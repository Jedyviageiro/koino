import { apiRequest } from '@/services/api/client.js'

export async function getPlansPageData() {
  const [route, userPlans, todayTask] = await Promise.all([
    apiRequest('/plans/me/route'),
    apiRequest('/plans/me'),
    apiRequest('/plans/me/today'),
  ])

  return { route, userPlans, todayTask }
}
