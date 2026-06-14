'use client';
import { useEffect, useRef } from 'react';

export type ChatMessage = {
  id: number;
  user_id: number;
  recipient_id: number | null;
  type: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  thumbnail_url: string | null;
  created_at: string;
  edited: boolean;
  display_name: string;
  emoji: string;
  color: string;
};

export function useSSE(
  userId: number | null,
  recipientId: number | null | undefined,
  active: boolean,
  onMessage: (m: ChatMessage) => void
) {
  const lastIdRef = useRef(0);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!active || !userId) return;
    let es: EventSource | null = null;
    let stopped = false;

    const connect = () => {
      if (stopped) return;
      const rid = recipientId == null ? 'null' : String(recipientId);
      es = new EventSource(
        `/api/messages/stream?user_id=${userId}&recipient_id=${rid}&last_id=${lastIdRef.current}`
      );
      es.addEventListener('message', (e) => {
        try {
          const msg = JSON.parse((e as MessageEvent).data) as ChatMessage;
          if (msg.id > lastIdRef.current) lastIdRef.current = msg.id;
          onMessageRef.current(msg);
        } catch {}
      });
      es.onerror = () => {
        es?.close();
        if (!stopped) setTimeout(connect, 1500);
      };
    };
    connect();

    return () => {
      stopped = true;
      es?.close();
    };
  }, [active, userId, recipientId]);

  const setLastId = (id: number) => {
    if (id > lastIdRef.current) lastIdRef.current = id;
  };
  return { setLastId };
}
