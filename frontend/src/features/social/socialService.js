import { apiRequest } from '@/services/api/client.js'

export function getUserProfile(userId) {
  return apiRequest(`/users/${userId}/profile`)
}

export function getPublicUserProfile(username) {
  return apiRequest(`/users/u/${encodeURIComponent(username)}`)
}

export function requestFriend(userId) {
  return apiRequest(`/users/me/friend-requests/${userId}`, {
    method: 'POST',
  })
}

export function acceptFriend(friendshipId) {
  return apiRequest(`/users/me/friend-requests/${friendshipId}/accept`, {
    method: 'PATCH',
  })
}

export function removeFriendship(friendshipId) {
  return apiRequest(`/users/me/friend-requests/${friendshipId}`, {
    method: 'DELETE',
  })
}
