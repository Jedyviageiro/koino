import { useCallback, useState } from 'react'
import { flushSync } from 'react-dom'
import AuthLayout from '@/components/auth/shared/AuthLayout.jsx'
import StatusModal from '@/components/auth/shared/StatusModal.jsx'
import RegisterForm from '@/components/auth/register/RegisterForm.jsx'

function RegisterPage({ onNavigate }) {
  const [onboardingLoading, setOnboardingLoading] = useState(false)
  const [status, setStatus] = useState(null)

  const beginOnboarding = useCallback(() => {
    setStatus(null)

    function updateLayout() {
      flushSync(() => setOnboardingLoading(true))
    }

    if (document.startViewTransition) {
      document.startViewTransition(updateLayout)
    } else {
      updateLayout()
    }
  }, [])

  const closeStatus = useCallback(() => {
    if (status?.type === 'success') {
      beginOnboarding()
    } else {
      setStatus(null)
    }
  }, [beginOnboarding, status])

  function handleSuccess(session) {
    setStatus({
      type: 'success',
      title: 'Account created successfully',
      message: `Welcome, ${session.fullname}. We are preparing your Koino experience now.`,
    })
  }

  function handleFailure(message) {
    setStatus({
      type: 'error',
      title: 'Registration failed',
      message,
    })
  }

  return (
    <>
      <AuthLayout
        mode="register"
        title="Create your account."
        subtitle="Start your journey of faith with Koino."
        onNavigate={onNavigate}
        onboardingLoading={onboardingLoading}
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
          autoCloseMs={status.type === 'success' ? 2400 : undefined}
        />
      )}
    </>
  )
}

export default RegisterPage
