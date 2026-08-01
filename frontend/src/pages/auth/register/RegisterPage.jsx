import { useCallback, useState } from 'react'
import AuthLayout from '@/components/auth/shared/AuthLayout.jsx'
import StatusModal from '@/components/auth/shared/StatusModal.jsx'
import RegisterForm from '@/components/auth/register/RegisterForm.jsx'
import { useTranslation } from 'react-i18next'

function RegisterPage({ onNavigate }) {
  const { t } = useTranslation()
  const [status, setStatus] = useState(null)
  const closeStatus = useCallback(() => {
    if (status?.type === 'success') {
      const query = new URLSearchParams({ email: status.email })
      setStatus(null)
      onNavigate(`/verify-email?${query}`)
    } else {
      setStatus(null)
    }
  }, [onNavigate, status])

  function handleSuccess(session) {
    setStatus({
      type: 'success',
      title: t('authExtra.accountCreated'),
      message: t('authExtra.verificationSent', { email: session.email }),
      email: session.email,
    })
  }

  function handleFailure(message) {
    setStatus({
      type: 'error',
      title: t('authExtra.registrationFailed'),
      message,
    })
  }

  return (
    <>
      <AuthLayout
        mode="register"
        title={t('auth.registerTitle')}
        subtitle={t('auth.registerSubtitle')}
        onNavigate={onNavigate}
      >
        <RegisterForm
          onNavigate={onNavigate}
          onSuccess={handleSuccess}
          onFailure={handleFailure}
        />
      </AuthLayout>

      {status && (
        <StatusModal
          type={status.type}
          title={status.title}
          message={status.message}
          onClose={closeStatus}
          autoCloseMs={status.type === 'success' ? 1800 : undefined}
        />
      )}
    </>
  )
}

export default RegisterPage
