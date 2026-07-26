import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bell, Search } from 'lucide-react'
import HomeSidebar from '@/components/home/HomeSidebar.jsx'
import HomeRail from '@/components/home/HomeRail.jsx'
import TodayPlanCard from '@/components/home/TodayPlanCard.jsx'
import StatusModal from '@/components/auth/shared/StatusModal.jsx'
import { getAuthSession, getAuthToken } from '@/features/auth/authStorage.js'
import { getHomeData } from '@/features/home/homeService.js'

function HomePage({ onNavigate }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
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

  const unreadCount = useMemo(
    () => data?.notifications?.filter((item) => !item.read).length || 0,
    [data],
  )

  const firstName = session?.fullname?.trim().split(/\s+/)[0] || 'Friend'
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const today = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  return (
    <div className="min-h-svh bg-white text-[#0d0f12] lg:grid lg:grid-cols-[164px_minmax(0,1fr)]">
      <HomeSidebar name={session?.fullname || firstName} onNavigate={onNavigate} />

      <main className="min-w-0 px-[18px] pb-20 pt-[30px] sm:px-7 lg:px-9 lg:pb-10 lg:pt-10">
        <header className="mx-auto mb-7 flex max-w-[1100px] items-start justify-between">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase text-[#b27413] lg:hidden">{today}</p>
            <h1 className="text-[30px] font-semibold leading-[1.17] sm:text-[34px]">
              {greeting.replace('Good ', 'Good ')}, {firstName}
            </h1>
            <p className="mt-2 text-[14px] text-[#677089] sm:text-[15px]">
              Let&apos;s grow closer to God together.
            </p>
          </div>
          <div className="flex gap-2 sm:gap-5">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e6e7e9] bg-white hover:bg-[#f7f7f8] sm:h-11 sm:w-11"
              aria-label="Search"
              title="Search"
            >
              <Search className="h-5 w-5" strokeWidth={1.65} />
            </button>
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#e6e7e9] bg-white hover:bg-[#f7f7f8] sm:h-11 sm:w-11"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className="h-5 w-5" strokeWidth={1.65} />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#e8a33d] ring-2 ring-white" />
              )}
            </button>
          </div>
        </header>

        <div className="mx-auto grid max-w-[1100px] items-start gap-6 xl:grid-cols-[minmax(0,746px)_minmax(300px,330px)]">
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
          />
          )}

          <HomeRail
            streak={data?.streak}
            bookmarkCount={data?.bookmarks?.length || 0}
            unreadCount={unreadCount}
          />
        </div>
      </main>

      {error && (
        <StatusModal
          type="error"
          title="Something went wrong"
          message={error}
          onClose={() => setError('')}
        />
      )}
    </div>
  )
}

export default HomePage
