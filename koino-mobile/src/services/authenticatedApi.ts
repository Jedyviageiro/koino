import { clearAuthSession, getAuthSession, saveAuthSession } from '@/features/auth/authStorage';
import type { AuthSession } from '@/features/auth/types';

import { ApiError, apiRequest } from './api';

let refreshRequest: Promise<AuthSession> | null = null;

async function refreshSession(session: AuthSession) {
  if (!session.refreshToken) throw new ApiError('Your session has expired. Please log in again.', 401);
  if (!refreshRequest) {
    refreshRequest = apiRequest<AuthSession>('/users/token/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    })
      .then(async (fresh) => {
        const next = { ...session, ...fresh };
        await saveAuthSession(next);
        return next;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
}

export async function authenticatedRequest<T>(path: string, options: RequestInit = {}) {
  const session = await getAuthSession();
  if (!session?.token) throw new ApiError('Please log in to continue.', 401);

  try {
    return await apiRequest<T>(path, {
      ...options,
      headers: { ...Object.fromEntries(new Headers(options.headers).entries()), Authorization: `Bearer ${session.token}` },
    });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    try {
      const fresh = await refreshSession(session);
      return await apiRequest<T>(path, {
        ...options,
        headers: { ...Object.fromEntries(new Headers(options.headers).entries()), Authorization: `Bearer ${fresh.token}` },
      });
    } catch (refreshError) {
      if (refreshError instanceof ApiError && refreshError.status === 401) {
        await clearAuthSession();
      }
      throw refreshError instanceof Error
        ? refreshError
        : new ApiError('Your session has expired. Please log in again.', 401);
    }
  }
}
