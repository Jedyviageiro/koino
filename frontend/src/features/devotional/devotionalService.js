import { apiRequest } from '@/services/api/client.js'

export async function getTodayDevotional() {
  const [plan, task] = await Promise.all([
    apiRequest('/plans/me/current'),
    apiRequest('/plans/me/today'),
  ])

  if (!task) {
    return { plan, task: null, devotional: null }
  }

  const devotional = await apiRequest(
    `/plans/me/tasks/${task.taskId}/devotional`,
  )
  return { plan, task, devotional }
}
