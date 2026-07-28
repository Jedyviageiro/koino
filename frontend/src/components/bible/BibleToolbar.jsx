import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

const controlClass =
  'h-10 w-full rounded-[8px] border border-[#dfe3e9] bg-white px-3 text-[12px] font-medium text-[#20242b] outline-none transition-colors focus:border-[#e8a33d]'

function BibleToolbar({
  versions,
  selectedVersion,
  testament,
  books,
  chapters,
  verses,
  selectedBookId,
  selectedChapterId,
  selectedVerseNumber,
  todayAvailable,
  loading,
  onTestamentChange,
  onVersionChange,
  onBookChange,
  onChapterChange,
  onVerseChange,
  onPrevious,
  onNext,
  onToday,
}) {
  return (
    <section className="grid gap-4 rounded-[8px] border border-[#dfe3e9] bg-white p-5 md:grid-cols-2 md:items-end xl:grid-cols-[200px_145px_minmax(130px,1fr)_90px_90px_auto]">
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-medium text-[#565e6e]">
          Version
        </span>
        <select
          className={controlClass}
          value={selectedVersion}
          onChange={(event) => onVersionChange(event.target.value)}
          disabled={loading || versions.length < 2}
        >
          {versions.map((version) => (
            <option key={version.code} value={version.code}>
              {version.name} ({version.code})
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[11px] font-medium text-[#565e6e]">
          Testament
        </span>
        <select
          className={controlClass}
          value={testament}
          onChange={(event) => onTestamentChange(event.target.value)}
          disabled={loading}
        >
          <option value="OLD">Old Testament</option>
          <option value="NEW">New Testament</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[11px] font-medium text-[#565e6e]">
          Book
        </span>
        <select
          className={controlClass}
          value={selectedBookId || ''}
          onChange={(event) => onBookChange(Number(event.target.value))}
          disabled={loading || !books.length}
        >
          {books.map((book) => (
            <option key={book.bookId} value={book.bookId}>
              {book.title}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[11px] font-medium text-[#565e6e]">
          Chapter
        </span>
        <select
          className={controlClass}
          value={selectedChapterId || ''}
          onChange={(event) => onChapterChange(Number(event.target.value))}
          disabled={loading || !chapters.length}
        >
          {chapters.map((chapter) => (
            <option key={chapter.chapterId} value={chapter.chapterId}>
              {chapter.chapterNumber}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[11px] font-medium text-[#565e6e]">
          Verse
        </span>
        <select
          className={controlClass}
          value={selectedVerseNumber || ''}
          onChange={(event) => onVerseChange(Number(event.target.value))}
          disabled={loading || !verses.length}
        >
          {verses.map((verse) => (
            <option key={verse.verseId} value={verse.verseNumber}>
              {verse.verseNumber}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-2 md:col-span-2 xl:col-span-1">
        <button
          type="button"
          onClick={onPrevious}
          disabled={loading}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-[#dfe3e9] bg-white hover:bg-[#faf8f5] disabled:opacity-40"
          aria-label="Previous chapter"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={loading}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] border border-[#dfe3e9] bg-white hover:bg-[#faf8f5] disabled:opacity-40"
          aria-label="Next chapter"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToday}
          disabled={!todayAvailable || loading}
          className="flex h-10 min-w-[144px] items-center justify-center gap-2 rounded-[8px] border border-[#dfe3e9] bg-white px-4 text-[12px] font-medium hover:bg-[#faf8f5] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <CalendarDays className="h-4 w-4" />
          Today&apos;s Reading
        </button>
      </div>
    </section>
  )
}

export default BibleToolbar
