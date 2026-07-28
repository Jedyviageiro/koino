import { useEffect, useState } from 'react'
import { CheckCircle2, LoaderCircle, MailCheck } from 'lucide-react'
import AuthLayout from '@/components/auth/shared/AuthLayout.jsx'
import {
  confirmEmail,
  resendVerification,
} from '@/features/auth/authService.js'

function VerifyEmailPage({ onNavigate }) {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token') || ''
  const email = params.get('email') || ''
  const [state, setState] = useState(token ? 'verifying' : 'waiting')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) return
    let active = true
    confirmEmail(token)
      .then((response) => {
        if (active) {
          setState('verified')
          setMessage(response.message)
        }
      })
      .catch((error) => {
        if (active) {
          setState('error')
          setMessage(error.message)
        }
      })
    return () => {
      active = false
    }
  }, [token])

  async function resend() {
    setState('sending')
    try {
      const response = await resendVerification(email)
      setState('waiting')
      setMessage(response.message)
    } catch (error) {
      setState('error')
      setMessage(error.message)
    }
  }

  const verified = state === 'verified'

  return (
    <AuthLayout
      mode="login"
      title={verified ? 'Email verified.' : 'Verify your email address.'}
      subtitle={
        verified
          ? 'Your Koino account is ready.'
          : `We sent a secure confirmation link${email ? ` to ${email}` : ''}.`
      }
      onNavigate={onNavigate}
      hideSwitcher
    >
      <div className="mt-8">
        <div className="flex h-20 items-center justify-center rounded-[11px] bg-[#fff8ed]">
          {state === 'verifying' || state === 'sending' ? (
            <LoaderCircle className="h-7 w-7 animate-spin text-[#d8922e]" />
          ) : verified ? (
            <CheckCircle2 className="h-8 w-8 text-[#217a45]" />
          ) : (
            <MailCheck className="h-8 w-8 text-[#d8922e]" />
          )}
        </div>
        <div
          className={`min-h-[58px] pt-4 text-[10px] leading-5 ${
            state === 'error' ? 'text-[#c73434]' : 'text-[#6f747d]'
          }`}
          aria-live="polite"
        >
          {message || 'Open the email and select “Verify Email Address.”'}
        </div>
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="flex h-[47px] w-full items-center justify-center rounded-[11px] bg-[#e8a33d] text-[12px] font-semibold text-white hover:bg-[#d8922e]"
        >
          {verified ? 'Continue to Login' : 'Back to Login'}
        </button>
        {!verified && email && (
          <button
            type="button"
            disabled={state === 'sending'}
            onClick={resend}
            className="mt-4 h-9 w-full text-[10px] font-semibold text-[#555b66] disabled:opacity-50"
          >
            Resend verification email
          </button>
        )}
      </div>
    </AuthLayout>
  )
}

export default VerifyEmailPage
