const AUTH_STORAGE_KEY = 'koino.auth'

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
  return getAuthSession()?.token || null
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}
