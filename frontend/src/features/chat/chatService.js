import { apiRequest } from '@/services/api/client.js'

export function getChatFriends() {
  return apiRequest('/chat/friends')
}

export function getConversation(friendId) {
  return apiRequest(`/chat/conversations/${friendId}`)
}

export function sendChatMessage(recipientId, body) {
  return apiRequest('/chat/messages', {
    method: 'POST',
    body: JSON.stringify({ recipientId, body }),
  })
}

export function setChatTyping(friendId, typing) {
  return apiRequest(`/chat/typing/${friendId}?typing=${typing}`, {
    method: 'POST',
  })
}

export function getChatTyping(friendId) {
  return apiRequest(`/chat/typing/${friendId}`)
}
