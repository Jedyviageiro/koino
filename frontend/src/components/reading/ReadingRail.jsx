import { Clock3, Quote, TrendingUp } from 'lucide-react'

function ReadingRail({ plan, task, currentVerse }) {
  const percentage = Math.round(plan.completionPercentage || 0)
  const circumference = 2 * Math.PI * 42
  const offset = circumference * (1 - percentage / 100)

  return (
    <aside className="flex flex-col gap-5">
      <section className="rounded-[8px] border border-[#e1e4e9] bg-white p-5">
        <h2 className="flex items-center gap-2 text-[12px] font-semibold">
          <TrendingUp className="h-4 w-4" />
          Today&apos;s Progress
        </h2>
        <div className="relative mx-auto mt-5 h-[132px] w-[132px]">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#fbf0df" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#e8a33d"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <strong className="text-[25px] font-semibold leading-none">{plan.completedDays}</strong>
            <span className="mt-1 text-[11px]">/ {plan.totalDays} days</span>
          </div>
        </div>
        <p className="mt-3 text-center text-[13px] text-[#59647a]">{percentage}% completed</p>
      </section>

      <section className="rounded-[8px] border border-[#e1e4e9] bg-white p-5">
        <h2 className="text-[12px] font-semibold">Today&apos;s Focus</h2>
        <div className="mt-6 flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fbf4ea] text-[#b27413]">
            <Clock3 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[13px] font-semibold">{plan.estimatedMinutesPerDay} min allocated</p>
            <p className="mt-1 text-[12px] text-[#657087]">About {task.estimatedMinutes} min to read</p>
          </div>
        </div>
        <div className="mt-6 border-t border-[#ece7df] pt-5">
          <Quote className="h-5 w-5 fill-[#f1c47f] text-[#f1c47f]" />
          <p className="mt-3 line-clamp-5 text-[10px] leading-5 text-[#454b55]">
            {currentVerse?.text || 'Take a quiet moment with today’s passage.'}
          </p>
          {currentVerse && (
            <p className="mt-2 text-[9px] font-medium text-[#9a681c]">
              Verse {currentVerse.verseNumber}
            </p>
          )}
        </div>
      </section>
    </aside>
  )
}

export default ReadingRail
