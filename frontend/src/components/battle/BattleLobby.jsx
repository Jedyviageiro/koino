import {
  ArrowRight,
  CircleHelp,
  Crown,
  Flame,
  ShieldCheck,
  Swords,
  Timer,
  Trophy,
  Zap,
} from 'lucide-react'
import battleHero from '@/assets/images/battle-space-hero.png'
import BattleRail from './BattleRail.jsx'

const modeIcons = {
  LIGHTNING: Zap,
  RAPID: Flame,
  CLASSICAL: Crown,
}

const modeDescriptions = {
  LIGHTNING: 'Fast decisions and sharp recall.',
  RAPID: 'A balanced test of speed and depth.',
  CLASSICAL: 'The deepest test with the hardest finish.',
}

function BattleLobby({ lobby, selectedMode, onSelectMode, onStart, onHelp }) {
  const mode =
    lobby.modes.find((item) => item.mode === selectedMode) || lobby.modes[0]

  return (
    <div className="mx-auto max-w-[1100px]">
      <header className="mb-5 flex items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[30px] font-semibold leading-tight">
              Battle Space
            </h1>
            <span className="rounded-[4px] bg-[#fff2d8] px-2 py-1 text-[8px] font-bold uppercase text-[#9a671d]">
              Beta
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-[#69717f]">
            Compete in timed Bible knowledge battles.
          </p>
        </div>
        <button
          type="button"
          onClick={onHelp}
          className="flex h-9 items-center gap-2 rounded-[7px] border border-[#e2c28e] px-3 text-[9px] font-semibold text-[#8c5e1a] hover:bg-[#fff9ef]"
        >
          <CircleHelp className="h-3.5 w-3.5" />
          How it works
        </button>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,720px)_minmax(260px,300px)]">
        <div className="space-y-5">
          <section className="relative h-[270px] overflow-hidden rounded-[8px] border border-[#e5e2dc] bg-[#faf9f6]">
            <img
              src={battleHero}
              alt="An open Bible with a golden sword of light"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.93)_39%,rgba(255,255,255,0.12)_72%)]" />
            <div className="relative flex h-full max-w-[355px] flex-col justify-center px-7">
              <p className="text-[10px] font-semibold uppercase text-[#a66d19]">
                Rated Bible battles
              </p>
              <h2 className="mt-2 text-[27px] font-semibold leading-[1.16]">
                Test your knowledge.
                <br />
                Grow your faith.
              </h2>
              <div className="mt-5 grid gap-2 text-[9px] text-[#5f6672]">
                <Feature icon={Swords} text="One-on-one skill battles" />
                <Feature icon={ShieldCheck} text="Server-verified answers" />
                <Feature icon={Trophy} text="Six progressive ELO ranks" />
              </div>
              <button
                type="button"
                onClick={() => onStart(mode.mode)}
                className="mt-5 flex h-10 w-[180px] items-center justify-center gap-2 rounded-[7px] bg-[#e8a33d] text-[10px] font-semibold text-white hover:bg-[#d8922e]"
              >
                Find an opponent
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h2 className="font-sans text-[13px] font-semibold">
                  Choose a battle mode
                </h2>
                <p className="mt-1 text-[9px] text-[#7a818d]">
                  Every battle is rated. Choose your pace.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {lobby.modes.map((item) => {
                const Icon = modeIcons[item.mode]
                const active = item.mode === selectedMode
                return (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => onSelectMode(item.mode)}
                    className={`min-h-[150px] rounded-[8px] border p-5 text-left transition-colors ${
                      active
                        ? 'border-[#dfa03f] bg-[#fffbf4]'
                        : 'border-[#e2e5e9] bg-white hover:border-[#d6b681]'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        active ? 'text-[#d58c20]' : 'text-[#626a77]'
                      }`}
                      strokeWidth={1.7}
                    />
                    <p className="mt-4 text-[11px] font-semibold">
                      {item.name}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[8px] text-[#777e8a]">
                      <span>Answer as many as you can</span>
                      <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-current" />
                      <span className="flex items-center gap-1">
                        <Timer className="h-2.5 w-2.5" />
                        {item.durationSeconds}s
                      </span>
                    </div>
                    <p className="mt-2 text-[8px] leading-4 text-[#858b95]">
                      {modeDescriptions[item.mode]}
                    </p>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="flex items-center justify-between gap-5 rounded-[8px] border border-[#e2e5e9] bg-white px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff6e6] text-[#c98218]">
                <Trophy className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[10px] font-semibold">
                  Win battles to earn ELO
                </p>
                <p className="mt-1 text-[8px] text-[#7a818d]">
                  Match difficulty rises with your rating.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onHelp}
              className="text-[9px] font-semibold text-[#a66d19]"
            >
              Rating guide
            </button>
          </section>
        </div>

        <BattleRail lobby={lobby} />
      </div>
    </div>
  )
}

function Feature({ icon: Icon, text }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-white/90 text-[#bd7914] shadow-[0_1px_5px_rgba(45,36,22,0.08)]">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
      </span>
      {text}
    </span>
  )
}

export default BattleLobby
