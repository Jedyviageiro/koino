import { apiRequest } from '@/services/api/client.js'
import { saveAuthSession } from './authStorage.js'
import { apiLanguage, changeAppLanguage } from '@/i18n/index.js'

export async function login(credentials) {
  const session = await apiRequest('/users/login', {
    method: 'POST',
    authenticated: false,
    body: JSON.stringify(credentials),
  })

  saveAuthSession(session)
  await changeAppLanguage(session.language || 'en')
  const onboarding = await apiRequest('/onboarding/status')
  const authenticatedSession = {
    ...session,
    onboardingCompleted: onboarding.completed,
  }
  saveAuthSession(authenticatedSession)
  return authenticatedSession
}

export async function register(details) {
  return apiRequest('/users/register', {
    method: 'POST',
    authenticated: false,
    body: JSON.stringify({
      ...details,
      language: apiLanguage() === 'pt-BR' ? 'pt' : 'en',
    }),
  })
}

export async function emailExists(email, signal) {
  const query = new URLSearchParams({ email })
  return apiRequest(`/users/email-exists?${query}`, {
    method: 'GET',
    authenticated: false,
    signal,
  })
}

export async function getGoogleConfig() {
  return apiRequest('/users/google/config', {
    method: 'GET',
    authenticated: false,
  })
}

export async function loginWithGoogle(credential) {
  const session = await apiRequest('/users/login/google', {
    method: 'POST',
    authenticated: false,
    body: JSON.stringify({
      credential,
      language: apiLanguage() === 'pt-BR' ? 'pt' : 'en',
    }),
  })
  saveAuthSession(session)
  await changeAppLanguage(session.language || 'en')
  const onboarding = await apiRequest('/onboarding/status')
  const authenticatedSession = {
    ...session,
    onboardingCompleted: onboarding.completed,
  }
  saveAuthSession(authenticatedSession)
  return authenticatedSession
}

export async function confirmEmail(token) {
  return apiRequest('/users/verify-email/confirm', {
    method: 'POST',
    authenticated: false,
    body: JSON.stringify({ token }),
  })
}

export async function resendVerification(email) {
  return apiRequest('/users/verify-email/resend', {
    method: 'POST',
    authenticated: false,
    body: JSON.stringify({ email }),
  })
}

export async function requestPasswordReset(email) {
  return apiRequest('/users/resetPassword', {
    method: 'POST',
    authenticated: false,
    body: JSON.stringify({ email }),
  })
}

export async function resetPassword(token, newPassword, confirmPassword) {
  return apiRequest('/users/resetPassword/confirm', {
    method: 'POST',
    authenticated: false,
    body: JSON.stringify({ token, newPassword, confirmPassword }),
  })
}
