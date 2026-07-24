import { useCallback, useState } from 'react'
import AuthLayout from '@/components/auth/shared/AuthLayout.jsx'
import StatusModal from '@/components/auth/shared/StatusModal.jsx'
import LoginForm from '@/components/auth/login/LoginForm.jsx'

function LoginPage({ onNavigate }) {
  const [error, setError] = useState('')
  const closeError = useCallback(() => setError(''), [])

  return (
    <>
      <AuthLayout
        mode="login"
        title="Log in to your account."
        subtitle="Enter your details to continue."
        onNavigate={onNavigate}
      >
        <LoginForm onNavigate={onNavigate} onFailure={setError} />
      </AuthLayout>

      {error && (
        <StatusModal
          type="error"
          title="Login failed"
          message={error}
          onClose={closeError}
        />
      )}
    </>
  )
}

export default LoginPage
