import { apiRequest } from '@/services/api/client.js'

async function getPassageVerses(passage) {
  const verses = await apiRequest(
    `/bible/books/${encodeURIComponent(passage.bookTitle)}/chapters/${passage.chapterNumber}/verses`,
    { authenticated: false },
  )

  return verses
    .filter(
      (verse) =>
        verse.verseNumber >= passage.firstVerse &&
        verse.verseNumber <= passage.lastVerse,
    )
    .map((verse) => ({
      ...verse,
      bookTitle: passage.bookTitle,
      chapterNumber: passage.chapterNumber,
    }))
}

export async function getReadingData() {
  const [plan, task, bookmarks] = await Promise.all([
    apiRequest('/plans/me/current'),
    apiRequest('/plans/me/today'),
    apiRequest('/users/me/bookmarks'),
  ])

  if (!task) {
    return { plan, task: null, verses: [], bookmarks }
  }

  const passageVerses = await Promise.all(task.passages.map(getPassageVerses))
  return {
    plan,
    task,
    verses: passageVerses.flat(),
    bookmarks,
  }
}

export function saveReadingProgress(taskId, verseIndex) {
  return apiRequest(`/plans/me/tasks/${taskId}/progress`, {
    method: 'PATCH',
    body: JSON.stringify({ verseIndex }),
  })
}

export function completeReading(taskId) {
  return apiRequest(`/plans/me/tasks/${taskId}/complete`, {
    method: 'PATCH',
  })
}

export function addVerseBookmark(verseId, highlightColor) {
  return apiRequest(`/users/me/bookmarks/${verseId}`, {
    method: 'PUT',
    body: JSON.stringify({ highlightColor }),
  })
}

export function removeVerseBookmark(verseId) {
  return apiRequest(`/users/me/bookmarks/${verseId}`, { method: 'DELETE' })
}
