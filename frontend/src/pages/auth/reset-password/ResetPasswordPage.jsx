import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LoaderCircle } from 'lucide-react'
import AuthLayout from '@/components/auth/shared/AuthLayout.jsx'
import { PasswordField } from '@/components/auth/shared/AuthField.jsx'
import PasswordRules from '@/components/auth/shared/PasswordRules.jsx'
import { isStrongPassword } from '@/features/auth/passwordPolicy.js'
import { resetPassword } from '@/features/auth/authService.js'

function ResetPasswordPage({ onNavigate }) {
  const { t } = useTranslation()
  const token = new URLSearchParams(window.location.search).get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: '', message: '' })
  const complete = status.type === 'success'
  const matches = password === confirmation && confirmation.length > 0

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    try {
      await resetPassword(token, password, confirmation)
      setStatus({
        type: 'success',
        message: t('auth.passwordUpdated'),
      })
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      mode="login"
      title={complete ? t('auth.passwordUpdated') : t('auth.newPasswordTitle')}
      subtitle={complete ? t('auth.continueToLogin') : t('auth.newPasswordSubtitle')}
      onNavigate={onNavigate}
      hideSwitcher
    >
      {complete ? (
        <div className="mt-8">
          <div className="rounded-[12px] border border-[#cfe7d8] bg-[#f3fbf6] px-4 py-4 text-[11px] leading-5 text-[#217a45]" role="status">
            {status.message}
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="mt-5 flex h-[47px] w-full items-center justify-center rounded-[11px] bg-[#e8a33d] text-[12px] font-semibold text-white"
          >
            {t('auth.continueToLogin')}
          </button>
        </div>
      ) : <form className="mt-8" onSubmit={submit}>
        <div className="space-y-2.5">
          <PasswordField
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            autoFocus
          />
          <PasswordField
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
          />
        </div>
        <PasswordRules password={password} />
        <div
          className={`min-h-[48px] pt-2 text-[9px] leading-4 ${
            status.type === 'success' ? 'text-[#217a45]' : 'text-[#6f747d]'
          }`}
          aria-live="polite"
        >
          {!matches && confirmation ? t('auth.passwordsMismatch') : status.message}
        </div>
        <button
          type="submit"
          disabled={!token || !isStrongPassword(password) || !matches || loading}
          className="flex h-[47px] w-full items-center justify-center gap-2 rounded-[11px] bg-[#e8a33d] text-[12px] font-semibold text-white disabled:bg-[#f2dfbf]"
        >
          {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
          {loading ? t('auth.updating') : t('auth.updatePassword')}
        </button>
      </form>
      }
      <p className="mt-4 text-center text-[9px] leading-4 text-[#858983]">
        {t('authExtra.playStoreSoon')}
      </p>
    </AuthLayout>
  )
}

export default ResetPasswordPage
