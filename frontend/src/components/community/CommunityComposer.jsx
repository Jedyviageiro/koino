import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, Camera, CircleHelp, ImagePlus, X } from 'lucide-react'
import CommunityAvatar from '@/components/community/CommunityAvatar.jsx'
import VersePicker from '@/components/community/VersePicker.jsx'

const modes = [
  { value: 'VERSE', label: 'Verse', icon: BookOpen },
  { value: 'PHOTO', label: 'Photo', icon: Camera },
  { value: 'QUESTION', label: 'Question', icon: CircleHelp },
]

function CommunityComposer({ user, books, posting, onSubmit }) {
  const [mode, setMode] = useState('QUESTION')
  const [content, setContent] = useState('')
  const [selectedVerse, setSelectedVerse] = useState(null)
  const [photo, setPhoto] = useState(null)
  const fileInputRef = useRef(null)
  const previewUrl = useMemo(
    () => (photo ? URL.createObjectURL(photo) : ''),
    [photo],
  )

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function changeMode(nextMode) {
    if (posting) return
    setMode(nextMode)
    setPhoto(null)
  }

  async function submit(event) {
    event.preventDefault()
    const posted = await onSubmit({
      postType: mode,
      content,
      verse: selectedVerse,
      photo,
    })
    if (posted) {
      setContent('')
      setPhoto(null)
    }
  }

  const canPost =
    !posting &&
    ((mode === 'QUESTION' && content.trim()) ||
      (mode === 'VERSE' && selectedVerse) ||
      (mode === 'PHOTO' && photo))

  return (
    <form
      onSubmit={submit}
      className="rounded-[8px] border border-[#dfe3e8] bg-white p-4"
    >
      <div className="flex items-start gap-3">
        <CommunityAvatar author={user} />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={1200}
          rows={mode === 'QUESTION' ? 2 : 1}
          placeholder={
            mode === 'QUESTION'
              ? 'What would you like to ask?'
              : mode === 'PHOTO'
                ? 'Add a caption...'
                : 'Add a thought about this verse...'
          }
          className="min-h-11 flex-1 resize-none border-0 bg-transparent px-1 py-2 text-[13px] leading-6 outline-none placeholder:text-[#9298a4]"
        />
        <button
          type="submit"
          disabled={!canPost}
          className="h-10 w-[76px] shrink-0 rounded-[7px] bg-[#d99a3e] text-[12px] font-semibold text-white transition-colors hover:bg-[#c9892f] disabled:cursor-not-allowed disabled:bg-[#eee9e1] disabled:text-[#aaa49b]"
        >
          {posting ? 'Posting' : 'Post'}
        </button>
      </div>

      <div className="mt-3 border-t border-[#eceef1] pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {modes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => changeMode(value)}
              aria-pressed={mode === value}
              className={`flex h-9 items-center gap-2 rounded-[6px] px-3 text-[11px] font-medium transition-colors ${
                mode === value
                  ? 'bg-[#f6efe4] text-[#795526]'
                  : 'text-[#596273] hover:bg-[#f6f7f8]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
              {label}
            </button>
          ))}
        </div>

        {mode === 'VERSE' && (
          <div className="mt-3 rounded-[7px] bg-[#faf8f4] p-3">
            <VersePicker
              books={books}
              value={selectedVerse}
              onChange={setSelectedVerse}
              disabled={posting}
            />
            {selectedVerse && (
              <p className="mt-3 line-clamp-2 text-[12px] italic leading-5 text-[#596273]">
                “{selectedVerse.text}”
              </p>
            )}
          </div>
        )}

        {mode === 'PHOTO' && (
          <div className="mt-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => setPhoto(event.target.files?.[0] || null)}
            />
            {previewUrl ? (
              <div className="relative flex max-h-[360px] justify-center overflow-hidden rounded-[7px] bg-[#f2f3f4]">
                <img
                  src={previewUrl}
                  alt="Selected upload"
                  className="h-auto max-h-[360px] w-auto max-w-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => setPhoto(null)}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#343942] shadow-sm"
                  aria-label="Remove selected photo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-24 w-full items-center justify-center gap-2 rounded-[7px] border border-dashed border-[#d7dbe1] bg-[#fafafa] text-[12px] font-medium text-[#596273] hover:border-[#c9a978] hover:bg-[#fdfaf5]"
              >
                <ImagePlus className="h-4 w-4" />
                Choose photo
              </button>
            )}
          </div>
        )}
      </div>
    </form>
  )
}

export default CommunityComposer
