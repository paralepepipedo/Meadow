import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdminRequest } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { active_object, click_count } = await req.json();
  const clicks = Number(click_count);
  if (!active_object || !clicks || clicks < 2 || clicks > 8) {
    return NextResponse.json({ error: 'Datos invalidos (clicks 2-8)' }, { status: 400 });
  }
  await sql`UPDATE trigger_config SET active_object = ${active_object}, click_count = ${clicks}, updated_at = NOW()
    WHERE id = (SELECT id FROM trigger_config ORDER BY id DESC LIMIT 1)`;
  return NextResponse.json({ ok: true });
}
