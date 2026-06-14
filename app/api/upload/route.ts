import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import cloudinary from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('file') as File | null;
  const userId = Number(form.get('user_id'));
  const kind = String(form.get('kind') || 'image');

  if (!file || !userId) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
  if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: 'Archivo muy grande (max 25MB)' }, { status: 400 });

  // Para uploads de avatar (user_id=0) no validar usuario
  if (userId !== 0) {
    const valid = await sql`SELECT id FROM users WHERE id = ${userId} AND is_active = TRUE`;
    if (valid.length === 0) return NextResponse.json({ error: 'Usuario no valido' }, { status: 403 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // PDF: subir como raw con public_id que incluye extension .pdf
  if (kind === 'pdf') {
    const publicId = `meadow/pdf_${Date.now()}`;
    const result: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'raw', folder: 'meadow', public_id: `pdf_${Date.now()}`, format: 'pdf', access_mode: 'public', type: 'upload' },
        (err, res) => (err ? reject(err) : resolve(res))
      );
      stream.end(buffer);
    });
    return NextResponse.json({
      ok: true,
      url: result.secure_url,
      thumbnail_url: null,
      media_type: 'application/pdf',
    });
  }

  const resourceType = kind === 'image' ? 'image' : 'video';

  const result: any = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType, folder: 'meadow' },
      (err, res) => (err ? reject(err) : resolve(res))
    );
    stream.end(buffer);
  });

  let thumbnail = null;
  if (kind === 'video') {
    thumbnail = result.secure_url.replace(/\.[^.]+$/, '.jpg');
  } else if (kind === 'image') {
    thumbnail = cloudinary.url(result.public_id, { width: 300, crop: 'limit', secure: true });
  }

  return NextResponse.json({
    ok: true,
    url: result.secure_url,
    thumbnail_url: thumbnail,
    media_type: file.type,
  });
}
