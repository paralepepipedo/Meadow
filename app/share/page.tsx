'use client';
// VERSION: v1.2
// Recibe el contenido compartido desde Android (ej: "Compartir" en la app de YouTube)
// via Web Share Target, lo guarda y redirige al juego para abrir el chat con el link listo.
// useSearchParams() exige un Suspense boundary en Next.js App Router (build estatico),
// por eso la logica vive en un componente interno separado del export default.
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { extractYouTubeId } from '@/lib/youtube';
import { SHARE_STORAGE_KEY } from '@/lib/share';

function ShareRedirect() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
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

  return null;
}

export default function SharePage() {
  return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: '#4a7c59' }}>
      <Suspense fallback={null}>
        <ShareRedirect />
      </Suspense>
      <p className="font-pixel text-[10px] text-white">Abriendo Meadow...</p>
    </main>
  );
}
