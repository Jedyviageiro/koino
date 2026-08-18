import { apiRequest } from '@/services/api';

import { saveAuthSession } from './authStorage';
import type { AuthSession, RegistrationResult } from './types';

export async function login(email: string, password: string) {
  const session = await apiRequest<AuthSession>('/users/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), password }),
  });
  await saveAuthSession(session);
  return addOnboardingStatus(session);
}

export function register(fullname: string, email: string, password: string) {
  return apiRequest<RegistrationResult>('/users/register', {
    method: 'POST',
    body: JSON.stringify({
      fullname: fullname.trim(),
      email: email.trim(),
      password,
      language: 'en',
    }),
  });
}

export async function emailExists(email: string) {
  const query = encodeURIComponent(email.trim());
  return apiRequest<{ exists: boolean }>(`/users/email-exists?email=${query}`);
}

export function getGoogleConfig() {
  return apiRequest<{ clientId: string }>('/users/google/config');
}

export async function loginWithGoogle(credential: string) {
  const session = await apiRequest<AuthSession>('/users/login/google', {
    method: 'POST',
    body: JSON.stringify({ credential, language: 'en' }),
  });
  await saveAuthSession(session);
  return addOnboardingStatus(session);
}

async function addOnboardingStatus(session: AuthSession) {
  const status = await apiRequest<{ completed: boolean }>('/onboarding/status', {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  const authenticatedSession = { ...session, onboardingCompleted: status.completed };
  await saveAuthSession(authenticatedSession);
  return authenticatedSession;
}

export function confirmEmail(token: string) {
  return apiRequest<{ message: string }>('/users/verify-email/confirm', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export function resendVerification(email: string) {
  return apiRequest<{ message: string }>('/users/verify-email/resend', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim() }),
  });
}

export function requestPasswordReset(email: string) {
  return apiRequest<{ message: string }>('/users/resetPassword', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim() }),
  });
}

export function resetPassword(token: string, newPassword: string, confirmPassword: string) {
  return apiRequest<null>('/users/resetPassword/confirm', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword, confirmPassword }),
  });
}
