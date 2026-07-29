import { MapPin, Swords, Trophy } from 'lucide-react'
import BattleRankBadge from '@/components/battle/BattleRankBadge.jsx'
import planCover from '@/assets/images/plans-cover.png'

function ProfileStats({ profile }) {
  const peakElo = Math.max(
    200,
    ...(profile.battle?.ratings || []).map((rating) => rating.elo),
  )
  const stats = [
    [profile.postsCount, 'Posts'],
    [profile.friendsCount, 'Friends'],
    [peakElo, 'Peak ELO'],
    [`${profile.battle?.winRate || 0}%`, 'Win rate'],
  ]

  return (
    <div className="grid grid-cols-4 border-y border-[#e6e8eb]">
      {stats.map(([value, label]) => (
        <div
          key={label}
          className="border-r border-[#e6e8eb] px-2 py-4 text-center last:border-r-0 sm:py-5"
        >
          <p className="text-[14px] font-semibold text-[#16191e] sm:text-[16px]">
            {value}
          </p>
          <p className="mt-1 text-[8px] text-[#858d9a]">{label}</p>
        </div>
      ))}
    </div>
  )
}

function ProfilePlanCard({ plan, onViewPlan }) {
  return (
    <section className="h-full rounded-[8px] border border-[#e3e6ea] bg-white p-3.5">
      <h2 className="text-[10px] font-semibold text-[#22262d]">
        Current Reading Plan
      </h2>
      {plan ? (
        <>
          <div className="mt-3 flex min-w-0 gap-3">
            <img
              src={planCover}
              alt=""
              className="h-[82px] w-[62px] shrink-0 rounded-[6px] object-cover"
            />
            <div className="min-w-0 pt-1">
              <p className="line-clamp-2 text-[11px] font-semibold leading-4">
                {plan.name}
              </p>
              <p className="mt-1 text-[8px] text-[#7a8290]">
                {plan.durationDays} days
                <span className="px-1.5 text-[#d18b22]">&bull;</span>
                {plan.estimatedMinutesPerDay} min/day
              </p>
              <p className="mt-2 line-clamp-2 text-[8px] leading-4 text-[#747d8a]">
                {plan.description}
              </p>
            </div>
          </div>
          {onViewPlan && (
            <button
              type="button"
              onClick={onViewPlan}
              className="mt-3 h-9 w-full rounded-[6px] bg-[#fbf3e7] text-[8px] font-semibold text-[#9b681d] transition-colors hover:bg-[#f7ead6]"
            >
              View Plan
            </button>
          )}
        </>
      ) : (
        <p className="mt-4 text-[9px] leading-5 text-[#818995]">
          No active reading plan is shared right now.
        </p>
      )}
    </section>
  )
}

function ProfileBattleCard({ battle, canChallenge, onChallenge }) {
  const ratings = battle?.ratings || []
  return (
    <section className="h-full rounded-[8px] border border-[#e3e6ea] bg-white p-3.5">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-semibold text-[#22262d]">
          Battle Space
        </h2>
        <p className="text-[8px] text-[#858d9a]">
          {battle?.battles || 0} total
        </p>
      </div>
      <div className="mt-2 divide-y divide-[#eceef1]">
        {ratings.map((rating) => (
          <div
            key={rating.mode}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-2"
          >
            <div className="min-w-0">
              <p className="text-[8px] font-semibold text-[#555e6b]">
                {rating.modeName}
              </p>
              <div className="mt-0.5">
                <BattleRankBadge rank={rating.rank} compact />
              </div>
            </div>
            <div className="text-right">
              <p className="text-[12px] font-semibold tabular-nums">
                {rating.elo.toLocaleString()}
              </p>
              <p className="text-[7px] text-[#858d9a]">
                {rating.winRate}% wins
              </p>
            </div>
          </div>
        ))}
        {!ratings.length && (
          <div className="py-3">
            <BattleRankBadge rank="Novice" compact />
            <p className="mt-1 text-[8px] text-[#858d9a]">
              All modes begin at 200 ELO.
            </p>
          </div>
        )}
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-[8px] text-[#777f8c]">
        <Trophy className="h-3 w-3 text-[#d18b22]" />
        {battle?.wins || 0} wins across all time controls
      </p>
      {canChallenge && (
        <button
          type="button"
          onClick={onChallenge}
          className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-[6px] bg-[#15191f] text-[8px] font-semibold text-white transition-colors hover:bg-[#262b33]"
        >
          <Swords className="h-3.5 w-3.5" />
          Challenge
        </button>
      )}
    </section>
  )
}

function ProfileAboutCard({ profile }) {
  return (
    <section className="h-full rounded-[8px] border border-[#e3e6ea] bg-white p-3.5">
      <h2 className="text-[10px] font-semibold text-[#22262d]">
        About {profile.fullname.split(/\s+/)[0]}
      </h2>
      <p className="mt-3 text-[9px] leading-5 text-[#68717f]">
        {profile.bio || 'Growing in faith with the Koino community.'}
      </p>
      {profile.location && (
        <p className="mt-3 flex items-center gap-1.5 text-[8px] text-[#858d9a]">
          <MapPin className="h-3.5 w-3.5" />
          {profile.location}
        </p>
      )}
    </section>
  )
}

function ProfileOverview({
  profile,
  onViewPlan,
  onChallenge,
  className = '',
}) {
  const canChallenge =
    profile.friendshipStatus === 'FRIENDS' && Boolean(onChallenge)

  return (
    <div className={className}>
      <ProfileStats profile={profile} />
      <div className="grid gap-2.5 pt-4 md:grid-cols-[1.15fr_0.95fr_0.9fr]">
        <ProfilePlanCard plan={profile.currentPlan} onViewPlan={onViewPlan} />
        <ProfileBattleCard
          battle={profile.battle}
          canChallenge={canChallenge}
          onChallenge={onChallenge}
        />
        <ProfileAboutCard profile={profile} />
      </div>
    </div>
  )
}

export default ProfileOverview
