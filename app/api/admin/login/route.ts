import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { username, password } = await req.json();
  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD &&
    username && password
  ) {
    const token = Buffer.from(`${username}:${password}`).toString('base64');
    return NextResponse.json({ ok: true, token });
  }
  return NextResponse.json({ error: 'Credenciales invalidas' }, { status: 401 });
}
