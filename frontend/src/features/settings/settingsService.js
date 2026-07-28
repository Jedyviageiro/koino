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
