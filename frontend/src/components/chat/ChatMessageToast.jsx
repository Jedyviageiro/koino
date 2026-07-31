import { useEffect, useRef, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import AppToast from '@/components/common/AppToast.jsx'
import { getAuthToken } from '@/features/auth/authStorage.js'
import { getChatFriends } from '@/features/chat/chatService.js'
import { playIncomingMessageSound } from '@/features/chat/chatAudio.js'

function ChatMessageToast({ onNavigate }) {
  const [message, setMessage] = useState(null)
  const latestIds = useRef(new Map())
  const initialized = useRef(false)

  useEffect(() => {
    if (!getAuthToken()) return undefined
    let active = true

    async function refresh() {
      const friends = await getChatFriends()
      if (!active) return

      if (initialized.current) {
        const incoming = friends
          .filter(
            (friend) =>
              friend.lastMessageId &&
              friend.lastMessageSenderId === friend.userId &&
              latestIds.current.get(friend.userId) !== friend.lastMessageId,
          )
          .sort(
            (left, right) =>
              new Date(right.lastMessageAt) - new Date(left.lastMessageAt),
          )[0]
        if (incoming) {
          setMessage(incoming)
          playIncomingMessageSound()
        }
      }

      friends.forEach((friend) => {
        if (friend.lastMessageId) {
          latestIds.current.set(friend.userId, friend.lastMessageId)
        }
      })
      initialized.current = true
    }

    Promise.resolve().then(refresh).catch(() => {})
    const timer = window.setInterval(() => refresh().catch(() => {}), 4000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])

  if (!message) return null
  return (
    <AppToast
      icon={MessageCircle}
      title={`New message from ${message.fullname}`}
      message={message.lastMessage}
      onClose={() => setMessage(null)}
      onOpen={() => {
        setMessage(null)
        onNavigate(`/chat?friend=${message.userId}`)
      }}
    />
  )
}

export default ChatMessageToast
