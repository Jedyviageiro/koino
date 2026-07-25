import {
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
} from 'lucide-react'

function getReadingTitle(task) {
  const passage = task?.passages?.[0]
  if (!passage) return task?.readingAssignment || 'Today’s reading'
  const end =
    passage.firstVerse === passage.lastVerse
      ? ''
      : `-${passage.lastVerse}`
  return `${passage.bookTitle} ${passage.chapterNumber}:${passage.firstVerse}${end}`
}

function getVerseCount(task) {
  return (task?.passages || []).reduce(
    (total, passage) =>
      total + Math.max(1, passage.lastVerse - passage.firstVerse + 1),
    0,
  )
}

function TodayPlanCard({ plan, task, onStartReading }) {
  const percentage = Math.round(plan?.completionPercentage || 0)
  const circumference = 2 * Math.PI * 42
  const offset = circumference * (1 - percentage / 100)
  const verseCount = getVerseCount(task)

  if (!plan) {
    return (
      <section className="rounded-[15px] border border-[#e4e4e2] bg-white px-8 py-16 text-center">
        <BookOpen className="mx-auto h-8 w-8 text-[#a66b0b]" strokeWidth={1.5} />
        <h2 className="mt-5 text-[24px] font-semibold">
          Your first plan is being prepared
        </h2>
        <p className="mx-auto mt-2 max-w-[380px] text-[14px] text-[#626b84]">
          Your daily reading and progress will appear here shortly.
        </p>
      </section>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="min-h-[245px] rounded-[12px] border border-[#e4e4e2] bg-white px-6 py-5">
        <div className="flex items-start gap-4 sm:gap-[27px]">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[linear-gradient(135deg,#fbf2e4,#fdf8f1)] text-[#9b650c]">
            <BookOpen className="h-6 w-6" strokeWidth={1.35} />
          </span>
          <div className="min-w-0 flex-1 pt-1">
            <h2 className="text-[16px] font-bold leading-none">Today&apos;s Plan</h2>
            <p className="mt-2 text-[13px] text-[#626b84]">
              Day {task?.dayNumber || plan.completedDays + 1} of {plan.totalDays}
              <span className="px-2">•</span>
              {plan.name}
            </p>
          </div>
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[9px] border border-[#e4e5e7] bg-white hover:bg-[#f8f8f8] sm:w-[116px] sm:gap-2"
          >
            <CalendarDays className="h-4 w-4" strokeWidth={1.8} />
            <span className="hidden text-[12px] sm:inline">View Plan</span>
          </button>
        </div>

        <div className="mt-7 flex items-center gap-4 sm:gap-6">
          <div className="relative h-[92px] w-[92px] shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#eee0cc" strokeWidth="9" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#e8a33d"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <strong className="text-[21px] font-semibold leading-none">{plan.completedDays}</strong>
              <span className="mt-1 text-[11px] text-[#646d85]">/{plan.totalDays}</span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-[#545d75]">Progress</p>
            <p className="mt-2.5 text-[20px] font-bold leading-none">
              {plan.completedDays}/{plan.totalDays} days
            </p>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#ecedef]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#ffb53d,#f4ac36)]"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
          <span className="hidden self-end pb-1 text-[13px] text-[#59637c] sm:block">
            {percentage}%
          </span>
        </div>
      </section>

      <section className="min-h-[170px] rounded-[12px] border border-[#e4e4e2] bg-[linear-gradient(105deg,#fff,#fefdfd)] px-6 py-5">
        <span className="inline-flex rounded-[8px] bg-[#fbf4ea] px-[13px] py-2 text-[13px] text-[#84560d]">
          Today&apos;s Reading
        </span>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h3 className="text-[24px] font-semibold leading-tight">
              {getReadingTitle(task)}
            </h3>
            <p className="mt-1 text-[14px] text-[#353b4a]">
              {task?.readingAssignment || 'Continue your plan'}
            </p>
            <div className="mt-4 flex flex-wrap gap-3 sm:gap-[17px]">
              <span className="flex h-[39px] items-center gap-2 rounded-[8px] bg-[#faf8f6] px-3.5 text-[13px] sm:text-[14px]">
                <Clock3 className="h-[19px] w-[19px]" />
                {task?.estimatedMinutes || plan.estimatedMinutesPerDay} min read
              </span>
              {verseCount > 0 && (
                <span className="flex h-[39px] items-center gap-2 rounded-[8px] bg-[#faf8f6] px-3.5 text-[13px] sm:text-[14px]">
                  <BookOpen className="h-[19px] w-[19px]" />
                  {verseCount} verses
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="h-6 w-6 shrink-0 text-[#17191d]" />
        </div>
      </section>

      <button
        type="button"
        onClick={onStartReading}
        disabled={!task || task.completed}
        className="flex h-14 w-full items-center justify-center gap-3 rounded-[10px] bg-[#1e55e5] text-[15px] font-semibold text-white transition-colors hover:bg-[#194acb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e55e5] focus-visible:ring-offset-2 active:bg-[#1742b7] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {task?.completed ? (
          <>
            <Check className="h-6 w-6" />
            Reading Completed
          </>
        ) : (
          <>
            <BookOpen className="h-5 w-5" strokeWidth={1.8} />
            {task?.currentVerseIndex > 1 ? 'Continue Reading' : 'Start Reading'}
          </>
        )}
      </button>

      <div className="flex min-h-[84px] items-start gap-5 rounded-[10px] bg-[linear-gradient(105deg,#f4f6fc,#f2f5fb)] px-6 py-5">
        <Clock3 className="h-5 w-5 shrink-0 text-[#101318]" strokeWidth={1.8} />
        <div>
          <p className="text-[14px] font-bold">
            You have {plan.estimatedMinutesPerDay} minutes allocated.
          </p>
          <p className="mt-1.5 text-[14px] text-[#667089]">
            This reading takes about {task?.estimatedMinutes || 10} minutes—plenty
            of time to reflect afterward.
          </p>
        </div>
      </div>
    </div>
  )
}

export default TodayPlanCard
