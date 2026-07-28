import { useState } from 'react'
import { Bookmark } from 'lucide-react'
import ModalShell from '@/components/common/ModalShell.jsx'

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
  return (
    <ModalShell
      labelledBy="bookmark-modal-title"
      onClose={onClose}
      dismissible={!saving}
    >
      <div className="flex h-full flex-col px-7 py-7 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fbf4ea] text-[#b27413]">
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
                    ? 'ring-2 ring-[#e8a33d] ring-offset-2'
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
            className="h-11 w-full rounded-[9px] bg-[#e8a33d] text-[12px] font-semibold text-white hover:bg-[#d8922e] disabled:opacity-60"
          >
            {saving ? 'Saving...' : bookmarked ? 'Update Highlight' : 'Save Highlight'}
          </button>
          <button
            type="button"
            onClick={bookmarked ? onRemove : onClose}
            disabled={saving}
            className="h-11 w-full rounded-[9px] border border-[#e8a33d] bg-white text-[12px] font-semibold text-[#b27413] hover:bg-[#fdf7ee] disabled:opacity-60"
          >
            {bookmarked ? 'Remove Bookmark' : 'Not Now'}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

export default BookmarkModal
