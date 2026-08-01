import { apiRequest } from '@/services/api/client.js'

export function getWatchCatalog(language = 'en') {
  return apiRequest(`/watch/videos?language=${encodeURIComponent(language)}`)
}
