'use client';
import { useCallback, useEffect, useState } from 'react';
import { type ChatMessage } from '@/hooks/useSSE';
import { usePusherChat } from '@/hooks/usePusher';
import { getPusherClient, getChatChannel } from '@/lib/pusher';
import { isYouTubeLink } from '@/lib/youtube';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

type StoredUser = { id: number; display_name: string; emoji: string; color: string };

type Conversation = {
  key: string;
  type: 'group' | 'private';
  recipientId?: number;
  name: string;
  emoji: string;
  color: string | null;
  avatar_url: string | null;
  last_message: { id: number; type: string; content: string | null; created_at: string; sender_id: number; display_name: string; emoji: string } | null;
  unread: number;
};

type ContactState =
  | { phase: 'selecting' }
  | { phase: 'group' }
  | { phase: 'private'; contact: StoredUser };

function lastMessagePreview(msg: Conversation['last_message'], myId: number): string {
  if (!msg) return 'Sin mensajes';
  const prefix = msg.sender_id === myId ? 'Tú: ' : `${msg.emoji} `;
  if (msg.type === 'text') {
    if (isYouTubeLink(msg.content)) return prefix + '📺 Video de YouTube';
    return prefix + (msg.content?.slice(0, 35) || '');
  }
  if (msg.type === 'image') return prefix + 'Imagen';
  if (msg.type === 'audio') return prefix + 'Audio';
  if (msg.type === 'video') return prefix + 'Video';
  if (msg.type === 'sticker' || msg.type === 'gif') return prefix + 'Sticker';
  return prefix + 'Archivo';
}

function timeLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  if (diff < 172800000) return 'Ayer';
  return d.toLocaleDateString('es-CL', { weekday: 'short' });
}

export default function ChatScreen({
  user,
  onClose,
  onPickingFile,
  initialSharedText,
}: {
  user: StoredUser;
  onClose: () => void;
  onPickingFile?: (val: boolean) => void;
  initialSharedText?: string | null;
}) {
  const [phase, setPhase] = useState<ContactState>(
    initialSharedText ? { phase: 'group' } : { phase: 'selecting' }
  );
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadConversations = useCallback(() => {
    fetch(`/api/conversations?user_id=${user.id}`)
      .then((r) => r.json())
      .then((rows) => { if (Array.isArray(rows)) setConversations(rows); })
      .catch(() => {});
  }, [user.id]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Escuchar mensajes nuevos en todos los canales para actualizar contadores
  useEffect(() => {
    if (phase.phase !== 'selecting') return;
    const pusher = getPusherClient();
    const groupCh = pusher.subscribe('chat-group');
    groupCh.bind('new-message', () => loadConversations());
    const privateCh = pusher.subscribe(getChatChannel(user.id));
    privateCh.bind('new-message', () => loadConversations());
    return () => {
      pusher.unsubscribe('chat-group');
      pusher.unsubscribe(getChatChannel(user.id));
    };
  }, [phase.phase, user.id, loadConversations]);

  const addMessage = useCallback((m: ChatMessage) => {
    setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
    loadConversations();
  }, [loadConversations]);

  const recipientId = phase.phase === 'private' ? phase.contact.id : null;
  const active = phase.phase !== 'selecting';
  const { setLastId } = usePusherChat(user.id, recipientId, active, addMessage);

  const markRead = useCallback((convKey: string, lastId: number) => {
    fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, conversation_key: convKey, last_read_id: lastId }),
    }).catch(() => {});
  }, [user.id]);

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
          if (rows.length > 0) {
            setLastId(rows[rows.length - 1].id);
            const convKey = phase.phase === 'group' ? 'group' : `private-${Math.min(user.id, recipientId!)}-${Math.max(user.id, recipientId!)}`;
            markRead(convKey, rows[rows.length - 1].id);
          }
        }
      })
      .finally(() => setLoaded(true));
  }, [phase, user.id]);

  const handleEdit = async (id: number, newContent: string) => {
    await fetch('/api/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, message_id: id, content: newContent }),
    });
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, content: newContent, edited: true } : m));
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/messages?user_id=${user.id}&message_id=${id}`, { method: 'DELETE' });
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  // ── Pantalla de seleccion ──────────────────────────────────
  if (phase.phase === 'selecting') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col fade-in" style={{ background: '#0d1117', height: '100dvh' }}>
        <div className="flex items-center gap-3 px-3 py-2.5 bg-[#1f2c33] border-b border-gray-800">
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-red-600/90 text-white flex items-center justify-center text-lg font-bold active:scale-90">✕</button>
          <span className="text-[15px] text-chatText font-medium">🔒 Chats</span>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2 flex flex-col gap-1">
          {conversations.map((conv) => (
            <button
              key={conv.key}
              onClick={() => {
                if (conv.type === 'group') {
                  setPhase({ phase: 'group' });
                } else {
                  setPhase({ phase: 'private', contact: { id: conv.recipientId!, display_name: conv.name, emoji: conv.emoji, color: conv.color || '#888' } });
                }
              }}
              className="flex items-center gap-3 bg-[#1f2c33] rounded-xl px-3 py-3 active:opacity-70 text-left w-full"
              style={{ borderLeft: conv.color ? `3px solid ${conv.color}` : '3px solid #2d9e4a' }}
            >
              {/* Avatar */}
              {conv.avatar_url ? (
                <img src={conv.avatar_url} alt={conv.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-[#2a3942] flex items-center justify-center text-2xl flex-shrink-0">{conv.emoji}</div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-chatText text-[14px] font-medium truncate">{conv.name}</span>
                  {conv.last_message && (
                    <span className="text-gray-500 text-[11px] flex-shrink-0">{timeLabel(conv.last_message.created_at)}</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <span className="text-gray-500 text-[12px] truncate">{lastMessagePreview(conv.last_message, user.id)}</span>
                  {conv.unread > 0 && (
                    <div className="w-5 h-5 rounded-full bg-[#25d366] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[11px] font-semibold">{conv.unread > 9 ? '9+' : conv.unread}</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Pantalla de chat ───────────────────────────────────────
  const chatTitle = phase.phase === 'group' ? '👥 Grupo general' : `${phase.contact.emoji} ${phase.contact.display_name}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col fade-in" style={{ background: '#0d1117', height: '100dvh' }}>
      <div className="flex items-center gap-3 px-3 py-2.5 bg-[#1f2c33] border-b border-gray-800">
        <button
          onClick={() => { setPhase({ phase: 'selecting' }); setMessages([]); setLoaded(false); loadConversations(); }}
          className="w-9 h-9 rounded-full bg-gray-600/80 text-white flex items-center justify-center text-lg font-bold active:scale-90"
        >←</button>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-red-600/90 text-white flex items-center justify-center text-lg font-bold active:scale-90">✕</button>
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
        initialText={phase.phase === 'group' ? initialSharedText : null}
      />
    </div>
  );
}