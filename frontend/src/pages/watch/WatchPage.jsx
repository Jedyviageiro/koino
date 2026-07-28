import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  ExternalLink,
  MessageCircleHeart,
  Mic2,
  Music2,
  Play,
  Search,
  SunMedium,
  TvMinimalPlay,
} from 'lucide-react'
import StatusModal from '@/components/auth/shared/StatusModal.jsx'
import HomeSidebar from '@/components/home/HomeSidebar.jsx'
import { getAuthSession, getAuthToken } from '@/features/auth/authStorage.js'
import { getWatchCatalog } from '@/features/watch/watchService.js'

const categories = [
  {
    value: 'ALL',
    label: 'All',
    description: 'The full Koino video library',
    icon: Play,
  },
  {
    value: 'TEACHING_PREACHING',
    label: 'Teaching & Preaching',
    description: 'Biblical teaching and ministry',
    icon: Mic2,
  },
  {
    value: 'WORSHIP',
    label: 'Worship',
    description: 'Songs for prayer and praise',
    icon: Music2,
  },
  {
    value: 'DEVOTIONALS',
    label: 'Devotionals',
    description: 'Quiet moments for each day',
    icon: SunMedium,
  },
  {
    value: 'TESTIMONIES',
    label: 'Testimonies',
    description: 'Stories of faith and courage',
    icon: MessageCircleHeart,
  },
  {
    value: 'BIBLE_STUDY',
    label: 'Bible Study',
    description: 'Go deeper into Scripture',
    icon: BookOpen,
  },
]

function VideoArtwork({ video, className = '' }) {
  if (video.youtubeVideoId) {
    return (
      <img
        src={`https://i.ytimg.com/vi/${video.youtubeVideoId}/hqdefault.jpg`}
        alt=""
        className={`h-full w-full object-cover ${className}`}
      />
    )
  }

  return (
    <span
      className={`flex h-full w-full items-center justify-center bg-[#f2f0ec] text-[#b47924] ${className}`}
    >
      <TvMinimalPlay className="h-8 w-8" strokeWidth={1.5} />
    </span>
  )
}

function WatchPage({ onNavigate }) {
  const session = getAuthSession()
  const playerRef = useRef(null)
  const [videos, setVideos] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!getAuthToken()) {
      onNavigate('/')
      return
    }

    let active = true
    getWatchCatalog()
      .then((catalog) => {
        if (!active) return
        setVideos(catalog)
        setSelectedVideo(
          catalog.find((video) => video.featured && video.youtubeVideoId) ||
            catalog.find((video) => video.youtubeVideoId) ||
            null,
        )
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || 'Unable to load Watch.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [onNavigate])

  const visibleVideos = useMemo(
    () =>
      selectedCategory === 'ALL'
        ? videos
        : videos.filter((video) => video.category === selectedCategory),
    [selectedCategory, videos],
  )

  const categoryCounts = useMemo(
    () =>
      new Map(
        categories.map((category) => [
          category.value,
          category.value === 'ALL'
            ? videos.length
            : videos.filter((video) => video.category === category.value)
                .length,
        ]),
      ),
    [videos],
  )

  function openVideo(video) {
    if (!video.youtubeVideoId) {
      window.open(video.youtubeUrl, '_blank', 'noopener,noreferrer')
      return
    }
    setSelectedVideo(video)
    playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-svh bg-[#fbfcfe] text-[#0d0f12] lg:grid lg:grid-cols-[164px_minmax(0,1fr)]">
      <HomeSidebar
        name={session?.fullname}
        onNavigate={onNavigate}
        activePath="/watch"
      />

      <main className="min-w-0 px-[18px] pb-12 pt-7 sm:px-7 lg:px-9 lg:pt-8">
        <div className="mx-auto max-w-[1100px]">
          <header className="mb-5">
            <h1 className="text-[30px] font-semibold leading-tight">Watch</h1>
            <p className="mt-1.5 text-[13px] text-[#667089]">
              Watch videos that inspire, teach, and strengthen your faith.
            </p>
          </header>

          {loading ? (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
              <div className="auth-skeleton aspect-video rounded-[8px]" />
              <div className="auth-skeleton h-[360px] rounded-[8px]" />
            </div>
          ) : (
            <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_280px]">
              <div className="min-w-0">
                {selectedVideo && (
                  <section ref={playerRef} className="scroll-mt-6">
                    <div className="aspect-video overflow-hidden rounded-[8px] bg-black">
                      <iframe
                        key={selectedVideo.youtubeVideoId}
                        src={`https://www.youtube-nocookie.com/embed/${selectedVideo.youtubeVideoId}?rel=0`}
                        title={`${selectedVideo.creator} - ${selectedVideo.title}`}
                        className="h-full w-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                    <div className="mt-4">
                      <p className="text-[10px] font-semibold uppercase text-[#b27413]">
                        Featured
                      </p>
                      <h2 className="mt-1.5 text-[24px] font-semibold leading-tight">
                        {selectedVideo.title}
                      </h2>
                      <p className="mt-1 text-[12px] text-[#6b7382]">
                        {selectedVideo.creator}
                      </p>
                    </div>
                  </section>
                )}

                <div className="mt-8 flex gap-1 overflow-x-auto border-b border-[#e1e4e8]">
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => setSelectedCategory(category.value)}
                      className={`relative h-10 shrink-0 px-3 text-[11px] font-medium ${
                        selectedCategory === category.value
                          ? 'text-[#8c5e21]'
                          : 'text-[#71798a] hover:text-[#252a32]'
                      }`}
                    >
                      {category.label}
                      {selectedCategory === category.value && (
                        <span className="absolute inset-x-3 bottom-0 h-0.5 bg-[#d99a3e]" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-4 grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleVideos.map((video) => (
                    <button
                      key={video.videoId}
                      type="button"
                      onClick={() => openVideo(video)}
                      className="group min-w-0 text-left"
                    >
                      <span className="relative block aspect-video overflow-hidden rounded-[7px] bg-[#f2f0ec]">
                        <VideoArtwork video={video} />
                        <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/75 text-white transition-transform group-hover:scale-105">
                          {video.youtubeVideoId ? (
                            <Play className="h-3.5 w-3.5 fill-current" />
                          ) : (
                            <Search className="h-3.5 w-3.5" />
                          )}
                        </span>
                      </span>
                      <span className="mt-2.5 block line-clamp-2 text-[12px] font-semibold leading-5 text-[#242933]">
                        {video.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] text-[#747c8a]">
                        {video.creator}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <aside className="space-y-4 xl:sticky xl:top-6">
                <section className="rounded-[8px] border border-[#dfe3e8] bg-white p-4">
                  <h2 className="font-sans text-[13px] font-semibold">
                    Categories
                  </h2>
                  <div className="mt-3 space-y-1">
                    {categories.slice(1).map((category) => {
                      const Icon = category.icon
                      return (
                        <button
                          key={category.value}
                          type="button"
                          onClick={() =>
                            setSelectedCategory(category.value)
                          }
                          className={`flex w-full items-center gap-3 rounded-[6px] px-2.5 py-2.5 text-left ${
                            selectedCategory === category.value
                              ? 'bg-[#f6efe4] text-[#6f4d22]'
                              : 'hover:bg-[#f6f7f8]'
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" strokeWidth={1.6} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[10px] font-semibold">
                              {category.label}
                            </span>
                            <span className="mt-0.5 block truncate text-[9px] text-[#858c99]">
                              {category.description}
                            </span>
                          </span>
                          <span className="text-[9px] text-[#8d94a0]">
                            {categoryCounts.get(category.value)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </section>

                <section className="rounded-[8px] border border-[#dfe3e8] bg-white p-4">
                  <h2 className="font-sans text-[13px] font-semibold">
                    On YouTube
                  </h2>
                  <p className="mt-2 text-[10px] leading-5 text-[#747c8a]">
                    Catalog entries without a direct video link open the exact
                    YouTube search supplied for that teaching.
                  </p>
                  <a
                    href="https://www.youtube.com"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex h-9 items-center justify-center gap-2 rounded-[7px] border border-[#e0e3e7] text-[10px] font-semibold text-[#555e6d] hover:bg-[#f8f8f8]"
                  >
                    Open YouTube
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </section>
              </aside>
            </div>
          )}
        </div>
      </main>

      {error && (
        <StatusModal
          type="error"
          title="Watch unavailable"
          message={error}
          onClose={() => setError('')}
        />
      )}
    </div>
  )
}

export default WatchPage
