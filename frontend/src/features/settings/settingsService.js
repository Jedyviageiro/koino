import { apiRequest } from '@/services/api/client.js'

export function getSettings() {
  return apiRequest('/users/me/settings')
}

export function updateSettings(settings) {
  return apiRequest('/users/me/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  })
}

export function deactivateAccount() {
  return apiRequest('/users/me/deactivate', {
    method: 'PATCH',
  })
}

export function uploadProfilePicture(file) {
  const body = new FormData()
  body.append('file', file)
  return apiRequest('/users/me/profile-picture', {
    method: 'PUT',
    body,
  })
}

export function removeProfilePicture() {
  return apiRequest('/users/me/profile-picture', {
    method: 'DELETE',
  })
}
