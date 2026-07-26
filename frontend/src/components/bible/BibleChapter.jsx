import { useEffect, useRef } from 'react'
import { Bookmark, Type } from 'lucide-react'

const textSizes = [
  'text-[14px] leading-7',
  'text-[16px] leading-8',
  'text-[18px] leading-9',
]

function BibleChapter({
  book,
  chapter,
  verses,
  selectedIndex,
  textSize,
  bookmarkColors,
  loading,
  onSelectVerse,
  onTextSize,
  onBookmark,
}) {
  const verseRefs = useRef(new Map())
  const selectedVerse = verses[selectedIndex]
  const bookmarked = Boolean(
    selectedVerse && bookmarkColors.has(selectedVerse.verseId),
  )
  const progress = verses.length
    ? Math.round(((selectedIndex + 1) / verses.length) * 100)
    : 0

  useEffect(() => {
    verseRefs.current.get(selectedIndex)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }, [selectedIndex])

  return (
    <section className="mt-6">
      <header className="flex items-end justify-between gap-5">
        <div>
          <h2 className="text-[26px] font-semibold">
            {book?.title || 'Bible'} {chapter?.chapterNumber || ''}
          </h2>
          <p className="mt-1 text-[13px] text-[#667089]">
            King James Version
          </p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onTextSize}
            className="flex h-9 w-9 items-center justify-center rounded-[7px] hover:bg-[#f5f3ef]"
            aria-label="Change text size"
          >
            <Type className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            onClick={() => onBookmark(selectedVerse)}
            disabled={!selectedVerse}
            className={`flex h-9 w-9 items-center justify-center rounded-[7px] transition-colors disabled:opacity-40 ${
              bookmarked
                ? 'bg-[#fbf4ea] text-[#b27413]'
                : 'hover:bg-[#f5f3ef]'
            }`}
            aria-label={bookmarked ? 'Edit verse bookmark' : 'Bookmark selected verse'}
          >
            <Bookmark className={`h-[18px] w-[18px] ${bookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </header>

      <div className="mt-4 overflow-hidden rounded-[8px] border border-[#dfe3e9] bg-white">
        <div className="bible-chapter-scroll h-[500px] overflow-y-auto px-5 py-4 sm:px-7">
          {loading ? (
            <div className="space-y-5 py-2">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="flex gap-5">
                  <div className="auth-skeleton h-4 w-4 shrink-0 rounded-[4px]" />
                  <div
                    className="auth-skeleton h-5 rounded-[5px]"
                    style={{ width: `${58 + (index % 3) * 12}%` }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <ol className="space-y-1">
              {verses.map((verse, index) => {
                const highlightColor = bookmarkColors.get(verse.verseId)
                const selected = index === selectedIndex

                return (
                  <li
                    key={verse.verseId}
                    ref={(element) => {
                      if (element) verseRefs.current.set(index, element)
                      else verseRefs.current.delete(index)
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectVerse(index)}
                      className={`grid w-full grid-cols-[28px_minmax(0,1fr)] gap-4 rounded-[7px] px-2 py-2 text-left transition-colors ${
                        selected && !highlightColor ? 'bg-[#fdf7ee]' : 'hover:bg-[#fafafa]'
                      }`}
                      style={
                        highlightColor
                          ? { backgroundColor: highlightColor }
                          : undefined
                      }
                    >
                      <span
                        className={`pt-1 text-[12px] ${
                          selected ? 'font-semibold text-[#b27413]' : 'text-[#697184]'
                        }`}
                      >
                        {verse.verseNumber}
                      </span>
                      <span className={`${textSizes[textSize]} text-[#171a20]`}>
                        {verse.text}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          )}
        </div>

        <footer className="grid gap-4 border-t border-[#e3e6ea] bg-[#fefefe] px-5 py-4 sm:grid-cols-[190px_minmax(220px,1fr)_120px] sm:items-center sm:px-7">
          <div>
            <p className="text-[11px] text-[#697184]">You&apos;re reading</p>
            <p className="mt-1 text-[13px] font-semibold">
              {book?.title} {chapter?.chapterNumber}
            </p>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#e9ebee]">
            <div
              className="h-full rounded-full bg-[#e8a33d] transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[12px] text-[#59647a] sm:text-right">
            {verses.length ? selectedIndex + 1 : 0} of {verses.length} verses
          </p>
        </footer>
      </div>
    </section>
  )
}

export default BibleChapter
