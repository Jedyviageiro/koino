const AUTH_STORAGE_KEY = 'koino.auth'
export const AUTH_LOGOUT_EVENT = 'koino:logout'

export function saveAuthSession(session) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function updateAuthSession(changes) {
  const current = getAuthSession()
  if (!current) return
  saveAuthSession({ ...current, ...changes })
}

export function getAuthSession() {
  const storedSession = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!storedSession) {
    return null
  }

  try {
    return JSON.parse(storedSession)
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function getAuthToken() {
  const token = getAuthSession()?.token || null
  if (!token) return null
  if (isJwtExpired(token)) {
    clearAuthSession()
    window.queueMicrotask(notifyLoggedOut)
    return null
  }
  return token
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function notifyLoggedOut() {
  window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT))
}

function isJwtExpired(token) {
  try {
    const payload = token.split('.')[1]
    if (!payload) return true
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const decoded = JSON.parse(window.atob(padded))
    return !decoded.exp || decoded.exp * 1000 <= Date.now()
  } catch {
    return true
  }
}
