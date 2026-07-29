import { Check, LockKeyhole } from 'lucide-react'
import planCover from '@/assets/images/plans-cover.png'

function PlanRouteItem({ template, existingPlan, dependencyName }) {
  const completed = Boolean(existingPlan?.completed)

  return (
    <article className="grid min-h-[78px] gap-4 rounded-[8px] border border-[#dfe3e9] bg-white px-5 py-4 sm:grid-cols-[minmax(0,1fr)_230px] sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={planCover}
          alt=""
          className="h-12 w-9 shrink-0 rounded-[5px] object-cover"
        />
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold">{template.name}</h3>
          <p className="mt-1 truncate text-[12px] text-[#667089]">
            {template.description}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-[12px] text-[#667089] sm:justify-start">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            completed
              ? 'bg-[#fbf4ea] text-[#b27413]'
              : 'bg-[#f1f3f6] text-[#59647a]'
          }`}
        >
          {completed ? (
            <Check className="h-[18px] w-[18px]" />
          ) : (
            <LockKeyhole className="h-[18px] w-[18px]" />
          )}
        </span>
        <span className="leading-5">
          {completed ? (
            <>
              Completed
              <br />
              {existingPlan.completedDays} of {existingPlan.totalDays} days
            </>
          ) : (
            <>
              Available after completing
              <br />
              <strong className="font-medium text-[#3e4758]">
                {dependencyName}
              </strong>
            </>
          )}
        </span>
      </div>
    </article>
  )
}

export default PlanRouteItem
