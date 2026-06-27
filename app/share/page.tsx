'use client';
// VERSION: v1.0
// Recibe el contenido compartido desde Android (ej: "Compartir" en la app de YouTube)
// via Web Share Target, lo guarda y redirige al juego para abrir el chat con el link listo.
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { extractYouTubeId } from '@/lib/youtube';

export const SHARE_STORAGE_KEY = 'meadow_shared_text';

export default function SharePage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    // YouTube (y otras apps) pueden mandar el link en distintos campos segun version
    const url = params.get('url') || '';
    const text = params.get('text') || '';
    const combined = [url, text].filter(Boolean).join(' ');

    const videoId = extractYouTubeId(combined) || extractYouTubeId(url) || extractYouTubeId(text);
    const toShare = videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : (url || text || '').trim();

    if (toShare) {
      sessionStorage.setItem(SHARE_STORAGE_KEY, toShare);
    }

    router.replace('/game');
  }, [params, router]);

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#4a7c59' }}>
      <p className="font-pixel text-[10px] text-white">Abriendo Meadow...</p>
    </main>
  );
}
