import { useEffect, useState } from 'react'
import {
  CalendarDays,
  Check,
  LoaderCircle,
  UserPlus,
  X,
} from 'lucide-react'
import ModalShell from '@/components/common/ModalShell.jsx'
import CommunityAvatar from '@/components/community/CommunityAvatar.jsx'
import ProfileOverview from '@/components/community/ProfileOverview.jsx'
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

  function challenge() {
    onClose()
    onChallenge(profile)
  }

  return (
    <ModalShell
      labelledBy="community-profile-title"
      onClose={onClose}
      panelClassName="!h-auto max-h-[92dvh] !max-w-[720px] !rounded-[12px] !text-left"
    >
      {!profile && !error ? (
        <div className="flex min-h-[520px] items-center justify-center">
          <LoaderCircle className="h-6 w-6 animate-spin text-[#d58c20]" />
        </div>
      ) : error && !profile ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center px-8 text-center">
          <p className="text-[11px] text-[#6c7481]">{error}</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 h-10 rounded-[7px] bg-[#e8a33d] px-5 text-[10px] font-semibold text-white"
          >
            Close
          </button>
        </div>
      ) : (
        <div className="max-h-[92dvh] overflow-y-auto">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-[#737c89] transition-colors hover:bg-[#f3f4f6]"
            aria-label="Close profile"
          >
            <X className="h-4 w-4" />
          </button>

          <header className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 px-5 pb-5 pt-6 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:px-6">
            <CommunityAvatar author={profile} size="xl" />
            <div className="min-w-0 flex-1 sm:pt-1">
              <h2
                id="community-profile-title"
                className="truncate font-serif text-[20px] font-semibold text-[#1b1e23]"
              >
                {profile.fullname}
              </h2>
              <p className="mt-0.5 text-[9px] text-[#727b89]">
                @{profile.username}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-[8px] text-[#858d99]">
                <CalendarDays className="h-3 w-3" />
                Joined {formatMonth(profile.joinedAt)}
              </p>
            </div>
            {profile.friendshipStatus !== 'SELF' && (
              <div className="col-span-2 flex min-w-0 pr-10 sm:col-span-1 sm:pr-8">
                <FriendAction
                  status={profile.friendshipStatus}
                  working={working}
                  onClick={updateFriendship}
                />
              </div>
            )}
          </header>

          <ProfileOverview
            profile={profile}
            onViewPlan={openFullProfile}
            onChallenge={
              profile.friendshipStatus === 'FRIENDS' ? challenge : undefined
            }
            className="px-0 [&>div:last-child]:px-5 [&>div:last-child]:pb-4 sm:[&>div:last-child]:px-6"
          />

          {error && (
            <p className="mx-5 mb-3 text-[9px] font-medium text-[#b33b36] sm:mx-6">
              {error}
            </p>
          )}

          <div className="px-5 pb-5 sm:px-6">
            <button
              type="button"
              onClick={openFullProfile}
              className="h-10 w-full rounded-[7px] bg-[#fbf3e7] text-[9px] font-semibold text-[#97641a] transition-colors hover:bg-[#f7ead6]"
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
  const disabled = ['FRIENDS', 'PENDING_OUTGOING'].includes(status)
  const label = {
    FRIENDS: 'Friends',
    PENDING_OUTGOING: 'Request sent',
    PENDING_INCOMING: 'Accept request',
    NONE: 'Add friend',
  }[status] || 'Add friend'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={working || disabled}
      className="flex h-9 min-w-[108px] items-center justify-center gap-2 rounded-[7px] border border-[#dfa03f] px-3 text-[8px] font-semibold text-[#9a671d] disabled:border-[#dfe2e6] disabled:text-[#7e8692]"
    >
      {working ? (
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
      ) : disabled ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <UserPlus className="h-3.5 w-3.5" />
      )}
      {label}
    </button>
  )
}

function formatMonth(value) {
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export default UserProfileModal
