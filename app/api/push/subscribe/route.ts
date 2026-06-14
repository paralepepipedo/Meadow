import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { user_id, subscription } = await req.json();
  if (!user_id || !subscription?.endpoint || !subscription?.keys) {
    return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 });
  }
  const valid = await sql`SELECT id FROM users WHERE id = ${user_id} AND is_active = TRUE`;
  if (valid.length === 0) return NextResponse.json({ error: 'Usuario no valido' }, { status: 403 });

  await sql`
    INSERT INTO push_subscriptions (user_id, endpoint, keys_p256dh, keys_auth)
    VALUES (${user_id}, ${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth})
    ON CONFLICT (endpoint) DO UPDATE SET user_id = ${user_id}, keys_p256dh = ${subscription.keys.p256dh}, keys_auth = ${subscription.keys.auth}`;
  return NextResponse.json({ ok: true });
}
