import { useEffect, useState } from 'react'
import {
  BookOpen,
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  House,
  Clapperboard,
  MessagesSquare,
  Settings,
} from 'lucide-react'
import koinoLogo from '@/assets/brand/logos/koino-wordmark.png'
import { getAuthSession } from '@/features/auth/authStorage.js'
import { apiRequest } from '@/services/api/client.js'

const navigation = [
  { label: 'Home', icon: House, path: '/home' },
  { label: 'Plans', icon: ChartNoAxesColumnIncreasing, path: '/plans' },
  { label: 'Bible', icon: BookOpen, path: '/bible' },
  { label: 'Watch', icon: Clapperboard, path: '/watch' },
  { label: 'Community', icon: MessagesSquare, path: '/community' },
]

function HomeSidebar({
  name,
  onNavigate,
  activePath = window.location.pathname,
}) {
  const session = getAuthSession()
  const [user, setUser] = useState({
    fullname: name || session?.fullname || 'Koino Reader',
    profilePictureUrl: session?.profilePictureUrl || '',
  })

  useEffect(() => {
    let active = true
    apiRequest('/users/me')
      .then((currentUser) => {
        if (active) setUser(currentUser)
      })
      .catch(() => {
        // The stored session still provides a stable fallback for the rail.
      })
    return () => {
      active = false
    }
  }, [])

  const displayName = user.fullname || 'Koino Reader'
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <aside className="relative z-10 hidden min-h-svh border-r border-[#e5e7eb] bg-white lg:sticky lg:top-0 lg:flex lg:h-svh lg:w-[164px] lg:flex-col">
      <button
        type="button"
        onClick={() => onNavigate('/home')}
        className="mx-5 mt-7 w-[76px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4b5563]"
        aria-label="Koino home"
      >
        <img src={koinoLogo} alt="Koino" className="h-auto w-full" />
      </button>

      <nav className="mt-9 space-y-1 px-3" aria-label="Main navigation">
        {navigation.map((item) => {
          const Icon = item.icon
          const active = item.path === activePath

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onNavigate(item.path)}
              className={`flex h-11 w-full items-center gap-3 rounded-[6px] px-3.5 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#4b5563] ${
                active
                  ? 'bg-[#f6efe4] font-semibold text-[#55452d]'
                  : 'text-[#394252] hover:bg-[#f7f8fa] hover:text-[#151a22]'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.65} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto px-3 pb-6">
        <button
          type="button"
          className="flex h-11 w-full items-center gap-3 rounded-[6px] px-3.5 text-[11px] font-medium text-[#394252] transition-colors hover:bg-[#f7f8fa] hover:text-[#151a22] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#4b5563]"
        >
          <Settings className="h-4 w-4" strokeWidth={1.65} />
          <span>Settings</span>
        </button>

        <div className="mt-3 flex h-12 items-center gap-2.5 border-t border-[#eceef1] px-1 pt-3">
          {user.profilePictureUrl ? (
            <img
              src={user.profilePictureUrl}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eceff3] text-[9px] font-semibold text-[#394252]">
              {initials}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-[#202630]">
            {displayName.split(/\s+/)[0]}
          </span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#9299a4]" />
        </div>
      </div>
    </aside>
  )
}

export default HomeSidebar
