import { apiRequest } from '@/services/api/client.js'

export function getWatchCatalog() {
  return apiRequest('/watch/videos')
}
