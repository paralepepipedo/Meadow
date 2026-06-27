'use client';
import { useState } from 'react';
import type { ChatMessage } from '@/hooks/useSSE';
import MediaMessage from './MediaMessage';
import YouTubePreview from './YouTubePreview';
import { extractYouTubeId } from '@/lib/youtube';

type Props = {
  msg: ChatMessage;
  mine: boolean;
  onEdit: (id: number, content: string) => void;
  onDelete: (id: number) => void;
};

export default function MessageBubble({ msg, mine, onEdit, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(msg.content || '');
  const time = new Date(msg.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  const youtubeId = msg.type === 'text' ? extractYouTubeId(msg.content) : null;

  const handleLongPress = () => {
    if (mine) setMenuOpen(true);
  };

  const saveEdit = () => {
    if (editText.trim()) {
      onEdit(msg.id, editText.trim());
      setEditing(false);
      setMenuOpen(false);
    }
  };

  const handleDelete = () => {
    onDelete(msg.id);
    setMenuOpen(false);
  };

  if (msg.type === 'sticker' || msg.type === 'gif') {
    const isWebm = msg.media_url?.endsWith('.webm');
    return (
      <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'} mb-2`}>
        {!mine && <span className="text-[11px] mb-0.5 font-medium" style={{ color: msg.color }}>{msg.emoji} {msg.display_name}</span>}
        {isWebm ? (
          <video src={msg.media_url || ''} autoPlay loop muted playsInline className="w-32 h-32 object-contain" />
        ) : (
          <img src={msg.media_url || ''} alt="sticker" className="w-32 h-32 object-contain" loading="lazy" />
        )}
        <span className="text-[10px] text-gray-500 mt-0.5">{time}</span>
      </div>
    );
  }

  return (
    <>
      {/* Menu flotante */}
      {menuOpen && (
        <div
          className={`flex gap-2 mb-1 ${mine ? 'justify-end' : 'justify-start'}`}
          style={{ paddingRight: mine ? 4 : 0, paddingLeft: mine ? 0 : 4 }}
        >
          {msg.type === 'text' && (
            <button
              onClick={() => { setEditing(true); setMenuOpen(false); }}
              className="bg-[#2a3942] text-chatText text-[12px] rounded-lg px-3 py-1.5 active:opacity-70"
            >
              ✏️ Editar
            </button>
          )}
          <button
            onClick={handleDelete}
            className="bg-red-900/80 text-red-200 text-[12px] rounded-lg px-3 py-1.5 active:opacity-70"
          >
            🗑️ Eliminar
          </button>
          <button
            onClick={() => setMenuOpen(false)}
            className="bg-[#1f2c33] text-gray-400 text-[12px] rounded-lg px-3 py-1.5 active:opacity-70"
          >
            ✕
          </button>
        </div>
      )}

      <div
        className={`flex ${mine ? 'justify-end' : 'justify-start'} mb-2`}
        onContextMenu={(e) => { e.preventDefault(); handleLongPress(); }}
      >
        <div
          className="max-w-[78%] rounded-2xl px-3 py-2"
          style={{
            background: mine ? '#005c4b' : '#1e2a35',
            borderTopRightRadius: mine ? 4 : 16,
            borderTopLeftRadius: mine ? 16 : 4,
          }}
          onTouchStart={() => {
            const t = setTimeout(() => handleLongPress(), 500);
            const cancel = () => clearTimeout(t);
            document.addEventListener('touchend', cancel, { once: true });
            document.addEventListener('touchmove', cancel, { once: true });
          }}
        >
          {!mine && (
            <p className="text-[11px] font-medium mb-0.5" style={{ color: msg.color }}>
              {msg.emoji} {msg.display_name}
            </p>
          )}

          {(msg.type === 'image' || msg.type === 'audio' || msg.type === 'video' || msg.type === 'pdf') && (
            <MediaMessage msg={msg} />
          )}

          {editing ? (
            <div className="flex flex-col gap-2 mt-1">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="bg-[#2a3942] text-chatText text-[14px] rounded-lg px-3 py-2 outline-none resize-none"
                rows={2}
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={saveEdit} className="bg-bubbleMine text-white text-[12px] rounded-lg px-3 py-1">Guardar</button>
                <button onClick={() => setEditing(false)} className="bg-gray-700 text-gray-300 text-[12px] rounded-lg px-3 py-1">Cancelar</button>
              </div>
            </div>
          ) : youtubeId ? (
            <YouTubePreview videoId={youtubeId} />
          ) : (
            msg.content && <p className="text-[14px] text-chatText whitespace-pre-wrap break-words">{msg.content}</p>
          )}

          <div className="flex items-center justify-end gap-1 mt-0.5">
            {msg.edited && <span className="text-[10px] text-gray-500">editado</span>}
            <p className="text-[10px] text-gray-400">{time}</p>
          </div>
        </div>
      </div>
    </>
  );
}