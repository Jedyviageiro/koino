import { useEffect, useState } from 'react'
import {
  CalendarDays,
  Check,
  Copy,
  LoaderCircle,
  MapPin,
  Swords,
  UserPlus,
} from 'lucide-react'
import HomeSidebar from '@/components/home/HomeSidebar.jsx'
import CommunityAvatar from '@/components/community/CommunityAvatar.jsx'
import BattleRankBadge from '@/components/battle/BattleRankBadge.jsx'
import StatusModal from '@/components/auth/shared/StatusModal.jsx'
import koinoLogo from '@/assets/brand/logos/koino-wordmark.png'
import { getAuthSession, getAuthToken } from '@/features/auth/authStorage.js'
import {
  acceptFriend,
  getPublicUserProfile,
  requestFriend,
} from '@/features/social/socialService.js'

function UserProfilePage({ username, onNavigate }) {
  const signedIn = Boolean(getAuthToken())
  const session = getAuthSession()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getPublicUserProfile(username)
      .then((data) => {
        if (active) setProfile(data)
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || 'This profile is unavailable.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [username])

  async function friendAction() {
    if (!signedIn) {
      onNavigate('/')
      return
    }
    if (!profile || working) return
    setWorking(true)
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

  const content = (
    <main className="min-w-0 px-[18px] pb-14 pt-6 sm:px-7 lg:px-9 lg:pt-8">
      <div className="mx-auto max-w-[1050px]">
        {!signedIn && (
          <header className="mb-8 flex items-center justify-between">
            <button type="button" onClick={() => onNavigate('/')} className="w-20">
              <img src={koinoLogo} alt="Koino" className="w-full" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="h-9 rounded-[7px] bg-[#e8a33d] px-4 text-[9px] font-semibold text-white"
            >
              Sign in
            </button>
          </header>
        )}

        {loading ? (
          <div className="flex min-h-[560px] items-center justify-center">
            <LoaderCircle className="h-6 w-6 animate-spin text-[#d58c20]" />
          </div>
        ) : profile ? (
          <>
            <header className="flex flex-col gap-5 border-b border-[#e5e8ec] pb-7 sm:flex-row sm:items-start">
              <CommunityAvatar author={profile} size="xl" />
              <div className="min-w-0 flex-1">
                <h1 className="font-sans text-[25px] font-semibold">
                  {profile.fullname}
                </h1>
                <p className="mt-1 text-[10px] text-[#737c8b]">
                  @{profile.username}
                </p>
                <p className="mt-3 flex items-center gap-1.5 text-[9px] text-[#858c98]">
                  <CalendarDays className="h-3 w-3" />
                  Joined {formatMonth(profile.joinedAt)}
                </p>
                {profile.bio && (
                  <p className="mt-3 max-w-[520px] text-[10px] leading-5 text-[#5f6877]">
                    {profile.bio}
                  </p>
                )}
              </div>
              {profile.friendshipStatus !== 'SELF' && (
                <div className="flex gap-2">
                  <FriendButton
                    status={profile.friendshipStatus}
                    working={working}
                    onClick={friendAction}
                  />
                  {profile.friendshipStatus === 'FRIENDS' && (
                    <button
                      type="button"
                      onClick={() =>
                        onNavigate(`/battle-space?challenge=${profile.userId}`)
                      }
                      className="flex h-10 items-center gap-2 rounded-[7px] bg-[#171a1f] px-4 text-[9px] font-semibold text-white"
                    >
                      <Swords className="h-3.5 w-3.5" />
                      Challenge
                    </button>
                  )}
                </div>
              )}
            </header>

            <div className="grid grid-cols-2 border-b border-[#e5e8ec] sm:grid-cols-4">
              <Metric value={profile.postsCount} label="Posts" />
              <Metric value={profile.friendsCount} label="Friends" />
              <Metric value={profile.battle?.elo || 200} label="ELO" />
              <Metric value={`${profile.battle?.winRate || 0}%`} label="Win rate" />
            </div>

            <div className="grid gap-6 py-7 lg:grid-cols-[1.1fr_1fr_0.85fr]">
              <section className="border-b border-[#e6e8eb] pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
                <h2 className="font-sans text-[12px] font-semibold">
                  Current reading plan
                </h2>
                {profile.currentPlan ? (
                  <>
                    <p className="mt-4 text-[14px] font-semibold">
                      {profile.currentPlan.name}
                    </p>
                    <p className="mt-2 text-[9px] leading-5 text-[#737c89]">
                      {profile.currentPlan.description}
                    </p>
                    <p className="mt-4 text-[9px] font-medium text-[#9a671d]">
                      {profile.currentPlan.durationDays} days ·{' '}
                      {profile.currentPlan.estimatedMinutesPerDay} minutes/day
                    </p>
                  </>
                ) : (
                  <p className="mt-4 text-[9px] text-[#858c98]">
                    No active plan is shared right now.
                  </p>
                )}
              </section>

              <section className="border-b border-[#e6e8eb] pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
                <h2 className="font-sans text-[12px] font-semibold">
                  Battle Space
                </h2>
                <div className="mt-4">
                  <BattleRankBadge rank={profile.battle?.rank || 'Novice'} />
                </div>
                <p className="mt-3 text-[19px] font-semibold">
                  {profile.battle?.elo || 200}{' '}
                  <span className="text-[9px] font-normal text-[#7b8390]">
                    ELO
                  </span>
                </p>
                <p className="mt-2 text-[9px] text-[#737c89]">
                  {profile.battle?.wins || 0} wins across{' '}
                  {profile.battle?.battles || 0} battles
                </p>
              </section>

              <section>
                <h2 className="font-sans text-[12px] font-semibold">
                  About {profile.fullname.split(/\s+/)[0]}
                </h2>
                <p className="mt-4 text-[9px] leading-5 text-[#737c89]">
                  {profile.bio || 'Growing in faith with the Koino community.'}
                </p>
                {profile.location && (
                  <p className="mt-4 flex items-center gap-1.5 text-[9px] text-[#858c98]">
                    <MapPin className="h-3.5 w-3.5" />
                    {profile.location}
                  </p>
                )}
              </section>
            </div>

            <footer className="mt-5 flex items-center justify-between border-t border-[#e5e8ec] pt-5">
              <p className="text-[8px] text-[#9299a4]">
                Public Koino profile
              </p>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="flex h-9 items-center gap-2 rounded-[7px] border border-[#e1e4e8] px-3 text-[9px] font-semibold"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy profile link
              </button>
            </footer>
          </>
        ) : null}
      </div>
    </main>
  )

  return (
    <div
      className={`min-h-svh bg-[#fbfcfe] text-[#111318] ${
        signedIn ? 'lg:grid lg:grid-cols-[164px_minmax(0,1fr)]' : ''
      }`}
    >
      {signedIn && (
        <HomeSidebar
          name={session?.fullname}
          onNavigate={onNavigate}
          activePath=""
        />
      )}
      {content}
      {error && (
        <StatusModal
          type="error"
          title="Profile unavailable"
          message={error}
          onClose={() => setError('')}
        />
      )}
    </div>
  )
}

function FriendButton({ status, working, onClick }) {
  const disabled = ['FRIENDS', 'PENDING_OUTGOING'].includes(status)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={working || disabled}
      className="flex h-10 min-w-[114px] items-center justify-center gap-2 rounded-[7px] border border-[#dfa03f] px-4 text-[9px] font-semibold text-[#9a671d] disabled:border-[#dfe2e6] disabled:text-[#7e8692]"
    >
      {working ? (
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
      ) : disabled ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <UserPlus className="h-3.5 w-3.5" />
      )}
      {status === 'FRIENDS'
        ? 'Friends'
        : status === 'PENDING_OUTGOING'
          ? 'Request sent'
          : status === 'PENDING_INCOMING'
            ? 'Accept request'
            : 'Add friend'}
    </button>
  )
}

function Metric({ value, label }) {
  return (
    <div className="border-r border-[#e5e8ec] px-4 py-5 text-center last:border-r-0">
      <p className="text-[15px] font-semibold">{value}</p>
      <p className="mt-1 text-[8px] text-[#858c98]">{label}</p>
    </div>
  )
}

function formatMonth(value) {
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export default UserProfilePage
