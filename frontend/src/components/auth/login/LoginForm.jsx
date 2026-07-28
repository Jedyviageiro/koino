import { useCallback, useState } from 'react'
import { LoaderCircle, Mail } from 'lucide-react'
import { AuthField, PasswordField } from '@/components/auth/shared/AuthField.jsx'
import { login } from '@/features/auth/authService.js'
import { useEmailExistence } from '@/features/auth/useEmailExistence.js'
import GoogleSignInButton from '@/components/auth/shared/GoogleSignInButton.jsx'

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
  const completeLogin = useCallback(
    (session) => {
      setSuccessMessage(`Welcome back, ${session.fullname}.`)
      onNavigate(session.onboardingCompleted ? '/home' : '/onboarding')
    },
    [onNavigate],
  )

  async function handleSubmit(event) {
    event.preventDefault()
    setSuccessMessage('')
    setIsSubmitting(true)

    try {
      const session = await login({ email: email.trim(), password })
      completeLogin(session)
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
          <button
            type="button"
            onClick={() => onNavigate('/forgot-password')}
            className="text-[11px] font-medium text-[#696d75] hover:text-[#111114] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8a33d]"
          >
            Forgot password?
          </button>
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
          className="flex h-[47px] w-full items-center justify-center gap-2 rounded-[11px] bg-[#e8a33d] text-[12px] font-semibold text-white transition-colors hover:bg-[#d8922e] active:bg-[#bf7416] disabled:cursor-not-allowed disabled:bg-[#f2dfbf]"
        >
          {isSubmitting && (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {isSubmitting ? 'Logging in' : 'Log In'}
        </button>

        <div className="my-[18px] flex items-center gap-4 text-[10px] text-[#7d8189] before:h-px before:flex-1 before:bg-[#e2e3e6] after:h-px after:flex-1 after:bg-[#e2e3e6]">
          or
        </div>

        <GoogleSignInButton
          onSuccess={completeLogin}
          onFailure={onFailure}
        />
      </form>

      <p className="mt-5 text-center text-[10px] text-[#777b84]">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={() => onNavigate('/register')}
          className="font-semibold text-[#111114] hover:text-[#b27413]"
        >
          Sign Up
        </button>
      </p>
    </>
  )
}

export default LoginForm
