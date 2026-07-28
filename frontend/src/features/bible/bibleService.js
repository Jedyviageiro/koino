import { apiRequest } from '@/services/api/client.js'

export async function getBibleBrowserData() {
  const [books, versions, bookmarks, todayTask] = await Promise.all([
    apiRequest('/bible/books', { authenticated: false }),
    apiRequest('/bible/versions', { authenticated: false }),
    apiRequest('/users/me/bookmarks').catch(() => []),
    apiRequest('/plans/me/today').catch(() => null),
  ])

  return { books, versions, bookmarks, todayTask }
}

export function getBookChapters(bookId) {
  return apiRequest(`/bible/books/${bookId}/chapters`, {
    authenticated: false,
  })
}

export function getChapterVerses(chapterId, version = 'KJV') {
  const query = new URLSearchParams({ version })
  return apiRequest(`/bible/chapters/${chapterId}/verses?${query}`, {
    authenticated: false,
  })
}
