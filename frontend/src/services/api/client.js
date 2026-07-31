import { API_BASE_URL } from '@/config/env.js'
import {
  clearAuthSession,
  getAuthToken,
  notifyLoggedOut,
} from '@/features/auth/authStorage.js'

export const STATUS_RETURN_PATH_KEY = 'koino.status.returnPath'
let serviceRedirectStarted = false

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
  if (typeof payload === 'object' && payload?.message) {
    return payload.message
  }
  if (
    typeof payload === 'string' &&
    payload.trim() &&
    !/<(?:html|body|head|title|h1)\b/i.test(payload)
  ) {
    return payload
  }
  if (status >= 500) {
    return 'Koino is temporarily unavailable. We are working to restore it.'
  }
  return `The request could not be completed (${status}).`
}

export async function apiRequest(
  path,
  { authenticated = true, headers, ...options } = {},
) {
  const requestHeaders = new Headers(headers)
  const token = authenticated ? getAuthToken() : null

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
    if (authenticated && token && [401, 403].includes(response.status)) {
      clearAuthSession()
      notifyLoggedOut()
      throw new ApiError(
        'Your session expired. Please log in again.',
        response.status,
        payload,
      )
    }
    if (response.status >= 500) {
      notifyServiceUnavailable()
    }
    const message = friendlyErrorMessage(payload, response.status)
    throw new ApiError(message, response.status, payload)
  }

  return payload
}
