import { useEffect, useState } from 'react'

function formatRelativeTime(value, now) {
  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) return 'Unknown time'

  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000))
  if (seconds < 60) return 'Just now'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`
  }

  const days = Math.floor(hours / 24)
  if (days < 7) {
    return days === 1 ? 'Yesterday' : `${days} days ago`
  }

  return new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function RelativeTime({ value }) {
  const [now, setNow] = useState(() => Date.now())
  const timestamp = Date.parse(value)
  const exactTime = Number.isFinite(timestamp)
    ? new Date(timestamp).toLocaleString()
    : 'Unknown time'

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <time dateTime={value} title={exactTime}>
      {formatRelativeTime(value, now)}
    </time>
  )
}

export default RelativeTime
