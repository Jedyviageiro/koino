import { useEffect, useMemo, useState } from 'react'
import BibleChapter from '@/components/bible/BibleChapter.jsx'
import BibleToolbar from '@/components/bible/BibleToolbar.jsx'
import HomeSidebar from '@/components/home/HomeSidebar.jsx'
import BookmarkModal from '@/components/reading/BookmarkModal.jsx'
import StatusModal from '@/components/auth/shared/StatusModal.jsx'
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

const isOldTestament = (book) => book.orderIndex <= 39

function BiblePage({ onNavigate }) {
  const [books, setBooks] = useState([])
  const [chapters, setChapters] = useState([])
  const [verses, setVerses] = useState([])
  const [todayTask, setTodayTask] = useState(null)
  const [testament, setTestament] = useState('NEW')
  const [selectedBook, setSelectedBook] = useState(null)
  const [selectedChapter, setSelectedChapter] = useState(null)
  const [selectedVerseIndex, setSelectedVerseIndex] = useState(0)
  const [textSize, setTextSize] = useState(1)
  const [bookmarkColors, setBookmarkColors] = useState(new Map())
  const [bookmarkTarget, setBookmarkTarget] = useState(null)
  const [bookmarkSaving, setBookmarkSaving] = useState(false)
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

        const todayPassage = browserData.todayTask?.passages?.[0]
        const initialBook =
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
          todayPassage?.bookId === initialBook.bookId
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

        const initialVerses = await getChapterVerses(initialChapter.chapterId)
        if (!active) return

        setBooks(browserData.books)
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
  }, [onNavigate])

  const testamentBooks = useMemo(
    () =>
      books.filter((book) =>
        testament === 'OLD' ? isOldTestament(book) : !isOldTestament(book),
      ),
    [books, testament],
  )

  async function loadChapter(chapter, book = selectedBook) {
    if (!chapter || !book) return
    setLoading(true)
    try {
      const chapterVerses = await getChapterVerses(chapter.chapterId)
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

      const chapterVerses = await getChapterVerses(chapter.chapterId)
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

  return (
    <div className="min-h-svh bg-[#fbfcfe] text-[#0d0f12] lg:grid lg:grid-cols-[150px_minmax(0,1fr)]">
      <HomeSidebar
        name={session?.fullname || 'Koino Reader'}
        onNavigate={onNavigate}
        activePath="/bible"
      />

      <main className="min-w-0 px-[18px] pb-12 pt-7 sm:px-7 lg:px-9 lg:pt-8">
        <div className="mx-auto max-w-[1100px]">
          <header className="mb-5">
            <h1 className="text-[30px] font-semibold leading-tight">Bible</h1>
            <p className="mt-1.5 text-[14px] text-[#667089]">
              Read, study, and grow in God&apos;s Word.
            </p>
          </header>

          <BibleToolbar
            testament={testament}
            books={testamentBooks}
            chapters={chapters}
            verses={verses}
            selectedBookId={selectedBook?.bookId}
            selectedChapterId={selectedChapter?.chapterId}
            selectedVerseNumber={verses[selectedVerseIndex]?.verseNumber}
            todayAvailable={Boolean(todayTask?.passages?.length)}
            loading={loading}
            onTestamentChange={changeTestament}
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
            selectedIndex={selectedVerseIndex}
            textSize={textSize}
            bookmarkColors={bookmarkColors}
            loading={loading}
            onSelectVerse={setSelectedVerseIndex}
            onTextSize={() => setTextSize((current) => (current + 1) % 3)}
            onBookmark={setBookmarkTarget}
          />
        </div>
      </main>

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

      {error && (
        <StatusModal
          type="error"
          title="Bible unavailable"
          message={error}
          onClose={() => {
            setError('')
            if (!books.length) onNavigate('/home')
          }}
        />
      )}
    </div>
  )
}

export default BiblePage
