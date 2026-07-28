import { ArrowRight, Minus, Trophy, TrendingDown, TrendingUp } from 'lucide-react'
import ModalShell from '@/components/common/ModalShell.jsx'
import BattleRankBadge from './BattleRankBadge.jsx'

function BattleResultModal({ battle, rank, onNext, onLobby }) {
  const won = battle.result === 'WIN'
  const draw = battle.result === 'DRAW'
  const Icon = draw ? Minus : won ? TrendingUp : TrendingDown

  return (
    <ModalShell
      labelledBy="battle-result-title"
      describedBy="battle-result-message"
      dismissible={false}
    >
      <div className="flex h-full flex-col px-7 pb-7 pt-6">
        <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
          won
            ? 'bg-[#fff4dd] text-[#ce8417]'
            : draw
              ? 'bg-[#f1f3f5] text-[#68707c]'
              : 'bg-[#fff1ee] text-[#b85549]'
        }`}>
          {won ? (
            <Trophy className="h-6 w-6" strokeWidth={1.7} />
          ) : (
            <Icon className="h-6 w-6" strokeWidth={1.7} />
          )}
        </span>
        <h2 id="battle-result-title" className="mt-4 text-[23px] font-semibold">
          {won ? 'Victory' : draw ? 'Draw' : 'Battle complete'}
        </h2>
        <p id="battle-result-message" className="mt-1 text-[9px] text-[#747b86]">
          {won
            ? `You defeated ${battle.opponentName}.`
            : draw
              ? `You matched ${battle.opponentName}.`
              : `${battle.opponentName} won this round.`}
          {' '}Final score: {Math.max(0, Math.floor(battle.playerScore / 10))}
          -{Math.floor(battle.opponentScore / 10)}.
        </p>

        <div className="mt-4 grid grid-cols-[1fr_auto] items-center rounded-[7px] border border-[#e4e6e9] bg-[#fafbfc] px-4 py-3 text-left">
          <div>
            <p className="text-[7px] uppercase text-[#8a9099]">ELO rating</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[20px] font-semibold tabular-nums">
                {battle.ratingAfter?.toLocaleString()}
              </span>
              <span className={`text-[10px] font-semibold ${
                battle.ratingChange > 0
                  ? 'text-[#278657]'
                  : battle.ratingChange < 0
                    ? 'text-[#bd5548]'
                    : 'text-[#747b86]'
              }`}>
                {battle.ratingChange > 0 ? '+' : ''}
                {battle.ratingChange}
              </span>
            </div>
          </div>
          <BattleRankBadge rank={rank} />
        </div>

        <div className="mt-auto grid gap-2">
          <button
            type="button"
            onClick={onNext}
            className="flex h-10 items-center justify-center gap-2 rounded-[7px] bg-[#e8a33d] text-[10px] font-semibold text-white hover:bg-[#d8922e]"
          >
            Next opponent
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onLobby}
            className="h-10 rounded-[7px] border border-[#dfe2e6] text-[10px] font-semibold text-[#59616d] hover:bg-[#f7f8f9]"
          >
            Back to Battle Space
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

export default BattleResultModal
