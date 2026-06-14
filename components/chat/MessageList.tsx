'use client';
import { useEffect, useRef } from 'react';
import type { ChatMessage } from '@/hooks/useSSE';
import MessageBubble from './MessageBubble';

type Props = {
  messages: ChatMessage[];
  myId: number;
  scrollOnLoad?: boolean;
  onEdit: (id: number, content: string) => void;
  onDelete: (id: number) => void;
};

export default function MessageList({ messages, myId, scrollOnLoad, onEdit, onDelete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    if (scrollOnLoad) setTimeout(() => scrollToBottom(), 100);
  }, [scrollOnLoad]);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages.length]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-3 py-2 chat-scroll">
      {messages.length === 0 && (
        <p className="text-center text-gray-500 text-[13px] mt-10">Sin mensajes todavia</p>
      )}
      {messages.map((m) => (
        <MessageBubble
          key={m.id}
          msg={m}
          mine={m.user_id === myId}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
