import novice from '@/assets/images/novice.svg'
import disciple from '@/assets/images/disciple.svg'
import scribe from '@/assets/images/scribe.svg'
import master from '@/assets/images/master.svg'
import grandmaster from '@/assets/images/grandmaster.svg'
import supergrandmaster from '@/assets/images/supergrandmaster.svg'

const rankDetails = {
  Novice: { image: novice, threshold: '200-699' },
  Disciple: { image: disciple, threshold: '700-1,199' },
  Scribe: { image: scribe, threshold: '1,200-1,699' },
  Master: { image: master, threshold: '1,700-2,199' },
  Grandmaster: { image: grandmaster, threshold: '2,200-2,599' },
  'Super Grandmaster': { image: supergrandmaster, threshold: '2,600+' },
}

function BattleRankBadge({ rank, compact = false }) {
  const details = rankDetails[rank] || rankDetails.Novice

  return (
    <span className="inline-flex items-center gap-1.5 text-[#9a671d]">
      <img
        src={details.image}
        alt=""
        className={compact ? 'h-4 w-4 object-contain' : 'h-6 w-6 object-contain'}
      />
      <span className={compact ? 'text-[9px]' : 'text-[11px] font-semibold'}>
        {rank}
      </span>
    </span>
  )
}

export default BattleRankBadge
