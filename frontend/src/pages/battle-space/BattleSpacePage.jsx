import { useCallback, useEffect, useRef, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import HomeSidebar from '@/components/home/HomeSidebar.jsx'
import ModalShell from '@/components/common/ModalShell.jsx'
import StatusModal from '@/components/auth/shared/StatusModal.jsx'
import BattleLobby from '@/components/battle/BattleLobby.jsx'
import BattleMatchmaking from '@/components/battle/BattleMatchmaking.jsx'
import BattleArena from '@/components/battle/BattleArena.jsx'
import BattleResultModal from '@/components/battle/BattleResultModal.jsx'
import BattleRulesModal from '@/components/battle/BattleRulesModal.jsx'
import {
  answerBattleQuestion,
  createBattle,
  finishBattle,
  getBattleLobby,
} from '@/features/battle/battleService.js'
import {
  getAuthSession,
  getAuthToken,
} from '@/features/auth/authStorage.js'

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
  const matchingTimerRef = useRef(null)
  const feedbackTimerRef = useRef(null)

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
    getBattleLobby()
      .then((data) => {
        if (active) {
          setLobby(data)
          setSelectedMode(data.modes[0]?.mode || 'LIGHTNING')
          setView('lobby')
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
    return () => {
      active = false
      window.clearTimeout(matchingTimerRef.current)
      window.clearTimeout(feedbackTimerRef.current)
    }
  }, [onNavigate])

  const beginMatch = useCallback(
    (modeName) => {
      const mode = lobby?.modes.find((item) => item.mode === modeName)
      if (!mode) return
      setSelectedMode(modeName)
      setMatchingMode(mode)
      setFeedback(null)
      setView('matching')
      window.clearTimeout(matchingTimerRef.current)
      matchingTimerRef.current = window.setTimeout(async () => {
        try {
          const created = await createBattle(modeName)
          setBattle(created)
          setView('battle')
        } catch (requestError) {
          setView('lobby')
          setError(requestError.message || 'Unable to start this battle.')
        }
      }, 1900)
    },
    [lobby],
  )

  function cancelMatching() {
    window.clearTimeout(matchingTimerRef.current)
    setView('lobby')
    setMatchingMode(null)
  }

  async function answer(selectedOption) {
    if (!battle?.currentQuestion || answering || feedback) return
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
      feedbackTimerRef.current = window.setTimeout(() => {
        setBattle(response.battle)
        setFeedback(null)
        setAnswering(false)
      }, 1100)
    } catch (requestError) {
      setAnswering(false)
      if (/time is up/i.test(requestError.message)) {
        await endForTime()
      } else {
        setError(requestError.message || 'Unable to submit your answer.')
      }
    }
  }

  const endForTime = useCallback(async () => {
    if (!battle?.battleId || battle.status !== 'ACTIVE') return
    try {
      setBattle(await finishBattle(battle.battleId))
      setFeedback(null)
      setAnswering(false)
    } catch (requestError) {
      setError(requestError.message || 'Unable to finish this battle.')
    }
  }, [battle])

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
    } catch (requestError) {
      setError(requestError.message || 'Unable to refresh Battle Space.')
    }
  }

  const resultRank = battle?.ratingAfter
    ? rankFor(battle.ratingAfter)
    : lobby?.profile.rank

  return (
    <div className="min-h-svh bg-[#fbfcfd] text-[#111318] lg:grid lg:grid-cols-[164px_minmax(0,1fr)]">
      <HomeSidebar
        name={session?.fullname}
        onNavigate={onNavigate}
        activePath="/battle-space"
      />

      <main className="min-w-0 px-[18px] pb-14 pt-7 sm:px-7 lg:px-8 lg:pt-8">
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
          />
        )}
        {view === 'matching' && matchingMode && (
          <BattleMatchmaking mode={matchingMode} onCancel={cancelMatching} />
        )}
        {view === 'battle' && battle && (
          <BattleArena
            battle={battle}
            user={{
              ...session,
              elo: lobby?.profile.elo,
            }}
            answering={answering}
            feedback={feedback}
            onAnswer={answer}
            onLeave={() => setConfirmLeave(true)}
            onTimeUp={endForTime}
          />
        )}
      </main>

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
          onNext={() => {
            setBattle(null)
            beginMatch(battle.mode)
          }}
          onLobby={returnToLobby}
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
    </div>
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
