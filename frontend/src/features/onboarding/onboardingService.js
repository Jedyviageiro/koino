import { apiRequest } from '@/services/api/client.js'

export function completeOnboarding(preferences) {
  return apiRequest('/onboarding', {
    method: 'POST',
    body: JSON.stringify(preferences),
  })
}
