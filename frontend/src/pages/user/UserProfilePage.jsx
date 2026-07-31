import { useEffect, useState } from 'react'
import {
  CalendarDays,
  Check,
  Copy,
  LoaderCircle,
  Swords,
  UserPlus,
} from 'lucide-react'
import {
  AppPageLayout,
  PageBackLink,
} from '@/components/common/AppPageLayout.jsx'
import CommunityAvatar from '@/components/community/CommunityAvatar.jsx'
import ProfileOverview from '@/components/community/ProfileOverview.jsx'
import StatusModal from '@/components/auth/shared/StatusModal.jsx'
import BrandMark from '@/components/common/BrandMark.jsx'
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
  const [copied, setCopied] = useState(false)
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

  async function copyProfileLink() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  function challenge() {
    onNavigate(`/battle-space?challenge=${profile.userId}`)
  }

  const content = (
      <>
        {!signedIn ? (
          <header className="mb-6 flex items-center justify-between border-b border-[#e4e7eb] pb-5">
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="inline-flex"
            >
              <BrandMark iconClassName="h-7 w-7" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="h-9 rounded-[7px] bg-[#e8a33d] px-4 text-[9px] font-semibold text-white"
            >
              Sign in
            </button>
          </header>
        ) : (
          <PageBackLink onClick={() => onNavigate('/community')}>
            Community / @{username}
          </PageBackLink>
        )}

        {loading ? (
          <div className="flex min-h-[560px] items-center justify-center">
            <LoaderCircle className="h-6 w-6 animate-spin text-[#d58c20]" />
          </div>
        ) : profile ? (
          <article className="overflow-hidden rounded-[10px] border border-[#e3e6ea] bg-white">
            <header className="flex flex-col gap-5 px-5 pb-6 pt-6 sm:flex-row sm:items-start sm:px-7">
              <CommunityAvatar author={profile} size="xl" />
              <div className="min-w-0 flex-1 sm:pt-1">
                <h1 className="font-serif text-[25px] font-semibold text-[#171a1f]">
                  {profile.fullname}
                </h1>
                <p className="mt-1 text-[10px] text-[#727b89]">
                  @{profile.username}
                </p>
                <p className="mt-3 flex items-center gap-1.5 text-[9px] text-[#858d99]">
                  <CalendarDays className="h-3 w-3" />
                  Joined {formatMonth(profile.joinedAt)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {profile.friendshipStatus !== 'SELF' && (
                  <FriendButton
                    status={profile.friendshipStatus}
                    working={working}
                    onClick={friendAction}
                  />
                )}
                {profile.friendshipStatus === 'FRIENDS' && (
                  <button
                    type="button"
                    onClick={challenge}
                    className="flex h-10 items-center gap-2 rounded-[7px] bg-[#15191f] px-4 text-[9px] font-semibold text-white"
                  >
                    <Swords className="h-3.5 w-3.5" />
                    Challenge
                  </button>
                )}
                <button
                  type="button"
                  onClick={copyProfileLink}
                  className="flex h-10 items-center gap-2 rounded-[7px] border border-[#dfe3e8] px-3 text-[9px] font-semibold"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? 'Copied' : 'Share'}
                </button>
              </div>
            </header>

            <ProfileOverview
              profile={profile}
              onViewPlan={
                profile.friendshipStatus === 'SELF'
                  ? () => onNavigate('/plans')
                  : undefined
              }
              onChallenge={
                profile.friendshipStatus === 'FRIENDS' ? challenge : undefined
              }
              className="border-t border-[#e6e8eb] [&>div:first-child]:border-t-0 [&>div:last-child]:px-5 [&>div:last-child]:pb-6 sm:[&>div:last-child]:px-7"
            />

            <footer className="mx-5 flex items-center justify-between border-t border-[#e5e8ec] py-5 sm:mx-7">
              <p className="text-[8px] text-[#9299a4]">Public Koino profile</p>
              <button
                type="button"
                onClick={copyProfileLink}
                className="flex h-9 items-center gap-2 rounded-[7px] border border-[#e1e4e8] px-3 text-[9px] font-semibold"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? 'Link copied' : 'Copy profile link'}
              </button>
            </footer>
          </article>
        ) : null}
      </>
  )

  return (
    <AppPageLayout
      name={session?.fullname}
      onNavigate={onNavigate}
      showSidebar={signedIn}
    >
      {content}
      {error && (
        <StatusModal
          type="error"
          title="Profile unavailable"
          message={error}
          onClose={() => setError('')}
        />
      )}
    </AppPageLayout>
  )
}

function FriendButton({ status, working, onClick }) {
  const disabled = ['FRIENDS', 'PENDING_OUTGOING'].includes(status)
  const label = {
    FRIENDS: 'Friends',
    PENDING_OUTGOING: 'Request sent',
    PENDING_INCOMING: 'Accept request',
    NONE: 'Add friend',
    SIGNED_OUT: 'Add friend',
  }[status] || 'Add friend'

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

export default UserProfilePage
