import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import NotificationMenu from '@/components/home/NotificationMenu.jsx'
import { getAuthToken } from '@/features/auth/authStorage.js'
import {
  markNotificationRead,
} from '@/features/home/homeService.js'
import {
  acceptFriend,
  removeFriendship,
} from '@/features/social/socialService.js'
import { apiRequest } from '@/services/api/client.js'

function AppHeaderActions({ onNavigate }) {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const [actioningId, setActioningId] = useState(null)

  const refresh = useCallback(async () => {
    if (!getAuthToken()) return
    const result = await apiRequest('/users/me/notifications')
    setNotifications(result)
  }, [])

  useEffect(() => {
    Promise.resolve().then(refresh).catch(() => {})
    const timer = window.setInterval(() => refresh().catch(() => {}), 15000)
    return () => window.clearInterval(timer)
  }, [refresh])

  const visibleNotifications = useMemo(
    () => notifications.filter((item) => item.type !== 'BATTLE_CHALLENGE'),
    [notifications],
  )

  async function toggleNotifications() {
    setOpen((current) => !current)
  }

  async function readNotification(notification) {
    setNotifications((current) =>
      current.filter(
        (item) => item.notificationId !== notification.notificationId,
      ),
    )
    setOpen(false)
    if (notification.type === 'PLAN_READY') onNavigate('/plans')
    if (notification.type === 'READING_REMINDER') onNavigate('/devotional')
    if (!notification.read) {
      try {
        await markNotificationRead(notification.notificationId)
      } catch {
        await refresh().catch(() => {})
      }
    }
  }

  async function respond(notification, accepted) {
    setActioningId(notification.notificationId)
    try {
      if (accepted) await acceptFriend(notification.referenceId)
      else await removeFriendship(notification.referenceId)
      setNotifications((current) =>
        current.filter(
          (item) => item.notificationId !== notification.notificationId,
        ),
      )
    } finally {
      setActioningId(null)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => onNavigate('/bible?focus=book')}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e6e7e9] bg-white transition-colors hover:bg-[#f7f7f8] sm:h-11 sm:w-11"
        aria-label="Search the Bible"
        title="Search the Bible"
      >
        <Search className="h-5 w-5" strokeWidth={1.65} />
      </button>
      <NotificationMenu
        notifications={visibleNotifications}
        open={open}
        onToggle={toggleNotifications}
        onClose={() => setOpen(false)}
        onRead={(notification) => readNotification(notification).catch(() => {})}
        onAccept={(notification) => respond(notification, true).catch(() => {})}
        onDecline={(notification) => respond(notification, false).catch(() => {})}
        actioningId={actioningId}
      />
    </>
  )
}

export default AppHeaderActions
