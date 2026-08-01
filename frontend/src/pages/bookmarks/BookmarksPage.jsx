import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bookmark, BookOpen, Trash2 } from 'lucide-react'
import StatusModal from '@/components/auth/shared/StatusModal.jsx'
import { AppPageLayout, PageHeader } from '@/components/common/AppPageLayout.jsx'
import { getAuthSession, getAuthToken } from '@/features/auth/authStorage.js'
import {
  getVerseBookmarks,
  removeVerseBookmark,
} from '@/features/reading/readingService.js'

function formatBookmarkedAt(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function BookmarksPage({ onNavigate }) {
  const { t } = useTranslation()
  const session = getAuthSession()
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!getAuthToken()) {
      onNavigate('/')
      return undefined
    }

    let active = true
    getVerseBookmarks()
      .then((savedBookmarks) => {
        if (active) setBookmarks(savedBookmarks)
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || 'Unable to load your bookmarks.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [onNavigate])

  function openBookmark(bookmark) {
    const search = new URLSearchParams({
      book: bookmark.book,
      chapter: String(bookmark.chapterNumber),
      verse: String(bookmark.verseNumber),
    })
    onNavigate(`/bible?${search.toString()}`)
  }

  async function removeBookmark(bookmark) {
    if (removingId) return
    setRemovingId(bookmark.verseId)
    try {
      await removeVerseBookmark(bookmark.verseId)
      setBookmarks((current) =>
        current.filter((item) => item.verseId !== bookmark.verseId),
      )
    } catch (requestError) {
      setError(requestError.message || 'Unable to remove this bookmark.')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <AppPageLayout
      name={session?.fullname}
      onNavigate={onNavigate}
      activePath="/bookmarks"
    >
          <PageHeader
            title={t('pages.bookmarks.title')}
            subtitle={t('pages.bookmarks.subtitle')}
          />

          <section>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }, (_, index) => (
                  <div
                    key={index}
                    className="auth-skeleton h-[132px] rounded-[8px]"
                  />
                ))}
              </div>
            ) : bookmarks.length ? (
              <div className="space-y-3">
                {bookmarks.map((bookmark) => (
                  <article
                    key={bookmark.bookmarkId}
                    className="rounded-[8px] border border-[#e2e5e9] bg-white p-5"
                  >
                    <div className="flex items-start gap-4">
                      <button
                        type="button"
                        onClick={() => openBookmark(bookmark)}
                        className="min-w-0 flex-1 text-left focus-visible:outline-none"
                      >
                        <span className="flex items-center gap-2 text-[12px] font-semibold text-[#7f571e]">
                          <Bookmark className="h-4 w-4 fill-current" />
                          {bookmark.book} {bookmark.chapterNumber}:
                          {bookmark.verseNumber}
                        </span>
                        <span
                          className="mt-3 block rounded-[6px] px-4 py-3 text-[14px] leading-7 text-[#252a32]"
                          style={{
                            backgroundColor:
                              bookmark.highlightColor || '#FFD6A1',
                          }}
                        >
                          {bookmark.text}
                        </span>
                        <span className="mt-3 block text-[10px] text-[#858c99]">
                          Saved {formatBookmarkedAt(bookmark.bookmarkedAt)}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBookmark(bookmark)}
                        disabled={removingId === bookmark.verseId}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border border-[#e2e5e9] text-[#737b88] hover:bg-[#f7f8f9] hover:text-[#a6493f] disabled:opacity-50"
                        aria-label={`Remove ${bookmark.book} ${bookmark.chapterNumber}:${bookmark.verseNumber} bookmark`}
                        title="Remove bookmark"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.6} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[330px] flex-col items-center justify-center rounded-[8px] border border-[#e2e5e9] bg-white px-6 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f6efe4] text-[#99671f]">
                  <Bookmark className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <h2 className="mt-5 font-sans text-[16px] font-semibold">
                  No bookmarked verses yet
                </h2>
                <p className="mt-2 max-w-[360px] text-[12px] leading-6 text-[#747c8a]">
                  Save a verse while reading and it will appear here with its
                  chosen highlight.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('/bible')}
                  className="mt-5 flex h-10 items-center gap-2 rounded-[7px] bg-[#e8a33d] px-4 text-[11px] font-semibold text-white hover:bg-[#d8922e]"
                >
                  <BookOpen className="h-4 w-4" />
                  Open Bible
                </button>
              </div>
            )}
          </section>

      {error && (
        <StatusModal
          type="error"
          title="Bookmarks unavailable"
          message={error}
          onClose={() => setError('')}
        />
      )}
    </AppPageLayout>
  )
}

export default BookmarksPage
