import { useEffect, useState } from 'react'
import { BookOpen, Swords, Target, Zap } from 'lucide-react'

function BattleMatchmaking({ mode, onCancel }) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(
      () => setSeconds((current) => current + 1),
      1000,
    )
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="mx-auto max-w-[1100px]">
      <header>
        <div className="flex items-center gap-2.5">
          <h1 className="text-[28px] font-semibold">Battle Space</h1>
          <span className="rounded-[4px] bg-[#fff2d8] px-2 py-1 text-[8px] font-bold uppercase text-[#9a671d]">
            Beta
          </span>
        </div>
        <p className="mt-1.5 text-[10px] text-[#707784]">
          {mode.name} / 1v1 / {mode.durationSeconds} seconds
        </p>
      </header>

      <section className="mt-5 flex min-h-[440px] flex-col items-center justify-center rounded-[8px] border border-[#e2e5e9] bg-white px-6 text-center">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <span className="battle-search-ring absolute inset-0 rounded-full border border-[#e9d4b2]" />
          <span className="battle-search-ring absolute inset-5 rounded-full border border-[#efd9b6] [animation-delay:350ms]" />
          <span className="absolute inset-9 animate-spin rounded-full border-[5px] border-[#f5ead8] border-t-[#e8a33d]" />
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fff8ed] text-[#d58c20]">
            <Swords className="h-7 w-7" strokeWidth={1.7} />
          </span>
        </div>
        <h2 className="mt-6 text-[24px] font-semibold">
          Finding an opponent
        </h2>
        <p className="mt-2 max-w-[310px] text-[10px] leading-5 text-[#747b87]">
          Matching you with a similarly rated Bible challenger.
        </p>
        <p className="mt-5 font-mono text-[19px] font-semibold tabular-nums text-[#aa6e15]">
          00:{String(seconds).padStart(2, '0')}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-7 h-9 rounded-[7px] border border-[#dfe2e6] px-5 text-[9px] font-semibold text-[#59616d] hover:bg-[#f7f8f9]"
        >
          Cancel search
        </button>
      </section>

      <div className="mt-4 grid rounded-[8px] border border-[#e2e5e9] bg-white sm:grid-cols-3">
        <Tip
          icon={Zap}
          title="Be fast"
          text="Answer confidently before time runs out."
        />
        <Tip
          icon={Target}
          title="Be accurate"
          text="Correct answers earn battle points."
          bordered
        />
        <Tip
          icon={BookOpen}
          title="Grow wiser"
          text="Every result includes a Bible reference."
        />
      </div>
    </div>
  )
}

function Tip({ icon: Icon, title, text, bordered = false }) {
  return (
    <div
      className={`flex items-center gap-3 px-5 py-4 ${
        bordered ? 'sm:border-x sm:border-[#eceef1]' : ''
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff7e9] text-[#d58c20]">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[9px] font-semibold">{title}</p>
        <p className="mt-1 text-[8px] leading-4 text-[#818792]">{text}</p>
      </div>
    </div>
  )
}

export default BattleMatchmaking
