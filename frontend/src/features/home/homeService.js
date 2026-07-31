import { apiRequest } from '@/services/api/client.js'

export async function getHomeData() {
  const [plan, task, progress, streak, notifications, bookmarks, verseOfDay] =
    await Promise.all([
      apiRequest('/plans/me/current'),
      apiRequest('/plans/me/today'),
      apiRequest('/plans/me/current/progress'),
      apiRequest('/users/me/streak'),
      apiRequest('/users/me/notifications'),
      apiRequest('/users/me/bookmarks'),
      apiRequest('/verse-of-day'),
    ])

  return {
    plan,
    task,
    progress,
    streak,
    notifications,
    bookmarks,
    verseOfDay,
  }
}

export function markNotificationRead(notificationId) {
  return apiRequest(`/users/me/notifications/${notificationId}/read`, {
    method: 'PATCH',
  })
}

export function markAllNotificationsRead() {
  return apiRequest('/users/me/notifications/read', {
    method: 'PATCH',
  })
}
