import { useState } from 'react'
import { LoaderCircle, Mail } from 'lucide-react'
import AuthLayout from '@/components/auth/shared/AuthLayout.jsx'
import { AuthField } from '@/components/auth/shared/AuthField.jsx'
import { requestPasswordReset } from '@/features/auth/authService.js'

function ForgotPasswordPage({ onNavigate }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    try {
      const response = await requestPasswordReset(email.trim())
      setMessage(response.message)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      mode="login"
      title="Reset your password."
      subtitle="We will email you a secure reset link."
      onNavigate={onNavigate}
      hideSwitcher
    >
      <form className="mt-8" onSubmit={submit}>
        <AuthField
          icon={Mail}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          autoComplete="email"
          maxLength={254}
          autoFocus
        />
        <div className="min-h-[70px] pt-3 text-[10px] leading-5 text-[#6f747d]" aria-live="polite">
          {message}
        </div>
        <button
          type="submit"
          disabled={!valid || loading}
          className="flex h-[47px] w-full items-center justify-center gap-2 rounded-[11px] bg-[#e8a33d] text-[12px] font-semibold text-white disabled:bg-[#f2dfbf]"
        >
          {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
          {loading ? 'Sending' : 'Send Reset Link'}
        </button>
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="mt-4 h-9 w-full text-[10px] font-semibold text-[#555b66]"
        >
          Back to Login
        </button>
      </form>
    </AuthLayout>
  )
}

export default ForgotPasswordPage
