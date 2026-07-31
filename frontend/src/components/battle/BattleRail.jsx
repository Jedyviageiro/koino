import { Trophy } from 'lucide-react'
import BattleRankBadge from './BattleRankBadge.jsx'

function PlayerAvatar({ entry }) {
  const initials = entry.fullname
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return entry.profilePictureUrl ? (
    <img
      src={entry.profilePictureUrl}
      alt=""
      referrerPolicy="no-referrer"
      className="h-7 w-7 rounded-full object-cover"
    />
  ) : (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f3ede3] text-[8px] font-semibold text-[#75572f]">
      {initials}
    </span>
  )
}

function BattleRail({ lobby, selectedMode, onOpenProfile }) {
  const { profile } = lobby
  const rating =
    profile.ratings.find((item) => item.mode === selectedMode) ||
    profile.ratings[0]
  const leaderboard = lobby.leaderboards?.[selectedMode] || []

  return (
    <aside className="space-y-4">
      <section className="rounded-[8px] border border-[#e3e5e8] bg-white p-5">
        <p className="text-[10px] font-semibold text-[#606774]">
          {rating.modeName} rating
        </p>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-[29px] font-semibold leading-none tabular-nums">
              {rating.elo.toLocaleString()}
            </p>
            <div className="mt-2">
              <BattleRankBadge rank={rating.rank} />
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff7e9] text-[#d58c20]">
            <Trophy className="h-5 w-5" strokeWidth={1.6} />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 border-t border-[#eceef1] pt-4 text-center">
          <Stat label="Battles" value={rating.battles} />
          <Stat label="Win rate" value={`${rating.winRate}%`} bordered />
          <Stat label="Streak" value={rating.winStreak} />
        </div>
      </section>

      <section className="rounded-[8px] border border-[#e3e5e8] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-sans text-[11px] font-semibold">Leaderboard</h2>
          <span className="text-[9px] text-[#858b95]">
            {rating.modeName}
          </span>
        </div>
        <div className="mt-4 space-y-2">
          {leaderboard.slice(0, 6).map((entry) => (
            <button
              type="button"
              key={`${entry.position}-${entry.userId}`}
              onClick={() => onOpenProfile(entry.userId)}
              className={`grid grid-cols-[18px_28px_minmax(0,1fr)_auto] items-center gap-2 rounded-[6px] px-2 py-1.5 ${
                entry.currentUser
                  ? 'bg-[#fff7ea]'
                  : 'hover:bg-[#f7f8f9]'
              }`}
            >
              <span className="text-[9px] font-semibold text-[#737986]">
                {entry.position}
              </span>
              <PlayerAvatar entry={entry} />
              <div className="min-w-0">
                <p className="truncate text-[9px] font-semibold">
                  {entry.fullname}
                  {entry.currentUser ? ' (You)' : ''}
                </p>
                <BattleRankBadge rank={entry.rank} compact />
              </div>
              <span className="text-[9px] font-semibold tabular-nums text-[#6a707b]">
                {entry.elo.toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </section>
    </aside>
  )
}

function Stat({ label, value, bordered = false }) {
  return (
    <div className={bordered ? 'border-x border-[#eceef1]' : ''}>
      <p className="text-[7px] uppercase text-[#8a909a]">{label}</p>
      <p className="mt-1 text-[11px] font-semibold tabular-nums">{value}</p>
    </div>
  )
}

export default BattleRail
