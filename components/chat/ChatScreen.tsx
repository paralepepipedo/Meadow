'use client';
import { useCallback, useEffect, useState } from 'react';
import { type ChatMessage } from '@/hooks/useSSE';
import { usePusherChat } from '@/hooks/usePusher';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

type StoredUser = { id: number; display_name: string; emoji: string; color: string };

type ContactState =
  | { phase: 'selecting' }
  | { phase: 'group' }
  | { phase: 'private'; contact: StoredUser };

export default function ChatScreen({
  user,
  onClose,
  onPickingFile,
}: {
  user: StoredUser;
  onClose: () => void;
  onPickingFile?: (val: boolean) => void;
}) {
  const [phase, setPhase] = useState<ContactState>({ phase: 'selecting' });
  const [contacts, setContacts] = useState<StoredUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/users?user_id=${user.id}`)
      .then((r) => r.json())
      .then((rows) => {
        if (Array.isArray(rows)) {
          setContacts(rows.filter((u: StoredUser) => u.id !== user.id));
        }
      });
  }, [user.id]);

  const addMessage = useCallback((m: ChatMessage) => {
    setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
  }, []);

  const recipientId =
    phase.phase === 'private' ? phase.contact.id : null;

  const active = phase.phase !== 'selecting';
  const { setLastId } = usePusherChat(user.id, recipientId, active, addMessage);

  useEffect(() => {
    if (phase.phase === 'selecting') return;
    setMessages([]);
    setLoaded(false);
    const rid = phase.phase === 'group' ? 'null' : String(recipientId);
    fetch(`/api/messages?user_id=${user.id}&recipient_id=${rid}`)
      .then((r) => r.json())
      .then((rows: ChatMessage[]) => {
        if (Array.isArray(rows)) {
          setMessages(rows);
          if (rows.length > 0) setLastId(rows[rows.length - 1].id);
        }
      })
      .finally(() => setLoaded(true));
  }, [phase, user.id]);

  const handleEdit = async (id: number, newContent: string) => {
    const stored = JSON.parse(localStorage.getItem('meadow_user') || '{}');
    await fetch('/api/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: stored.id, message_id: id, content: newContent }),
    });
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, content: newContent, edited: true } : m));
  };

  const handleDelete = async (id: number) => {
    const stored = JSON.parse(localStorage.getItem('meadow_user') || '{}');
    await fetch(`/api/messages?user_id=${stored.id}&message_id=${id}`, { method: 'DELETE' });
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  // ── Pantalla de seleccion ──────────────────────────────────
  if (phase.phase === 'selecting') {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col fade-in"
        style={{ background: '#0d1117', height: '100dvh' }}
      >
        <div className="flex items-center gap-3 px-3 py-2.5 bg-[#1f2c33] border-b border-gray-800">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-red-600/90 text-white flex items-center justify-center text-lg font-bold active:scale-90"
          >
            ✕
          </button>
          <span className="text-[15px] text-chatText font-medium">🔒 Nuevo chat</span>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-4 flex flex-col gap-3">
          <button
            onClick={() => setPhase({ phase: 'group' })}
            className="flex items-center gap-3 bg-[#1f2c33] rounded-xl px-4 py-3 active:opacity-70 text-left"
          >
            <span className="text-3xl">👥</span>
            <div>
              <p className="text-chatText text-[15px] font-medium">Grupo general</p>
              <p className="text-gray-500 text-[12px]">Todos los usuarios</p>
            </div>
          </button>

          <p className="text-gray-500 text-[11px] px-1 mt-1">MENSAJES PRIVADOS</p>

          {contacts.map((c) => (
            <button
              key={c.id}
              onClick={() => setPhase({ phase: 'private', contact: c })}
              className="flex items-center gap-3 bg-[#1f2c33] rounded-xl px-4 py-3 active:opacity-70 text-left"
              style={{ borderLeft: `3px solid ${c.color}` }}
            >
              <span className="text-3xl">{c.emoji}</span>
              <div>
                <p className="text-chatText text-[15px] font-medium">{c.display_name}</p>
                <p className="text-gray-500 text-[12px]">Mensaje privado</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Pantalla de chat ───────────────────────────────────────
  const chatTitle =
    phase.phase === 'group'
      ? '👥 Grupo general'
      : `${phase.contact.emoji} ${phase.contact.display_name}`;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col fade-in"
      style={{ background: '#0d1117', height: '100dvh' }}
    >
      <div className="flex items-center gap-3 px-3 py-2.5 bg-[#1f2c33] border-b border-gray-800">
        <button
          onClick={() => { setPhase({ phase: 'selecting' }); setMessages([]); setLoaded(false); }}
          className="w-9 h-9 rounded-full bg-gray-600/80 text-white flex items-center justify-center text-lg font-bold active:scale-90"
        >
          ←
        </button>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-red-600/90 text-white flex items-center justify-center text-lg font-bold active:scale-90"
        >
          ✕
        </button>
        <div className="flex flex-col">
          <span className="text-[15px] text-chatText font-medium">{chatTitle}</span>
          <span className="text-[11px] text-gray-500">{user.emoji} {user.display_name}</span>
        </div>
      </div>

      {!loaded ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-gray-500 text-[13px]">Conectando...</span>
        </div>
      ) : (
        <MessageList messages={messages} myId={user.id} scrollOnLoad={loaded} onEdit={handleEdit} onDelete={handleDelete} />
      )}

      <ChatInput
        userId={user.id}
        recipientId={phase.phase === 'group' ? null : phase.contact.id}
        onSent={() => {}}
        onPickingFile={onPickingFile}
      />
    </div>
  );
}
