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
      title={t('auth.newPasswordTitle')}
      subtitle={t('auth.newPasswordSubtitle')}
      onNavigate={onNavigate}
      hideSwitcher
    >
      <form className="mt-8" onSubmit={submit}>
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
            status.type === 'error' ? 'text-[#c73434]' : 'text-[#217a45]'
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
        {status.type === 'success' && (
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="mt-4 h-9 w-full text-[10px] font-semibold text-[#555b66]"
          >
            {t('auth.continueToLogin')}
          </button>
        )}
      </form>
    </AuthLayout>
  )
}

export default ResetPasswordPage
