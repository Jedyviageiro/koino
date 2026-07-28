import { useEffect, useState } from 'react'
import LoginPage from '@/pages/auth/login/LoginPage.jsx'
import RegisterPage from '@/pages/auth/register/RegisterPage.jsx'
import OnboardingPage from '@/pages/onboarding/OnboardingPage.jsx'
import HomePage from '@/pages/home/HomePage.jsx'
import ReadingPage from '@/pages/reading/ReadingPage.jsx'
import PlansPage from '@/pages/plans/PlansPage.jsx'
import BiblePage from '@/pages/bible/BiblePage.jsx'
import DevotionalPage from '@/pages/devotional/DevotionalPage.jsx'
import CommunityPage from '@/pages/community/CommunityPage.jsx'
import StatusPage from '@/pages/status/StatusPage.jsx'
import WatchPage from '@/pages/watch/WatchPage.jsx'
import { STATUS_RETURN_PATH_KEY } from '@/services/api/client.js'

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [statusReturnPath] = useState(
    () => sessionStorage.getItem(STATUS_RETURN_PATH_KEY) || '/home',
  )

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

  function recover(nextPath) {
    sessionStorage.removeItem(STATUS_RETURN_PATH_KEY)
    window.history.replaceState({}, '', nextPath)
    setPath(nextPath)
  }

  if (path === '/status') {
    return (
      <StatusPage
        returnPath={statusReturnPath}
        onRecover={recover}
      />
    )
  }

  if (path === '/onboarding') {
    return <OnboardingPage onNavigate={navigate} />
  }

  if (path === '/home') {
    return <HomePage onNavigate={navigate} />
  }

  if (path === '/reading') {
    return <ReadingPage onNavigate={navigate} />
  }

  if (path === '/devotional') {
    return <DevotionalPage onNavigate={navigate} />
  }

  if (path === '/plans') {
    return <PlansPage onNavigate={navigate} />
  }

  if (path === '/bible') {
    return <BiblePage onNavigate={navigate} />
  }

  if (path === '/community') {
    return <CommunityPage onNavigate={navigate} />
  }

  if (path === '/watch') {
    return <WatchPage onNavigate={navigate} />
  }

  return path === '/register' ? (
    <RegisterPage onNavigate={navigate} />
  ) : (
    <LoginPage onNavigate={navigate} />
  )
}

export default App
