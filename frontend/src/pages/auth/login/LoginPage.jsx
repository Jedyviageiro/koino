import { useCallback, useState } from 'react'
import AuthLayout from '@/components/auth/shared/AuthLayout.jsx'
import StatusModal from '@/components/auth/shared/StatusModal.jsx'
import LoginForm from '@/components/auth/login/LoginForm.jsx'
import { useTranslation } from 'react-i18next'

function LoginPage({ onNavigate }) {
  const { t } = useTranslation()
  const [error, setError] = useState('')
  const closeError = useCallback(() => setError(''), [])

  return (
    <>
      <AuthLayout
        mode="login"
        title={t('auth.loginTitle')}
        subtitle={t('auth.loginSubtitle')}
        onNavigate={onNavigate}
      >
        <LoginForm onNavigate={onNavigate} onFailure={setError} />
      </AuthLayout>

      {error && (
        <StatusModal
          type="error"
          title={t('auth.loginFailed')}
          message={error}
          onClose={closeError}
        />
      )}
    </>
  )
}

export default LoginPage
