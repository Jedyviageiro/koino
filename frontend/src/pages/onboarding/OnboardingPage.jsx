import { useEffect, useState } from 'react'
import AuthLayout from '@/components/auth/shared/AuthLayout.jsx'
import StatusModal from '@/components/auth/shared/StatusModal.jsx'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow.jsx'
import { getAuthToken } from '@/features/auth/authStorage.js'

function OnboardingPage({ onNavigate }) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!getAuthToken()) {
      onNavigate('/register')
      return undefined
    }

    const timer = window.setTimeout(() => setIsLoading(false), 900)
    return () => window.clearTimeout(timer)
  }, [onNavigate])

  return (
    <>
      <AuthLayout
        mode="register"
        title=""
        subtitle=""
        onNavigate={onNavigate}
        onboardingLoading={isLoading}
        onboardingContent={
          <OnboardingFlow
            onFailure={setError}
            onComplete={() => onNavigate('/home')}
          />
        }
      />

      {error && (
        <StatusModal
          type="error"
          title="Onboarding failed"
          message={error}
          onClose={() => setError('')}
        />
      )}
    </>
  )
}

export default OnboardingPage
