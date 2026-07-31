import { useEffect, useRef, useState } from 'react'
import { GripHorizontal, Maximize2, X } from 'lucide-react'
import YouTubeEmbed from './YouTubeEmbed.jsx'

const PLAYER_POSITION_KEY = 'koino.watch.mini-position'

function storedPosition() {
  try {
    return JSON.parse(localStorage.getItem(PLAYER_POSITION_KEY))
  } catch {
    localStorage.removeItem(PLAYER_POSITION_KEY)
    return null
  }
}

function WatchMiniPlayer({ video, onClose, onMaximize, onProgress }) {
  const containerRef = useRef(null)
  const playerRef = useRef(null)
  const dragRef = useRef(null)
  const closingRef = useRef(false)
  const [position, setPosition] = useState(storedPosition)

  useEffect(() => {
    function keepInsideViewport() {
      if (!position || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setPosition((current) => clampPosition(current, rect))
    }
    window.addEventListener('resize', keepInsideViewport)
    return () => window.removeEventListener('resize', keepInsideViewport)
  }, [position])

  if (!video) return null

  function beginDrag(event) {
    if (event.button !== 0 || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    dragRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setPosition({ left: rect.left, top: rect.top })
  }

  function drag(event) {
    if (!dragRef.current) return
    setPosition(clampPosition({
      left: event.clientX - dragRef.current.offsetX,
      top: event.clientY - dragRef.current.offsetY,
    }, dragRef.current))
  }

  function finishDrag(event) {
    if (!dragRef.current) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    dragRef.current = null
    setPosition((current) => {
      if (current) {
        localStorage.setItem(PLAYER_POSITION_KEY, JSON.stringify(current))
      }
      return current
    })
  }

  function maximize() {
    const seconds = playerRef.current?.getCurrentTime?.()
    if (Number.isFinite(seconds)) onProgress(seconds)
    onMaximize()
  }

  function close() {
    closingRef.current = true
    onClose()
  }

  function reportProgress(seconds) {
    if (!closingRef.current) onProgress(seconds)
  }

  return (
    <aside
      ref={containerRef}
      style={position ? { left: position.left, top: position.top } : undefined}
      className={`fixed z-[70] w-[min(320px,calc(100vw-32px))] overflow-hidden rounded-[8px] border border-white/20 bg-[#101216] shadow-[0_12px_36px_rgba(0,0,0,0.28)] ${
        position ? '' : 'bottom-4 right-4'
      }`}
      aria-label={`Now playing ${video.title}`}
    >
      <div className="relative aspect-video bg-black">
        <YouTubeEmbed
          ref={playerRef}
          videoId={video.youtubeVideoId}
          title={`${video.creator} - ${video.title}`}
          startSeconds={video.playbackSeconds}
          autoplay
          onProgress={reportProgress}
        />
        <button
          type="button"
          onPointerDown={beginDrag}
          onPointerMove={drag}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          className="absolute left-2 top-2 flex h-7 w-9 touch-none cursor-grab items-center justify-center rounded-full bg-black/65 text-white backdrop-blur-sm active:cursor-grabbing"
          aria-label="Move player"
          title="Move player"
        >
          <GripHorizontal className="h-4 w-4" />
        </button>
        <div className="absolute right-2 top-2 flex gap-1.5">
          <button
            type="button"
            onClick={maximize}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur-sm"
            aria-label="Return to full player"
            title="Return to full player"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={close}
            className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur-sm"
            aria-label="Close player"
            title="Close player"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={maximize}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-white"
      >
        <span className="min-w-0">
          <span className="block truncate text-[10px] font-semibold">
            {video.title}
          </span>
          <span className="mt-0.5 block truncate text-[8px] text-white/60">
            {video.creator}
          </span>
        </span>
        <Maximize2 className="h-3.5 w-3.5 shrink-0 text-white/75" />
      </button>
    </aside>
  )
}

function clampPosition(position, dimensions) {
  if (!position) return null
  const margin = 16
  const width = dimensions.width || 320
  const height = dimensions.height || 230
  return {
    left: Math.min(
      Math.max(margin, position.left),
      Math.max(margin, window.innerWidth - width - margin),
    ),
    top: Math.min(
      Math.max(margin, position.top),
      Math.max(margin, window.innerHeight - height - margin),
    ),
  }
}

export default WatchMiniPlayer
