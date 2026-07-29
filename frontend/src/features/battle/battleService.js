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

export function startMatchmaking(mode) {
  return apiRequest('/battles/matchmaking', {
    method: 'POST',
    body: JSON.stringify({ mode }),
  })
}

export function getMatchmaking(ticketId) {
  return apiRequest(`/battles/matchmaking/${ticketId}`)
}

export function getMatchmakingBot(ticketId) {
  return apiRequest(`/battles/matchmaking/${ticketId}/bot`, {
    method: 'POST',
  })
}

export function cancelMatchmaking(ticketId) {
  return apiRequest(`/battles/matchmaking/${ticketId}/cancel`, {
    method: 'POST',
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

export function createBattleChallenge(userId, mode) {
  return apiRequest('/battles/challenges', {
    method: 'POST',
    body: JSON.stringify({ userId, mode }),
  })
}

export function getBattleChallenge(challengeId) {
  return apiRequest(`/battles/challenges/${challengeId}`)
}

export function acceptBattleChallenge(challengeId) {
  return apiRequest(`/battles/challenges/${challengeId}/accept`, {
    method: 'POST',
  })
}

export function declineBattleChallenge(challengeId) {
  return apiRequest(`/battles/challenges/${challengeId}/decline`, {
    method: 'POST',
  })
}

export function cancelBattleChallenge(challengeId) {
  return apiRequest(`/battles/challenges/${challengeId}/cancel`, {
    method: 'POST',
  })
}
