import { useCallback, useState } from 'react'
import AuthLayout from '@/components/auth/shared/AuthLayout.jsx'
import StatusModal from '@/components/auth/shared/StatusModal.jsx'
import RegisterForm from '@/components/auth/register/RegisterForm.jsx'

function RegisterPage({ onNavigate }) {
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
      title: 'Account created successfully',
      message: `We sent a verification link to ${session.email}.`,
      email: session.email,
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
