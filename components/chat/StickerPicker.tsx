'use client';
import { useEffect, useState } from 'react';

const SVG_STICKERS = Array.from({ length: 20 }, (_, i) => `/assets/stickers/sticker-${String(i + 1).padStart(2, '0')}.svg`);

type Tab = 'stickers' | 'animados' | 'gif';

export default function StickerPicker({
  onPick,
  onClose,
}: {
  onPick: (url: string, type: 'sticker' | 'gif') => void;
  onClose: () => void;
}) {
  const giphyKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;
  const [tab, setTab] = useState<Tab>('animados');
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState<{ id: string; url: string; preview: string }[]>([]);
  const [webmFiles, setWebmFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar stickers .webm de la carpeta publica
  useEffect(() => {
    fetch('/api/stickers')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data.files)) setWebmFiles(data.files); })
      .catch(() => {});
  }, []);

  // Cargar GIFs de Giphy
  useEffect(() => {
    if (tab !== 'gif' || !giphyKey) return;
    const q = query.trim();
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const endpoint = q
          ? `https://api.giphy.com/v1/gifs/search?api_key=${giphyKey}&q=${encodeURIComponent(q)}&limit=20&rating=pg-13`
          : `https://api.giphy.com/v1/gifs/trending?api_key=${giphyKey}&limit=20&rating=pg-13`;
        const r = await fetch(endpoint, { signal: controller.signal });
        const data = await r.json();
        setGifs(
          (data.data || []).map((g: any) => ({
            id: g.id,
            url: g.images.fixed_height.url,
            preview: g.images.fixed_height_small.url,
          }))
        );
      } catch {}
      setLoading(false);
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [tab, query, giphyKey]);

  return (
    <div className="absolute bottom-14 left-0 right-0 bg-[#111b21] border-t border-gray-800 flex flex-col z-50" style={{ maxHeight: '65dvh' }}>
      {/* Tabs */}
      <div className="flex items-center px-3 pt-2 gap-2 border-b border-gray-800 pb-2">
        <button
          onClick={() => setTab('animados')}
          className={`text-[12px] px-3 py-1 rounded-full ${tab === 'animados' ? 'bg-bubbleMine text-white' : 'text-gray-400'}`}
        >
          🎭 Stickers
        </button>
        <button
          onClick={() => setTab('stickers')}
          className={`text-[12px] px-3 py-1 rounded-full ${tab === 'stickers' ? 'bg-bubbleMine text-white' : 'text-gray-400'}`}
        >
          😊 Emojis
        </button>
        {giphyKey && (
          <button
            onClick={() => setTab('gif')}
            className={`text-[12px] px-3 py-1 rounded-full ${tab === 'gif' ? 'bg-bubbleMine text-white' : 'text-gray-400'}`}
          >
            GIF
          </button>
        )}
        <button onClick={onClose} className="ml-auto text-gray-400 px-2 text-lg">✕</button>
      </div>

      {/* Tab: Stickers animados .webm */}
      {tab === 'animados' && (
        <div className="grid grid-cols-4 gap-2 p-3 overflow-y-auto">
          {webmFiles.length === 0 && (
            <p className="col-span-4 text-center text-gray-500 text-[12px] py-4">Sin stickers disponibles</p>
          )}
          {webmFiles.map((s) => {
            const isWebm = s.endsWith('.webm');
            return (
              <button
                key={s}
                onClick={() => onPick(s, 'sticker')}
                className="active:scale-90 transition-transform bg-[#202c33] rounded-xl p-1"
              >
                {isWebm ? (
                  <video
                    src={s}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full aspect-square object-contain rounded-lg"
                  />
                ) : (
                  <img
                    src={s}
                    alt="sticker"
                    className="w-full aspect-square object-contain rounded-lg"
                    loading="lazy"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Tab: Emojis SVG */}
      {tab === 'stickers' && (
        <div className="grid grid-cols-4 gap-2 p-3 overflow-y-auto">
          {SVG_STICKERS.map((s) => (
            <button key={s} onClick={() => onPick(s, 'sticker')} className="active:scale-90 transition-transform">
              <img src={s} alt="sticker" className="w-full aspect-square object-contain" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {/* Tab: GIFs */}
      {tab === 'gif' && (
        <>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar GIF..."
            className="mx-3 mt-2 bg-[#202c33] text-chatText text-[14px] rounded-lg px-3 py-2 outline-none"
          />
          <div className="grid grid-cols-3 gap-2 p-3 overflow-y-auto">
            {loading && <p className="col-span-3 text-center text-gray-500 text-[12px]">Buscando...</p>}
            {gifs.map((g) => (
              <button key={g.id} onClick={() => onPick(g.url, 'gif')} className="active:scale-90 transition-transform">
                <img src={g.preview} alt="gif" className="w-full rounded-lg" loading="lazy" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
