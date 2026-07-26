import { apiRequest } from '@/services/api/client.js'

export function getCommunityPosts(type = 'ALL') {
  return apiRequest(`/community/posts?type=${encodeURIComponent(type)}`)
}

export function createCommunityPost({ postType, content, verseId = null }) {
  return apiRequest('/community/posts', {
    method: 'POST',
    body: JSON.stringify({ postType, content, verseId }),
  })
}

export function createCommunityPhotoPost(file, caption) {
  const body = new FormData()
  body.append('file', file)
  body.append('caption', caption || '')

  return apiRequest('/community/posts/photo', {
    method: 'POST',
    body,
  })
}

export function addCommunityComment(postId, content) {
  return apiRequest(`/community/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}
