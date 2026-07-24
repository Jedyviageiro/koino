import { apiRequest } from '@/services/api/client.js'
import { saveAuthSession } from './authStorage.js'

export async function login(credentials) {
  const session = await apiRequest('/users/login', {
    method: 'POST',
    authenticated: false,
    body: JSON.stringify(credentials),
  })

  saveAuthSession(session)
  return session
}

export async function register(details) {
  const session = await apiRequest('/users/register', {
    method: 'POST',
    authenticated: false,
    body: JSON.stringify(details),
  })

  saveAuthSession(session)
  return session
}

export async function emailExists(email, signal) {
  const query = new URLSearchParams({ email })
  return apiRequest(`/users/email-exists?${query}`, {
    method: 'GET',
    authenticated: false,
    signal,
  })
}
