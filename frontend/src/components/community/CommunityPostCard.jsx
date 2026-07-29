import { useState } from 'react'
import { BookOpen, MessageCircle, Send } from 'lucide-react'
import CommunityAvatar from '@/components/community/CommunityAvatar.jsx'
import RelativeTime from '@/components/community/RelativeTime.jsx'

function CommunityPostCard({
  post,
  commenting,
  onComment,
  onAuthorClick,
}) {
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comment, setComment] = useState('')

  async function submitComment(event) {
    event.preventDefault()
    if (!comment.trim() || commenting) return
    const saved = await onComment(post.postId, comment)
    if (saved) {
      setComment('')
      setCommentsOpen(true)
    }
  }

  return (
    <article className="rounded-[8px] border border-[#dfe3e8] bg-white p-4">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onAuthorClick(post.author.userId)}
          className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8a33d]"
          aria-label={`View ${post.author.fullname}'s profile`}
        >
          <CommunityAvatar author={post.author} />
        </button>
        <button
          type="button"
          onClick={() => onAuthorClick(post.author.userId)}
          className="min-w-0 text-left"
        >
          <p className="truncate text-[12px] font-semibold text-[#20242b]">
            {post.author.fullname}
          </p>
          <p className="mt-0.5 text-[10px] text-[#858c99]">
            {post.postType.charAt(0) +
              post.postType.slice(1).toLowerCase()}{' '}
            {' | '}
            <RelativeTime value={post.createdAt} />
          </p>
        </button>
      </header>

      {post.postType === 'QUESTION' && (
        <h3 className="mt-4 font-sans text-[15px] font-semibold leading-6 text-[#20242b]">
          {post.content}
        </h3>
      )}

      {post.postType === 'VERSE' && post.verse && (
        <div className="mt-4 border-l-2 border-[#d9a052] bg-[#fdfaf5] px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#99651f]">
            <BookOpen className="h-3.5 w-3.5" />
            {post.verse.reference}
          </div>
          <blockquote className="mt-2 text-[13px] leading-6 text-[#303641]">
            “{post.verse.text}”
          </blockquote>
        </div>
      )}

      {post.postType === 'PHOTO' && post.photoUrl && (
        <div className="mt-4 flex max-h-[680px] w-full justify-center overflow-hidden rounded-[7px] bg-[#f1f2f3]">
          <img
            src={post.photoUrl}
            alt={post.content || 'Community post'}
            className="h-auto max-h-[680px] w-auto max-w-full object-contain"
          />
        </div>
      )}

      {post.postType !== 'QUESTION' && post.content && (
        <p className="mt-3 whitespace-pre-wrap text-[12px] leading-6 text-[#424a58]">
          {post.content}
        </p>
      )}

      <div className="mt-4 flex items-center border-t border-[#eceef1] pt-3">
        <button
          type="button"
          onClick={() => setCommentsOpen((current) => !current)}
          className="flex h-8 items-center gap-2 rounded-[6px] px-2 text-[11px] font-medium text-[#626b7b] hover:bg-[#f6f7f8]"
          aria-expanded={commentsOpen}
        >
          <MessageCircle className="h-4 w-4" strokeWidth={1.7} />
          {post.comments.length
            ? `${post.comments.length} comment${post.comments.length === 1 ? '' : 's'}`
            : 'Comment'}
        </button>
      </div>

      {commentsOpen && (
        <div className="mt-3 border-t border-[#f0f1f2] pt-3">
          {post.comments.length > 0 && (
            <div className="space-y-3 pb-3">
              {post.comments.map((item) => (
                <div key={item.commentId} className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => onAuthorClick(item.author.userId)}
                    className="h-7 w-7 shrink-0 rounded-full"
                    aria-label={`View ${item.author.fullname}'s profile`}
                  >
                    <CommunityAvatar author={item.author} size="sm" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <p className="truncate text-[11px] font-semibold">
                        {item.author.fullname}
                      </p>
                      <span className="text-[9px] text-[#949aa5]">
                        <RelativeTime value={item.createdAt} />
                      </span>
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap text-[11px] leading-5 text-[#4e5665]">
                      {item.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={submitComment} className="flex gap-2">
            <input
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={600}
              placeholder="Write a comment..."
              className="h-9 min-w-0 flex-1 rounded-[7px] border border-[#e0e3e8] bg-[#fafafa] px-3 text-[11px] outline-none focus:border-[#d3ab70]"
            />
            <button
              type="submit"
              disabled={!comment.trim() || commenting}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] bg-[#d99a3e] text-white hover:bg-[#c9892f] disabled:bg-[#e8e5e0]"
              aria-label="Post comment"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </article>
  )
}

export default CommunityPostCard
