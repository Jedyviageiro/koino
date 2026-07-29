import { useEffect, useState } from 'react'
import {
  CalendarDays,
  Check,
  LoaderCircle,
  MapPin,
  Swords,
  UserPlus,
  X,
} from 'lucide-react'
import ModalShell from '@/components/common/ModalShell.jsx'
import CommunityAvatar from '@/components/community/CommunityAvatar.jsx'
import BattleRankBadge from '@/components/battle/BattleRankBadge.jsx'
import {
  acceptFriend,
  getUserProfile,
  requestFriend,
} from '@/features/social/socialService.js'

function UserProfileModal({
  userId,
  onClose,
  onNavigate,
  onChallenge,
}) {
  const [profile, setProfile] = useState(null)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getUserProfile(userId)
      .then((data) => {
        if (active) setProfile(data)
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || 'Unable to load this profile.')
        }
      })
    return () => {
      active = false
    }
  }, [userId])

  async function updateFriendship() {
    if (!profile || working) return
    setWorking(true)
    setError('')
    try {
      if (profile.friendshipStatus === 'PENDING_INCOMING') {
        await acceptFriend(profile.friendshipId)
        setProfile((current) => ({
          ...current,
          friendshipStatus: 'FRIENDS',
          friendsCount: current.friendsCount + 1,
        }))
      } else if (profile.friendshipStatus === 'NONE') {
        const request = await requestFriend(profile.userId)
        setProfile((current) => ({
          ...current,
          friendshipStatus: 'PENDING_OUTGOING',
          friendshipId: request.friendshipId,
        }))
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to update this friendship.')
    } finally {
      setWorking(false)
    }
  }

  function openFullProfile() {
    onClose()
    onNavigate(`/u/${profile.username}`)
  }

  return (
    <ModalShell
      labelledBy="community-profile-title"
      onClose={onClose}
      panelClassName="!h-auto max-h-[88dvh] !max-w-[610px] !rounded-[12px] !text-left"
    >
      {!profile && !error ? (
        <div className="flex min-h-[430px] items-center justify-center">
          <LoaderCircle className="h-6 w-6 animate-spin text-[#d58c20]" />
        </div>
      ) : error && !profile ? (
        <div className="flex min-h-[330px] flex-col items-center justify-center px-8 text-center">
          <p className="text-[12px] text-[#6c7481]">{error}</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 h-10 rounded-[7px] bg-[#e8a33d] px-5 text-[10px] font-semibold text-white"
          >
            Close
          </button>
        </div>
      ) : (
        <div className="overflow-y-auto">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-[#6f7784] hover:bg-[#f4f5f6]"
            aria-label="Close profile"
          >
            <X className="h-4 w-4" />
          </button>

          <header className="flex gap-4 px-6 pb-5 pt-6 sm:items-start">
            <CommunityAvatar
              author={profile}
              size="xl"
            />
            <div className="min-w-0 flex-1 pr-8">
              <h2
                id="community-profile-title"
                className="truncate font-sans text-[17px] font-semibold"
              >
                {profile.fullname}
              </h2>
              <p className="mt-0.5 text-[10px] text-[#777f8d]">
                @{profile.username}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-[9px] text-[#858c98]">
                <CalendarDays className="h-3 w-3" />
                Joined {formatMonth(profile.joinedAt)}
              </p>
            </div>
            {profile.friendshipStatus !== 'SELF' && (
            <div className="hidden shrink-0 gap-2 sm:flex">
              <FriendAction
                status={profile.friendshipStatus}
                working={working}
                onClick={updateFriendship}
              />
              {profile.friendshipStatus === 'FRIENDS' && (
                <button
                  type="button"
                  onClick={() => onChallenge(profile)}
                  className="flex h-9 items-center gap-2 rounded-[7px] bg-[#171a1f] px-4 text-[9px] font-semibold text-white"
                >
                  <Swords className="h-3.5 w-3.5" />
                  Challenge
                </button>
              )}
            </div>
            )}
          </header>

          <div className="grid grid-cols-2 border-y border-[#eceef1] sm:grid-cols-4">
            <Stat value={profile.postsCount} label="Posts" />
            <Stat value={profile.friendsCount} label="Friends" />
            <Stat value={profile.battle?.elo || 200} label="ELO" />
            <Stat value={`${profile.battle?.winRate || 0}%`} label="Win rate" />
          </div>

          <div className="space-y-5 px-6 py-5">
            <section>
              <p className="text-[10px] font-semibold">Current reading plan</p>
              {profile.currentPlan ? (
                <div className="mt-3 flex items-center justify-between gap-4 border-l-2 border-[#e8a33d] pl-4">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold">
                      {profile.currentPlan.name}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-[#747c89]">
                      {profile.currentPlan.description}
                    </p>
                  </div>
                  <span className="shrink-0 text-[9px] text-[#9b681d]">
                    {profile.currentPlan.estimatedMinutesPerDay} min/day
                  </span>
                </div>
              ) : (
                <p className="mt-2 text-[9px] text-[#858c98]">
                  No active plan is shared right now.
                </p>
              )}
            </section>

            <section className="flex items-center justify-between border-y border-[#eceef1] py-4">
              <div>
                <p className="text-[10px] font-semibold">Battle Space</p>
                <div className="mt-1.5">
                  <BattleRankBadge rank={profile.battle?.rank || 'Novice'} />
                </div>
              </div>
              <p className="text-right text-[10px] font-semibold">
                {profile.battle?.elo || 200} ELO
                <span className="mt-1 block text-[8px] font-normal text-[#858c98]">
                  {profile.battle?.wins || 0} wins
                </span>
              </p>
            </section>

            <section>
              <p className="text-[10px] font-semibold">
                About {profile.fullname.split(/\s+/)[0]}
              </p>
              <p className="mt-2 text-[10px] leading-5 text-[#646d7a]">
                {profile.bio || 'Growing in faith with the Koino community.'}
              </p>
              {profile.location && (
                <p className="mt-2 flex items-center gap-1.5 text-[9px] text-[#858c98]">
                  <MapPin className="h-3 w-3" />
                  {profile.location}
                </p>
              )}
            </section>

            {error && (
              <p className="text-[9px] font-medium text-[#b33b36]">{error}</p>
            )}

            {profile.friendshipStatus !== 'SELF' && (
            <div className="flex gap-2 sm:hidden">
              <FriendAction
                status={profile.friendshipStatus}
                working={working}
                onClick={updateFriendship}
              />
              {profile.friendshipStatus === 'FRIENDS' && (
                <button
                  type="button"
                  onClick={() => onChallenge(profile)}
                  className="flex h-10 flex-1 items-center justify-center gap-2 rounded-[7px] bg-[#171a1f] text-[9px] font-semibold text-white"
                >
                  <Swords className="h-3.5 w-3.5" />
                  Challenge
                </button>
              )}
            </div>
            )}

            <button
              type="button"
              onClick={openFullProfile}
              className="h-10 w-full rounded-[7px] bg-[#f8f1e6] text-[9px] font-semibold text-[#97641a]"
            >
              View full profile
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  )
}

function FriendAction({ status, working, onClick }) {
  const pending = status === 'PENDING_OUTGOING'
  const friends = status === 'FRIENDS'
  const incoming = status === 'PENDING_INCOMING'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={working || pending || friends}
      className="flex h-9 min-w-[108px] items-center justify-center gap-2 rounded-[7px] border border-[#dfa03f] px-3 text-[9px] font-semibold text-[#9a671d] disabled:border-[#dfe2e6] disabled:text-[#7e8692]"
    >
      {working ? (
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
      ) : friends ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <UserPlus className="h-3.5 w-3.5" />
      )}
      {friends
        ? 'Friends'
        : pending
          ? 'Request sent'
          : incoming
            ? 'Accept request'
            : 'Add friend'}
    </button>
  )
}

function Stat({ value, label }) {
  return (
    <div className="border-r border-[#eceef1] px-3 py-3 text-center last:border-r-0">
      <p className="text-[12px] font-semibold">{value}</p>
      <p className="mt-0.5 text-[8px] text-[#858c98]">{label}</p>
    </div>
  )
}

function formatMonth(value) {
  if (!value) return 'recently'
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export default UserProfileModal
