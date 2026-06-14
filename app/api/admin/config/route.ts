import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdminRequest } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const rows = await sql`SELECT key, value FROM app_config`;
  const cfg: Record<string, string> = {};
  for (const r of rows) cfg[r.key] = r.value;
  return NextResponse.json(cfg);
}

// { action: 'set_weather', value } | { action: 'random_weather' } | { action: 'set_retention', value }
export async function POST(req: Request) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { action, value } = await req.json();

  if (action === 'set_weather' && ['sunny', 'cloudy', 'rainy'].includes(value)) {
    await sql`UPDATE app_config SET value = ${value} WHERE key = 'weather_current'`;
    await sql`UPDATE app_config SET value = NOW()::text WHERE key = 'weather_updated_at'`;
  } else if (action === 'random_weather') {
    const options = ['sunny', 'cloudy', 'rainy'];
    const pick = options[Math.floor(Math.random() * options.length)];
    await sql`UPDATE app_config SET value = ${pick} WHERE key = 'weather_current'`;
    await sql`UPDATE app_config SET value = NOW()::text WHERE key = 'weather_updated_at'`;
    return NextResponse.json({ ok: true, weather: pick });
  } else if (action === 'set_retention' && Number(value) > 0) {
    await sql`UPDATE app_config SET value = ${String(Number(value))} WHERE key = 'message_retention_days'`;
  } else {
    return NextResponse.json({ error: 'Accion invalida' }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
