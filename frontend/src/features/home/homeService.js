import { apiRequest } from '@/services/api/client.js'

export async function getHomeData() {
  const [plan, task, progress, streak, notifications, bookmarks] =
    await Promise.all([
      apiRequest('/plans/me/current'),
      apiRequest('/plans/me/today'),
      apiRequest('/plans/me/current/progress'),
      apiRequest('/users/me/streak'),
      apiRequest('/users/me/notifications'),
      apiRequest('/users/me/bookmarks'),
    ])

  return { plan, task, progress, streak, notifications, bookmarks }
}
