import { useCallback, useEffect, useRef, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { AppPageLayout } from '@/components/common/AppPageLayout.jsx'
import ModalShell from '@/components/common/ModalShell.jsx'
import StatusModal from '@/components/auth/shared/StatusModal.jsx'
import BattleLobby from '@/components/battle/BattleLobby.jsx'
import BattleMatchmaking from '@/components/battle/BattleMatchmaking.jsx'
import BattleArena from '@/components/battle/BattleArena.jsx'
import BattleResultModal from '@/components/battle/BattleResultModal.jsx'
import BattleRulesModal from '@/components/battle/BattleRulesModal.jsx'
import UserProfileModal from '@/components/community/UserProfileModal.jsx'
import {
  answerBattleQuestion,
  createBattleChallenge,
  startMatchmaking,
  getMatchmaking,
  getMatchmakingBot,
  cancelMatchmaking,
  getBattleChallenge,
  acceptBattleChallenge,
  cancelBattleChallenge,
  finishBattle,
  getBattle,
  getBattleLobby,
} from '@/features/battle/battleService.js'
import { getUserProfile } from '@/features/social/socialService.js'
import { playBattleSound } from '@/features/battle/battleAudio.js'
import {
  getAuthSession,
  getAuthToken,
} from '@/features/auth/authStorage.js'
import { API_BASE_URL } from '@/config/env.js'

function BattleSpacePage({ onNavigate }) {
  const session = getAuthSession()
  const [lobby, setLobby] = useState(null)
  const [view, setView] = useState('loading')
  const [selectedMode, setSelectedMode] = useState('LIGHTNING')
  const [matchingMode, setMatchingMode] = useState(null)
  const [battle, setBattle] = useState(null)
  const [answering, setAnswering] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [error, setError] = useState('')
  const [showRules, setShowRules] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [challengeProfile, setChallengeProfile] = useState(null)
  const [activeChallenge, setActiveChallenge] = useState(null)
  const [matchmakingTicket, setMatchmakingTicket] = useState(null)
  const [profileUserId, setProfileUserId] = useState(null)
  const matchingRequestRef = useRef(0)
  const feedbackTimerRef = useRef(null)
  const finishingBattleRef = useRef(null)
  const battleId = battle?.battleId
  const battleStatus = battle?.status

  const loadLobby = useCallback(async () => {
    const data = await getBattleLobby()
    setLobby(data)
    setView('lobby')
    return data
  }, [])

  useEffect(() => {
    if (!getAuthToken()) {
      onNavigate('/')
      return undefined
    }
    let active = true
    const params = new URLSearchParams(window.location.search)
    const challengeTarget = params.get('challenge')
    const incomingChallenge = params.get('challengeId')
    const requestedBattle = params.get('battle')

    getBattleLobby()
      .then(async (data) => {
        if (!active) return
        setLobby(data)
        setSelectedMode(data.modes[0]?.mode || 'LIGHTNING')

        if (requestedBattle) {
          const currentBattle = await getBattle(requestedBattle)
          if (!active) return
          setBattle(currentBattle)
          setView('battle')
          return
        }
        if (incomingChallenge) {
          const accepted = await acceptBattleChallenge(incomingChallenge)
          if (!active) return
          setActiveChallenge(accepted)
          if (!accepted.battleId) {
            throw new Error('The challenge could not start.')
          }
          const currentBattle = await getBattle(accepted.battleId)
          if (!active) return
          setBattle(currentBattle)
          setView('battle')
          return
        }
        if (challengeTarget) {
          const profile = await getUserProfile(challengeTarget)
          if (!active) return
          setChallengeProfile(profile)
        }
        setView('lobby')
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
    return () => {
      active = false
      matchingRequestRef.current += 1
      window.clearTimeout(feedbackTimerRef.current)
    }
  }, [onNavigate])

  const beginMatch = useCallback(
    async (modeName) => {
      const mode = lobby?.modes.find((item) => item.mode === modeName)
      if (!mode) return
      const requestId = matchingRequestRef.current + 1
      matchingRequestRef.current = requestId
      playBattleSound('select')
      setSelectedMode(modeName)
      setMatchingMode(mode)
      setFeedback(null)
      setView('matching')
      try {
        if (challengeProfile) {
          const challenge = await createBattleChallenge(
            challengeProfile.userId,
            modeName,
          )
          if (matchingRequestRef.current !== requestId) {
            await cancelBattleChallenge(challenge.challengeId)
            return
          }
          setActiveChallenge(challenge)
          return
        }
        const ticket = await startMatchmaking(modeName)
        if (matchingRequestRef.current !== requestId) {
          if (ticket.status === 'WAITING') {
            await cancelMatchmaking(ticket.ticketId)
          }
          return
        }
        setMatchmakingTicket(ticket)
        if (ticket.status === 'MATCHED' && ticket.battleId) {
          const created = await getBattle(ticket.battleId)
          if (matchingRequestRef.current !== requestId) return
          setBattle(created)
          setMatchmakingTicket(null)
          setView('battle')
        }
      } catch (requestError) {
        if (matchingRequestRef.current !== requestId) return
        setView('lobby')
        setError(requestError.message || 'Unable to start this battle.')
      }
    },
    [challengeProfile, lobby],
  )

  async function cancelMatching() {
    matchingRequestRef.current += 1
    if (matchmakingTicket?.status === 'WAITING') {
      try {
        await cancelMatchmaking(matchmakingTicket.ticketId)
      } catch {
        // Heartbeat expiry also removes abandoned searches.
      }
    }
    if (activeChallenge?.status === 'PENDING') {
      try {
        await cancelBattleChallenge(activeChallenge.challengeId)
      } catch {
        // Expiry on the server still prevents a stale challenge from starting.
      }
    }
    setActiveChallenge(null)
    setMatchmakingTicket(null)
    setView('lobby')
    setMatchingMode(null)
  }

  useEffect(() => {
    if (matchmakingTicket?.status !== 'WAITING') return undefined
    let active = true
    let usingBot = false
    const startedAt = Date.now()

    async function refreshMatchmaking() {
      try {
        const latest = await getMatchmaking(matchmakingTicket.ticketId)
        if (!active) return
        setMatchmakingTicket(latest)
        if (latest.status === 'MATCHED' && latest.battleId) {
          const currentBattle = await getBattle(latest.battleId)
          if (!active) return
          setBattle(currentBattle)
          setMatchmakingTicket(null)
          setView('battle')
          return
        }
        if (latest.status !== 'WAITING') {
          setMatchmakingTicket(null)
          setView('lobby')
          return
        }
        if (!usingBot && Date.now() - startedAt >= 7000) {
          usingBot = true
          const currentBattle = await getMatchmakingBot(latest.ticketId)
          if (!active) return
          setBattle(currentBattle)
          setMatchmakingTicket(null)
          setView('battle')
        }
      } catch (requestError) {
        if (active) {
          setMatchmakingTicket(null)
          setView('lobby')
          setError(requestError.message || 'Unable to find an opponent.')
        }
      }
    }

    const timer = window.setInterval(refreshMatchmaking, 1400)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [matchmakingTicket?.status, matchmakingTicket?.ticketId])

  useEffect(() => {
    if (activeChallenge?.status !== 'PENDING') return undefined
    let active = true

    async function refreshChallenge() {
      try {
        const latest = await getBattleChallenge(activeChallenge.challengeId)
        if (!active) return
        if (latest.status === 'ACCEPTED' && latest.battleId) {
          const currentBattle = await getBattle(latest.battleId)
          if (!active) return
          setActiveChallenge(latest)
          setBattle(currentBattle)
          setView('battle')
          window.history.replaceState({}, '', '/battle-space')
        } else if (
          ['DECLINED', 'CANCELLED', 'EXPIRED'].includes(latest.status)
        ) {
          setActiveChallenge(latest)
          setView('lobby')
          setMatchingMode(null)
          setError(
            latest.status === 'DECLINED'
              ? 'Your friend declined this challenge.'
              : 'This challenge is no longer available.',
          )
        } else {
          setActiveChallenge(latest)
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message || 'Unable to refresh the challenge.')
        }
      }
    }

    refreshChallenge()
    const timer = window.setInterval(refreshChallenge, 1000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [activeChallenge?.challengeId, activeChallenge?.status])

  useEffect(() => {
    if (matchmakingTicket?.status !== 'WAITING') return undefined
    function cancelOnPageExit() {
      const token = getAuthToken()
      fetch(
        `${API_BASE_URL}/battles/matchmaking/${matchmakingTicket.ticketId}/cancel`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          keepalive: true,
        },
      ).catch(() => {})
    }
    window.addEventListener('pagehide', cancelOnPageExit)
    return () => window.removeEventListener('pagehide', cancelOnPageExit)
  }, [matchmakingTicket?.status, matchmakingTicket?.ticketId])

  useEffect(() => {
    if (activeChallenge?.status !== 'PENDING') return undefined
    function cancelOnPageExit() {
      const token = getAuthToken()
      fetch(
        `${API_BASE_URL}/battles/challenges/${activeChallenge.challengeId}/cancel`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          keepalive: true,
        },
      ).catch(() => {})
    }
    window.addEventListener('pagehide', cancelOnPageExit)
    window.addEventListener('popstate', cancelOnPageExit)
    return () => {
      window.removeEventListener('pagehide', cancelOnPageExit)
      window.removeEventListener('popstate', cancelOnPageExit)
    }
  }, [activeChallenge?.challengeId, activeChallenge?.status])

  const guardedNavigate = useCallback(
    async (path) => {
      if (matchmakingTicket?.status === 'WAITING') {
        try {
          await cancelMatchmaking(matchmakingTicket.ticketId)
        } catch {
          // Heartbeat expiry also removes abandoned searches.
        }
      }
      if (activeChallenge?.status === 'PENDING') {
        try {
          await cancelBattleChallenge(activeChallenge.challengeId)
        } catch {
          // The pending challenge expires even if cancellation cannot connect.
        }
      }
      onNavigate(path)
    },
    [activeChallenge, matchmakingTicket, onNavigate],
  )

  async function answer(selectedOption) {
    if (!battle?.currentQuestion || answering || feedback) return
    playBattleSound('select')
    setAnswering(true)
    try {
      const response = await answerBattleQuestion(
        battle.battleId,
        battle.currentQuestion.questionId,
        selectedOption,
      )
      setFeedback({
        ...response,
        selectedOption,
      })
      playBattleSound(response.correct ? 'correct' : 'incorrect')
      const feedbackDuration = {
        LIGHTNING: 320,
        RAPID: 560,
        CLASSICAL: 760,
      }[battle.mode] || 560
      feedbackTimerRef.current = window.setTimeout(() => {
        setBattle(response.battle)
        setFeedback(null)
        setAnswering(false)
      }, feedbackDuration)
    } catch (requestError) {
      setAnswering(false)
      if (/time is up/i.test(requestError.message)) {
        await endForTime()
      } else if (/battle has ended/i.test(requestError.message)) {
        try {
          setBattle(await getBattle(battle.battleId))
          setFeedback(null)
          setError('')
        } catch {
          // The next poll will reconcile the terminal battle state.
        }
      } else {
        setError(requestError.message || 'Unable to submit your answer.')
      }
    }
  }

  const endForTime = useCallback(async () => {
    if (
      !battleId ||
      battleStatus !== 'ACTIVE' ||
      finishingBattleRef.current === battleId
    ) return
    finishingBattleRef.current = battleId
    window.clearTimeout(feedbackTimerRef.current)
    try {
      const completed = await finishBattle(battleId)
      setBattle(completed)
      setError('')
      setFeedback(null)
      setAnswering(false)
    } catch (requestError) {
      try {
        const latest = await getBattle(battleId)
        setBattle(latest)
        if (latest.status === 'ACTIVE') {
          setError(requestError.message || 'Unable to finish this battle.')
        }
      } catch {
        setError(requestError.message || 'Unable to finish this battle.')
      }
    } finally {
      finishingBattleRef.current = null
    }
  }, [battleId, battleStatus])

  useEffect(() => {
    if (
      view !== 'battle' ||
      !battle?.battleId ||
      battle.status !== 'ACTIVE' ||
      answering ||
      feedback
    ) {
      return undefined
    }
    const timer = window.setInterval(() => {
      getBattle(battle.battleId)
        .then((latest) => setBattle(latest))
        .catch(() => {})
    }, 1200)
    return () => window.clearInterval(timer)
  }, [
    answering,
    battle?.battleId,
    battle?.status,
    feedback,
    view,
  ])

  async function leaveBattle() {
    setConfirmLeave(false)
    try {
      setBattle(await finishBattle(battle.battleId, true))
      setView('battle')
    } catch (requestError) {
      setError(requestError.message || 'Unable to leave this battle.')
    }
  }

  async function returnToLobby() {
    try {
      await loadLobby()
      setBattle(null)
      setMatchingMode(null)
      setActiveChallenge(null)
      setChallengeProfile(null)
    } catch (requestError) {
      setError(requestError.message || 'Unable to refresh Battle Space.')
    }
  }

  async function rematch() {
    const finishedBattle = battle
    if (!finishedBattle) return
    const mode = lobby?.modes.find(
      (item) => item.mode === finishedBattle.mode,
    )
    if (!mode) return
    setBattle(null)
    setFeedback(null)
    setAnswering(false)
    if (
      finishedBattle.opponentType === 'USER' &&
      finishedBattle.opponentUserId
    ) {
      const opponent = {
        userId: finishedBattle.opponentUserId,
        fullname: finishedBattle.opponentName,
      }
      setChallengeProfile(opponent)
      setMatchingMode(mode)
      setView('matching')
      const challenge = await createBattleChallenge(
        opponent.userId,
        finishedBattle.mode,
      )
      setActiveChallenge(challenge)
      return
    }
    await beginMatch(finishedBattle.mode)
  }

  const selectedRating = lobby?.profile.ratings.find(
    (rating) => rating.mode === (battle?.mode || selectedMode),
  )
  const resultRank = battle?.ratingAfter
    ? rankFor(battle.ratingAfter)
    : selectedRating?.rank

  return (
    <AppPageLayout
      name={session?.fullname}
      onNavigate={guardedNavigate}
      activePath="/battle-space"
    >
          {view === 'loading' && (
            <div className="flex min-h-[520px] items-center justify-center">
              <LoaderCircle className="h-6 w-6 animate-spin text-[#d58c20]" />
            </div>
          )}
          {view === 'lobby' && lobby && (
            <BattleLobby
              lobby={lobby}
              selectedMode={selectedMode}
              onSelectMode={setSelectedMode}
              onStart={beginMatch}
              onHelp={() => setShowRules(true)}
              challengeProfile={challengeProfile}
              onOpenProfile={setProfileUserId}
            />
          )}
          {view === 'matching' && matchingMode && (
            <BattleMatchmaking
              mode={matchingMode}
              onCancel={cancelMatching}
              title={
                activeChallenge
                  ? `Waiting for ${challengeProfile?.fullname || 'your friend'}`
                  : 'Finding an opponent'
              }
              message={
                activeChallenge
                  ? 'Stay in Battle Space while your friend responds. Leaving voids the challenge.'
                  : undefined
              }
              cancelLabel={
                activeChallenge ? 'Cancel challenge' : 'Cancel search'
              }
            />
          )}
          {view === 'battle' && battle && (
            <BattleArena
              battle={battle}
              user={{
                ...session,
                elo: selectedRating?.elo,
              }}
              answering={answering}
              feedback={feedback}
              onAnswer={answer}
              onLeave={() => setConfirmLeave(true)}
              onTimeUp={endForTime}
            />
          )}
      {showRules && (
        <BattleRulesModal onClose={() => setShowRules(false)} />
      )}

      {confirmLeave && (
        <ModalShell
          labelledBy="leave-battle-title"
          describedBy="leave-battle-message"
          onClose={() => setConfirmLeave(false)}
        >
          <div className="flex h-full flex-col px-7 pb-7 pt-8 text-left">
            <h2 id="leave-battle-title" className="text-[21px] font-semibold">
              Leave this battle?
            </h2>
            <p id="leave-battle-message" className="mt-3 text-[10px] leading-5 text-[#6d7584]">
              Leaving counts as a loss and may reduce your ELO rating.
            </p>
            <div className="mt-auto grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmLeave(false)}
                className="h-11 rounded-[7px] border border-[#dfe3e8] text-[10px] font-semibold"
              >
                Keep playing
              </button>
              <button
                type="button"
                onClick={leaveBattle}
                className="h-11 rounded-[7px] bg-[#e8a33d] text-[10px] font-semibold text-white"
              >
                Leave battle
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {battle && battle.status !== 'ACTIVE' && (
        <BattleResultModal
          battle={battle}
          rank={resultRank}
          onRematch={() => rematch().catch((requestError) => {
            setError(requestError.message || 'Unable to request a rematch.')
          })}
          onLobby={returnToLobby}
        />
      )}

      {profileUserId && (
        <UserProfileModal
          userId={profileUserId}
          onClose={() => setProfileUserId(null)}
          onNavigate={guardedNavigate}
          onChallenge={(profile) => {
            setProfileUserId(null)
            setChallengeProfile(profile)
            setView('lobby')
          }}
        />
      )}

      {error && (
        <StatusModal
          type="error"
          title="Battle Space unavailable"
          message={error}
          onClose={() => setError('')}
        />
      )}
    </AppPageLayout>
  )
}

function rankFor(elo) {
  if (elo >= 2600) return 'Super Grandmaster'
  if (elo >= 2200) return 'Grandmaster'
  if (elo >= 1700) return 'Master'
  if (elo >= 1200) return 'Scribe'
  if (elo >= 700) return 'Disciple'
  return 'Novice'
}

export default BattleSpacePage
