import { apiRequest } from '@/services/api';
import { authenticatedRequest } from '@/services/authenticatedApi';
import { getCurrentLanguage } from '@/features/localization/language';

import type {
  BibleVerse,
  Bookmark,
  Devotional,
  DevotionalData,
  HomeData,
  Notification,
  PlansData,
  PlanTemplate,
  ReadingData,
  ReadingVerse,
  Streak,
  UserPlan,
  UserPlanTask,
  VerseOfDay,
} from './types';

export async function getHomeData(): Promise<HomeData> {
  const [plan, task, streak, notifications, bookmarks, verseOfDay] = await Promise.all([
    authenticatedRequest<UserPlan | null>('/plans/me/current'),
    authenticatedRequest<UserPlanTask | null>('/plans/me/today'),
    authenticatedRequest<Streak>('/users/me/streak'),
    authenticatedRequest<Notification[]>('/users/me/notifications'),
    authenticatedRequest<Bookmark[]>('/users/me/bookmarks'),
    authenticatedRequest<VerseOfDay>('/verse-of-day'),
  ]);
  return { plan, task, streak, notifications, bookmarks, verseOfDay };
}

export async function getPlansData(): Promise<PlansData> {
  const status = await authenticatedRequest<{ completed: boolean }>('/onboarding/status');
  if (!status.completed) return { route: [], userPlans: [], todayTask: null, needsOnboarding: true };
  const [userPlans, todayTask] = await Promise.all([
    authenticatedRequest<UserPlan[]>('/plans/me'),
    authenticatedRequest<UserPlanTask | null>('/plans/me/today'),
  ]);
  let route: PlanTemplate[];
  try {
    route = await authenticatedRequest<PlanTemplate[]>('/plans/me/route');
  } catch {
    route = await authenticatedRequest<PlanTemplate[]>('/plans');
  }
  return { route, userPlans, todayTask, needsOnboarding: false };
}

export async function getDevotionalData(): Promise<DevotionalData> {
  const [plan, task] = await Promise.all([
    authenticatedRequest<UserPlan | null>('/plans/me/current'),
    authenticatedRequest<UserPlanTask | null>('/plans/me/today'),
  ]);
  if (!task) return { plan, task: null, devotional: null };
  const devotional = await authenticatedRequest<Devotional>(`/plans/me/tasks/${task.taskId}/devotional`);
  return { plan, task, devotional };
}

async function getPassageVerses(passage: UserPlanTask['passages'][number]): Promise<ReadingVerse[]> {
  const version = getCurrentLanguage() === 'pt' ? 'NVI' : 'NIV';
  const verses = await apiRequest<BibleVerse[]>(
    `/bible/books/${encodeURIComponent(passage.bookTitle)}/chapters/${passage.chapterNumber}/verses?version=${version}`,
  );
  return verses
    .filter((verse) => verse.verseNumber >= passage.firstVerse && verse.verseNumber <= passage.lastVerse)
    .map((verse) => ({ ...verse, bookTitle: passage.bookTitle, chapterNumber: passage.chapterNumber }));
}

export async function getReadingData(): Promise<ReadingData> {
  const [plan, task, bookmarks] = await Promise.all([
    authenticatedRequest<UserPlan | null>('/plans/me/current'),
    authenticatedRequest<UserPlanTask | null>('/plans/me/today'),
    authenticatedRequest<Bookmark[]>('/users/me/bookmarks'),
  ]);
  if (!task) return { plan, task: null, verses: [], bookmarks };
  const groups = await Promise.all(task.passages.map(getPassageVerses));
  return { plan, task, verses: groups.flat(), bookmarks };
}

export function saveReadingProgress(taskId: number, verseIndex: number) {
  return authenticatedRequest<UserPlanTask>(`/plans/me/tasks/${taskId}/progress`, {
    method: 'PATCH',
    body: JSON.stringify({ verseIndex }),
  });
}

export function completeReading(taskId: number) {
  return authenticatedRequest<UserPlanTask>(`/plans/me/tasks/${taskId}/complete`, { method: 'PATCH' });
}

export function saveBookmark(verseId: number, highlightColor = '#FFF3DB') {
  return authenticatedRequest<Bookmark>(`/users/me/bookmarks/${verseId}`, {
    method: 'PUT',
    body: JSON.stringify({ highlightColor }),
  });
}

export function removeBookmark(verseId: number) {
  return authenticatedRequest<null>(`/users/me/bookmarks/${verseId}`, { method: 'DELETE' });
}

export function getBookmarks() { return authenticatedRequest<Bookmark[]>('/users/me/bookmarks'); }

export function getNotifications() {
  return authenticatedRequest<Notification[]>('/users/me/notifications');
}

export function markNotificationRead(notificationId: number) {
  return authenticatedRequest<Notification>(`/users/me/notifications/${notificationId}/read`, { method: 'PATCH' });
}

export function markAllNotificationsRead() {
  return authenticatedRequest<null>('/users/me/notifications/read', { method: 'PATCH' });
}

export function acceptFriendRequest(friendshipId: number) {
  return authenticatedRequest(`/users/me/friend-requests/${friendshipId}/accept`, { method: 'PATCH' });
}

export function rejectFriendRequest(friendshipId: number) {
  return authenticatedRequest<null>(`/users/me/friend-requests/${friendshipId}`, { method: 'DELETE' });
}
