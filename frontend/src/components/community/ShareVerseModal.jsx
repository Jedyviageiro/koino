import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import ModalShell from '@/components/common/ModalShell.jsx'

function ShareVerseModal({ verse, sharing, onShare, onClose }) {
  const [caption, setCaption] = useState('')

  return (
    <ModalShell
      labelledBy="share-verse-title"
      describedBy="share-verse-description"
      onClose={onClose}
      dismissible={!sharing}
    >
      <div className="flex h-full flex-col px-7 py-6">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#f7efe3] text-[#9a6723]">
          <BookOpen className="h-5 w-5" strokeWidth={1.7} />
        </span>
        <h2
          id="share-verse-title"
          className="mt-3 text-[19px] font-semibold text-[#17191d]"
        >
          Share this verse
        </h2>
        <p
          id="share-verse-description"
          className="mt-1 text-[11px] font-medium text-[#9a6723]"
        >
          {verse.bookTitle} {verse.chapterNumber}:{verse.verseNumber}
        </p>
        <p className="mt-3 line-clamp-2 text-[11px] italic leading-5 text-[#606877]">
          “{verse.text}”
        </p>
        <textarea
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          maxLength={1200}
          rows={2}
          placeholder="Add a thought (optional)"
          className="mt-3 min-h-12 resize-none rounded-[7px] border border-[#e1e4e8] bg-[#fafafa] px-3 py-2 text-left text-[11px] leading-5 outline-none focus:border-[#d3a35f]"
        />
        <div className="mt-auto grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={sharing}
            className="h-10 rounded-[7px] border border-[#dedfe2] bg-white text-[11px] font-semibold text-[#525966] hover:bg-[#f7f7f7] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onShare(caption)}
            disabled={sharing}
            className="h-10 rounded-[7px] bg-[#d99a3e] text-[11px] font-semibold text-white hover:bg-[#c9892f] disabled:opacity-60"
          >
            {sharing ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

export default ShareVerseModal
