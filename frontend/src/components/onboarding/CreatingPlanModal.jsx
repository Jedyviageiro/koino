import ModalShell from '@/components/common/ModalShell.jsx'

function CreatingPlanModal({
  phase = 'creating',
  plan,
  reason,
  onContinue,
}) {
  const isReady = phase === 'ready'

  return (
    <ModalShell
      labelledBy="creating-plan-title"
      describedBy="creating-plan-message"
      dismissible={false}
    >
      {isReady ? (
        <div className="flex h-full flex-col px-7 pb-7 pt-6 text-left">
          <p className="text-[10px] font-semibold uppercase text-[#b27413]">
            Your first plan
          </p>
          <h2
            id="creating-plan-title"
            className="mt-1.5 text-[22px] font-semibold leading-tight text-[#17191c]"
          >
            {plan?.name || 'Your reading plan is ready'}
          </h2>
          <p
            id="creating-plan-message"
            className="mt-2 line-clamp-2 text-[11px] leading-[1.65] text-[#747880]"
          >
            {plan?.description ||
              'Your first progressive reading plan has been prepared.'}
          </p>

          <div className="mt-4 rounded-[8px] bg-[#fbf6ee] px-4 py-3">
            <p className="text-[10px] font-semibold uppercase text-[#9a6718]">
              Why this plan
            </p>
            <p className="mt-1 text-[11px] leading-[1.55] text-[#56524b]">
              {reason}
            </p>
          </div>

          <p className="mt-3 text-[11px] text-[#747880]">
            {plan?.estimatedMinutesPerDay || 10} min per reading
            <span className="px-2 text-[#c4b8a4]">&bull;</span>
            {plan?.totalDays || 1} reading days
          </p>

          <button
            type="button"
            onClick={onContinue}
            className="mt-auto h-11 w-full rounded-[11px] bg-[#e8a33d] text-[12px] font-semibold text-white transition-colors hover:bg-[#d8922e] active:bg-[#bf7416]"
          >
            Open My Plan
          </button>
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center px-8">
          <p className="text-[10px] font-semibold uppercase text-[#b27413]">
            Personalized for you
          </p>
          <h2
            id="creating-plan-title"
            className="mt-3 text-[22px] font-semibold text-[#17191c]"
          >
            Creating your reading plan
          </h2>
          <p
            id="creating-plan-message"
            className="mx-auto mt-2 max-w-[270px] text-[11px] leading-[1.65] text-[#747880]"
          >
            Matching your starting point, daily rhythm, and reading capacity.
          </p>

          <div
            className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-[#eee9e1]"
            role="progressbar"
            aria-label="Creating plan"
          >
            <span className="plan-processing-line block h-full w-2/5 rounded-full bg-[#e8a33d]" />
          </div>
          <p className="mt-3 text-[10px] text-[#96918a]">
            Preparing your first reading
          </p>
        </div>
      )}
    </ModalShell>
  )
}

export default CreatingPlanModal
