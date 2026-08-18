import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { authenticatedRequest } from '@/services/authenticatedApi';
import type { LocalPreferences, PublicProfile, UserSettings } from './types';

const LOCAL_KEY = 'koino.preferences';
const defaults: LocalPreferences = {
  pushMessages: true, pushMentions: true, planReminders: true,
  communityActivity: false, newFollowers: true, emailNotifications: true, weeklySummary: true,
};

export function getSettings() { return authenticatedRequest<UserSettings>('/users/me/settings'); }
export function updateSettings(settings: Omit<UserSettings, 'id' | 'profilePictureUrl' | 'friendCode'>) {
  return authenticatedRequest<UserSettings>('/users/me/settings', { method: 'PATCH', body: JSON.stringify(settings) });
}
export function deactivateAccount() { return authenticatedRequest<null>('/users/me/deactivate', { method: 'PATCH' }); }
export function uploadProfilePicture(uri: string, mimeType: string | null, fileName: string | null) {
  const body = new FormData();
  body.append('file', { uri, type: mimeType || 'image/jpeg', name: fileName || `profile-${Date.now()}.jpg` } as unknown as Blob);
  return authenticatedRequest<{ profilePictureUrl: string }>('/users/me/profile-picture', { method: 'PUT', body });
}
export function removeProfilePicture() { return authenticatedRequest<null>('/users/me/profile-picture', { method: 'DELETE' }); }
export function getPublicProfileByFriendCode(friendCode: string) {
  const normalized = friendCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return authenticatedRequest<PublicProfile>(`/users/me/friend-code/${encodeURIComponent(normalized)}`);
}
export function requestFriend(userId: number) { return authenticatedRequest(`/users/me/friend-requests/${userId}`, { method: 'POST' }); }

export async function getLocalPreferences(): Promise<LocalPreferences> {
  const stored = Platform.OS === 'web' ? globalThis.localStorage?.getItem(LOCAL_KEY) : await SecureStore.getItemAsync(LOCAL_KEY);
  if (!stored) return defaults;
  try { return { ...defaults, ...JSON.parse(stored) as Partial<LocalPreferences> }; } catch { return defaults; }
}
export async function saveLocalPreferences(value: LocalPreferences) {
  const serialized = JSON.stringify(value);
  if (Platform.OS === 'web') globalThis.localStorage?.setItem(LOCAL_KEY, serialized);
  else await SecureStore.setItemAsync(LOCAL_KEY, serialized);
}
