import { apiRequest } from '@/services/api/client.js'

export async function getPlansPageData() {
  const onboarding = await apiRequest('/onboarding/status')
  if (!onboarding.completed) {
    return {
      route: [],
      userPlans: [],
      todayTask: null,
      needsOnboarding: true,
    }
  }

  const [userPlans, todayTask] = await Promise.all([
    apiRequest('/plans/me'),
    apiRequest('/plans/me/today'),
  ])

  let route
  try {
    route = await apiRequest('/plans/me/route')
  } catch {
    const templates = await apiRequest('/plans', { authenticated: false })
    const activePlanCodes = new Set(userPlans.map((plan) => plan.planCode))
    route = templates.filter((template) =>
      activePlanCodes.has(template.planCode),
    )
  }

  return {
    route,
    userPlans,
    todayTask,
    needsOnboarding: false,
  }
}
