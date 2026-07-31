import { useEffect, useMemo, useRef, useState } from 'react'
import { Play } from 'lucide-react'
import StatusModal from '@/components/auth/shared/StatusModal.jsx'
import AppHeaderActions from '@/components/common/AppHeaderActions.jsx'
import {
  AppPageLayout,
  PageBackLink,
} from '@/components/common/AppPageLayout.jsx'
import { getAuthSession, getAuthToken } from '@/features/auth/authStorage.js'
import { getWatchCatalog } from '@/features/watch/watchService.js'

const categoryLabels = {
  TEACHING_PREACHING: 'Teaching & Preaching',
  WORSHIP: 'Worship',
  DEVOTIONALS: 'Devotional',
  TESTIMONIES: 'Testimony',
  BIBLE_STUDY: 'Bible Study',
}

function QueueItem({ video, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group grid w-full grid-cols-[92px_minmax(0,1fr)] gap-3 rounded-[7px] p-2 text-left transition-colors ${
        active ? 'bg-[#f7efe3]' : 'hover:bg-[#f6f7f8]'
      }`}
      aria-current={active ? 'true' : undefined}
    >
      <span className="relative block aspect-video overflow-hidden rounded-[5px] bg-[#ece9e4]">
        <img
          src={`https://i.ytimg.com/vi/${video.youtubeVideoId}/mqdefault.jpg`}
          alt=""
          className="h-full w-full object-cover"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
          <Play className="h-4 w-4 fill-white text-white" />
        </span>
      </span>
      <span className="min-w-0 self-center">
        <span className="line-clamp-2 text-[10px] font-semibold leading-4 text-[#20242b]">
          {video.title}
        </span>
        <span className="mt-1 block truncate text-[9px] text-[#7b8290]">
          {video.creator}
        </span>
      </span>
    </button>
  )
}

function WatchPlayerPage({ onNavigate, onVideoActive }) {
  const session = getAuthSession()
  const topRef = useRef(null)
  const [videos, setVideos] = useState([])
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!getAuthToken()) {
      onNavigate('/')
      return
    }

    let active = true
    const requestedVideo = new URLSearchParams(window.location.search).get(
      'video',
    )

    getWatchCatalog()
      .then((catalog) => {
        if (!active) return
        const initialVideo =
          catalog.find((video) => video.catalogKey === requestedVideo) ||
          catalog.find((video) => video.featured) ||
          catalog[0]
        setVideos(catalog)
        setSelectedVideo(initialVideo || null)
        if (initialVideo) onVideoActive?.(initialVideo)
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || 'Unable to load this video.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [onNavigate, onVideoActive])

  const queue = useMemo(() => {
    if (!selectedVideo) return []
    const sameCategory = videos.filter(
      (video) =>
        video.category === selectedVideo.category &&
        video.catalogKey !== selectedVideo.catalogKey,
    )
    const remaining = videos.filter(
      (video) =>
        video.category !== selectedVideo.category &&
        video.catalogKey !== selectedVideo.catalogKey,
    )
    return [...sameCategory, ...remaining].slice(0, 7)
  }, [selectedVideo, videos])

  function selectVideo(video) {
    setSelectedVideo(video)
    onVideoActive?.(video)
    window.history.replaceState(
      {},
      '',
      `/watch/player?video=${encodeURIComponent(video.catalogKey)}`,
    )
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <AppPageLayout
      name={session?.fullname}
      onNavigate={onNavigate}
      activePath="/watch"
      mainClassName="scroll-mt-4"
    >
          <header ref={topRef} className="mb-5 flex items-start justify-between">
            <PageBackLink onClick={() => onNavigate('/watch')} className="mb-0">
              Back to Watch
            </PageBackLink>
            <div className="flex gap-2">
              <AppHeaderActions onNavigate={onNavigate} />
            </div>
          </header>

          {loading ? (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
              <div className="auth-skeleton aspect-video rounded-[8px]" />
              <div className="auth-skeleton h-[430px] rounded-[8px]" />
            </div>
          ) : selectedVideo ? (
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
              <section className="min-w-0">
                <div className="aspect-video overflow-hidden rounded-[8px] bg-black">
                  <iframe
                    key={selectedVideo.youtubeVideoId}
                    src={`https://www.youtube-nocookie.com/embed/${selectedVideo.youtubeVideoId}?rel=0&modestbranding=1&playsinline=1`}
                    title={`${selectedVideo.creator} - ${selectedVideo.title}`}
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>

                <div className="border-b border-[#e2e5e9] px-1 pb-6 pt-5">
                  <p className="text-[10px] font-semibold text-[#b27413]">
                    {categoryLabels[selectedVideo.category]}
                  </p>
                  <h1 className="mt-1.5 text-[27px] font-semibold leading-tight">
                    {selectedVideo.title}
                  </h1>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4eadc] text-[10px] font-semibold text-[#8c5e21]">
                      {selectedVideo.creator
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join('')}
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold">
                        {selectedVideo.creator}
                      </p>
                      <p className="mt-0.5 text-[9px] text-[#808794]">
                        {categoryLabels[selectedVideo.category]}
                      </p>
                    </div>
                  </div>
                  <p className="mt-5 max-w-[680px] text-[11px] leading-5 text-[#687183]">
                    Settle in and watch without leaving Koino. Continue with
                    another teaching from the queue when you are ready.
                  </p>
                </div>
              </section>

              <aside className="rounded-[8px] border border-[#dfe3e8] bg-white p-3 xl:sticky xl:top-5">
                <div className="flex items-center justify-between px-2 py-1">
                  <h2 className="font-sans text-[12px] font-semibold">
                    Up next
                  </h2>
                  <span className="text-[9px] text-[#858c99]">
                    {queue.length} videos
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {queue.map((video) => (
                    <QueueItem
                      key={video.videoId}
                      video={video}
                      active={false}
                      onSelect={() => selectVideo(video)}
                    />
                  ))}
                </div>
              </aside>
            </div>
          ) : null}
      {error && (
        <StatusModal
          type="error"
          title="Video unavailable"
          message={error}
          onClose={() => setError('')}
        />
      )}
    </AppPageLayout>
  )
}

export default WatchPlayerPage
