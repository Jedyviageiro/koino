import { useEffect, useRef, useState } from 'react'
import { BookOpen, Bookmark, Ellipsis, Share2, Type } from 'lucide-react'

const textSizes = [
  'text-[13px] leading-6',
  'text-[15px] leading-7',
  'text-[17px] leading-8',
]

function BibleChapter({
  book,
  chapter,
  verses,
  versionName,
  selectedIndex,
  textSize,
  bookmarkColors,
  loading,
  onSelectVerse,
  onTextSize,
  onBookmark,
  onShare,
}) {
  const verseRefs = useRef(new Map())
  const scrollRef = useRef(null)
  const scrollFrameRef = useRef(null)
  const selectedFromScrollRef = useRef(false)
  const programmaticScrollRef = useRef(false)
  const programmaticTimerRef = useRef(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const selectedVerse = verses[selectedIndex]
  const bookmarked = Boolean(
    selectedVerse && bookmarkColors.has(selectedVerse.verseId),
  )
  const progress = verses.length
    ? Math.round(((selectedIndex + 1) / verses.length) * 100)
    : 0

  useEffect(() => {
    if (selectedFromScrollRef.current) {
      selectedFromScrollRef.current = false
      return
    }
    programmaticScrollRef.current = true
    verseRefs.current.get(selectedIndex)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
    window.clearTimeout(programmaticTimerRef.current)
    programmaticTimerRef.current = window.setTimeout(() => {
      programmaticScrollRef.current = false
    }, 450)
  }, [selectedIndex])

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
      if (!scrollRef.current || loading) return
      const atEnd =
        scrollRef.current.scrollTop + scrollRef.current.clientHeight >=
        scrollRef.current.scrollHeight - 4
      const targetTop = scrollRef.current.getBoundingClientRect().top + 22
      let closestIndex = atEnd ? Math.max(0, verses.length - 1) : selectedIndex
      let closestDistance = Number.POSITIVE_INFINITY
      if (!atEnd) {
        verseRefs.current.forEach((element, index) => {
          const distance = Math.abs(
            element.getBoundingClientRect().top - targetTop,
          )
          if (distance < closestDistance) {
            closestDistance = distance
            closestIndex = index
          }
        })
      }
      if (closestIndex !== selectedIndex) {
        selectedFromScrollRef.current = true
        setMoreOpen(false)
        onSelectVerse(closestIndex)
      }
    })
  }

  return (
    <section className="mt-5 overflow-hidden rounded-[8px] border border-[#dfe3e9] bg-white">
      <div className="grid min-h-[500px] xl:grid-cols-[255px_minmax(0,1fr)]">
        <aside className="flex flex-col border-b border-[#e7e9ed] bg-[#fdfdfc] px-7 py-8 xl:border-b-0 xl:border-r">
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <BookOpen className="h-5 w-5 text-[#e29a2f]" strokeWidth={1.6} />
            <h2 className="mt-5 text-[27px] font-semibold leading-tight">
              {book?.title || 'Bible'} {chapter?.chapterNumber || ''}
            </h2>
            <p className="mt-2 text-[10px] text-[#687183]">
              {versionName || 'King James Version'}
            </p>
            <span className="mt-5 h-px w-5 bg-[#e8a33d]" />
            <p className="mt-5 line-clamp-5 text-[10px] leading-5 text-[#747b86]">
              {selectedVerse?.text || 'Choose a verse to begin reading.'}
            </p>
          </div>
          <p className="mt-7 text-center text-[9px] text-[#9a9fa7]">
            Verse {verses.length ? selectedIndex + 1 : 0} of {verses.length}
          </p>
        </aside>

        <div className="min-w-0">
          <header className="flex h-14 items-center justify-between border-b border-[#eceef1] px-4 sm:px-6">
            <div>
              <p className="text-[9px] uppercase text-[#a56b13]">Chapter reading</p>
              <p className="mt-0.5 text-[10px] font-medium text-[#555d69]">
                Select a verse to bookmark or share
              </p>
            </div>
            <div className="flex gap-1">
              <button type="button" onClick={onTextSize} className="flex h-8 w-8 items-center justify-center rounded-[6px] hover:bg-[#f5f3ef]" aria-label="Change text size">
                <Type className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onBookmark(selectedVerse)}
                disabled={!selectedVerse}
                className={`flex h-8 w-8 items-center justify-center rounded-[6px] transition-colors disabled:opacity-40 ${bookmarked ? 'bg-[#fbf4ea] text-[#b27413]' : 'hover:bg-[#f5f3ef]'}`}
                aria-label={bookmarked ? 'Edit verse bookmark' : 'Bookmark selected verse'}
              >
                <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
              </button>
              <div className="relative">
                <button type="button" onClick={() => setMoreOpen((current) => !current)} disabled={!selectedVerse} className="flex h-8 w-8 items-center justify-center rounded-[6px] hover:bg-[#f5f3ef] disabled:opacity-40" aria-label="More verse options" aria-expanded={moreOpen}>
                  <Ellipsis className="h-4 w-4" />
                </button>
                {moreOpen && (
                  <div className="absolute right-0 top-10 z-20 w-[180px] rounded-[7px] border border-[#e0e3e7] bg-white p-1.5 shadow-[0_12px_30px_rgba(27,31,38,0.12)]">
                    <button type="button" onClick={() => { setMoreOpen(false); onShare(selectedVerse) }} className="flex h-9 w-full items-center gap-2.5 rounded-[5px] px-2.5 text-left text-[11px] font-medium text-[#343a44] hover:bg-[#f7f4ef]">
                      <Share2 className="h-3.5 w-3.5" strokeWidth={1.7} />
                      Share to Community
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div ref={scrollRef} onScroll={trackScrollProgress} className="bible-chapter-scroll h-[445px] overflow-y-auto px-4 py-4 sm:px-7">
            {loading ? (
              <div className="space-y-5 py-2">
                {Array.from({ length: 8 }, (_, index) => (
                  <div key={index} className="flex gap-5">
                    <div className="auth-skeleton h-4 w-4 shrink-0 rounded-[4px]" />
                    <div className="auth-skeleton h-5 rounded-[5px]" style={{ width: `${58 + (index % 3) * 12}%` }} />
                  </div>
                ))}
              </div>
            ) : (
              <ol className="space-y-1">
                {verses.map((verse, index) => {
                  const highlightColor = bookmarkColors.get(verse.verseId)
                  const selected = index === selectedIndex
                  return (
                    <li key={verse.verseId} ref={(element) => { if (element) verseRefs.current.set(index, element); else verseRefs.current.delete(index) }}>
                      <button
                        type="button"
                        onClick={() => { setMoreOpen(false); onSelectVerse(index) }}
                        className={`relative grid w-full grid-cols-[26px_minmax(0,1fr)] gap-3 rounded-[6px] px-3 py-2 text-left transition-colors ${selected && !highlightColor ? 'bg-[#fdf7ee]' : 'hover:bg-[#fafafa]'}`}
                        style={highlightColor ? { backgroundColor: highlightColor } : undefined}
                      >
                        {selected && !highlightColor && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#e8a33d]" />}
                        <span className={`pt-1 text-[10px] ${selected ? 'font-semibold text-[#b27413]' : 'text-[#697184]'}`}>
                          {verse.verseNumber}
                        </span>
                        <span className={`${textSizes[textSize]} text-[#171a20]`}>{verse.text}</span>
                      </button>
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
        </div>
      </div>

      <footer className="grid gap-3 border-t border-[#e3e6ea] bg-[#fefefe] px-5 py-3 sm:grid-cols-[150px_minmax(220px,1fr)_70px] sm:items-center sm:px-7">
        <p className="text-[9px] text-[#697184]">Chapter {chapter?.chapterNumber || 0} progress</p>
        <div className="h-1 overflow-hidden rounded-full bg-[#e9ebee]">
          <div className="h-full rounded-full bg-[#e8a33d] transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[9px] tabular-nums text-[#59647a] sm:text-right">{progress}%</p>
      </footer>
    </section>
  )
}

export default BibleChapter
