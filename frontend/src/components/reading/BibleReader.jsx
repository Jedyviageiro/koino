import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
} from 'lucide-react'

const TEXT_SIZES = [
  { label: 'Small', className: 'text-[14px] leading-7' },
  { label: 'Medium', className: 'text-[16px] leading-8' },
  { label: 'Large', className: 'text-[18px] leading-9' },
]

function BibleReader({
  task,
  verses,
  currentIndex,
  textSize,
  bookmarked,
  bookmarkColors,
  saving,
  completing,
  onBack,
  onSelect,
  onTextSize,
  onBookmark,
  onComplete,
}) {
  const { t } = useTranslation()
  const verseRefs = useRef(new Map())
  const scrollRef = useRef(null)
  const scrollFrameRef = useRef(null)
  const selectedFromScrollRef = useRef(false)
  const programmaticScrollRef = useRef(false)
  const programmaticTimerRef = useRef(null)
  const total = verses.length
  const currentVerse = verses[currentIndex - 1]
  const percentage = total ? (currentIndex / total) * 100 : 0
  const firstPassage = task.passages[0]
  const lastPassage = task.passages.at(-1)
  const reference =
    firstPassage === lastPassage
      ? `${firstPassage.bookTitle} ${firstPassage.chapterNumber}:${firstPassage.firstVerse}-${firstPassage.lastVerse}`
      : task.readingAssignment

  useEffect(() => {
    if (selectedFromScrollRef.current) {
      selectedFromScrollRef.current = false
      return
    }
    programmaticScrollRef.current = true
    verseRefs.current.get(currentIndex)?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    })
    window.clearTimeout(programmaticTimerRef.current)
    programmaticTimerRef.current = window.setTimeout(() => {
      programmaticScrollRef.current = false
    }, 450)
  }, [currentIndex])

  useEffect(
    () => () => {
      window.cancelAnimationFrame(scrollFrameRef.current)
      window.clearTimeout(programmaticTimerRef.current)
    },
    [],
  )

  function trackScrollProgress() {
    if (programmaticScrollRef.current) return
    window.cancelAnimationFrame(scrollFrameRef.current)
    scrollFrameRef.current = window.requestAnimationFrame(() => {
      if (!scrollRef.current) return
      const atEnd =
        scrollRef.current.scrollTop + scrollRef.current.clientHeight >=
        scrollRef.current.scrollHeight - 4
      const targetTop = scrollRef.current.getBoundingClientRect().top + 18
      let closestIndex = atEnd ? total : currentIndex
      let closestDistance = Number.POSITIVE_INFINITY
      if (!atEnd) {
        verseRefs.current.forEach((element, verseIndex) => {
          const distance = Math.abs(
            element.getBoundingClientRect().top - targetTop,
          )
          if (distance < closestDistance) {
            closestDistance = distance
            closestIndex = verseIndex
          }
        })
      }
      if (closestIndex !== currentIndex) {
        selectedFromScrollRef.current = true
        onSelect(closestIndex)
      }
    })
  }

  return (
    <section className="overflow-hidden rounded-[8px] border border-[#e1e4e9] bg-white">
      <div className="border-b border-[#e7e9ed] px-5 py-4 sm:px-7">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[11px] font-medium text-[#536078] hover:text-[#b27413]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Home
        </button>

      </div>

      <div className="px-5 py-5 sm:px-7 lg:px-8">
        <div>
          <p className="text-[10px] font-semibold uppercase text-[#b27413]">{t('pages.reading.today')}</p>
          <h1 className="mt-2 text-[29px] font-semibold leading-tight">{reference}</h1>
          <p className="mt-1.5 text-[11px] text-[#59647a]">{task.readingAssignment} - KJV</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="inline-flex h-8 items-center gap-2 rounded-[7px] bg-[#fdf7ee] px-3 text-[12px]">
              <Clock3 className="h-4 w-4" />
              {task.estimatedMinutes} min read
            </span>
            <span className="inline-flex h-8 items-center rounded-[7px] bg-[#fdf7ee] px-3 text-[12px]">
              {total} verses
            </span>
          </div>
        </div>

        <div className="mt-5 pt-1">
          <div className="flex items-center justify-between text-[12px] text-[#4e5a72]">
            <span className="font-medium">{t('pages.reading.progress')}</span>
            <span>Verse {currentIndex} of {total}</span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e9ecf1]">
            <div
              className="h-full rounded-full bg-[#e8a33d] transition-[width] duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-[8px] border border-[#e3e6eb]">
          <div
            ref={scrollRef}
            onScroll={trackScrollProgress}
            className="bible-chapter-scroll h-[390px] overflow-y-auto px-3 py-2 sm:px-4"
          >
            {verses.map((verse, index) => {
              const verseIndex = index + 1
              const active = verseIndex === currentIndex
              const highlightColor = bookmarkColors.get(verse.verseId)
              return (
                <button
                  key={verse.verseId}
                  ref={(element) => {
                    if (element) verseRefs.current.set(verseIndex, element)
                    else verseRefs.current.delete(verseIndex)
                  }}
                  type="button"
                  onClick={() => onSelect(verseIndex)}
                  className={`relative grid w-full grid-cols-[28px_minmax(0,1fr)] gap-3 rounded-[6px] px-3 py-2.5 text-left transition-colors ${
                    !highlightColor && active
                      ? 'bg-[#fdf7ee]'
                      : !highlightColor
                        ? 'hover:bg-[#f8f9fb]'
                        : ''
                  }`}
                  style={{
                    backgroundColor: highlightColor,
                  }}
                >
                  {active && !highlightColor && (
                    <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#e8a33d]" />
                  )}
                  <span className={`pt-0.5 text-[12px] ${active ? 'font-semibold text-[#b27413]' : 'text-[#657087]'}`}>
                    {verse.verseNumber}
                  </span>
                  <span className={`${TEXT_SIZES[textSize].className} text-[#171a20]`}>
                    {verse.text}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e1e4e9] bg-white px-5 py-4 sm:px-7">
        <button
          type="button"
          onClick={onTextSize}
          className="inline-flex h-10 items-center gap-2 rounded-[7px] border border-[#dfe3e9] px-3 text-[12px] hover:bg-[#f7f8fa]"
          title={`Text size: ${TEXT_SIZES[textSize].label}`}
        >
          <span className="text-[15px] font-semibold">Aa</span>
          <span className="hidden sm:inline">Text Size</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={currentIndex <= 1 || saving}
            onClick={() => onSelect(currentIndex - 1)}
            className="flex h-10 w-10 items-center justify-center rounded-[7px] border border-[#dfe3e9] hover:bg-[#f7f8fa] disabled:opacity-40"
            aria-label="Previous verse"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[58px] text-center text-[12px] font-medium">
            {currentIndex} of {total}
          </span>
          <button
            type="button"
            disabled={currentIndex >= total || saving}
            onClick={() => onSelect(currentIndex + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-[7px] border border-[#dfe3e9] hover:bg-[#f7f8fa] disabled:opacity-40"
            aria-label="Next verse"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => onBookmark(currentVerse)}
          disabled={!currentVerse}
          className={`inline-flex h-10 w-28 shrink-0 items-center justify-center gap-2 rounded-[7px] border text-[12px] ${
            bookmarked
              ? 'border-[#e8a33d] bg-[#fdf7ee] text-[#b27413]'
              : 'border-[#dfe3e9] hover:bg-[#f7f8fa]'
          }`}
        >
          <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
          <span>{bookmarked ? 'Saved' : 'Bookmark'}</span>
        </button>

        {currentIndex === total && (
          <button
            type="button"
            onClick={onComplete}
            disabled={saving || completing}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-[7px] bg-[#e8a33d] text-[13px] font-semibold text-white hover:bg-[#d8922e] disabled:opacity-60 sm:w-auto sm:px-5"
          >
            <Check className="h-4 w-4" />
            {completing ? 'Saving...' : 'Complete Reading'}
          </button>
        )}
      </div>
    </section>
  )
}

export default BibleReader
