import { apiRequest } from '@/services/api';

import { saveAuthSession } from './authStorage';
import type { AuthSession, RegistrationResult } from './types';

export async function login(email: string, password: string) {
  const session = await apiRequest<AuthSession>('/users/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), password }),
  });
  await saveAuthSession(session);
  return session;
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
  return session;
}
