import {
  BarChart3,
  BookOpen,
  ChevronRight,
  Home,
  Settings,
} from 'lucide-react'
import koinoLogo from '@/assets/brand/logos/koino-wordmark.png'

const navigation = [
  { label: 'Home', icon: Home, active: true },
  { label: 'Plans', icon: BarChart3 },
  { label: 'Bible', icon: BookOpen },
]

function HomeSidebar({ name, onNavigate }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <aside className="hidden min-h-svh bg-[linear-gradient(106deg,#f8f8f8_0%,#f4f5f7_100%)] px-3 lg:sticky lg:top-0 lg:flex lg:h-svh lg:w-[150px] lg:flex-col">
      <button
        type="button"
        onClick={() => onNavigate('/home')}
        className="mx-3 mt-8 w-[72px] focus-visible:outline-2 focus-visible:outline-[#1e55e5]"
        aria-label="Koino home"
      >
        <img src={koinoLogo} alt="Koino" className="h-auto w-full" />
      </button>

      <nav className="mt-10 space-y-2" aria-label="Main navigation">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.label}
              type="button"
              className={`flex h-11 w-full items-center gap-3 rounded-[9px] px-3.5 text-[12.5px] font-medium transition-colors ${
                item.active
                  ? 'bg-[#e9ebef] font-semibold text-[#15171b]'
                  : 'text-[#15171b] hover:bg-[#eceef1]'
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.65} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto space-y-2 pb-7">
        <button
          type="button"
          className="flex h-11 w-full items-center gap-3 rounded-[9px] px-2.5 text-[12.5px] font-medium text-[#15171b] hover:bg-[#eceef1]"
        >
          <Settings className="h-[18px] w-[18px]" strokeWidth={1.65} />
          Config
        </button>

        <div className="flex h-11 items-center gap-2.5 rounded-[9px] px-1">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1e55e5] text-[9px] font-semibold text-white">
            {initials}
          </span>
          <span className="min-w-0 flex-1 truncate text-[12px] font-medium">
            {name.split(/\s+/)[0]}
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-[#9a9a9a]" />
        </div>

      </div>
    </aside>
  )
}

export default HomeSidebar
