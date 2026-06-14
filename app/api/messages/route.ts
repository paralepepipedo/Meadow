import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import webpush from 'web-push';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = Number(searchParams.get('user_id'));
  if (!userId) return NextResponse.json({ error: 'Falta user_id' }, { status: 400 });

  const valid = await sql`SELECT id FROM users WHERE id = ${userId} AND is_active = TRUE AND is_admin = FALSE`;
  if (valid.length === 0) return NextResponse.json({ error: 'Usuario no valido' }, { status: 403 });

  const retRow = await sql`SELECT value FROM app_config WHERE key = 'message_retention_days'`;
  const days = Number(retRow[0]?.value || 30);
  await sql`UPDATE messages SET is_deleted = TRUE
    WHERE is_deleted = FALSE AND created_at < NOW() - (${days} || ' days')::interval`;

  const recipientId = searchParams.get('recipient_id');

  let rows;
  if (recipientId === 'null' || recipientId === null && searchParams.has('recipient_id')) {
    rows = await sql`
      SELECT m.id, m.user_id, m.recipient_id, m.type, m.content, m.media_url, m.media_type, m.thumbnail_url, m.created_at, m.edited,
             u.display_name, u.emoji, u.color
      FROM messages m JOIN users u ON u.id = m.user_id
      WHERE m.is_deleted = FALSE
        AND (m.hidden_until IS NULL OR m.hidden_until <= NOW())
        AND m.recipient_id IS NULL
      ORDER BY m.id DESC LIMIT 100`;
  } else if (recipientId) {
    const rid = Number(recipientId);
    rows = await sql`
      SELECT m.id, m.user_id, m.recipient_id, m.type, m.content, m.media_url, m.media_type, m.thumbnail_url, m.created_at, m.edited,
             u.display_name, u.emoji, u.color
      FROM messages m JOIN users u ON u.id = m.user_id
      WHERE m.is_deleted = FALSE
        AND (m.hidden_until IS NULL OR m.hidden_until <= NOW())
        AND (
          (m.user_id = ${userId} AND m.recipient_id = ${rid})
          OR
          (m.user_id = ${rid} AND m.recipient_id = ${userId})
        )
      ORDER BY m.id DESC LIMIT 100`;
  } else {
    rows = await sql`
      SELECT m.id, m.user_id, m.recipient_id, m.type, m.content, m.media_url, m.media_type, m.thumbnail_url, m.created_at, m.edited,
             u.display_name, u.emoji, u.color
      FROM messages m JOIN users u ON u.id = m.user_id
      WHERE m.is_deleted = FALSE
        AND (m.hidden_until IS NULL OR m.hidden_until <= NOW())
        AND m.recipient_id IS NULL
      ORDER BY m.id DESC LIMIT 100`;
  }

  return NextResponse.json(rows.reverse());
}

export async function POST(req: Request) {
  const body = await req.json();
  const { user_id, recipient_id, type, content, media_url, media_type, thumbnail_url } = body;
  if (!user_id) return NextResponse.json({ error: 'Falta user_id' }, { status: 400 });

  const valid = await sql`SELECT display_name FROM users WHERE id = ${user_id} AND is_active = TRUE AND is_admin = FALSE`;
  if (valid.length === 0) return NextResponse.json({ error: 'Usuario no valido' }, { status: 403 });

  const msgType = type || 'text';
  if (msgType === 'text' && (!content || content.length > 1000)) {
    return NextResponse.json({ error: 'Texto invalido' }, { status: 400 });
  }

  const rid = recipient_id ? Number(recipient_id) : null;

  const rows = await sql`
    INSERT INTO messages (user_id, recipient_id, type, content, media_url, media_type, thumbnail_url)
    VALUES (${user_id}, ${rid}, ${msgType}, ${content || null}, ${media_url || null}, ${media_type || null}, ${thumbnail_url || null})
    RETURNING id, created_at`;

  sendPushToOthers(user_id, valid[0].display_name, rid).catch(() => {});

  return NextResponse.json({ ok: true, id: rows[0].id, created_at: rows[0].created_at });
}

// PATCH: editar mensaje (solo el autor, solo texto)
export async function PATCH(req: Request) {
  const body = await req.json();
  const { user_id, message_id, content } = body;
  if (!user_id || !message_id || !content) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
  if (content.length > 1000) return NextResponse.json({ error: 'Texto muy largo' }, { status: 400 });

  const rows = await sql`
    UPDATE messages SET content = ${content}, edited = TRUE
    WHERE id = ${message_id} AND user_id = ${user_id} AND is_deleted = FALSE AND type = 'text'
    RETURNING id`;

  if (rows.length === 0) return NextResponse.json({ error: 'No autorizado o mensaje no existe' }, { status: 403 });
  return NextResponse.json({ ok: true });
}

// DELETE: eliminar mensaje (solo el autor)
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = Number(searchParams.get('user_id'));
  const messageId = Number(searchParams.get('message_id'));
  if (!userId || !messageId) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

  const rows = await sql`
    UPDATE messages SET is_deleted = TRUE
    WHERE id = ${messageId} AND user_id = ${userId}
    RETURNING id`;

  if (rows.length === 0) return NextResponse.json({ error: 'No autorizado o mensaje no existe' }, { status: 403 });
  return NextResponse.json({ ok: true });
}

async function sendPushToOthers(senderId: number, senderName: string, recipientId: number | null) {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@example.com', pub, priv);

  let subs;
  if (recipientId) {
    subs = await sql`
      SELECT ps.endpoint, ps.keys_p256dh, ps.keys_auth
      FROM push_subscriptions ps
      JOIN users u ON u.id = ps.user_id
      WHERE ps.user_id = ${recipientId} AND u.notifications_enabled = TRUE AND u.is_active = TRUE`;
  } else {
    subs = await sql`
      SELECT ps.endpoint, ps.keys_p256dh, ps.keys_auth
      FROM push_subscriptions ps
      JOIN users u ON u.id = ps.user_id
      WHERE ps.user_id != ${senderId} AND u.notifications_enabled = TRUE AND u.is_active = TRUE`;
  }

  const payload = JSON.stringify({ title: 'Meadow', body: '\u{1F33E} Tu granja tiene novedades' });

  await Promise.allSettled(
    subs.map((s: any) =>
      webpush
        .sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.keys_p256dh, auth: s.keys_auth } },
          payload
        )
        .catch(async (err: any) => {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await sql`DELETE FROM push_subscriptions WHERE endpoint = ${s.endpoint}`;
          }
        })
    )
  );
}
