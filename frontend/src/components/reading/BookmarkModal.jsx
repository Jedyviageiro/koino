import { useLayoutEffect, useRef, useState } from 'react'
import { Bookmark } from 'lucide-react'

const BOOKMARK_COLORS = [
  '#FFF1A8',
  '#FFD0C7',
  '#FFD6A1',
  '#CDECCF',
  '#BFE7E1',
  '#CFE0FF',
  '#DDD4FF',
  '#F5CFE1',
]

function BookmarkModal({
  verse,
  initialColor,
  bookmarked,
  saving,
  onSave,
  onRemove,
  onClose,
}) {
  const [selectedColor, setSelectedColor] = useState(
    initialColor || BOOKMARK_COLORS[5],
  )
  const modalRef = useRef(null)

  useLayoutEffect(() => {
    const previousOverflow = document.body.style.overflow
    const previousPaddingRight = document.body.style.paddingRight
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
    document.body.style.overflow = 'hidden'
    modalRef.current?.focus({ preventScroll: true })

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !saving) onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.paddingRight = previousPaddingRight
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, saving])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-5 py-8 backdrop-blur-[3px] animate-[modal-backdrop-in_220ms_ease-out]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose()
      }}
    >
      <section
        ref={modalRef}
        tabIndex={-1}
        className="flex h-[330px] w-full max-w-[360px] flex-col rounded-[22px] bg-white px-7 py-7 text-center shadow-[0_28px_80px_rgba(0,0,0,0.24)] animate-[modal-card-in_420ms_cubic-bezier(0.16,1,0.3,1)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bookmark-modal-title"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef3ff] text-[#1e55e5]">
          <Bookmark className="h-5 w-5" />
        </span>
        <h2
          id="bookmark-modal-title"
          className="mt-4 text-[19px] font-semibold text-[#17171a]"
        >
          Highlight this verse
        </h2>
        <p className="mt-1.5 truncate text-[12px] text-[#747880]">
          {verse.bookTitle} {verse.chapterNumber}:{verse.verseNumber}
        </p>

        <div className="mt-6 flex items-center justify-between" aria-label="Highlight color">
          {BOOKMARK_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              className="flex h-7 w-7 items-center justify-center rounded-full transition-transform hover:scale-105 focus-visible:outline-none"
              aria-label={`Choose ${color} highlight`}
              aria-pressed={selectedColor === color}
            >
              <span
                className={`h-6 w-6 rounded-full border border-black/5 ${
                  selectedColor === color
                    ? 'ring-2 ring-[#1e55e5] ring-offset-2'
                    : ''
                }`}
                style={{ backgroundColor: color }}
              />
            </button>
          ))}
        </div>

        <div className="mt-auto grid gap-2">
          <button
            type="button"
            onClick={() => onSave(selectedColor)}
            disabled={saving}
            className="h-11 w-full rounded-[9px] bg-[#1e55e5] text-[12px] font-semibold text-white hover:bg-[#194acb] disabled:opacity-60"
          >
            {saving ? 'Saving...' : bookmarked ? 'Update Highlight' : 'Save Highlight'}
          </button>
          <button
            type="button"
            onClick={bookmarked ? onRemove : onClose}
            disabled={saving}
            className="h-11 w-full rounded-[9px] border border-[#1e55e5] bg-white text-[12px] font-semibold text-[#1e55e5] hover:bg-[#f2f6ff] disabled:opacity-60"
          >
            {bookmarked ? 'Remove Bookmark' : 'Not Now'}
          </button>
        </div>
      </section>
    </div>
  )
}

export default BookmarkModal
