import { API_BASE_URL } from '@/config/env.js'
import { getAuthToken } from '@/features/auth/authStorage.js'

export class ApiError extends Error {
  constructor(message, status, payload = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: requestHeaders,
  })

  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message =
      typeof payload === 'string'
        ? payload
        : payload?.message || `Request failed with status ${response.status}`
    throw new ApiError(message, response.status, payload)
  }

  return payload
}
