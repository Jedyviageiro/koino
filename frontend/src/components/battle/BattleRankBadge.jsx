import {
  BookOpen,
  Crown,
  Diamond,
  Flame,
  Sprout,
  PenLine,
} from 'lucide-react'

const rankDetails = {
  Novice: { icon: Sprout, threshold: '200-699' },
  Disciple: { icon: BookOpen, threshold: '700-1,199' },
  Scribe: { icon: PenLine, threshold: '1,200-1,699' },
  Master: { icon: Crown, threshold: '1,700-2,199' },
  Grandmaster: { icon: Diamond, threshold: '2,200-2,599' },
  'Super Grandmaster': { icon: Flame, threshold: '2,600+' },
}

function BattleRankBadge({ rank, compact = false }) {
  const details = rankDetails[rank] || rankDetails.Novice
  const Icon = details.icon

  return (
    <span className="inline-flex items-center gap-1.5 text-[#9a671d]">
      <Icon className={compact ? 'h-3 w-3' : 'h-4 w-4'} strokeWidth={1.8} />
      <span className={compact ? 'text-[9px]' : 'text-[11px] font-semibold'}>
        {rank}
      </span>
    </span>
  )
}

export default BattleRankBadge
