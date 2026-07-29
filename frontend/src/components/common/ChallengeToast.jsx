import { useEffect, useMemo, useState } from 'react'
import { LoaderCircle, Swords, X } from 'lucide-react'
import {
  acceptBattleChallenge,
  declineBattleChallenge,
} from '@/features/battle/battleService.js'
import { getAuthToken } from '@/features/auth/authStorage.js'
import { apiRequest } from '@/services/api/client.js'

function ChallengeToast({ onNavigate, routePath }) {
  const [notifications, setNotifications] = useState([])
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!getAuthToken()) return undefined
    let active = true

    async function refresh() {
      try {
        const result = await apiRequest('/users/me/notifications')
        if (active) setNotifications(result)
      } catch {
        // Regular API status handling remains responsible for outages.
      }
    }

    refresh()
    const timer = window.setInterval(refresh, 4000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [routePath])

  const challenge = useMemo(
    () =>
      notifications.find(
        (item) =>
          item.type === 'BATTLE_CHALLENGE' &&
          !item.read &&
          item.referenceId,
      ),
    [notifications],
  )

  if (!challenge) return null

  async function respond(accepted) {
    setWorking(true)
    setError('')
    try {
      if (accepted) {
        const result = await acceptBattleChallenge(challenge.referenceId)
        setNotifications((current) =>
          current.filter(
            (item) => item.notificationId !== challenge.notificationId,
          ),
        )
        onNavigate(`/battle-space?battle=${result.battleId}`)
      } else {
        await declineBattleChallenge(challenge.referenceId)
        setNotifications((current) =>
          current.filter(
            (item) => item.notificationId !== challenge.notificationId,
          ),
        )
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to respond to this challenge.')
    } finally {
      setWorking(false)
    }
  }

  return (
    <aside
      className="fixed right-4 top-4 z-[90] w-[min(360px,calc(100vw-32px))] rounded-[8px] border border-[#ead8bb] bg-white p-4 shadow-[0_18px_48px_rgba(30,34,42,0.16)]"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff4e3] text-[#b87512]">
          <Swords className="h-4 w-4" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-[#20242b]">
            {challenge.title}
          </p>
          <p className="mt-1 text-[9px] leading-4 text-[#707887]">
            {challenge.message}
          </p>
        </div>
        <button
          type="button"
          onClick={() => respond(false)}
          disabled={working}
          className="flex h-7 w-7 shrink-0 items-center justify-center text-[#858d99] hover:text-[#2c3139]"
          aria-label="Decline challenge"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {error && (
        <p className="mt-3 rounded-[6px] bg-[#fff2f1] px-3 py-2 text-[9px] text-[#a33c36]">
          {error}
        </p>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => respond(false)}
          disabled={working}
          className="h-9 rounded-[7px] border border-[#dde1e6] text-[9px] font-semibold text-[#59616e] disabled:opacity-60"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => respond(true)}
          disabled={working}
          className="flex h-9 items-center justify-center gap-2 rounded-[7px] bg-[#e8a33d] text-[9px] font-semibold text-white disabled:opacity-60"
        >
          {working && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
          Accept
        </button>
      </div>
    </aside>
  )
}

export default ChallengeToast
