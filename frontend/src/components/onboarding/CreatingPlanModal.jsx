import { BookOpen, Pencil } from 'lucide-react'

function CreatingPlanModal({ phase = 'creating' }) {
  const isReady = phase === 'ready'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#10182a]/35 px-5 py-8 backdrop-blur-[5px] animate-[plan-backdrop-in_320ms_ease-out]"
      role="presentation"
    >
      <section
        className="plan-modal-shell relative w-full max-w-[390px] overflow-hidden bg-white text-center shadow-[0_30px_90px_rgba(11,20,40,0.25)]"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="creating-plan-title"
        aria-describedby="creating-plan-message"
      >
        <div className="plan-modal-content px-9 pb-10 pt-11">
          <p className="text-[10px] font-semibold uppercase text-[#1e55e5]">
            Personalized for you
          </p>
          <h2
            id="creating-plan-title"
            className="mx-auto mt-3 max-w-[290px] text-[23px] font-semibold leading-tight text-[#17191c]"
          >
            {isReady
              ? 'Your reading plan is ready.'
              : 'Creating your reading plan.'}
          </h2>
          <p
            id="creating-plan-message"
            className="mx-auto mt-2 max-w-[280px] text-[12px] leading-5 text-[#7a8089]"
            aria-live="polite"
          >
            {isReady
              ? 'Your first progressive plan has been prepared around your rhythm and goals.'
              : 'Koino is arranging your first readings around the pace and starting point you chose.'}
          </p>

          <div
            className="relative mx-auto mt-9 flex h-36 w-36 items-center justify-center"
            aria-hidden="true"
          >
            <span className="plan-orbit absolute inset-0 rounded-full border border-[#dce5ff]" />
            <span className="absolute inset-4 rounded-full bg-[#f2f6ff]" />
            <span className="absolute inset-8 rounded-[18px] border border-[#d5e0ff] bg-white shadow-[0_12px_30px_rgba(30,85,229,0.10)]" />
            <BookOpen
              className="plan-book relative h-12 w-12 text-[#1e55e5]"
              strokeWidth={1.55}
            />
            <Pencil
              className="plan-pencil absolute h-7 w-7 text-[#1e55e5]"
              strokeWidth={1.8}
            />
            <span className="plan-spark plan-spark-one absolute h-1.5 w-1.5 rounded-full bg-[#1e55e5]" />
            <span className="plan-spark plan-spark-two absolute h-1 w-1 rounded-full bg-[#79a0ff]" />
            <span className="plan-spark plan-spark-three absolute h-1 w-1 rounded-full bg-[#1e55e5]" />
          </div>

          <div className="mt-8 flex items-center justify-center gap-1.5" aria-hidden="true">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className={`h-1.5 w-1.5 rounded-full ${
                  isReady
                    ? 'bg-[#1e55e5]'
                    : 'animate-[plan-dot_1.2s_ease-in-out_infinite] bg-[#9eb7f8]'
                }`}
                style={{ animationDelay: `${dot * 160}ms` }}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default CreatingPlanModal
