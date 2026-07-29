import { useCallback, useEffect, useState } from 'react'
import { MessageCircleMore } from 'lucide-react'
import StatusModal from '@/components/auth/shared/StatusModal.jsx'
import CommunityComposer from '@/components/community/CommunityComposer.jsx'
import CommunityPostCard from '@/components/community/CommunityPostCard.jsx'
import UserProfileModal from '@/components/community/UserProfileModal.jsx'
import {
  AppPageLayout,
  PageHeader,
} from '@/components/common/AppPageLayout.jsx'
import { getAuthSession, getAuthToken } from '@/features/auth/authStorage.js'
import {
  addCommunityComment,
  createCommunityPhotoPost,
  createCommunityPost,
  getCommunityPosts,
} from '@/features/community/communityService.js'
import { apiRequest } from '@/services/api/client.js'

const filters = [
  { label: 'For You', value: 'ALL' },
  { label: 'Verses', value: 'VERSE' },
  { label: 'Questions', value: 'QUESTION' },
  { label: 'Photos', value: 'PHOTO' },
]

function CommunityPage({ onNavigate }) {
  const session = getAuthSession()
  const [user, setUser] = useState({
    userId: session?.userId,
    fullname: session?.fullname || 'Koino Reader',
    profilePictureUrl: session?.profilePictureUrl || '',
  })
  const [books, setBooks] = useState([])
  const [posts, setPosts] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [commentingPostId, setCommentingPostId] = useState(null)
  const [error, setError] = useState('')
  const [profileUserId, setProfileUserId] = useState(null)

  useEffect(() => {
    if (!getAuthToken()) {
      onNavigate('/')
      return
    }

    let active = true
    Promise.all([
      apiRequest('/users/me'),
      apiRequest('/bible/books', { authenticated: false }),
    ])
      .then(([currentUser, bibleBooks]) => {
        if (!active) return
        setUser(currentUser)
        setBooks(bibleBooks)
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || 'Unable to prepare the community.')
        }
      })

    return () => {
      active = false
    }
  }, [onNavigate])

  useEffect(() => {
    let active = true
    getCommunityPosts(filter)
      .then((result) => {
        if (active) setPosts(result)
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || 'Unable to load community posts.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [filter])

  const submitPost = useCallback(async ({ postType, content, verse, photo }) => {
    setPosting(true)
    try {
      const created =
        postType === 'PHOTO'
          ? await createCommunityPhotoPost(photo, content)
          : await createCommunityPost({
              postType,
              content,
              verseId: verse?.verseId || null,
            })
      if (filter !== 'ALL') {
        setLoading(true)
        setFilter('ALL')
      }
      setPosts((current) => [
        created,
        ...current.filter((post) => post.postId !== created.postId),
      ])
      return true
    } catch (requestError) {
      setError(requestError.message || 'Unable to publish this post.')
      return false
    } finally {
      setPosting(false)
    }
  }, [filter])

  async function submitComment(postId, content) {
    setCommentingPostId(postId)
    try {
      const saved = await addCommunityComment(postId, content)
      setPosts((current) =>
        current.map((post) =>
          post.postId === postId
            ? { ...post, comments: [...post.comments, saved] }
            : post,
        ),
      )
      return true
    } catch (requestError) {
      setError(requestError.message || 'Unable to post this comment.')
      return false
    } finally {
      setCommentingPostId(null)
    }
  }

  return (
    <AppPageLayout
      name={user.fullname}
      onNavigate={onNavigate}
      activePath="/community"
    >
          <PageHeader
            title="Community"
            subtitle="Share Scripture, ask questions, and encourage one another."
            className="mb-5"
          />

          <CommunityComposer
            user={user}
            books={books}
            posting={posting}
            onSubmit={submitPost}
          />

          <div className="mt-5 flex items-center gap-1 overflow-x-auto border-b border-[#e2e5e9]">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  if (item.value === filter) return
                  setLoading(true)
                  setFilter(item.value)
                }}
                className={`relative h-10 shrink-0 px-3 text-[11px] font-medium transition-colors ${
                  filter === item.value
                    ? 'text-[#8d5f20]'
                    : 'text-[#71798a] hover:text-[#252a32]'
                }`}
              >
                {item.label}
                {filter === item.value && (
                  <span className="absolute inset-x-3 bottom-0 h-0.5 bg-[#d99a3e]" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-3 space-y-3">
            {loading ? (
              Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  className="rounded-[8px] border border-[#e2e5e9] bg-white p-4"
                >
                  <div className="flex gap-3">
                    <span className="auth-skeleton h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="auth-skeleton h-3 w-32 rounded-[4px]" />
                      <div className="auth-skeleton h-3 w-20 rounded-[4px]" />
                    </div>
                  </div>
                  <div className="auth-skeleton mt-5 h-20 rounded-[7px]" />
                </div>
              ))
            ) : posts.length ? (
              posts.map((post) => (
                <CommunityPostCard
                  key={post.postId}
                  post={post}
                  commenting={commentingPostId === post.postId}
                  onComment={submitComment}
                  onAuthorClick={setProfileUserId}
                />
              ))
            ) : (
              <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f4eee5] text-[#956829]">
                  <MessageCircleMore className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <h2 className="mt-4 font-sans text-[14px] font-semibold">
                  Start the conversation
                </h2>
                <p className="mt-1.5 max-w-[320px] text-[11px] leading-5 text-[#747c8b]">
                  Share a verse, post a photo, or ask the community a question.
                </p>
              </div>
            )}
          </div>
      {error && (
        <StatusModal
          type="error"
          title="Community unavailable"
          message={error}
          onClose={() => setError('')}
        />
      )}

      {profileUserId && (
        <UserProfileModal
          userId={profileUserId}
          onClose={() => setProfileUserId(null)}
          onNavigate={onNavigate}
          onChallenge={(profile) => {
            setProfileUserId(null)
            onNavigate(`/battle-space?challenge=${profile.userId}`)
          }}
        />
      )}
    </AppPageLayout>
  )
}

export default CommunityPage
