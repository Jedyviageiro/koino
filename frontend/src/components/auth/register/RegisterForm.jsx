import { useState } from 'react'
import { LoaderCircle, Mail, UserRound } from 'lucide-react'
import { AuthField, PasswordField } from '@/components/auth/shared/AuthField.jsx'
import { register } from '@/features/auth/authService.js'
import { useEmailExistence } from '@/features/auth/useEmailExistence.js'

function RegisterForm({ onNavigate, onSuccess, onFailure }) {
  const [fullname, setFullname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const emailState = useEmailExistence(email)
  const emailValidationState =
    emailState === 'exists'
      ? 'invalid'
      : emailState === 'available'
        ? 'valid'
        : emailState

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const session = await register({
        fullname: fullname.trim(),
        email: email.trim(),
        password,
      })
      onSuccess(session)
    } catch (requestError) {
      onFailure(
        requestError.message ||
          'Unable to create your account. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <form className="mt-[18px]" onSubmit={handleSubmit}>
        <div className="space-y-2.5">
          <AuthField
            icon={UserRound}
            value={fullname}
            onChange={(event) => setFullname(event.target.value)}
            placeholder="Full name"
            autoComplete="name"
            minLength={2}
            disabled={isSubmitting}
            autoFocus
          />
          <AuthField
            icon={Mail}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email address"
            autoComplete="email"
            disabled={isSubmitting}
            validationState={emailValidationState}
          />
          <PasswordField
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            disabled={isSubmitting}
          />
        </div>

        <button
          type="submit"
          disabled={
            isSubmitting ||
            fullname.trim().length < 2 ||
            !isEmailValid ||
            emailState === 'checking' ||
            emailState === 'exists' ||
            password.length < 6
          }
          className="mt-7 flex h-[47px] w-full items-center justify-center gap-2 rounded-[11px] bg-[#1e55e5] text-[12px] font-semibold text-white transition-colors hover:bg-[#194bcf] active:bg-[#1542ba] disabled:cursor-not-allowed disabled:bg-[#dce3f9]"
        >
          {isSubmitting && (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {isSubmitting ? 'Creating account' : 'Create Account'}
        </button>
      </form>

      <p className="mt-5 text-center text-[10px] text-[#777b84]">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="font-semibold text-[#111114] hover:text-[#1e55e5]"
        >
          Sign In
        </button>
      </p>
    </>
  )
}

export default RegisterForm
