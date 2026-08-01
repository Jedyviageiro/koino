import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LoaderCircle, Mail, UserRound } from 'lucide-react'
import { AuthField, PasswordField } from '@/components/auth/shared/AuthField.jsx'
import { register } from '@/features/auth/authService.js'
import { useEmailExistence } from '@/features/auth/useEmailExistence.js'
import PasswordRules from '@/components/auth/shared/PasswordRules.jsx'
import { isStrongPassword } from '@/features/auth/passwordPolicy.js'

function RegisterForm({ onNavigate, onSuccess, onFailure }) {
  const { t } = useTranslation()
  const [fullname, setFullname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
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
          t('auth.registerError'),
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
            placeholder={t('auth.fullName')}
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
            placeholder={t('auth.email')}
            autoComplete="email"
            disabled={isSubmitting}
            validationState={emailValidationState}
            maxLength={254}
          />
          <div
            className="h-4 px-1 text-[9px] font-medium leading-4 text-[#c73434]"
            aria-live="polite"
          >
            {emailState === 'exists' ? t('auth.emailInUse') : ''}
          </div>
          <PasswordField
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            disabled={isSubmitting}
          />
          <PasswordField
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            autoComplete="new-password"
            disabled={isSubmitting}
            placeholder={t('auth.confirmPassword')}
          />
          <PasswordRules password={password} />
        </div>

        <button
          type="submit"
          disabled={
            isSubmitting ||
            fullname.trim().length < 2 ||
            !isEmailValid ||
            emailState === 'checking' ||
            emailState === 'exists' ||
            !isStrongPassword(password)
            || password !== passwordConfirmation
          }
          className="mt-4 flex h-[47px] w-full items-center justify-center gap-2 rounded-[11px] bg-[#e8a33d] text-[12px] font-semibold text-white transition-colors hover:bg-[#d8922e] active:bg-[#bf7416] disabled:cursor-not-allowed disabled:bg-[#f2dfbf]"
        >
          {isSubmitting && (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {isSubmitting ? t('auth.creatingAccount') : t('auth.createAccount')}
        </button>
      </form>

      <p className="mt-5 text-center text-[10px] text-[#777b84]">
        {t('auth.haveAccount')}{' '}
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="font-semibold text-[#111114] hover:text-[#b27413]"
        >
          {t('auth.signIn')}
        </button>
      </p>
    </>
  )
}

export default RegisterForm
