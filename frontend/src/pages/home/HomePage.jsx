import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import {
  AppPageLayout,
  PageHeader,
} from '@/components/common/AppPageLayout.jsx'
import HomeRail from '@/components/home/HomeRail.jsx'
import TodayPlanCard from '@/components/home/TodayPlanCard.jsx'
import NotificationMenu from '@/components/home/NotificationMenu.jsx'
import StatusModal from '@/components/auth/shared/StatusModal.jsx'
import { getAuthSession, getAuthToken } from '@/features/auth/authStorage.js'
import {
  getHomeData,
  markNotificationRead,
} from '@/features/home/homeService.js'
import {
  acceptFriend,
  removeFriendship,
} from '@/features/social/socialService.js'

function HomePage({ onNavigate }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [notificationsOpen, setNotificationsOpen] = useState(
    () => new URLSearchParams(window.location.search).get('notifications') === 'open',
  )
  const [actioningNotificationId, setActioningNotificationId] = useState(null)
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

  const notifications = useMemo(
    () =>
      (data?.notifications || []).filter(
        (notification) => notification.type !== 'BATTLE_CHALLENGE',
      ),
    [data],
  )

  async function toggleNotifications() {
    if (notificationsOpen) {
      setNotificationsOpen(false)
      return
    }

    setNotificationsOpen(true)
    const unreadIds = new Set(
      notifications
        .filter((notification) => !notification.read)
        .map((notification) => notification.notificationId),
    )
    if (unreadIds.size === 0) return

    setData((current) => ({
      ...current,
      notifications: current.notifications.map((notification) => (
        unreadIds.has(notification.notificationId)
          ? { ...notification, read: true }
          : notification
      )),
    }))

    try {
      await Promise.all(
        Array.from(unreadIds, (notificationId) =>
          markNotificationRead(notificationId),
        ),
      )
    } catch (requestError) {
      setData((current) => ({
        ...current,
        notifications: current.notifications.map((notification) => (
          unreadIds.has(notification.notificationId)
            ? { ...notification, read: false }
            : notification
        )),
      }))
      setError(
        requestError.message || 'Unable to update your notifications.',
      )
    }
  }

  async function readNotification(notification) {
    try {
      if (!notification.read) {
        const updated = await markNotificationRead(notification.notificationId)
        setData((current) => ({
          ...current,
          notifications: current.notifications.map((item) =>
            item.notificationId === updated.notificationId ? updated : item,
          ),
        }))
      }
      setNotificationsOpen(false)
      if (notification.type === 'PLAN_READY') onNavigate('/plans')
    } catch (requestError) {
      setError(requestError.message || 'Unable to update this notification.')
    }
  }

  async function respondToNotification(notification, accepted) {
    setActioningNotificationId(notification.notificationId)
    try {
      if (notification.type === 'FRIEND_REQUEST') {
        if (accepted) {
          await acceptFriend(notification.referenceId)
        } else {
          await removeFriendship(notification.referenceId)
        }
      }
      setData((current) => ({
        ...current,
        notifications: current.notifications.map((item) =>
          item.notificationId === notification.notificationId
            ? { ...item, read: true, referenceId: null }
            : item,
        ),
      }))
    } catch (requestError) {
      setError(requestError.message || 'Unable to respond right now.')
    } finally {
      setActioningNotificationId(null)
    }
  }

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
    <AppPageLayout
      name={session?.fullname || firstName}
      onNavigate={onNavigate}
      activePath="/home"
    >
        <PageHeader
          title={`${greeting}, ${firstName}`}
          subtitle="Let's grow closer to God together."
          eyebrow={<span className="lg:hidden">{today}</span>}
          className="mb-6"
          actions={
            <>
            <button
              type="button"
              onClick={() => onNavigate('/bible')}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e6e7e9] bg-white hover:bg-[#f7f7f8] sm:h-11 sm:w-11"
              aria-label="Search"
              title="Search"
            >
              <Search className="h-5 w-5" strokeWidth={1.65} />
            </button>
            <NotificationMenu
              notifications={notifications}
              open={notificationsOpen}
              onToggle={toggleNotifications}
              onClose={() => setNotificationsOpen(false)}
              onRead={readNotification}
              onAccept={(notification) =>
                respondToNotification(notification, true)
              }
              onDecline={(notification) =>
                respondToNotification(notification, false)
              }
              actioningId={actioningNotificationId}
            />
            </>
          }
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
            onNavigate={onNavigate}
          />
        </div>

      {error && (
        <StatusModal
          type="error"
          title="Something went wrong"
          message={error}
          onClose={() => setError('')}
        />
      )}
    </AppPageLayout>
  )
}

export default HomePage
