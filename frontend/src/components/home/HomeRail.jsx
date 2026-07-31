import {
  Bookmark,
  BookOpen,
  Check,
  Flame,
  Search,
  SunMedium,
} from 'lucide-react'
import { SectionTitle } from '@/components/common/AppPageLayout.jsx'

const quickActions = [
  { label: 'Search Bible', icon: Search, path: '/bible' },
  { label: 'Browse Plans', icon: BookOpen, path: '/plans' },
  { label: 'My Bookmarks', icon: Bookmark, path: '/bookmarks' },
]

function HomeRail({ streak, bookmarkCount, verseOfDay, onNavigate }) {
  const currentStreak = streak?.currentStreak || 0
  const recentDays = streak?.recentDays || []
  const streakProgress = Math.min(currentStreak, 7) / 7

  return (
    <div className="flex flex-col gap-7">
      <section className="rounded-[12px] border border-[#e4e4e2] bg-white px-5 py-5">
        <p className="flex items-center gap-2 text-[10px] font-semibold text-[#252a32]">
          <SunMedium className="h-4 w-4 text-[#d89127]" strokeWidth={1.7} />
          Verse of the Day
        </p>
        <blockquote className="mt-3 text-[11px] font-medium leading-5 text-[#252a32]">
          &ldquo;{verseOfDay?.text || 'Be still, and know that I am God.'}&rdquo;
        </blockquote>
        <p className="mt-2 text-[9px] font-semibold text-[#b77718]">
          {verseOfDay?.reference || 'Psalm 46:10'}
        </p>
        <button
          type="button"
          onClick={() => onNavigate(verseLink(verseOfDay?.reference))}
          className="mt-3 inline-flex h-8 items-center gap-2 text-[9px] font-medium text-[#4f5764]"
        >
          View in Bible <span aria-hidden="true">&rarr;</span>
        </button>
      </section>

      <section className="self-start rounded-[12px] border border-[#e4e4e2] bg-white px-5 py-5">
        <SectionTitle>Quick Actions</SectionTitle>
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {quickActions.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => onNavigate(item.path)}
                className="relative flex h-[96px] min-w-0 flex-col items-center justify-center gap-3 rounded-[10px] border border-[#e7e8e9] bg-white px-1.5 text-center text-[10px] leading-4 text-[#303442] hover:border-[#d5d7da] hover:bg-[#fafafa]"
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

      <section className="rounded-[12px] border border-[#e4e4e2] bg-white px-5 py-5">
        <header className="flex items-center justify-between">
          <h2 className="text-[14px] font-bold">Your Streak</h2>
          <span className="text-[11px] text-[#7b8392]">Last 7 days</span>
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

function verseLink(reference) {
  const match = reference?.match(/^(.+?)\s+(\d+):(\d+)/)
  if (!match) return '/bible'
  const query = new URLSearchParams({
    book: match[1],
    chapter: match[2],
    verse: match[3],
  })
  return `/bible?${query}`
}

export default HomeRail
