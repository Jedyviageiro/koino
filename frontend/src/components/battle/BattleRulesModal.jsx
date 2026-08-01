import { Swords } from 'lucide-react'
import ModalShell from '@/components/common/ModalShell.jsx'
import { useTranslation } from 'react-i18next'

const ratings = [
  ['200-699', 'Novice'],
  ['700-1,199', 'Disciple'],
  ['1,200-1,699', 'Scribe'],
  ['1,700-2,199', 'Master'],
  ['2,200-2,599', 'Grandmaster'],
  ['2,600+', 'Super Grandmaster'],
]

function BattleRulesModal({ onClose }) {
  const { t } = useTranslation()
  return (
    <ModalShell
      labelledBy="battle-rules-title"
      describedBy="battle-rules-message"
      onClose={onClose}
    >
      <div className="flex h-full flex-col px-7 pb-7 pt-6 text-left">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff5e4] text-[#ce8417]">
          <Swords className="h-4 w-4" />
        </span>
        <h2 id="battle-rules-title" className="mt-3 text-[20px] font-semibold">
          {t('battleRules.title')}
        </h2>
        <p
          id="battle-rules-message"
          className="mt-1 text-[8px] leading-4 text-[#747b86]"
        >
          {t('battleRules.message')}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-1.5">
          {ratings.map(([range, rank]) => (
            <div
              key={rank}
              className="flex items-center justify-between border-b border-[#eceef1] pb-1.5"
            >
              <span className="text-[7px] tabular-nums text-[#858b95]">
                {range}
              </span>
              <span className="text-[8px] font-semibold">
                {t(`battleRules.ranks.${rank}`)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-[6px] bg-[#fff8ed] px-3 py-2 text-[8px] leading-4 text-[#765522]">
          {t('battleRules.timings')}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-auto h-10 rounded-[7px] bg-[#e8a33d] text-[10px] font-semibold text-white hover:bg-[#d8922e]"
        >
          {t('battleRules.understood')}
        </button>
      </div>
    </ModalShell>
  )
}

export default BattleRulesModal
