import { useEffect, useState } from 'react'
import { emailExists } from './authService.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function useEmailExistence(email) {
  const [result, setResult] = useState({ email: '', state: 'idle' })
  const normalizedEmail = email.trim().toLowerCase()
  const isValidEmail = emailPattern.test(normalizedEmail)

  useEffect(() => {
    if (!isValidEmail) return undefined

    const controller = new AbortController()

    const timer = window.setTimeout(async () => {
      setResult({ email: normalizedEmail, state: 'checking' })

      try {
        const response = await emailExists(normalizedEmail, controller.signal)
        setResult({
          email: normalizedEmail,
          state: response.exists ? 'exists' : 'available',
        })
      } catch (error) {
        if (error.name !== 'AbortError') {
          setResult({ email: normalizedEmail, state: 'unknown' })
        }
      }
    }, 450)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [isValidEmail, normalizedEmail])

  if (!isValidEmail) return 'idle'
  return result.email === normalizedEmail ? result.state : 'checking'
}
