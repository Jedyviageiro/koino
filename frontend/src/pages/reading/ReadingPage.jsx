import { useEffect, useMemo, useState } from 'react'
import { Bell, Search } from 'lucide-react'
import HomeSidebar from '@/components/home/HomeSidebar.jsx'
import BibleReader from '@/components/reading/BibleReader.jsx'
import BookmarkModal from '@/components/reading/BookmarkModal.jsx'
import ReadingRail from '@/components/reading/ReadingRail.jsx'
import StatusModal from '@/components/auth/shared/StatusModal.jsx'
import { getAuthSession, getAuthToken } from '@/features/auth/authStorage.js'
import {
  addVerseBookmark,
  completeReading,
  getReadingData,
  removeVerseBookmark,
  saveReadingProgress,
} from '@/features/reading/readingService.js'

function ReadingPage({ onNavigate }) {
  const [data, setData] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(1)
  const [textSize, setTextSize] = useState(1)
  const [bookmarkColors, setBookmarkColors] = useState(new Map())
  const [bookmarkTarget, setBookmarkTarget] = useState(null)
  const [bookmarkSaving, setBookmarkSaving] = useState(false)
  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState('')
  const session = getAuthSession()

  useEffect(() => {
    if (!getAuthToken()) {
      onNavigate('/')
      return
    }

    let active = true
    getReadingData()
      .then((readingData) => {
        if (!active) return
        if (!readingData.task || !readingData.verses.length) {
          setError('There is no reading available for today yet.')
          return
        }
        setData(readingData)
        setCurrentIndex(
          Math.min(
            readingData.verses.length,
            Math.max(1, readingData.task.currentVerseIndex || 1),
          ),
        )
        setBookmarkColors(
          new Map(
            readingData.bookmarks.map((bookmark) => [
              bookmark.verseId,
              bookmark.highlightColor || '#CFE0FF',
            ]),
          ),
        )
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || 'Unable to open today\'s reading.')
        }
      })

    return () => {
      active = false
    }
  }, [onNavigate])

  const currentVerse = data?.verses[currentIndex - 1]
  const bookmarked = useMemo(
    () => Boolean(currentVerse && bookmarkColors.has(currentVerse.verseId)),
    [bookmarkColors, currentVerse],
  )

  async function selectVerse(nextIndex) {
    if (!data?.task || saving || nextIndex === currentIndex) return
    const previousIndex = currentIndex
    setCurrentIndex(nextIndex)
    setSaving(true)
    try {
      await saveReadingProgress(data.task.taskId, nextIndex)
    } catch (requestError) {
      setCurrentIndex(previousIndex)
      setError(requestError.message || 'Unable to save your reading position.')
    } finally {
      setSaving(false)
    }
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

  async function finishReading() {
    if (!data?.task || saving) return
    setCompleting(true)
    try {
      await completeReading(data.task.taskId)
      onNavigate('/home')
    } catch (requestError) {
      setError(requestError.message || 'Unable to complete today\'s reading.')
      setCompleting(false)
    }
  }

  return (
    <div className="min-h-svh bg-[#fbfcfe] text-[#0d0f12] lg:grid lg:grid-cols-[164px_minmax(0,1fr)]">
      <HomeSidebar
        name={session?.fullname || 'Koino Reader'}
        onNavigate={onNavigate}
      />

      <main className="min-w-0 px-[18px] pb-14 pt-7 sm:px-7 lg:px-9 lg:pt-9">
        <header className="mx-auto mb-6 flex max-w-[1100px] items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase text-[#b27413]">
              Daily Scripture
            </p>
            <h1 className="mt-1.5 text-[28px] font-semibold leading-tight sm:text-[32px]">
              Make space for the Word
            </h1>
            <p className="mt-1.5 text-[13px] text-[#677089] sm:text-[14px]">
              Read slowly, reflect, and continue when you are ready.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e1e4e9] bg-white hover:bg-[#f7f8fa]"
              aria-label="Search"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e1e4e9] bg-white hover:bg-[#f7f8fa]"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
            </button>
          </div>
        </header>

        {!data ? (
          <div className="mx-auto grid max-w-[1100px] gap-5 xl:grid-cols-[minmax(0,1fr)_270px]">
            <div className="rounded-[8px] border border-[#e1e4e9] bg-white p-7">
              <div className="auth-skeleton h-5 w-28 rounded-[6px]" />
              <div className="auth-skeleton mt-8 h-9 w-56 rounded-[6px]" />
              <div className="auth-skeleton mt-6 h-[420px] w-full rounded-[7px]" />
            </div>
            <div className="auth-skeleton hidden h-64 rounded-[8px] xl:block" />
          </div>
        ) : (
          <div className="mx-auto grid max-w-[1100px] items-start gap-5 xl:grid-cols-[minmax(0,1fr)_270px]">
            <BibleReader
              task={data.task}
              verses={data.verses}
              currentIndex={currentIndex}
              textSize={textSize}
              bookmarked={bookmarked}
              bookmarkColors={bookmarkColors}
              saving={saving}
              completing={completing}
              onBack={() => onNavigate('/home')}
              onSelect={selectVerse}
              onTextSize={() => setTextSize((current) => (current + 1) % 3)}
              onBookmark={setBookmarkTarget}
              onComplete={finishReading}
            />
            <ReadingRail plan={data.plan} task={data.task} />
          </div>
        )}
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
          title="Reading unavailable"
          message={error}
          onClose={() => {
            setError('')
            if (!data) onNavigate('/home')
          }}
        />
      )}
    </div>
  )
}

export default ReadingPage
