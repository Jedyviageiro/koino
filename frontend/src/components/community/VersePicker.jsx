import { useEffect, useMemo, useState } from 'react'
import {
  getBookChapters,
  getChapterVerses,
} from '@/features/bible/bibleService.js'

const selectClass =
  'h-10 min-w-0 rounded-[7px] border border-[#dde1e7] bg-white px-3 text-[12px] outline-none focus:border-[#d39a49]'

function VersePicker({ books, value, onChange, disabled }) {
  const [bookId, setBookId] = useState('')
  const [chapters, setChapters] = useState([])
  const [chapterId, setChapterId] = useState('')
  const [verses, setVerses] = useState([])
  const initialBookId = useMemo(() => {
    if (!books.length) return ''
    const matthew = books.find((book) => book.title === 'Matthew')
    return String((matthew || books[0]).bookId)
  }, [books])
  const effectiveBookId = bookId || initialBookId

  useEffect(() => {
    if (!effectiveBookId) return
    let active = true
    getBookChapters(Number(effectiveBookId)).then((result) => {
      if (!active) return
      setChapters(result)
      const preferred = result.find((chapter) => chapter.chapterNumber === 5)
      setChapterId(String((preferred || result[0])?.chapterId || ''))
    })
    return () => {
      active = false
    }
  }, [effectiveBookId])

  useEffect(() => {
    if (!chapterId) return
    let active = true
    getChapterVerses(Number(chapterId)).then((result) => {
      if (!active) return
      setVerses(result)
      onChange(result[0] || null)
    })
    return () => {
      active = false
    }
  }, [chapterId, onChange])

  return (
    <div className="grid grid-cols-[minmax(120px,1fr)_90px_82px] gap-2">
      <select
        className={selectClass}
        value={effectiveBookId}
        onChange={(event) => setBookId(event.target.value)}
        disabled={disabled}
        aria-label="Bible book"
      >
        {books.map((book) => (
          <option key={book.bookId} value={book.bookId}>
            {book.title}
          </option>
        ))}
      </select>
      <select
        className={selectClass}
        value={chapterId}
        onChange={(event) => setChapterId(event.target.value)}
        disabled={disabled || !chapters.length}
        aria-label="Bible chapter"
      >
        {chapters.map((chapter) => (
          <option key={chapter.chapterId} value={chapter.chapterId}>
            Ch. {chapter.chapterNumber}
          </option>
        ))}
      </select>
      <select
        className={selectClass}
        value={value?.verseId || ''}
        onChange={(event) =>
          onChange(
            verses.find(
              (verse) => verse.verseId === Number(event.target.value),
            ) || null,
          )
        }
        disabled={disabled || !verses.length}
        aria-label="Bible verse"
      >
        {verses.map((verse) => (
          <option key={verse.verseId} value={verse.verseId}>
            v. {verse.verseNumber}
          </option>
        ))}
      </select>
    </div>
  )
}

export default VersePicker
