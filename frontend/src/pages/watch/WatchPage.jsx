import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BookOpen,
  MessageCircleHeart,
  Mic2,
  Music2,
  Play,
  SunMedium,
  TvMinimalPlay,
  HandHeart,
  HeartHandshake,
  CircleDollarSign,
} from 'lucide-react'
import StatusModal from '@/components/auth/shared/StatusModal.jsx'
import { AppPageLayout, PageHeader } from '@/components/common/AppPageLayout.jsx'
import { getAuthSession, getAuthToken } from '@/features/auth/authStorage.js'
import { getWatchCatalog } from '@/features/watch/watchService.js'
import { normalizeLocale } from '@/i18n/index.js'

const categoryMetadata = {
  TEACHING_PREACHING: {
    value: 'TEACHING_PREACHING',
    translationKey: 'TEACHING_PREACHING',
    icon: Mic2,
  },
  WORSHIP: {
    value: 'WORSHIP',
    translationKey: 'WORSHIP',
    icon: Music2,
  },
  DEVOTIONALS: {
    value: 'DEVOTIONALS',
    translationKey: 'DEVOTIONALS',
    icon: SunMedium,
  },
  TESTIMONIES: {
    value: 'TESTIMONIES',
    translationKey: 'TESTIMONIES',
    icon: MessageCircleHeart,
  },
  BIBLE_STUDY: {
    value: 'BIBLE_STUDY',
    translationKey: 'BIBLE_STUDY',
    icon: BookOpen,
  },
  PRAYER: {
    value: 'PRAYER',
    translationKey: 'PRAYER',
    icon: HandHeart,
  },
  FORGIVENESS: {
    value: 'FORGIVENESS',
    translationKey: 'FORGIVENESS',
    icon: HeartHandshake,
  },
  FINANCES: {
    value: 'FINANCES',
    translationKey: 'FINANCES',
    icon: CircleDollarSign,
  },
}

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
  const { t, i18n } = useTranslation()
  const session = getAuthSession()
  const [contentLanguage, setContentLanguage] = useState(() =>
    normalizeLocale(session?.language || i18n.resolvedLanguage) === 'pt-BR'
      ? 'pt'
      : 'en',
  )
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
    getWatchCatalog(contentLanguage)
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
          setError(requestError.message || t('watch.unavailable'))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [contentLanguage, onNavigate, t])

  const visibleVideos = useMemo(
    () =>
      selectedCategory === 'ALL'
        ? videos
        : videos.filter((video) => video.category === selectedCategory),
    [selectedCategory, videos],
  )

  const categories = useMemo(() => {
    const available = [...new Set(videos.map((video) => video.category))]
    return [
      {
        value: 'ALL',
        label: t('watch.all'),
        description: t('watch.allDescription'),
        icon: Play,
      },
      ...available.map((value) =>
        categoryMetadata[value] ? {
          ...categoryMetadata[value],
          label: t(`watch.categoriesMap.${value}.label`),
          description: t(`watch.categoriesMap.${value}.description`),
        } : {
          value,
          label: value
            .toLowerCase()
            .split('_')
            .map((word) => word[0].toUpperCase() + word.slice(1))
            .join(' '),
          description: t('watch.insideDescription'),
          icon: TvMinimalPlay,
        },
      ),
    ]
  }, [t, videos])

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
    [categories, videos],
  )

  function openVideo(video) {
    onNavigate(`/watch/player?video=${encodeURIComponent(video.catalogKey)}`)
  }

  return (
    <AppPageLayout
      name={session?.fullname}
      onNavigate={onNavigate}
      activePath="/watch"
    >
          <PageHeader
            title={t('watch.title')}
            subtitle={t('watch.subtitle')}
            actions={(
              <label className="flex h-9 items-center gap-2 rounded-[7px] border border-[#dfe3e8] bg-white px-3 text-[10px] font-medium text-[#4f5866]">
                <span>{t('watch.contentLanguage')}</span>
                <select
                  value={contentLanguage}
                  onChange={(event) => setContentLanguage(event.target.value)}
                  className="bg-transparent font-semibold text-[#81571d] outline-none"
                >
                  <option value="pt">{t('watch.portuguese')}</option>
                  <option value="en">{t('watch.english')}</option>
                </select>
              </label>
            )}
            className="mb-5"
          />

          {loading ? (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
              <div className="auth-skeleton aspect-video rounded-[8px]" />
              <div className="auth-skeleton h-[360px] rounded-[8px]" />
            </div>
          ) : (
            <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_280px]">
              <div className="min-w-0">
                {selectedVideo ? (
                  <section>
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
                        {t('watch.featured')}
                      </p>
                      <h2 className="mt-1.5 text-[24px] font-semibold leading-tight">
                        {selectedVideo.title}
                      </h2>
                      <p className="mt-1 text-[12px] text-[#6b7382]">
                        {selectedVideo.creator}
                      </p>
                    </div>
                  </section>
                ) : (
                  <section className="flex min-h-[330px] flex-col items-center justify-center rounded-[8px] border border-[#e2e4e8] bg-white px-8 text-center">
                    <TvMinimalPlay className="h-9 w-9 text-[#d2953d]" strokeWidth={1.4} />
                    <h2 className="mt-4 text-[18px] font-semibold">{t('watch.emptyTitle')}</h2>
                    <p className="mt-2 max-w-[430px] text-[11px] leading-5 text-[#737b89]">{t('watch.emptyDescription')}</p>
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
                          <Play className="h-3.5 w-3.5 fill-current" />
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
                    {t('watch.categories')}
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
                    {t('watch.insideTitle')}
                  </h2>
                  <p className="mt-2 text-[10px] leading-5 text-[#747c8a]">
                    {t('watch.insideDescription')}
                  </p>
                </section>
              </aside>
            </div>
          )}
      {error && (
        <StatusModal
          type="error"
          title={t('watch.unavailable')}
          message={error}
          onClose={() => setError('')}
        />
      )}
    </AppPageLayout>
  )
}

export default WatchPage
