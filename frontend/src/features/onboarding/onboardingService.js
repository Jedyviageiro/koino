import { apiRequest } from '@/services/api/client.js'

export function completeOnboarding(preferences) {
  return apiRequest('/onboarding', {
    method: 'POST',
    body: JSON.stringify(preferences),
  })
}

export async function getGeneratedPlanSummary() {
  const [plan, templates] = await Promise.all([
    apiRequest('/plans/me/current'),
    apiRequest('/plans', { authenticated: false }),
  ])
  const template = templates.find(
    (candidate) => candidate.planCode === plan?.planCode,
  )

  return {
    ...plan,
    description: template?.description || '',
    bookNames: template?.bookNames || '',
  }
}
