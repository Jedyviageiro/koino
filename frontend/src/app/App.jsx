import { useEffect, useState } from 'react'
import LoginPage from '@/pages/auth/login/LoginPage.jsx'
import RegisterPage from '@/pages/auth/register/RegisterPage.jsx'
import OnboardingPage from '@/pages/onboarding/OnboardingPage.jsx'

function App() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    function handlePopState() {
      setPath(window.location.pathname)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  function navigate(nextPath) {
    if (nextPath === path) return
    const isOnboardingTransition =
      path === '/register' && nextPath === '/onboarding'

    function updateRoute() {
      window.history.pushState({}, '', nextPath)
      setPath(nextPath)
    }

    if (document.startViewTransition) {
      if (isOnboardingTransition) {
        document.documentElement.dataset.routeTransition = 'onboarding'
      }

      const transition = document.startViewTransition(updateRoute)
      transition.finished.finally(() => {
        delete document.documentElement.dataset.routeTransition
      })
    } else {
      updateRoute()
    }
  }

  if (path === '/onboarding') {
    return <OnboardingPage onNavigate={navigate} />
  }

  return path === '/register' ? (
    <RegisterPage onNavigate={navigate} />
  ) : (
    <LoginPage onNavigate={navigate} />
  )
}

export default App
