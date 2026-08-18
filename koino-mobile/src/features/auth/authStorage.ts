import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { AuthSession } from './types';

const AUTH_STORAGE_KEY = 'koino.auth';

export async function saveAuthSession(session: AuthSession) {
  const serialized = JSON.stringify(session);
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(AUTH_STORAGE_KEY, serialized);
    return;
  }
  await SecureStore.setItemAsync(AUTH_STORAGE_KEY, serialized);
}

export async function getAuthSession(): Promise<AuthSession | null> {
  const serialized =
    Platform.OS === 'web'
      ? globalThis.localStorage?.getItem(AUTH_STORAGE_KEY)
      : await SecureStore.getItemAsync(AUTH_STORAGE_KEY);

  if (!serialized) return null;
  try {
    return JSON.parse(serialized) as AuthSession;
  } catch {
    await clearAuthSession();
    return null;
  }
}

export async function clearAuthSession() {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
}
