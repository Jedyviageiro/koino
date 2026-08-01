import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Hash,
  Library,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { localizedBibleBook } from '@/i18n/bibleBooks.js'

const controlClass =
  'h-9 w-full appearance-none rounded-[7px] border border-[#dfe3e9] bg-white pl-8 pr-2 text-[10px] font-medium text-[#20242b] outline-none transition-colors focus:border-[#e8a33d]'

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
  focusBook,
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
  const { t, i18n } = useTranslation()
  return (
    <section className="grid gap-2 rounded-[8px] border border-[#dfe3e9] bg-white p-3 md:grid-cols-2 xl:grid-cols-[92px_150px_minmax(135px,1fr)_74px_74px_auto] xl:items-center">
      <label className="relative block">
        <span className="sr-only">{t('pages.bible.version')}</span>
        <BookOpen className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[#707886]" />
        <select
          className={controlClass}
          value={selectedVersion}
          onChange={(event) => onVersionChange(event.target.value)}
          disabled={loading || versions.length < 2}
        >
          {versions.map((version) => (
            <option key={version.code} value={version.code}>
              {version.code}
            </option>
          ))}
        </select>
      </label>

      <label className="relative block">
        <span className="sr-only">{t('pages.bible.testament')}</span>
        <Library className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[#707886]" />
        <select
          className={controlClass}
          value={testament}
          onChange={(event) => onTestamentChange(event.target.value)}
          disabled={loading}
        >
          <option value="OLD">{t('pages.bible.oldTestament')}</option>
          <option value="NEW">{t('pages.bible.newTestament')}</option>
        </select>
      </label>

      <label className="relative block">
        <span className="sr-only">{t('pages.bible.book')}</span>
        <BookOpen className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[#707886]" />
        <select
          autoFocus={focusBook}
          className={controlClass}
          value={selectedBookId || ''}
          onChange={(event) => onBookChange(Number(event.target.value))}
          disabled={loading || !books.length}
        >
          {books.map((book) => (
            <option key={book.bookId} value={book.bookId}>
              {localizedBibleBook(book.title, i18n.resolvedLanguage)}
            </option>
          ))}
        </select>
      </label>

      <label className="relative block">
        <span className="sr-only">{t('pages.bible.chapter')}</span>
        <Hash className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[#707886]" />
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

      <label className="relative block">
        <span className="sr-only">{t('pages.bible.verse')}</span>
        <span className="pointer-events-none absolute left-2.5 top-2.5 text-[10px] font-semibold text-[#707886]">V</span>
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

      <div className="flex justify-end gap-2 md:col-span-2 xl:col-span-1">
        <button
          type="button"
          onClick={onPrevious}
          disabled={loading}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] border border-[#dfe3e9] bg-white hover:bg-[#faf8f5] disabled:opacity-40"
          aria-label={t('pages.bible.previousChapter')}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={loading}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] border border-[#dfe3e9] bg-white hover:bg-[#faf8f5] disabled:opacity-40"
          aria-label={t('pages.bible.nextChapter')}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToday}
          disabled={!todayAvailable || loading}
          className="flex h-9 min-w-[132px] items-center justify-center gap-2 rounded-[7px] border border-[#dfe3e9] bg-white px-3 text-[10px] font-medium hover:bg-[#faf8f5] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <CalendarDays className="h-4 w-4" />
          {t('pages.bible.todaysReading')}
        </button>
      </div>
    </section>
  )
}

export default BibleToolbar
