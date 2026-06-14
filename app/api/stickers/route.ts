import { NextResponse } from 'next/server';
import { readdirSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dir = join(process.cwd(), 'public', 'stickers');
    const files = readdirSync(dir)
      .filter((f) => f.endsWith('.webm') || f.endsWith('.gif') || f.endsWith('.png') || f.endsWith('.webp'))
      .sort()
      .map((f) => `/stickers/${f}`);
    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ files: [] });
  }
}
