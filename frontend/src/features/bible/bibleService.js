import { apiRequest } from '@/services/api/client.js'

export async function getBibleBrowserData() {
  const [books, bookmarks, todayTask] = await Promise.all([
    apiRequest('/bible/books', { authenticated: false }),
    apiRequest('/users/me/bookmarks').catch(() => []),
    apiRequest('/plans/me/today').catch(() => null),
  ])

  return { books, bookmarks, todayTask }
}

export function getBookChapters(bookId) {
  return apiRequest(`/bible/books/${bookId}/chapters`, {
    authenticated: false,
  })
}

export function getChapterVerses(chapterId) {
  return apiRequest(`/bible/chapters/${chapterId}/verses`, {
    authenticated: false,
  })
}
