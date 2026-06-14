import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const rows = await sql`SELECT active_object, click_count FROM trigger_config ORDER BY id DESC LIMIT 1`;
  const cfg = rows[0] || { active_object: 'mailbox', click_count: 3 };
  return NextResponse.json(
    { active_object: cfg.active_object, click_count: Number(cfg.click_count) },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache' } }
  );
}
