import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import BibleChapter from '@/components/bible/BibleChapter.jsx'
import BibleToolbar from '@/components/bible/BibleToolbar.jsx'
import { AppPageLayout, PageHeader } from '@/components/common/AppPageLayout.jsx'
import BookmarkModal from '@/components/reading/BookmarkModal.jsx'
import StatusModal from '@/components/auth/shared/StatusModal.jsx'
import ShareVerseModal from '@/components/community/ShareVerseModal.jsx'
import {
  getBibleBrowserData,
  getBookChapters,
  getChapterVerses,
} from '@/features/bible/bibleService.js'
import { getAuthSession, getAuthToken } from '@/features/auth/authStorage.js'
import {
  addVerseBookmark,
  removeVerseBookmark,
} from '@/features/reading/readingService.js'
import { createCommunityPost } from '@/features/community/communityService.js'

const isOldTestament = (book) => book.orderIndex <= 39

const BOOK_ALIASES = new Map([
  ['psalm', 'psalms'],
  ['song of songs', 'song of solomon'],
  ['canticles', 'song of solomon'],
])

function normalizedBookTitle(title) {
  const normalized = title?.trim().toLowerCase().replace(/\s+/g, ' ') || ''
  return BOOK_ALIASES.get(normalized) || normalized
}

function BiblePage({ onNavigate }) {
  const { t, i18n } = useTranslation()
  const [books, setBooks] = useState([])
  const [versions, setVersions] = useState([])
  const [selectedVersion, setSelectedVersion] = useState('KJV')
  const [chapters, setChapters] = useState([])
  const [verses, setVerses] = useState([])
  const [todayTask, setTodayTask] = useState(null)
  const [testament, setTestament] = useState('NEW')
  const [selectedBook, setSelectedBook] = useState(null)
  const [selectedChapter, setSelectedChapter] = useState(null)
  const [selectedVerseIndex, setSelectedVerseIndex] = useState(0)
  const [textSize, setTextSize] = useState(0)
  const [bookmarkColors, setBookmarkColors] = useState(new Map())
  const [bookmarkTarget, setBookmarkTarget] = useState(null)
  const [bookmarkSaving, setBookmarkSaving] = useState(false)
  const [shareTarget, setShareTarget] = useState(null)
  const [shareSaving, setShareSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const session = getAuthSession()

  useEffect(() => {
    if (!getAuthToken()) {
      onNavigate('/')
      return
    }

    let active = true

    async function initializeBible() {
      try {
        const browserData = await getBibleBrowserData()
        if (!active) return

        const search = new URLSearchParams(window.location.search)
        const requestedBook = search.get('book')
        const requestedChapter = Number(search.get('chapter'))
        const requestedVerse = Number(search.get('verse'))
        const showBookmarks = search.get('bookmarks') === '1'
        const initialBookmark = showBookmarks
          ? browserData.bookmarks[0]
          : null
        const todayPassage = browserData.todayTask?.passages?.[0]
        const requestedBookEntry = browserData.books.find(
          (book) =>
            normalizedBookTitle(book.title) ===
            normalizedBookTitle(requestedBook),
        )
        const initialBook =
          browserData.books.find(
            (book) => book.title === initialBookmark?.book,
          ) ||
          requestedBookEntry ||
          browserData.books.find(
            (book) => book.bookId === todayPassage?.bookId,
          ) ||
          browserData.books.find((book) => book.title === 'Matthew') ||
          browserData.books.find((book) => !isOldTestament(book)) ||
          browserData.books[0]

        if (!initialBook) {
          throw new Error('No Bible books are available.')
        }

        const initialChapters = await getBookChapters(initialBook.bookId)
        const preferredChapter =
          initialBookmark?.book === initialBook.title
            ? initialBookmark.chapterNumber
            : requestedBookEntry?.bookId === initialBook.bookId &&
                Number.isInteger(requestedChapter) &&
                requestedChapter > 0
              ? requestedChapter
            : todayPassage?.bookId === initialBook.bookId
            ? todayPassage.chapterNumber
            : initialBook.title === 'Matthew'
              ? 5
              : 1
        const initialChapter =
          initialChapters.find(
            (chapter) => chapter.chapterNumber === preferredChapter,
          ) || initialChapters[0]

        if (!initialChapter) {
          throw new Error(`No chapters are available for ${initialBook.title}.`)
        }

        const preferredVersion = String(i18n.resolvedLanguage || '')
          .toLowerCase().startsWith('pt') ? 'NVI' : 'KJV'
        const initialVersion =
          browserData.versions.find((version) => version.code === preferredVersion) ||
          browserData.versions.find((version) => version.code === 'KJV') ||
          browserData.versions[0]
        if (!initialVersion) {
          throw new Error('No Bible versions are available.')
        }
        const initialVerses = await getChapterVerses(
          initialChapter.chapterId,
          initialVersion.code,
        )
        if (!active) return

        setBooks(browserData.books)
        setVersions(browserData.versions)
        setSelectedVersion(initialVersion.code)
        setTodayTask(browserData.todayTask)
        setBookmarkColors(
          new Map(
            browserData.bookmarks.map((bookmark) => [
              bookmark.verseId,
              bookmark.highlightColor || '#FFD6A1',
            ]),
          ),
        )
        setTestament(isOldTestament(initialBook) ? 'OLD' : 'NEW')
        setSelectedBook(initialBook)
        setChapters(initialChapters)
        setSelectedChapter(initialChapter)
        setVerses(
          initialVerses.map((verse) => ({
            ...verse,
            bookTitle: initialBook.title,
            chapterNumber: initialChapter.chapterNumber,
          })),
        )
        if (initialBookmark || requestedVerse > 0) {
          const bookmarkedIndex = initialVerses.findIndex(
            (verse) =>
              initialBookmark
                ? verse.verseId === initialBookmark.verseId
                : verse.verseNumber === requestedVerse,
          )
          if (bookmarkedIndex >= 0) setSelectedVerseIndex(bookmarkedIndex)
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message || 'Unable to load the Bible.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    initializeBible()
    return () => {
      active = false
    }
  }, [i18n.resolvedLanguage, onNavigate])

  const testamentBooks = useMemo(
    () =>
      books.filter((book) =>
        testament === 'OLD' ? isOldTestament(book) : !isOldTestament(book),
      ),
    [books, testament],
  )

  async function loadChapter(
    chapter,
    book = selectedBook,
    versionCode = selectedVersion,
  ) {
    if (!chapter || !book) return
    setLoading(true)
    try {
      const chapterVerses = await getChapterVerses(
        chapter.chapterId,
        versionCode,
      )
      setSelectedChapter(chapter)
      setSelectedVerseIndex(0)
      setVerses(
        chapterVerses.map((verse) => ({
          ...verse,
          bookTitle: book.title,
          chapterNumber: chapter.chapterNumber,
        })),
      )
    } catch (requestError) {
      setError(requestError.message || 'Unable to load this chapter.')
    } finally {
      setLoading(false)
    }
  }

  async function openBook(book, preferredChapter = 1, useLastChapter = false) {
    if (!book) return
    setLoading(true)
    try {
      const bookChapters = await getBookChapters(book.bookId)
      const chapter = useLastChapter
        ? bookChapters.at(-1)
        : bookChapters.find(
            (candidate) => candidate.chapterNumber === preferredChapter,
          ) || bookChapters[0]

      if (!chapter) throw new Error(`No chapters are available for ${book.title}.`)

      const chapterVerses = await getChapterVerses(
        chapter.chapterId,
        selectedVersion,
      )
      setTestament(isOldTestament(book) ? 'OLD' : 'NEW')
      setSelectedBook(book)
      setChapters(bookChapters)
      setSelectedChapter(chapter)
      setSelectedVerseIndex(0)
      setVerses(
        chapterVerses.map((verse) => ({
          ...verse,
          bookTitle: book.title,
          chapterNumber: chapter.chapterNumber,
        })),
      )
    } catch (requestError) {
      setError(requestError.message || 'Unable to open this book.')
    } finally {
      setLoading(false)
    }
  }

  function changeTestament(nextTestament) {
    const firstBook = books.find((book) =>
      nextTestament === 'OLD'
        ? isOldTestament(book)
        : !isOldTestament(book),
    )
    if (firstBook) openBook(firstBook)
  }

  async function changeVersion(versionCode) {
    if (!selectedChapter || versionCode === selectedVersion) return
    setLoading(true)
    try {
      const chapterVerses = await getChapterVerses(
        selectedChapter.chapterId,
        versionCode,
      )
      setSelectedVersion(versionCode)
      setSelectedVerseIndex(0)
      setVerses(
        chapterVerses.map((verse) => ({
          ...verse,
          bookTitle: selectedBook.title,
          chapterNumber: selectedChapter.chapterNumber,
        })),
      )
    } catch (requestError) {
      setError(requestError.message || 'Unable to change Bible version.')
    } finally {
      setLoading(false)
    }
  }

  function navigateChapter(direction) {
    if (!selectedBook || !selectedChapter) return
    const chapterIndex = chapters.findIndex(
      (chapter) => chapter.chapterId === selectedChapter.chapterId,
    )
    const adjacentChapter = chapters[chapterIndex + direction]

    if (adjacentChapter) {
      loadChapter(adjacentChapter)
      return
    }

    const bookIndex = books.findIndex(
      (book) => book.bookId === selectedBook.bookId,
    )
    const adjacentBook = books[bookIndex + direction]
    if (adjacentBook) {
      openBook(adjacentBook, 1, direction < 0)
    }
  }

  function openTodaysReading() {
    const passage = todayTask?.passages?.[0]
    const book = books.find((candidate) => candidate.bookId === passage?.bookId)
    if (book && passage) openBook(book, passage.chapterNumber)
  }

  async function saveBookmark(verse, highlightColor) {
    if (!verse || bookmarkSaving) return
    setBookmarkSaving(true)
    try {
      const bookmark = await addVerseBookmark(verse.verseId, highlightColor)
      setBookmarkColors((current) => {
        const next = new Map(current)
        next.set(verse.verseId, bookmark.highlightColor)
        return next
      })
      setBookmarkTarget(null)
    } catch (requestError) {
      setBookmarkTarget(null)
      setError(requestError.message || 'Unable to update this bookmark.')
    } finally {
      setBookmarkSaving(false)
    }
  }

  async function removeBookmark(verse) {
    if (!verse || bookmarkSaving) return
    setBookmarkSaving(true)
    try {
      await removeVerseBookmark(verse.verseId)
      setBookmarkColors((current) => {
        const next = new Map(current)
        next.delete(verse.verseId)
        return next
      })
      setBookmarkTarget(null)
    } catch (requestError) {
      setBookmarkTarget(null)
      setError(requestError.message || 'Unable to remove this bookmark.')
    } finally {
      setBookmarkSaving(false)
    }
  }

  async function shareVerse(caption) {
    if (!shareTarget || shareSaving) return
    setShareSaving(true)
    try {
      await createCommunityPost({
        postType: 'VERSE',
        verseId: shareTarget.verseId,
        content: caption,
      })
      setShareTarget(null)
      onNavigate('/community')
    } catch (requestError) {
      setShareTarget(null)
      setError(requestError.message || 'Unable to share this verse.')
    } finally {
      setShareSaving(false)
    }
  }

  return (
    <AppPageLayout
      name={session?.fullname}
      onNavigate={onNavigate}
      activePath="/bible"
    >
          <PageHeader
            title={t('pages.bible.title')}
            subtitle={t('pages.bible.subtitle')}
            className="mb-5"
          />

          <BibleToolbar
            versions={versions}
            selectedVersion={selectedVersion}
            testament={testament}
            books={testamentBooks}
            chapters={chapters}
            verses={verses}
            selectedBookId={selectedBook?.bookId}
            selectedChapterId={selectedChapter?.chapterId}
            selectedVerseNumber={verses[selectedVerseIndex]?.verseNumber}
            focusBook={
              new URLSearchParams(window.location.search).get('focus') === 'book'
            }
            todayAvailable={Boolean(todayTask?.passages?.length)}
            loading={loading}
            onTestamentChange={changeTestament}
            onVersionChange={changeVersion}
            onBookChange={(bookId) =>
              openBook(books.find((book) => book.bookId === bookId))
            }
            onChapterChange={(chapterId) =>
              loadChapter(
                chapters.find((chapter) => chapter.chapterId === chapterId),
              )
            }
            onVerseChange={(verseNumber) => {
              const nextIndex = verses.findIndex(
                (verse) => verse.verseNumber === verseNumber,
              )
              if (nextIndex >= 0) setSelectedVerseIndex(nextIndex)
            }}
            onPrevious={() => navigateChapter(-1)}
            onNext={() => navigateChapter(1)}
            onToday={openTodaysReading}
          />

          <BibleChapter
            book={selectedBook}
            chapter={selectedChapter}
            verses={verses}
            versionName={
              versions.find((version) => version.code === selectedVersion)
                ?.name
            }
            selectedIndex={selectedVerseIndex}
            textSize={textSize}
            bookmarkColors={bookmarkColors}
            loading={loading}
            onSelectVerse={setSelectedVerseIndex}
            onTextSize={() => setTextSize((current) => (current + 1) % 3)}
            onBookmark={setBookmarkTarget}
            onShare={setShareTarget}
          />
      {bookmarkTarget && (
        <BookmarkModal
          verse={bookmarkTarget}
          initialColor={bookmarkColors.get(bookmarkTarget.verseId)}
          bookmarked={bookmarkColors.has(bookmarkTarget.verseId)}
          saving={bookmarkSaving}
          onSave={(color) => saveBookmark(bookmarkTarget, color)}
          onRemove={() => removeBookmark(bookmarkTarget)}
          onClose={() => setBookmarkTarget(null)}
        />
      )}

      {shareTarget && (
        <ShareVerseModal
          verse={shareTarget}
          sharing={shareSaving}
          onShare={shareVerse}
          onClose={() => setShareTarget(null)}
        />
      )}

      {error && (
        <StatusModal
          type="error"
          title={t('pages.bible.unavailable')}
          message={error}
          onClose={() => {
            setError('')
            if (!books.length) onNavigate('/home')
          }}
        />
      )}
    </AppPageLayout>
  )
}

export default BiblePage
