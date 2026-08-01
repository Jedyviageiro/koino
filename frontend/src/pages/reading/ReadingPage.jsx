import { useEffect, useMemo, useRef, useState } from 'react'
import { AppPageLayout } from '@/components/common/AppPageLayout.jsx'
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
  const progressTimerRef = useRef(null)
  const saveVersionRef = useRef(0)
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

  useEffect(
    () => () => window.clearTimeout(progressTimerRef.current),
    [],
  )

  const currentVerse = data?.verses[currentIndex - 1]
  const bookmarked = useMemo(
    () => Boolean(currentVerse && bookmarkColors.has(currentVerse.verseId)),
    [bookmarkColors, currentVerse],
  )

  function selectVerse(nextIndex) {
    if (!data?.task || nextIndex === currentIndex) return
    setCurrentIndex(nextIndex)
    window.clearTimeout(progressTimerRef.current)
    const saveVersion = ++saveVersionRef.current
    setSaving(true)
    progressTimerRef.current = window.setTimeout(async () => {
      try {
        await saveReadingProgress(data.task.taskId, nextIndex)
      } catch (requestError) {
        if (saveVersion === saveVersionRef.current) {
          setError(
            requestError.message || 'Unable to save your reading position.',
          )
        }
      } finally {
        if (saveVersion === saveVersionRef.current) setSaving(false)
      }
    }, 180)
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
    <AppPageLayout
      name={session?.fullname}
      onNavigate={onNavigate}
      activePath="/plans"
    >
        {!data ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_270px]">
            <div className="rounded-[8px] border border-[#e1e4e9] bg-white p-7">
              <div className="auth-skeleton h-5 w-28 rounded-[6px]" />
              <div className="auth-skeleton mt-8 h-9 w-56 rounded-[6px]" />
              <div className="auth-skeleton mt-6 h-[420px] w-full rounded-[7px]" />
            </div>
            <div className="auth-skeleton hidden h-64 rounded-[8px] xl:block" />
          </div>
        ) : (
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_270px]">
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
            <ReadingRail
              plan={data.plan}
              task={data.task}
              currentVerse={currentVerse}
            />
          </div>
        )}
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
    </AppPageLayout>
  )
}

export default ReadingPage
