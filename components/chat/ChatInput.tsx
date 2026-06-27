'use client';
import { useEffect, useRef, useState } from 'react';
import StickerPicker from './StickerPicker';

export default function ChatInput({
  userId,
  recipientId,
  onSent,
  onPickingFile,
  initialText,
}: {
  userId: number;
  recipientId: number | null;
  onSent: () => void;
  onPickingFile?: (val: boolean) => void;
  initialText?: string | null;
}) {
  const [text, setText] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Precargar texto recibido por "Compartir" (ej: link de YouTube) — el usuario debe tocar enviar
  useEffect(() => {
    if (initialText) setText(initialText);
  }, [initialText]);

  const post = async (body: Record<string, any>) => {
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, recipient_id: recipientId, ...body }),
    });
    onSent();
  };

  const inputRef = useRef<HTMLInputElement>(null);

  const sendText = async () => {
    const t = text.trim();
    if (!t) return;
    setText('');
    // Mantener foco en el input para que no desaparezca el teclado
    setTimeout(() => inputRef.current?.focus(), 50);
    await post({ type: 'text', content: t });
  };

  const sendSticker = async (url: string, type: 'sticker' | 'gif') => {
    setShowStickers(false);
    await post({ type, media_url: url });
  };

  const uploadAndSend = async (file: File) => {
    setUploading(true);
    try {
      const kind = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('audio/')
        ? 'audio'
        : file.type === 'application/pdf' || file.name.endsWith('.pdf')
        ? 'pdf'
        : 'video';
      const form = new FormData();
      form.append('file', file);
      form.append('user_id', String(userId));
      form.append('kind', kind);
      const r = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await r.json();
      if (data.ok) {
        await post({
          type: kind,
          media_url: data.url,
          media_type: data.media_type,
          thumbnail_url: data.thumbnail_url,
        });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPickingFile?.(false);
    const file = e.target.files?.[0];
    if (file) uploadAndSend(file);
    e.target.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        if (blob.size > 1000) {
          const file = new File([blob], `audio-${Date.now()}.webm`, { type: blob.type });
          await uploadAndSend(file);
        }
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordSecs(0);
      timerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
    } catch {}
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="relative">
      {showStickers && <StickerPicker onPick={sendSticker} onClose={() => setShowStickers(false)} />}
      <div className="flex items-center gap-2 px-2 py-2 bg-[#1f2c33]">
        <input ref={fileRef} type="file" accept="image/*,audio/*,video/*,.pdf,application/pdf" hidden onChange={handleFile} />
        <button
          onClick={() => { onPickingFile?.(true); fileRef.current?.click(); }}
          disabled={uploading || recording}
          className="text-gray-400 text-xl px-1 disabled:opacity-40"
        >
          📎
        </button>
        <button
          onClick={() => setShowStickers((v) => !v)}
          disabled={recording}
          className="text-gray-400 text-xl px-1 disabled:opacity-40"
        >
          🎭
        </button>
        {recording ? (
          <div className="flex-1 flex items-center gap-2 bg-[#2a3942] rounded-full px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[14px] text-chatText">{fmt(recordSecs)}</span>
            <span className="text-[12px] text-gray-400 ml-auto">grabando...</span>
          </div>
        ) : (
          <input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendText()}
            placeholder={uploading ? 'Subiendo...' : 'Escribe un mensaje'}
            disabled={uploading}
            autoComplete="off"
            ref={inputRef}
            className="flex-1 bg-[#2a3942] text-chatText text-[15px] rounded-full px-4 py-2 outline-none"
          />
        )}
        {text.trim() ? (
          <button
            onClick={sendText}
            className="w-10 h-10 rounded-full bg-bubbleMine text-white flex items-center justify-center text-lg"
          >
            ➤
          </button>
        ) : (
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={uploading}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
              recording ? 'bg-red-600 text-white' : 'bg-bubbleMine text-white'
            } disabled:opacity-40`}
          >
            {recording ? '■' : '🎤'}
          </button>
        )}
      </div>
    </div>
  );
}