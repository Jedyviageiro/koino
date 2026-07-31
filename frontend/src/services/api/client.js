import { API_BASE_URL } from '@/config/env.js'
import {
  clearAuthSession,
  getAuthToken,
  getAuthSession,
  getRefreshToken,
  isAuthTokenExpired,
  notifyLoggedOut,
  saveAuthSession,
} from '@/features/auth/authStorage.js'

export const STATUS_RETURN_PATH_KEY = 'koino.status.returnPath'
let serviceRedirectStarted = false
let refreshRequest = null

export class ApiError extends Error {
  constructor(message, status, payload = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

function notifyServiceUnavailable() {
  if (
    serviceRedirectStarted ||
    window.location.pathname === '/status'
  ) {
    return
  }
  serviceRedirectStarted = true
  sessionStorage.setItem(STATUS_RETURN_PATH_KEY, window.location.pathname)
  window.location.replace('/status')
}

function friendlyErrorMessage(payload, status) {
  if (status >= 500) {
    return 'Koino is temporarily unavailable. We are working to restore it.'
  }
  const message =
    typeof payload === 'object' && payload?.message
      ? payload.message
      : typeof payload === 'string'
        ? payload.trim()
        : ''
  const exposesInternalDetails =
    /(?:exception|stack\s*trace|org\.springframework|java\.|hibernate|jdbc|sqlstate|constraint|at\s+com\.koino|expected\s+\d+.*resolved\s+\d+)/i.test(
      message,
    )

  if (
    message &&
    !exposesInternalDetails &&
    !/<(?:html|body|head|title|h1)\b/i.test(message)
  ) {
    return message
  }
  return 'The request could not be completed. Please check your details and try again.'
}

export async function apiRequest(
  path,
  { authenticated = true, headers, _retried = false, ...options } = {},
) {
  const requestHeaders = new Headers(headers)
  let token = authenticated ? getAuthToken() : null

  if (
    authenticated &&
    token &&
    !isAuthTokenExpired(token) &&
    !getRefreshToken()
  ) {
    token = await upgradeLegacySession(token)
  }
  if (authenticated && token && isAuthTokenExpired(token)) {
    token = await refreshAccessToken()
  }

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }
  if (options.body && !(options.body instanceof FormData)) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: requestHeaders,
    })
  } catch (error) {
    notifyServiceUnavailable()
    throw new ApiError(
      'We could not connect to Koino. Please try again shortly.',
      0,
      error,
    )
  }

  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') || ''
  let payload
  try {
    payload = contentType.includes('application/json')
      ? await response.json()
      : await response.text()
  } catch {
    payload = null
  }

  if (!response.ok) {
    if (authenticated && token && response.status === 401 && !_retried) {
      const refreshedToken = await refreshAccessToken(token)
      if (refreshedToken && refreshedToken !== token) {
        return apiRequest(path, {
          authenticated,
          headers,
          _retried: true,
          ...options,
        })
      }
      expireSession(response.status, payload)
    }
    if (authenticated && response.status === 401) {
      expireSession(response.status, payload)
    }
    if (response.status >= 500) {
      notifyServiceUnavailable()
    }
    const message = friendlyErrorMessage(payload, response.status)
    throw new ApiError(message, response.status, payload)
  }

  return payload
}

async function upgradeLegacySession(token) {
  if (!refreshRequest) {
    refreshRequest = fetch(`${API_BASE_URL}/users/token/upgrade`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) expireSession(response.status)
        const upgraded = await response.json()
        saveAuthSession({ ...getAuthSession(), ...upgraded })
        return upgraded.token
      })
      .finally(() => {
        refreshRequest = null
      })
  }
  return refreshRequest
}

async function refreshAccessToken(rejectedToken = null) {
  const currentToken = getAuthToken()
  if (
    rejectedToken &&
    currentToken &&
    currentToken !== rejectedToken &&
    !isAuthTokenExpired(currentToken)
  ) {
    return currentToken
  }
  const refreshToken = getRefreshToken()
  if (!refreshToken) expireSession(401)
  if (!refreshRequest) {
    refreshRequest = fetch(`${API_BASE_URL}/users/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) expireSession(response.status)
        const refreshed = await response.json()
        saveAuthSession({ ...getAuthSession(), ...refreshed })
        return refreshed.token
      })
      .catch((error) => {
        if (error instanceof ApiError) throw error
        throw new ApiError('We could not renew your session.', 0, error)
      })
      .finally(() => {
        refreshRequest = null
      })
  }
  return refreshRequest
}

function expireSession(status = 401, payload = null) {
  clearAuthSession()
  notifyLoggedOut()
  throw new ApiError(
    'Your session expired. Please log in again.',
    status,
    payload,
  )
}
