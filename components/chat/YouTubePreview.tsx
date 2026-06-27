'use client';
// VERSION: v1.0
import { useEffect, useState } from 'react';
import { youtubeThumbnail, youtubeWatchUrl } from '@/lib/youtube';

type OEmbedData = { title: string; author_name: string };

// Cache simple en memoria para no repetir el fetch de oEmbed por cada render/mensaje
const oembedCache = new Map<string, OEmbedData | null>();

export default function YouTubePreview({ videoId }: { videoId: string }) {
  const [data, setData] = useState<OEmbedData | null>(oembedCache.get(videoId) ?? null);

  useEffect(() => {
    if (oembedCache.has(videoId)) {
      setData(oembedCache.get(videoId) ?? null);
      return;
    }
    const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      youtubeWatchUrl(videoId)
    )}&format=json`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const result = json ? { title: json.title, author_name: json.author_name } : null;
        oembedCache.set(videoId, result);
        setData(result);
      })
      .catch(() => {
        oembedCache.set(videoId, null);
        setData(null);
      });
  }, [videoId]);

  return (
    <a
      href={youtubeWatchUrl(videoId)}
      target="_blank"
      rel="noreferrer"
      className="block rounded-xl overflow-hidden mb-1 active:opacity-80"
      style={{ background: 'rgba(0,0,0,0.25)', textDecoration: 'none', maxWidth: 260 }}
    >
      <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
        <img
          src={youtubeThumbnail(videoId)}
          alt="YouTube"
          loading="lazy"
          className="w-full h-full object-cover"
          style={{ display: 'block' }}
        />
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.15)' }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: 46,
              height: 46,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.55)',
            }}
          >
            <div
              style={{
                width: 0,
                height: 0,
                borderTop: '9px solid transparent',
                borderBottom: '9px solid transparent',
                borderLeft: '15px solid white',
                marginLeft: 3,
              }}
            />
          </div>
        </div>
        <span
          className="absolute bottom-1 right-1 text-[10px] text-white px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(0,0,0,0.7)' }}
        >
          ▶ YouTube
        </span>
      </div>
      <div className="px-2.5 py-2">
        <p className="text-[13px] text-chatText font-medium leading-snug" style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {data?.title || 'Ver en YouTube'}
        </p>
        {data?.author_name && (
          <p className="text-[11px] text-gray-400 mt-0.5">{data.author_name}</p>
        )}
      </div>
    </a>
  );
}
