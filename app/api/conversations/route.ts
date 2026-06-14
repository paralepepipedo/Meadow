import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Devuelve resumen de conversaciones para un usuario:
// ultimo mensaje, quien lo envio, cuantos no leidos
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = Number(searchParams.get('user_id'));
  if (!userId) return NextResponse.json({ error: 'Falta user_id' }, { status: 400 });

  const valid = await sql`SELECT id FROM users WHERE id = ${userId} AND is_active = TRUE AND is_admin = FALSE`;
  if (valid.length === 0) return NextResponse.json({ error: 'Usuario no valido' }, { status: 403 });

  // Ultimo mensaje del grupo
  const groupLast = await sql`
    SELECT m.id, m.type, m.content, m.created_at, m.user_id as sender_id, u.display_name, u.emoji
    FROM messages m JOIN users u ON u.id = m.user_id
    WHERE m.is_deleted = FALSE AND m.recipient_id IS NULL
    ORDER BY m.id DESC LIMIT 1`;

  // No leidos del grupo
  const groupRead = await sql`
    SELECT last_read_id FROM message_reads
    WHERE user_id = ${userId} AND conversation_key = 'group'`;
  const groupLastReadId = groupRead[0]?.last_read_id || 0;
  const groupUnread = await sql`
    SELECT COUNT(*) as cnt FROM messages
    WHERE is_deleted = FALSE AND recipient_id IS NULL
      AND id > ${groupLastReadId} AND user_id != ${userId}`;

  // Otros usuarios
  const others = await sql`
    SELECT id, display_name, emoji, color, avatar_url
    FROM users WHERE is_admin = FALSE AND is_active = TRUE AND id != ${userId}
    ORDER BY id`;

  const conversations = [];

  // Grupo
  conversations.push({
    key: 'group',
    type: 'group',
    name: 'Grupo general',
    emoji: '👥',
    color: null,
    avatar_url: null,
    last_message: groupLast[0] || null,
    unread: Number(groupUnread[0]?.cnt || 0),
  });

  // Privados
  for (const other of others) {
    const lastMsg = await sql`
      SELECT m.id, m.type, m.content, m.created_at, m.user_id as sender_id,
             u.display_name, u.emoji
      FROM messages m JOIN users u ON u.id = m.user_id
      WHERE m.is_deleted = FALSE
        AND ((m.user_id = ${userId} AND m.recipient_id = ${other.id})
          OR (m.user_id = ${other.id} AND m.recipient_id = ${userId}))
      ORDER BY m.id DESC LIMIT 1`;

    const convKey = `private-${Math.min(userId, other.id)}-${Math.max(userId, other.id)}`;
    const readRow = await sql`
      SELECT last_read_id FROM message_reads
      WHERE user_id = ${userId} AND conversation_key = ${convKey}`;
    const lastReadId = readRow[0]?.last_read_id || 0;

    const unread = await sql`
      SELECT COUNT(*) as cnt FROM messages
      WHERE is_deleted = FALSE
        AND user_id = ${other.id} AND recipient_id = ${userId}
        AND id > ${lastReadId}`;

    conversations.push({
      key: convKey,
      type: 'private',
      recipientId: other.id,
      name: other.display_name,
      emoji: other.emoji,
      color: other.color,
      avatar_url: other.avatar_url,
      last_message: lastMsg[0] || null,
      unread: Number(unread[0]?.cnt || 0),
    });
  }

  return NextResponse.json(conversations);
}

// Marcar conversacion como leida
export async function POST(req: Request) {
  const { user_id, conversation_key, last_read_id } = await req.json();
  if (!user_id || !conversation_key) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

  await sql`
    INSERT INTO message_reads (user_id, conversation_key, last_read_id)
    VALUES (${user_id}, ${conversation_key}, ${last_read_id || 0})
    ON CONFLICT (user_id, conversation_key)
    DO UPDATE SET last_read_id = GREATEST(message_reads.last_read_id, ${last_read_id || 0})`;

  return NextResponse.json({ ok: true });
}
