import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AppPageLayout,
  PageHeader,
} from '@/components/common/AppPageLayout.jsx'
import HomeRail from '@/components/home/HomeRail.jsx'
import TodayPlanCard from '@/components/home/TodayPlanCard.jsx'
import StatusModal from '@/components/auth/shared/StatusModal.jsx'
import { getAuthSession, getAuthToken } from '@/features/auth/authStorage.js'
import {
  getCachedHomeData,
  getHomeData,
} from '@/features/home/homeService.js'

function HomePage({ onNavigate }) {
  const { t } = useTranslation()
  const [data, setData] = useState(getCachedHomeData)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(() => !getCachedHomeData())
  const session = getAuthSession()

  const loadHome = useCallback(async () => {
    try {
      setData(await getHomeData())
    } catch (requestError) {
      setError(requestError.message || 'Unable to load your home page.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!getAuthToken()) {
      onNavigate('/')
      return undefined
    }

    let active = true
    getHomeData()
      .then((homeData) => {
        if (active) setData(homeData)
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || 'Unable to load your home page.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [onNavigate])

  useEffect(() => {
    if (loading || !data || data.plan) return undefined

    const refreshTimer = window.setTimeout(loadHome, 3000)
    return () => window.clearTimeout(refreshTimer)
  }, [data, loadHome, loading])

  useEffect(() => {
    const refreshBookmarks = () => loadHome()
    window.addEventListener('koino:bookmarks-changed', refreshBookmarks)
    return () => {
      window.removeEventListener('koino:bookmarks-changed', refreshBookmarks)
    }
  }, [loadHome])

  const firstName = session?.fullname?.trim().split(/\s+/)[0] || 'Friend'
  const hour = new Date().getHours()
  const greeting = hour < 12
    ? t('pages.home.morning')
    : hour < 18
      ? t('pages.home.afternoon')
      : t('pages.home.evening')
  const today = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  return (
    <AppPageLayout
      name={session?.fullname || firstName}
      onNavigate={onNavigate}
      activePath="/home"
    >
        <PageHeader
          title={`${greeting}, ${firstName}`}
          subtitle={t('pages.home.subtitle')}
          eyebrow={<span className="lg:hidden">{today}</span>}
          className="mb-6"
        />

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(290px,310px)]">
          {loading ? (
          <div className="rounded-[15px] border border-[#e2e5ea] bg-white p-7">
            <div className="auth-skeleton h-10 w-40 rounded-[7px]" />
            <div className="mt-7 auth-skeleton h-28 w-full rounded-[7px]" />
            <div className="mt-5 auth-skeleton h-40 w-full rounded-[7px]" />
            <div className="mt-4 auth-skeleton h-12 w-full rounded-[7px]" />
          </div>
        ) : (
          <TodayPlanCard
            plan={data?.plan}
            task={data?.task}
            onStartReading={() => onNavigate('/devotional')}
            onViewPlan={() => onNavigate('/plans')}
          />
          )}

          <HomeRail
            streak={data?.streak}
            bookmarkCount={data?.bookmarks?.length || 0}
            verseOfDay={data?.verseOfDay}
            onNavigate={onNavigate}
          />
        </div>

      {error && (
        <StatusModal
          type="error"
          title={t('common.errorTitle')}
          message={error}
          onClose={() => setError('')}
        />
      )}
    </AppPageLayout>
  )
}

export default HomePage
