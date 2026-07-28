import { Bell, Check } from 'lucide-react'

function relativeTime(value) {
  const timestamp = new Date(value).getTime()
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (elapsedSeconds < 60) return 'Just now'
  const minutes = Math.floor(elapsedSeconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function NotificationMenu({
  notifications,
  open,
  onToggle,
  onRead,
}) {
  const unreadCount = notifications.filter((item) => !item.read).length

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#e6e7e9] bg-white hover:bg-[#f7f7f8] sm:h-11 sm:w-11"
        aria-label="Notifications"
        aria-expanded={open}
        title="Notifications"
      >
        <Bell className="h-5 w-5" strokeWidth={1.65} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#e8a33d] ring-2 ring-white" />
        )}
      </button>

      {open && (
        <section className="absolute right-0 top-[calc(100%+10px)] z-30 w-[310px] overflow-hidden rounded-[8px] border border-[#dfe3e8] bg-white shadow-[0_18px_45px_rgba(22,28,38,0.14)]">
          <header className="flex items-center justify-between border-b border-[#eceef1] px-4 py-3">
            <h2 className="font-sans text-[12px] font-semibold">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="text-[9px] font-medium text-[#a66b0b]">
                {unreadCount} new
              </span>
            )}
          </header>
          <div className="max-h-[330px] overflow-y-auto p-1.5">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto h-5 w-5 text-[#9aa1ac]" />
                <p className="mt-2 text-[10px] text-[#7a8290]">
                  You&apos;re all caught up.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.notificationId}
                  type="button"
                  onClick={() => onRead(notification)}
                  className={`flex w-full gap-3 rounded-[6px] px-3 py-3 text-left hover:bg-[#f7f8f9] ${
                    notification.read ? 'opacity-70' : 'bg-[#fdf8f0]'
                  }`}
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f4eadc] text-[#a66b0b]">
                    {notification.read ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Bell className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-semibold text-[#202630]">
                      {notification.title}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-[9px] leading-4 text-[#6d7584]">
                      {notification.message}
                    </span>
                    <span className="mt-1.5 block text-[8px] text-[#9aa1ac]">
                      {relativeTime(notification.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  )
}

export default NotificationMenu
