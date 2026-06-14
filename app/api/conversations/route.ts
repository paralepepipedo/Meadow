import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = Number(searchParams.get('user_id'));
  if (!userId) return NextResponse.json({ error: 'Falta user_id' }, { status: 400 });

  const valid = await sql`SELECT id FROM users WHERE id = ${userId} AND is_active = TRUE AND is_admin = FALSE`;
  if (valid.length === 0) return NextResponse.json({ error: 'Usuario no valido' }, { status: 403 });

  // Una sola query: ultimo mensaje del grupo + no leidos
  const groupData = await sql`
    WITH last_msg AS (
      SELECT m.id, m.type, m.content, m.created_at, m.user_id as sender_id,
             u.display_name, u.emoji
      FROM messages m JOIN users u ON u.id = m.user_id
      WHERE m.is_deleted = FALSE AND m.recipient_id IS NULL
      ORDER BY m.id DESC LIMIT 1
    ),
    read_pos AS (
      SELECT COALESCE(last_read_id, 0) as last_read_id
      FROM message_reads
      WHERE user_id = ${userId} AND conversation_key = 'group'
    ),
    unread_cnt AS (
      SELECT COUNT(*) as cnt FROM messages
      WHERE is_deleted = FALSE AND recipient_id IS NULL
        AND user_id != ${userId}
        AND id > (SELECT COALESCE(last_read_id, 0) FROM read_pos)
    )
    SELECT row_to_json(last_msg) as last_message, (SELECT cnt FROM unread_cnt) as unread
    FROM last_msg`;

  // Una sola query: todos los usuarios + ultimo mensaje privado + no leidos
  const privateData = await sql`
    WITH others AS (
      SELECT id, display_name, emoji, color, avatar_url
      FROM users WHERE is_admin = FALSE AND is_active = TRUE AND id != ${userId}
    ),
    last_msgs AS (
      SELECT DISTINCT ON (
        LEAST(m.user_id, m.recipient_id),
        GREATEST(m.user_id, m.recipient_id)
      )
      m.id, m.type, m.content, m.created_at, m.user_id as sender_id,
      m.recipient_id,
      LEAST(m.user_id, m.recipient_id) as u1,
      GREATEST(m.user_id, m.recipient_id) as u2,
      u.display_name, u.emoji
      FROM messages m JOIN users u ON u.id = m.user_id
      WHERE m.is_deleted = FALSE
        AND (m.user_id = ${userId} OR m.recipient_id = ${userId})
        AND m.recipient_id IS NOT NULL
      ORDER BY LEAST(m.user_id, m.recipient_id), GREATEST(m.user_id, m.recipient_id), m.id DESC
    ),
    read_positions AS (
      SELECT conversation_key, last_read_id FROM message_reads WHERE user_id = ${userId}
    ),
    unread_counts AS (
      SELECT
        LEAST(user_id, recipient_id) as u1,
        GREATEST(user_id, recipient_id) as u2,
        COUNT(*) as cnt
      FROM messages
      WHERE is_deleted = FALSE
        AND recipient_id = ${userId}
        AND id > COALESCE(
          (SELECT last_read_id FROM read_positions
           WHERE conversation_key = 'private-' || LEAST(user_id, ${userId}) || '-' || GREATEST(user_id, ${userId})),
          0
        )
      GROUP BY LEAST(user_id, recipient_id), GREATEST(user_id, recipient_id)
    )
    SELECT
      o.id, o.display_name, o.emoji, o.color, o.avatar_url,
      row_to_json(lm) as last_message,
      COALESCE(uc.cnt, 0) as unread
    FROM others o
    LEFT JOIN last_msgs lm ON (lm.u1 = LEAST(o.id, ${userId}) AND lm.u2 = GREATEST(o.id, ${userId}))
    LEFT JOIN unread_counts uc ON (uc.u1 = LEAST(o.id, ${userId}) AND uc.u2 = GREATEST(o.id, ${userId}))
    ORDER BY o.id`;

  const conversations = [];

  // Grupo
  const g = groupData[0];
  conversations.push({
    key: 'group',
    type: 'group',
    name: 'Grupo general',
    emoji: '👥',
    color: null,
    avatar_url: null,
    last_message: g?.last_message || null,
    unread: Number(g?.unread || 0),
  });

  // Privados
  for (const p of privateData) {
    conversations.push({
      key: `private-${Math.min(userId, p.id)}-${Math.max(userId, p.id)}`,
      type: 'private',
      recipientId: p.id,
      name: p.display_name,
      emoji: p.emoji,
      color: p.color,
      avatar_url: p.avatar_url,
      last_message: p.last_message || null,
      unread: Number(p.unread || 0),
    });
  }

  return NextResponse.json(conversations);
}

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
