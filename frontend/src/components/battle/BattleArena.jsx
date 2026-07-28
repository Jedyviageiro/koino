import { useEffect, useRef, useState } from 'react'
import {
  BookOpen,
  Check,
  Flame,
  LogOut,
  Swords,
  Trophy,
  X,
  Zap,
} from 'lucide-react'
import { playBattleSound } from '@/features/battle/battleAudio.js'

function BattleArena({
  battle,
  user,
  answering,
  feedback,
  onAnswer,
  onLeave,
  onTimeUp,
}) {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    remainingSeconds(battle.expiresAt),
  )
  const timeUpCalled = useRef(false)
  const lastWarningSecond = useRef(null)

  useEffect(() => {
    timeUpCalled.current = false
    const timer = window.setInterval(() => {
      const next = remainingSeconds(battle.expiresAt)
      setSecondsLeft(next)
      if (
        next > 0 &&
        next <= 10 &&
        lastWarningSecond.current !== next
      ) {
        lastWarningSecond.current = next
        playBattleSound('warning')
      }
      if (next === 0 && !timeUpCalled.current) {
        timeUpCalled.current = true
        onTimeUp()
      }
    }, 250)
    return () => window.clearInterval(timer)
  }, [battle.battleId, battle.expiresAt, onTimeUp])

  const timerProgress = Math.max(
    0,
    (secondsLeft / battle.durationSeconds) * 100,
  )
  const timeCritical = secondsLeft <= 10
  const question = battle.currentQuestion
  const initials = (user?.fullname || 'You')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  const opponentInitials = battle.opponentName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  const playerCorrect = Math.floor(battle.playerScore / 10)
  const opponentCorrect = Math.floor(battle.opponentScore / 10)

  return (
    <div className="mx-auto max-w-[1040px]">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff5e3] text-[#d58c20]">
            <Zap className="h-4 w-4" />
          </span>
          <div>
            <h1 className="font-sans text-[12px] font-semibold">
              Battle in progress
            </h1>
            <p className="mt-1 text-[8px] text-[#7b828e]">
              {battle.modeName} · 1v1
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLeave}
          className="flex h-9 items-center gap-2 rounded-[7px] border border-[#e6c9c9] px-3 text-[9px] font-semibold text-[#b94a4a] hover:bg-[#fff8f8]"
        >
          <LogOut className="h-3.5 w-3.5" />
          Leave battle
        </button>
      </header>

      <div className="mt-5 grid items-start gap-4 xl:grid-cols-[minmax(0,750px)_minmax(240px,276px)]">
        <div className="space-y-4">
          <section className="grid min-h-[112px] grid-cols-[1fr_116px_1fr] items-center rounded-[8px] border border-[#e2e5e9] bg-white px-6">
            <Player
              name={user?.fullname || 'You'}
              elo={battle.ratingBefore || user?.elo}
              image={user?.profilePictureUrl}
              initials={initials}
              score={playerCorrect}
              align="left"
            />
            <div className="text-center">
              <div
                className="mx-auto flex h-[78px] w-[78px] items-center justify-center rounded-full p-[5px]"
                style={{
                  background: `conic-gradient(${
                    timeCritical ? '#d94f4f' : '#e8a33d'
                  } ${timerProgress}%, #edf0f3 ${timerProgress}% 100%)`,
                }}
              >
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white">
                  <span
                    className={`font-mono text-[18px] font-semibold tabular-nums ${
                      timeCritical ? 'text-[#c93e3e]' : ''
                    }`}
                  >
                    {formatTime(secondsLeft)}
                  </span>
                  <span className="mt-0.5 text-[7px] text-[#8a9099]">
                    Time left
                  </span>
                </div>
              </div>
            </div>
            <Player
              name={battle.opponentName}
              elo={battle.opponentElo}
              initials={opponentInitials}
              score={opponentCorrect}
              align="right"
            />
          </section>

          <section className="min-h-[360px] rounded-[8px] border border-[#e2e5e9] bg-white p-6">
            <div className="flex items-center justify-between">
              <p className="text-[9px] text-[#6f7682]">
                Question {question?.number}
              </p>
              <span className="rounded-[5px] border border-[#ead3ac] bg-[#fffbf5] px-2 py-1 text-[8px] font-semibold text-[#9a671d]">
                10 pts
              </span>
            </div>
            <h2 className="mt-5 max-w-[650px] text-[22px] font-semibold leading-[1.35]">
              {question?.prompt}
            </h2>
            <div className="mt-6 grid gap-2.5">
              {question?.options.map((option, index) => (
                <AnswerButton
                  key={`${question.questionId}-${index}`}
                  index={index}
                  option={option}
                  feedback={feedback}
                  disabled={answering || Boolean(feedback)}
                  onClick={() => onAnswer(index)}
                />
              ))}
            </div>
            <div className="mt-4 min-h-[42px]" aria-live="polite">
              {feedback && (
                <div className={`flex items-start gap-2 rounded-[6px] px-3 py-2 text-[8px] leading-4 ${
                  feedback.correct
                    ? 'bg-[#f2faf5] text-[#276744]'
                    : 'bg-[#fff6f3] text-[#9d4b3f]'
                }`}>
                  {feedback.correct ? (
                    <Check className="mt-0.5 h-3 w-3 shrink-0" />
                  ) : (
                    <X className="mt-0.5 h-3 w-3 shrink-0" />
                  )}
                  <span>
                    {feedback.explanation}{' '}
                    <strong>{feedback.reference}</strong>
                  </span>
                </div>
              )}
            </div>
          </section>

          <div className="flex min-h-[54px] items-center gap-4 rounded-[8px] border border-[#e2e5e9] bg-white px-5 py-4">
            <span className="text-[8px] font-semibold text-[#68707d]">
              Keep going until time expires
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#edf0f2]">
              <span className="plan-processing-line block h-full rounded-full bg-[#e8a33d]" />
            </div>
            <span className="text-[8px] font-semibold tabular-nums text-[#8b672e]">
              {playerCorrect} correct
            </span>
          </div>
        </div>

        <BattleLiveRail
          battle={battle}
          playerCorrect={playerCorrect}
          opponentCorrect={opponentCorrect}
          feedback={feedback}
        />
      </div>
    </div>
  )
}

function AnswerButton({ index, option, feedback, disabled, onClick }) {
  const selected = feedback?.selectedOption === index
  const correctAnswer = feedback && feedback.correctOption === index
  const incorrectSelected = selected && !feedback.correct
  let style = 'border-[#e2e5e9] bg-[#fafbfc] hover:border-[#dab276]'
  if (correctAnswer) style = 'border-[#73bd8f] bg-[#f1faf4]'
  if (incorrectSelected) style = 'border-[#df8d82] bg-[#fff4f1]'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`grid min-h-[48px] grid-cols-[28px_minmax(0,1fr)_20px] items-center gap-2 rounded-[7px] border px-3 text-left transition-colors disabled:cursor-default ${style}`}
    >
      <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[9px] font-semibold ${
        correctAnswer
          ? 'border-[#55a874] bg-[#55a874] text-white'
          : incorrectSelected
            ? 'border-[#d96d5e] bg-[#d96d5e] text-white'
            : 'border-[#d9dde2] bg-white text-[#606773]'
      }`}>
        {String.fromCharCode(65 + index)}
      </span>
      <span className="text-[10px] font-medium">{option}</span>
      {correctAnswer && <Check className="h-3.5 w-3.5 text-[#3e8f5d]" />}
      {incorrectSelected && <X className="h-3.5 w-3.5 text-[#c7584a]" />}
    </button>
  )
}

function Player({ name, elo, image, initials, score, align }) {
  const right = align === 'right'
  return (
    <div className={`flex items-center gap-3 ${right ? 'justify-end text-right' : ''}`}>
      {!right && <Avatar image={image} initials={initials} />}
      <div className="min-w-0">
        <p className="truncate text-[10px] font-semibold">{name}</p>
        <p className="mt-1 text-[8px] text-[#818792]">ELO {elo || 200}</p>
      </div>
      <span className={`text-[27px] font-semibold tabular-nums ${
        right ? 'order-first' : ''
      }`}>
        {score}
      </span>
      {right && <Avatar image={image} initials={initials} />}
    </div>
  )
}

function Avatar({ image, initials }) {
  return image ? (
    <img
      src={image}
      alt=""
      referrerPolicy="no-referrer"
      className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-[#e8a33d] ring-offset-2"
    />
  ) : (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f0ece5] text-[9px] font-semibold text-[#6f5735] ring-2 ring-[#e8a33d] ring-offset-2">
      {initials}
    </span>
  )
}

function BattleLiveRail({ battle, playerCorrect, opponentCorrect, feedback }) {
  const leader =
    playerCorrect === opponentCorrect
      ? 'Battle tied'
      : playerCorrect > opponentCorrect
        ? 'You are leading'
        : `${battle.opponentName} leads`

  return (
    <aside className="space-y-4">
      <section className="rounded-[8px] border border-[#e2e5e9] bg-white p-5">
        <div className="flex items-center gap-2">
          <Swords className="h-3.5 w-3.5 text-[#c98218]" />
          <h2 className="font-sans text-[10px] font-semibold">Live progress</h2>
        </div>
        <p className="mt-5 text-[18px] font-semibold">{leader}</p>
        <p className="mt-1 text-[8px] text-[#7b828d]">
          Correct answers: {playerCorrect}–{opponentCorrect}
        </p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#eceff2]">
          <span
            className="block h-full rounded-full bg-[#e8a33d] transition-[width] duration-300"
            style={{
              width: `${Math.max(
                4,
                (playerCorrect /
                  Math.max(1, playerCorrect + opponentCorrect)) *
                  100,
              )}%`,
            }}
          />
        </div>
      </section>

      <section className="rounded-[8px] border border-[#e2e5e9] bg-white p-5">
        <div className="flex items-center gap-2">
          <Trophy className="h-3.5 w-3.5 text-[#c98218]" />
          <h2 className="font-sans text-[10px] font-semibold">Rated match</h2>
        </div>
        <p className="mt-4 text-[9px] leading-5 text-[#6f7682]">
          Winning against a stronger opponent earns more ELO. Rating never
          drops below 200.
        </p>
      </section>

      <section className="rounded-[8px] border border-[#e2e5e9] bg-white p-5">
        <div className="flex items-center gap-2">
          <Flame className="h-3.5 w-3.5 text-[#c98218]" />
          <h2 className="font-sans text-[10px] font-semibold">Battle focus</h2>
        </div>
        <p className="mt-4 min-h-[42px] text-[9px] leading-5 text-[#6f7682]">
          {feedback
            ? feedback.correct
              ? 'Correct. Keep your rhythm.'
              : 'Learn the reference and move forward.'
            : 'Read carefully, then answer decisively.'}
        </p>
      </section>

      <section className="rounded-[8px] border border-[#eadfce] bg-[#fffbf5] p-5">
        <BookOpen className="h-4 w-4 text-[#c98218]" />
        <p className="mt-3 text-[9px] italic leading-5 text-[#656d79]">
          “Your word is a lamp to my feet and a light to my path.”
        </p>
        <p className="mt-2 text-[8px] font-semibold text-[#a66d19]">
          Psalm 119:105
        </p>
      </section>
    </aside>
  )
}

function remainingSeconds(expiresAt) {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000))
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export default BattleArena
