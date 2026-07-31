import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, LoaderCircle, MessageCircle, Search, Send } from 'lucide-react'
import {
  AppPageLayout,
  PageHeader,
} from '@/components/common/AppPageLayout.jsx'
import CommunityAvatar from '@/components/community/CommunityAvatar.jsx'
import StatusModal from '@/components/auth/shared/StatusModal.jsx'
import UserProfileModal from '@/components/community/UserProfileModal.jsx'
import {
  getChatFriends,
  getConversation,
  sendChatMessage,
} from '@/features/chat/chatService.js'
import {
  getAuthSession,
  getAuthToken,
} from '@/features/auth/authStorage.js'

function ChatPage({ onNavigate }) {
  const session = getAuthSession()
  const [friends, setFriends] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [profileUserId, setProfileUserId] = useState(null)
  const endRef = useRef(null)

  const selectedFriend = friends.find((friend) => friend.userId === selectedId)

  const refreshFriends = useCallback(async () => {
    const result = await getChatFriends()
    setFriends(result)
    setSelectedId((current) =>
      current && result.some((friend) => friend.userId === current)
        ? current
        : result[0]?.userId || null,
    )
    return result
  }, [])

  useEffect(() => {
    if (!getAuthToken()) {
      onNavigate('/')
      return undefined
    }
    let active = true
    Promise.resolve()
      .then(() => refreshFriends())
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || 'Unable to load your conversations.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    const timer = window.setInterval(() => {
      refreshFriends().catch(() => {})
    }, 10000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [onNavigate, refreshFriends])

  useEffect(() => {
    if (!selectedId) return undefined
    let active = true

    async function refreshConversation() {
      try {
        const result = await getConversation(selectedId)
        if (active) setMessages(result)
      } catch (requestError) {
        if (active) {
          setError(requestError.message || 'Unable to load this conversation.')
        }
      }
    }

    refreshConversation()
    const timer = window.setInterval(refreshConversation, 3000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [selectedId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, selectedId])

  const visibleFriends = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return friends
    return friends.filter((friend) =>
      `${friend.fullname} ${friend.username}`.toLowerCase().includes(needle),
    )
  }, [friends, query])

  async function submit(event) {
    event.preventDefault()
    const body = draft.trim()
    if (!body || !selectedId || sending) return
    setSending(true)
    try {
      const sent = await sendChatMessage(selectedId, body)
      setMessages((current) => [...current, sent])
      setDraft('')
      await refreshFriends()
    } catch (requestError) {
      setError(requestError.message || 'Unable to send this message.')
    } finally {
      setSending(false)
    }
  }

  return (
    <AppPageLayout
      name={session?.fullname}
      onNavigate={onNavigate}
      activePath="/chat"
    >
      <PageHeader
        title="Chat"
        subtitle="Private conversations with your Koino friends."
      />

      <section className="grid min-h-[620px] overflow-hidden rounded-[8px] border border-[#dfe3e8] bg-white md:grid-cols-[280px_minmax(0,1fr)]">
        <aside
          className={`border-r border-[#e6e8eb] ${
            selectedFriend ? 'hidden md:block' : 'block'
          }`}
        >
          <div className="border-b border-[#e8eaed] px-4 py-4">
            <h2 className="font-sans text-[13px] font-semibold">
              Messages
            </h2>
            <label className="mt-3 flex h-9 items-center gap-2 rounded-[7px] border border-[#e1e4e8] px-3">
              <Search className="h-3.5 w-3.5 text-[#7a8290]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search friends"
                className="min-w-0 flex-1 bg-transparent text-[10px] outline-none"
              />
            </label>
          </div>

          <div className="max-h-[540px] overflow-y-auto p-2">
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <LoaderCircle className="h-5 w-5 animate-spin text-[#d58c20]" />
              </div>
            ) : visibleFriends.length ? (
              visibleFriends.map((friend) => (
                <button
                  key={friend.userId}
                  type="button"
                  onClick={() => setSelectedId(friend.userId)}
                  className={`flex w-full items-center gap-3 rounded-[7px] px-3 py-3 text-left ${
                    selectedId === friend.userId
                      ? 'bg-[#fff7eb]'
                      : 'hover:bg-[#f7f8f9]'
                  }`}
                >
                  <CommunityAvatar author={friend} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[10px] font-semibold">
                        {friend.fullname}
                      </span>
                      {friend.lastMessageAt && (
                        <span className="shrink-0 text-[8px] text-[#939aa5]">
                          {formatConversationTime(friend.lastMessageAt)}
                        </span>
                      )}
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-2">
                      <span className="truncate text-[9px] text-[#7a8290]">
                        {friend.lastMessage || 'Start a conversation'}
                      </span>
                      {friend.unreadCount > 0 && (
                        <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-[#e8a33d] px-1 text-[7px] font-bold text-white">
                          {friend.unreadCount}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <div className="px-5 py-12 text-center">
                <MessageCircle className="mx-auto h-5 w-5 text-[#9aa1ac]" />
                <p className="mt-3 text-[10px] leading-5 text-[#757e8c]">
                  Your accepted friends will appear here.
                </p>
              </div>
            )}
          </div>
        </aside>

        <div className={`${selectedFriend ? 'flex' : 'hidden md:flex'} min-w-0 flex-col`}>
          {selectedFriend ? (
            <>
              <header className="flex h-[66px] shrink-0 items-center gap-3 border-b border-[#e8eaed] px-4 sm:px-5">
                <button
                  type="button"
                  onClick={() => {
                    setMessages([])
                    setSelectedId(null)
                  }}
                  className="flex h-8 w-8 items-center justify-center md:hidden"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setProfileUserId(selectedFriend.userId)}
                  className="flex min-w-0 items-center gap-3 rounded-[7px] p-1 text-left transition-colors hover:bg-[#f5f6f7]"
                  aria-label={`View ${selectedFriend.fullname}'s profile`}
                >
                  <CommunityAvatar author={selectedFriend} size="md" />
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-semibold">
                      {selectedFriend.fullname}
                    </span>
                    <span className="mt-0.5 block text-[8px] text-[#818996]">
                      @{selectedFriend.username}
                    </span>
                  </span>
                </button>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto bg-[#fdfdfd] px-4 py-5 sm:px-6">
                {groupMessages(messages).map((group) => (
                  <div key={group.date} className="mb-5">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="h-px flex-1 bg-[#eceef1]" />
                      <span className="text-[8px] font-medium text-[#9198a4]">
                        {group.label}
                      </span>
                      <span className="h-px flex-1 bg-[#eceef1]" />
                    </div>
                    <div className="space-y-2.5">
                      {group.messages.map((message) => {
                        const mine = message.senderId === session?.id
                        return (
                          <div
                            key={message.messageId}
                            className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[78%] rounded-[10px] px-3.5 py-2.5 ${
                                mine
                                  ? 'bg-[#17634e] text-white'
                                  : 'bg-[#f0f1f2] text-[#292e36]'
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words text-[10px] leading-5">
                                {message.body}
                              </p>
                              <p
                                className={`mt-1 text-right text-[7px] ${
                                  mine ? 'text-white/70' : 'text-[#858d99]'
                                }`}
                              >
                                {formatMessageTime(message.sentAt)}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              <form
                onSubmit={submit}
                className="flex shrink-0 items-end gap-2 border-t border-[#e8eaed] bg-white p-4"
              >
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      submit(event)
                    }
                  }}
                  maxLength={2000}
                  rows={1}
                  placeholder="Type a message"
                  className="min-h-10 max-h-28 flex-1 resize-none rounded-[8px] border border-[#dfe3e8] px-3.5 py-2.5 text-[10px] leading-5 outline-none focus:border-[#e8a33d]"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#17634e] text-white disabled:opacity-40"
                  aria-label="Send message"
                >
                  {sending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <MessageCircle className="h-7 w-7 text-[#a0a7b1]" />
              <h2 className="mt-4 font-sans text-[14px] font-semibold">
                Select a friend
              </h2>
              <p className="mt-2 text-[10px] text-[#7a8290]">
                Choose a conversation from the left.
              </p>
            </div>
          )}
        </div>
      </section>

      {error && (
        <StatusModal
          type="error"
          title="Chat unavailable"
          message={error}
          onClose={() => setError('')}
        />
      )}
      {profileUserId && (
        <UserProfileModal
          userId={profileUserId}
          onClose={() => setProfileUserId(null)}
          onNavigate={onNavigate}
          onChallenge={(profile) =>
            onNavigate(`/battle-space?challenge=${profile.userId}`)
          }
        />
      )}
    </AppPageLayout>
  )
}

function groupMessages(messages) {
  const groups = new Map()
  messages.forEach((message) => {
    const date = new Date(message.sentAt)
    const key = date.toISOString().slice(0, 10)
    if (!groups.has(key)) {
      groups.set(key, {
        date: key,
        label: formatDay(date),
        messages: [],
      })
    }
    groups.get(key).messages.push(message)
  })
  return Array.from(groups.values())
}

function formatDay(date) {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function formatConversationTime(value) {
  const date = new Date(value)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) {
    return formatMessageTime(value)
  }
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function formatMessageTime(value) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export default ChatPage
