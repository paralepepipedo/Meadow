import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdminRequest } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (isAdminRequest(req)) {
    const rows = await sql`
      SELECT id, username, display_name, emoji, color, avatar_url, is_active, notifications_enabled
      FROM users WHERE is_admin = FALSE ORDER BY id`;
    return NextResponse.json(rows);
  }
  const rows = await sql`
    SELECT id, display_name, emoji, color, avatar_url
    FROM users WHERE is_admin = FALSE AND is_active = TRUE ORDER BY id`;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const body = await req.json();
  const { display_name, emoji, color, notifications_enabled, avatar_url } = body;
  if (!display_name) return NextResponse.json({ error: 'Falta display_name' }, { status: 400 });
  const username = display_name.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Date.now().toString(36);
  const rows = await sql`
    INSERT INTO users (username, display_name, emoji, color, avatar_url, notifications_enabled)
    VALUES (${username}, ${display_name}, ${emoji || '🐻'}, ${color || '#6ab04c'}, ${avatar_url || null}, ${notifications_enabled ?? true})
    RETURNING id`;
  const userId = rows[0].id;
  await sql`INSERT INTO game_state (user_id) VALUES (${userId}) ON CONFLICT (user_id) DO NOTHING`;
  await sql`
    INSERT INTO animals (user_id, type, name) VALUES
    (${userId}, 'cow', 'Manchas'), (${userId}, 'chicken', 'Kiki'), (${userId}, 'sheep', 'Copito')`;
  return NextResponse.json({ ok: true, id: userId });
}

export async function PATCH(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const body = await req.json();
  const { id, display_name, emoji, color, avatar_url, is_active, notifications_enabled } = body;
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });
  await sql`
    UPDATE users SET
      display_name = COALESCE(${display_name ?? null}, display_name),
      emoji        = COALESCE(${emoji ?? null}, emoji),
      color        = COALESCE(${color ?? null}, color),
      avatar_url   = COALESCE(${avatar_url ?? null}, avatar_url),
      is_active    = COALESCE(${is_active ?? null}, is_active),
      notifications_enabled = COALESCE(${notifications_enabled ?? null}, notifications_enabled)
    WHERE id = ${id} AND is_admin = FALSE`;
  return NextResponse.json({ ok: true });
}
