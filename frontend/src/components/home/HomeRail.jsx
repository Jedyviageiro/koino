import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  Flame,
  NotebookText,
  Search,
  Sparkles,
} from 'lucide-react'

const quickActions = [
  { label: 'Search Bible', icon: Search, path: '/bible' },
  { label: 'Browse Plans', icon: BookOpen, path: '/plans' },
  { label: 'My Bookmarks', icon: Bookmark, path: '/bible?bookmarks=1' },
  { label: 'Ask a Question', icon: NotebookText, path: '/community?compose=question' },
]

function HomeRail({ streak, bookmarkCount, onNavigate }) {
  const currentStreak = streak?.currentStreak || 0
  const recentDays = streak?.recentDays || []
  const streakProgress = Math.min(currentStreak, 7) / 7

  return (
    <div className="flex flex-col gap-7">
      <section className="flex min-h-[105px] items-center gap-4 rounded-[12px] border border-[#eee5db] bg-[linear-gradient(105deg,#fdf9f3,#fbf7f2)] px-5 py-5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#fcf3e5] text-[#a66b0b]">
          <Sparkles className="h-6 w-6" strokeWidth={1.45} />
        </span>
        <div>
          <h2 className="text-[14px] font-bold">Keep the habit.</h2>
          <p className="mt-1.5 text-[12px] text-[#69728a]">Small steps, deep roots.</p>
        </div>
      </section>

      <section className="min-h-[300px] rounded-[12px] border border-[#e4e4e2] bg-white px-5 py-5">
        <header className="flex items-center justify-between">
          <h2 className="text-[14px] font-bold">Quick Actions</h2>
          <button
            type="button"
            onClick={() => onNavigate('/plans')}
            className="flex items-center gap-2 text-[14px] text-[#69728a]"
          >
            Explore <ArrowRight className="h-[18px] w-[18px]" />
          </button>
        </header>
        <div className="mt-7 grid grid-cols-2 gap-4">
          {quickActions.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => onNavigate(item.path)}
                className="relative flex h-[96px] flex-col items-center justify-center gap-3 rounded-[10px] border border-[#e7e8e9] bg-white text-[12px] text-[#303442] hover:border-[#d5d7da] hover:bg-[#fafafa]"
              >
                <Icon className="h-6 w-6 text-[#07090c]" strokeWidth={1.55} />
                {item.label}
                {item.label === 'My Bookmarks' && bookmarkCount > 0 && (
                  <span className="absolute right-2.5 top-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f5ad39] px-1 text-[9px] font-bold text-white">
                    {bookmarkCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      <section className="min-h-[195px] rounded-[12px] border border-[#e4e4e2] bg-white px-5 py-5">
        <header className="flex items-center justify-between">
          <h2 className="text-[14px] font-bold">Your Streak</h2>
          <button type="button" className="text-[13px] text-[#677089]">View all</button>
        </header>
        <div className="mt-4 flex items-center gap-5">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full p-[5px]"
            style={{
              background: `conic-gradient(#f7b44d ${streakProgress * 360}deg, #fbf0e1 0deg)`,
            }}
            role="img"
            aria-label={`${currentStreak} of 7 streak days`}
          >
            <span className="flex h-full w-full items-center justify-center rounded-full bg-white">
              <Flame className="h-7 w-7 fill-[#ffb23b] text-[#ffb23b]" />
            </span>
          </span>
          <div>
            <p className="text-[25px] font-semibold leading-none">{currentStreak}</p>
            <p className="mt-2 text-[13px]">Days in a row</p>
          </div>
        </div>
        <div className="mt-4 flex justify-between">
          {recentDays.map((day) => {
            const date = new Date(`${day.date}T00:00:00`)
            const weekday = new Intl.DateTimeFormat('en', {
              weekday: 'narrow',
            }).format(date)
            return (
              <div
                key={day.date}
                className="flex flex-col items-center gap-2"
                title={date.toLocaleDateString()}
              >
                <span className="text-[11px] text-[#687188]">{weekday}</span>
                <span className={`flex h-[18px] w-[18px] items-center justify-center rounded-full ${day.active ? 'bg-[#171b23] text-white' : 'border border-[#dce0e6]'}`}>
                  {day.active && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                </span>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default HomeRail
