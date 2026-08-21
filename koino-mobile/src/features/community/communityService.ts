import { apiRequest } from '@/services/api';
import { authenticatedRequest } from '@/services/authenticatedApi';

import type {
  BibleBook,
  BibleChapter,
  BibleVerseOption,
  CommunityComment,
  CommunityPost,
  CommunityPostType,
  CurrentUser,
} from './types';
import type { ReportReason } from '@/components/community/ReportModal';

export function getCommunityPosts(type: CommunityPostType | 'ALL' = 'ALL') {
  return authenticatedRequest<CommunityPost[]>(`/community/posts?type=${encodeURIComponent(type)}`);
}

export function getCurrentUser() {
  return authenticatedRequest<CurrentUser>('/users/me');
}

export function createCommunityPost(postType: CommunityPostType, content: string, verseId: number | null = null) {
  return authenticatedRequest<CommunityPost>('/community/posts', {
    method: 'POST',
    body: JSON.stringify({ postType, content: content.trim(), verseId }),
  });
}

export function createCommunityPhotoPost(uri: string, mimeType: string | null, fileName: string | null, caption: string) {
  const body = new FormData();
  body.append('file', { uri, type: mimeType || 'image/jpeg', name: fileName || `koino-${Date.now()}.jpg` } as unknown as Blob);
  body.append('caption', caption.trim());
  return authenticatedRequest<CommunityPost>('/community/posts/photo', { method: 'POST', body });
}

export function addCommunityComment(postId: number, content: string) {
  return authenticatedRequest<CommunityComment>(`/community/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content: content.trim() }),
  });
}

export function deleteCommunityPost(postId: number) {
  return authenticatedRequest<void>(`/community/posts/${postId}`, { method: 'DELETE' });
}

export function reportCommunityPost(postId: number, reason: ReportReason, details = '') {
  return authenticatedRequest<{ message: string }>(`/safety/reports/posts/${postId}`, { method: 'POST', body: JSON.stringify({ reason, details: details.trim() || null }) });
}

export function reportCommunityUser(userId: number, reason: ReportReason, details = '') {
  return authenticatedRequest<{ message: string }>(`/safety/reports/users/${userId}`, { method: 'POST', body: JSON.stringify({ reason, details: details.trim() || null }) });
}

export function blockCommunityUser(userId: number) {
  return authenticatedRequest<{ message: string }>(`/safety/blocks/${userId}`, { method: 'POST' });
}

export function unblockCommunityUser(userId: number) {
  return authenticatedRequest<{ message: string }>(`/safety/blocks/${userId}`, { method: 'DELETE' });
}

export function getBibleBooks() {
  return apiRequest<BibleBook[]>('/bible/books');
}

export function getBookChapters(bookId: number) {
  return apiRequest<BibleChapter[]>(`/bible/books/${bookId}/chapters`);
}

export function getChapterVerses(chapterId: number, version: string) {
  return apiRequest<BibleVerseOption[]>(`/bible/chapters/${chapterId}/verses?version=${encodeURIComponent(version)}`);
}
