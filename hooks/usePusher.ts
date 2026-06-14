'use client';
import { useEffect, useRef } from 'react';
import { getPusherClient, getChatChannel } from '@/lib/pusher';
import type { ChatMessage } from './useSSE';

export function usePusherChat(
  userId: number | null,
  recipientId: number | null | undefined,
  active: boolean,
  onMessage: (m: ChatMessage) => void
) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const setLastId = (id: number) => {};

  useEffect(() => {
    if (!active || !userId) return;

    const pusher = getPusherClient();
    const channelName = getChatChannel(recipientId ?? null);
    const channel = pusher.subscribe(channelName);

    channel.bind('new-message', (data: ChatMessage) => {
      onMessageRef.current(data);
    });

    // Para chat privado también escuchar el canal del otro lado
    let channelMine: any = null;
    if (recipientId !== null && recipientId !== undefined) {
      const myChannel = getChatChannel(userId);
      if (myChannel !== channelName) {
        channelMine = pusher.subscribe(myChannel);
        channelMine.bind('new-message', (data: ChatMessage) => {
          onMessageRef.current(data);
        });
      }
    }

    return () => {
      pusher.unsubscribe(channelName);
      if (channelMine) pusher.unsubscribe(getChatChannel(userId));
    };
  }, [active, userId, recipientId]);

  return { setLastId };
}
