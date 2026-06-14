import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 25;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = Number(searchParams.get('user_id'));
  if (!userId) return new Response('Falta user_id', { status: 400 });

  const valid = await sql`SELECT id FROM users WHERE id = ${userId} AND is_active = TRUE AND is_admin = FALSE`;
  if (valid.length === 0) return new Response('Usuario no valido', { status: 403 });

  const lastEventId = req.headers.get('last-event-id');
  let lastId = lastEventId ? Number(lastEventId) : Number(searchParams.get('last_id') || 0);
  if (!lastId) {
    const maxRow = await sql`SELECT COALESCE(MAX(id),0) AS m FROM messages`;
    lastId = Number(maxRow[0].m);
  }

  const recipientParam = searchParams.get('recipient_id');
  const isGroup = !recipientParam || recipientParam === 'null';
  const recipientId = isGroup ? null : Number(recipientParam);

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (text: string) => {
        if (!closed) controller.enqueue(encoder.encode(text));
      };
      send(': connected\n\n');

      const started = Date.now();
      while (!closed && Date.now() - started < 23000) {
        try {
          let rows;
          if (isGroup) {
            rows = await sql`
              SELECT m.id, m.user_id, m.recipient_id, m.type, m.content, m.media_url, m.media_type, m.thumbnail_url, m.created_at,
                     u.display_name, u.emoji, u.color
              FROM messages m JOIN users u ON u.id = m.user_id
              WHERE m.id > ${lastId} AND m.is_deleted = FALSE
                AND (m.hidden_until IS NULL OR m.hidden_until <= NOW())
                AND m.recipient_id IS NULL
              ORDER BY m.id ASC`;
          } else {
            rows = await sql`
              SELECT m.id, m.user_id, m.recipient_id, m.type, m.content, m.media_url, m.media_type, m.thumbnail_url, m.created_at,
                     u.display_name, u.emoji, u.color
              FROM messages m JOIN users u ON u.id = m.user_id
              WHERE m.id > ${lastId} AND m.is_deleted = FALSE
                AND (m.hidden_until IS NULL OR m.hidden_until <= NOW())
                AND (
                  (m.user_id = ${userId} AND m.recipient_id = ${recipientId})
                  OR
                  (m.user_id = ${recipientId} AND m.recipient_id = ${userId})
                )
              ORDER BY m.id ASC`;
          }
          for (const r of rows) {
            lastId = r.id;
            const line = 'id: ' + r.id + '\nevent: message\ndata: ' + JSON.stringify(r) + '\n\n';
            send(line);
          }
          if (rows.length === 0) send(': ping\n\n');
        } catch {
          send(': error\n\n');
        }
        await new Promise((res) => setTimeout(res, 2500));
      }
      try { controller.close(); } catch {}
    },
    cancel() { closed = true; },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
