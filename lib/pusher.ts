import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher (para disparar eventos desde API routes)
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

// Client-side Pusher (singleton)
let pusherClientInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
  }
  return pusherClientInstance;
}

// Canal para mensajes de chat
// grupo: 'chat-group'
// privado entre A y B: 'chat-private-{min}-{max}'
export function getChatChannel(recipientId: number | null): string {
  return recipientId === null ? 'chat-group' : `chat-private-${recipientId}`;
}
