'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ChatMessage } from '@/hooks/useSSE';

function ImageViewer({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,0.96)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        touchAction: 'none',
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'fixed', top: 20, right: 20,
          background: 'rgba(255,255,255,0.2)', border: 'none',
          color: 'white', fontSize: 22, width: 44, height: 44,
          borderRadius: '50%', cursor: 'pointer', zIndex: 100000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >✕</button>
      <img
        src={src}
        alt="imagen"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '100vw',
          maxHeight: '100vh',
          objectFit: 'contain',
          touchAction: 'pinch-zoom',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      />
    </div>,
    document.body
  );
}

export default function MediaMessage({ msg }: { msg: ChatMessage }) {
  const [viewing, setViewing] = useState(false);

  if (msg.type === 'image') {
    return (
      <>
        {viewing && <ImageViewer src={msg.media_url || ''} onClose={() => setViewing(false)} />}
        <img
          src={msg.thumbnail_url || msg.media_url || ''}
          alt="imagen"
          onClick={() => setViewing(true)}
          className="rounded-xl max-w-full mb-1 cursor-pointer active:opacity-80"
          loading="lazy"
          style={{ touchAction: 'manipulation', display: 'block' }}
        />
      </>
    );
  }

  if (msg.type === 'audio') {
    return <audio controls src={msg.media_url || ''} className="max-w-full mb-1" preload="none" />;
  }

  if (msg.type === 'video') {
    return (
      <video
        controls
        src={msg.media_url || ''}
        poster={msg.thumbnail_url || undefined}
        className="rounded-xl max-w-full mb-1"
        preload="none"
        playsInline
      />
    );
  }

  if (msg.type === 'pdf') {
    return (
      <a
        href={msg.media_url || '#'}
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(0,0,0,0.3)', borderRadius: 12,
          padding: '10px 12px', marginBottom: 4, textDecoration: 'none',
        }}
      >
        <span style={{ fontSize: 32 }}>📄</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#e9edef', fontSize: 13, fontWeight: 500 }}>Documento PDF</div>
          <div style={{ color: '#8696a0', fontSize: 11 }}>Toca para abrir</div>
        </div>
        <span style={{ color: '#8696a0', fontSize: 20 }}>↗</span>
      </a>
    );
  }

  return null;
}
