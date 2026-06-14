import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdminRequest } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

// GET (admin): ultimos 200 mensajes con filtros opcionales
export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('user_id');
  const date = searchParams.get('date'); // YYYY-MM-DD

  const rows = await sql`
    SELECT m.id, m.user_id, m.type, m.content, m.media_url, m.is_deleted, m.hidden_until, m.created_at,
           u.display_name, u.emoji
    FROM messages m JOIN users u ON u.id = m.user_id
    WHERE (${userId ?? null}::int IS NULL OR m.user_id = ${userId ?? null}::int)
      AND (${date ?? null}::date IS NULL OR m.created_at::date = ${date ?? null}::date)
    ORDER BY m.id DESC LIMIT 200`;
  return NextResponse.json(rows);
}

// POST (admin): acciones sobre mensajes
// { action: 'delete', id } | { action: 'hide', id, until } | { action: 'unhide', id } | { action: 'clear_all' }
export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const body = await req.json();
  const { action, id, until } = body;

  if (action === 'delete' && id) {
    await sql`UPDATE messages SET is_deleted = TRUE WHERE id = ${id}`;
  } else if (action === 'hide' && id && until) {
    await sql`UPDATE messages SET hidden_until = ${until} WHERE id = ${id}`;
  } else if (action === 'unhide' && id) {
    await sql`UPDATE messages SET hidden_until = NULL WHERE id = ${id}`;
  } else if (action === 'clear_all') {
    await sql`UPDATE messages SET is_deleted = TRUE WHERE is_deleted = FALSE`;
  } else {
    return NextResponse.json({ error: 'Accion invalida' }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
