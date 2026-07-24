import { useState } from 'react'
import { LoaderCircle, Mail } from 'lucide-react'
import { AuthField, PasswordField } from '@/components/auth/shared/AuthField.jsx'
import { login } from '@/features/auth/authService.js'
import { useEmailExistence } from '@/features/auth/useEmailExistence.js'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.89c2.28-2.1 3.54-5.2 3.54-8.66Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.89-3.02c-1.08.72-2.46 1.15-4.04 1.15-3.1 0-5.73-2.1-6.67-4.92H1.32v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.33 14.31A7.2 7.2 0 0 1 4.96 12c0-.8.14-1.58.37-2.31V6.6H1.32A12 12 0 0 0 0 12c0 1.94.47 3.77 1.32 5.4l4.01-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.94 1.19 15.23 0 12 0 7.31 0 3.26 2.7 1.32 6.6l4.01 3.09C6.27 6.87 8.9 4.77 12 4.77Z"
      />
    </svg>
  )
}

function LoginForm({ onNavigate, onFailure }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const emailState = useEmailExistence(email)
  const emailValidationState =
    emailState === 'exists'
      ? 'valid'
      : emailState === 'available'
        ? 'invalid'
        : emailState

  async function handleSubmit(event) {
    event.preventDefault()
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      const session = await login({ email: email.trim(), password })
      setSuccessMessage(`Welcome back, ${session.fullname}.`)
    } catch (requestError) {
      onFailure(requestError.message || 'Unable to log in. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <form className="mt-[18px]" onSubmit={handleSubmit}>
        <div className="space-y-2.5">
          <AuthField
            icon={Mail}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            autoComplete="email"
            disabled={isSubmitting}
            validationState={emailValidationState}
            autoFocus
          />
          <PasswordField
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            disabled={isSubmitting}
          />
        </div>

        <div className="mt-2.5 flex justify-end">
          <a
            href="/forgot-password"
            className="text-[11px] font-medium text-[#696d75] hover:text-[#111114] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e55e5]"
          >
            Forgot password?
          </a>
        </div>

        <div
          className="min-h-7 pt-1.5 text-center text-[11px] leading-4"
          aria-live="polite"
        >
          {successMessage && <p className="text-[#217a45]">{successMessage}</p>}
        </div>

        <button
          type="submit"
          disabled={
            isSubmitting ||
            !isEmailValid ||
            emailState === 'checking' ||
            emailState === 'available' ||
            password.length < 6
          }
          className="flex h-[47px] w-full items-center justify-center gap-2 rounded-[11px] bg-[#1e55e5] text-[12px] font-semibold text-white transition-colors hover:bg-[#194bcf] active:bg-[#1542ba] disabled:cursor-not-allowed disabled:bg-[#dce3f9]"
        >
          {isSubmitting && (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {isSubmitting ? 'Logging in' : 'Log In'}
        </button>

        <div className="my-[18px] flex items-center gap-4 text-[10px] text-[#7d8189] before:h-px before:flex-1 before:bg-[#e2e3e6] after:h-px after:flex-1 after:bg-[#e2e3e6]">
          or
        </div>

        <button
          type="button"
          onClick={() =>
            onFailure('Google sign-in has not been configured yet.')
          }
          className="flex h-[45px] w-full items-center justify-center gap-2.5 rounded-[11px] border border-[#dedfe3] bg-white text-[12px] font-semibold text-[#111114] transition-colors hover:bg-[#f8f8f9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e55e5]"
        >
          <GoogleIcon />
          Continue with Google
        </button>
      </form>

      <p className="mt-5 text-center text-[10px] text-[#777b84]">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={() => onNavigate('/register')}
          className="font-semibold text-[#111114] hover:text-[#1e55e5]"
        >
          Sign Up
        </button>
      </p>
    </>
  )
}

export default LoginForm
