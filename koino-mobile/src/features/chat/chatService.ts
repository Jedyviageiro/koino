import { authenticatedRequest } from '@/services/authenticatedApi';

import type { ChatFriend, ChatMessage } from './types';

export function getChatFriends() {
  return authenticatedRequest<ChatFriend[]>('/chat/friends');
}

export function getConversation(friendId: number) {
  return authenticatedRequest<ChatMessage[]>(`/chat/conversations/${friendId}`);
}

export function sendChatMessage(recipientId: number, body: string) {
  return authenticatedRequest<ChatMessage>('/chat/messages', {
    method: 'POST',
    body: JSON.stringify({ recipientId, body: body.trim() }),
  });
}

export function sendChatPhoto(recipientId: number, uri: string, mimeType: string | null, fileName: string | null, caption: string) {
  const body = new FormData();
  body.append('recipientId', String(recipientId));
  body.append('file', { uri, type: mimeType || 'image/jpeg', name: fileName || `koino-chat-${Date.now()}.jpg` } as unknown as Blob);
  if (caption.trim()) body.append('caption', caption.trim());
  return authenticatedRequest<ChatMessage>('/chat/messages/photo', { method: 'POST', body });
}

export function setChatTyping(friendId: number, typing: boolean) {
  return authenticatedRequest<{ typing: boolean }>(`/chat/typing/${friendId}?typing=${typing}`, { method: 'POST' });
}

export function getChatTyping(friendId: number) {
  return authenticatedRequest<{ typing: boolean }>(`/chat/typing/${friendId}`);
}
