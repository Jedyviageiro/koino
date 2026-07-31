import { useEffect, useState } from 'react'
import {
  BookOpen,
  ChevronRight,
  Heart,
} from 'lucide-react'
import StatusModal from '@/components/auth/shared/StatusModal.jsx'
import {
  AppPageLayout,
  PageBackLink,
} from '@/components/common/AppPageLayout.jsx'
import AppHeaderActions from '@/components/common/AppHeaderActions.jsx'
import { getAuthSession, getAuthToken } from '@/features/auth/authStorage.js'
import { getTodayDevotional } from '@/features/devotional/devotionalService.js'

function ReflectionText({ text }) {
  return String(text || '')
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((paragraph) => (
      <p key={paragraph} className="mt-4">
        {paragraph}
      </p>
    ))
}

function DevotionalSkeleton() {
  return (
    <div className="pt-2">
      <div className="auth-skeleton h-4 w-24 rounded-[5px]" />
      <div className="auth-skeleton mt-8 h-4 w-32 rounded-[5px]" />
      <div className="auth-skeleton mt-3 h-10 w-80 max-w-full rounded-[6px]" />
      <div className="auth-skeleton mt-6 h-4 w-3/4 rounded-[5px]" />
      <div className="mt-8 space-y-3">
        <div className="auth-skeleton h-3.5 w-full rounded-[5px]" />
        <div className="auth-skeleton h-3.5 w-[92%] rounded-[5px]" />
        <div className="auth-skeleton h-3.5 w-[84%] rounded-[5px]" />
        <div className="auth-skeleton h-3.5 w-[95%] rounded-[5px]" />
      </div>
      <div className="auth-skeleton mt-10 h-24 w-full rounded-[8px]" />
    </div>
  )
}

function DevotionalPage({ onNavigate }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const session = getAuthSession()

  useEffect(() => {
    if (!getAuthToken()) {
      onNavigate('/')
      return undefined
    }

    let active = true
    getTodayDevotional()
      .then((devotionalData) => {
        if (!active) return
        if (!devotionalData.task) {
          setError('There is no devotional available for today yet.')
          return
        }
        setData(devotionalData)
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.message || 'Unable to prepare today\'s devotional.',
          )
        }
      })

    return () => {
      active = false
    }
  }, [onNavigate])

  const firstName =
    session?.fullname?.trim().split(/\s+/)[0] || 'there'

  return (
    <AppPageLayout
      name={session?.fullname}
      onNavigate={onNavigate}
      activePath="/plans"
    >
        {!data ? (
          <DevotionalSkeleton />
        ) : (
          <article>
            <div className="mb-6 flex items-center justify-between gap-4">
              <PageBackLink
                onClick={() => onNavigate('/plans')}
                className="mb-0"
              >
                Back to Plans
              </PageBackLink>
              <div className="flex items-center gap-2">
                <AppHeaderActions onNavigate={onNavigate} />
              </div>
            </div>

            <header>
              <p className="text-[11px] font-semibold text-[#c27c11]">
                Today&apos;s Devotional
              </p>
              <h1 className="mt-2 text-[32px] font-semibold leading-tight sm:text-[38px]">
                {data.devotional.title}
              </h1>
              <blockquote className="mt-5 border-l-2 border-[#e8a33d] pl-4">
                <p className="text-[12px] italic leading-6 text-[#606879]">
                  {data.devotional.anchorVerseText}
                </p>
                <cite className="mt-1 block text-[11px] font-semibold not-italic text-[#c27c11]">
                  {data.devotional.anchorVerseReference}
                </cite>
              </blockquote>
            </header>

            <div className="mt-8 max-w-[760px] text-[12px] leading-[1.85] text-[#242a33] sm:text-[13px]">
              <p>Hi {firstName},</p>
              <p className="mt-4">{data.devotional.opening}</p>
              <ReflectionText text={data.devotional.reflection} />
              <p className="mt-4">{data.devotional.application}</p>
            </div>

            <section className="mt-9 flex gap-4 border-y border-[#e6e8eb] py-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff7eb] text-[#dc8d18]">
                <Heart className="h-[18px] w-[18px]" strokeWidth={1.65} />
              </span>
              <div>
                <h2 className="font-sans text-[12px] font-semibold text-[#c27c11]">
                  Let&apos;s Pray
                </h2>
                <p className="mt-2 max-w-[700px] text-[12px] leading-6 text-[#313844]">
                  {data.devotional.prayer}
                </p>
              </div>
            </section>

            <section className="mt-8 flex flex-col gap-5 rounded-[8px] bg-[#fff6e9] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#b27413]">
                  <BookOpen className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <div>
                  <p className="text-[12px] font-semibold">
                    Ready to begin today&apos;s reading?
                  </p>
                  <p className="mt-1 text-[11px] text-[#6a7281]">
                    {data.task.readingAssignment}
                    <span className="px-1.5">&bull;</span>
                    {data.devotional.verseCount} verses
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('/reading')}
                className="flex h-11 shrink-0 items-center justify-center gap-3 rounded-[7px] bg-[#d98b18] px-5 text-[11px] font-semibold text-white transition-colors hover:bg-[#c87c0f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d98b18]"
              >
                Start Today&apos;s Reading
                <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </section>
          </article>
        )}
      {error && (
        <StatusModal
          type="error"
          title="Devotional unavailable"
          message={error}
          onClose={() => {
            setError('')
            onNavigate('/plans')
          }}
        />
      )}
    </AppPageLayout>
  )
}

export default DevotionalPage
