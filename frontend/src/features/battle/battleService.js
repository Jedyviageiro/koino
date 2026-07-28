import { apiRequest } from '@/services/api/client.js'

export function getBattleLobby() {
  return apiRequest('/battles/lobby')
}

export function createBattle(mode) {
  return apiRequest('/battles', {
    method: 'POST',
    body: JSON.stringify({ mode }),
    signal:
      typeof AbortSignal.timeout === 'function'
        ? AbortSignal.timeout(12000)
        : undefined,
  })
}

export function getBattle(battleId) {
  return apiRequest(`/battles/${battleId}`)
}

export function answerBattleQuestion(battleId, questionId, selectedOption) {
  return apiRequest(`/battles/${battleId}/answers`, {
    method: 'POST',
    body: JSON.stringify({ questionId, selectedOption }),
  })
}

export function finishBattle(battleId, abandoned = false) {
  const query = new URLSearchParams({ abandoned: String(abandoned) })
  return apiRequest(`/battles/${battleId}/finish?${query}`, {
    method: 'POST',
  })
}
