import { BookOpen, CalendarDays, LockKeyhole } from 'lucide-react'
import planCover from '@/assets/images/plans-cover.png'

function formatDate(date) {
  if (!date) return null
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

function CurrentPlanCard({ plan, template, todayTask, onContinue }) {
  if (!plan || !template) {
    return (
      <section className="rounded-[8px] border border-[#dfe3e9] bg-white px-6 py-8">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-[#fbf4ea] text-[#b27413]">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-[16px] font-semibold">Your route is complete</h2>
            <p className="mt-1 text-[13px] text-[#667089]">
              You have completed every plan currently assigned to your journey.
            </p>
          </div>
        </div>
      </section>
    )
  }

  const percentage = Math.round(plan.completionPercentage)
  const available = Boolean(todayTask)
  const nextDate = formatDate(plan.nextReadingDate)

  return (
    <section className="grid gap-6 rounded-[8px] border border-[#dfe3e9] bg-white px-6 py-6 md:grid-cols-[minmax(0,1.05fr)_minmax(280px,1fr)_180px] md:items-center">
      <div className="flex min-w-0 gap-4 md:border-r md:border-[#e2e5ea] md:pr-7">
        <img
          src={planCover}
          alt=""
          className="h-[92px] w-[70px] shrink-0 rounded-[7px] object-cover"
        />
        <div className="min-w-0">
          <p className="text-[18px] font-semibold">{plan.name}</p>
          <p className="mt-1.5 text-[12px] font-medium text-[#b27413]">
            {template.bookNames}
          </p>
          <p className="mt-3 line-clamp-2 max-w-[360px] text-[12px] leading-5 text-[#667089]">
            {template.description}
          </p>
        </div>
      </div>

      <div>
        <p className="text-[12px] text-[#667089]">Progress</p>
        <p className="mt-1.5 text-[21px] font-semibold">
          {plan.completedDays}/{plan.totalDays} days
        </p>
        <div className="mt-4 flex items-center gap-4">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e8ebf0]">
            <div
              className="h-full rounded-full bg-[#e8a33d]"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="w-9 text-right text-[12px] text-[#59647a]">
            {percentage}%
          </span>
        </div>
      </div>

      <div className="flex flex-col items-stretch md:items-end">
        <button
          type="button"
          onClick={onContinue}
          disabled={!available}
          className={`flex h-11 w-full items-center justify-center gap-2 rounded-[8px] border text-[12px] font-semibold md:w-[160px] ${
            available
              ? 'border-[#e8a33d] bg-[#e8a33d] text-white hover:bg-[#d8922e]'
              : 'cursor-not-allowed border-[#dfe3e9] bg-[#f1f3f6] text-[#7a8394]'
          }`}
        >
          {available ? (
            <BookOpen className="h-4 w-4" />
          ) : (
            <LockKeyhole className="h-4 w-4" />
          )}
          {available ? 'Continue Plan' : 'Reading Locked'}
        </button>
        <p className="mt-2.5 flex items-center gap-1.5 text-[12px] text-[#667089]">
          <CalendarDays className="h-3.5 w-3.5" />
          {todayTask
            ? `Day ${todayTask.dayNumber} of ${plan.totalDays}`
            : nextDate
              ? `Next reading ${nextDate}`
              : `${plan.completedDays} days completed`}
        </p>
      </div>
    </section>
  )
}

export default CurrentPlanCard
