import { Maximize2, X } from 'lucide-react'

function WatchMiniPlayer({ video, onClose, onMaximize }) {
  if (!video) return null

  return (
    <aside
      className="fixed bottom-4 right-4 z-[70] w-[min(320px,calc(100vw-32px))] overflow-hidden rounded-[8px] border border-white/20 bg-[#101216] shadow-[0_12px_36px_rgba(0,0,0,0.28)]"
      aria-label={`Now playing ${video.title}`}
    >
      <div className="relative aspect-video bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.youtubeVideoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={`${video.creator} - ${video.title}`}
          className="h-full w-full border-0"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
        <div className="pointer-events-none absolute right-2 top-2 flex gap-1.5">
          <button
            type="button"
            onClick={onMaximize}
            className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur-sm"
            aria-label="Return to full player"
            title="Return to full player"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
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
        onClick={onMaximize}
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

export default WatchMiniPlayer
