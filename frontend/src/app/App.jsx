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
import WatchPlayerPage from '@/pages/watch/WatchPlayerPage.jsx'
import SettingsPage from '@/pages/settings/SettingsPage.jsx'
import VerifyEmailPage from '@/pages/auth/verify-email/VerifyEmailPage.jsx'
import ForgotPasswordPage from '@/pages/auth/forgot-password/ForgotPasswordPage.jsx'
import ResetPasswordPage from '@/pages/auth/reset-password/ResetPasswordPage.jsx'
import BattleSpacePage from '@/pages/battle-space/BattleSpacePage.jsx'
import BookmarksPage from '@/pages/bookmarks/BookmarksPage.jsx'
import UserProfilePage from '@/pages/user/UserProfilePage.jsx'
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
    const nextUrl = new URL(nextPath, window.location.origin)
    if (
      nextUrl.pathname === path &&
      nextUrl.search === window.location.search
    ) {
      return
    }
    const isOnboardingTransition =
      path === '/register' && nextUrl.pathname === '/onboarding'

    function updateRoute() {
      window.history.pushState({}, '', `${nextUrl.pathname}${nextUrl.search}`)
      setPath(nextUrl.pathname)
    }

    if (document.startViewTransition) {
      document.documentElement.dataset.routeTransition = isOnboardingTransition
        ? 'onboarding'
        : 'page'

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

  let page

  if (path === '/status') {
    page = (
      <StatusPage
        returnPath={statusReturnPath}
        onRecover={recover}
      />
    )
  } else if (path === '/onboarding') {
    page = <OnboardingPage onNavigate={navigate} />
  } else if (path === '/home') {
    page = <HomePage onNavigate={navigate} />
  } else if (path === '/reading') {
    page = <ReadingPage onNavigate={navigate} />
  } else if (path === '/devotional') {
    page = <DevotionalPage onNavigate={navigate} />
  } else if (path === '/plans') {
    page = <PlansPage onNavigate={navigate} />
  } else if (path === '/bible') {
    page = <BiblePage onNavigate={navigate} />
  } else if (path === '/bookmarks') {
    page = <BookmarksPage onNavigate={navigate} />
  } else if (path === '/community') {
    page = <CommunityPage onNavigate={navigate} />
  } else if (path === '/watch/player') {
    page = <WatchPlayerPage onNavigate={navigate} />
  } else if (path === '/watch') {
    page = <WatchPage onNavigate={navigate} />
  } else if (path === '/settings') {
    page = <SettingsPage onNavigate={navigate} />
  } else if (path === '/battle-space') {
    page = <BattleSpacePage onNavigate={navigate} />
  } else if (path.startsWith('/u/')) {
    page = (
      <UserProfilePage
        username={decodeURIComponent(path.slice(3))}
        onNavigate={navigate}
      />
    )
  } else if (path === '/register') {
    page = <RegisterPage onNavigate={navigate} />
  } else if (path === '/verify-email') {
    page = <VerifyEmailPage onNavigate={navigate} />
  } else if (path === '/forgot-password') {
    page = <ForgotPasswordPage onNavigate={navigate} />
  } else if (path === '/reset-password') {
    page = <ResetPasswordPage onNavigate={navigate} />
  } else {
    page = <LoginPage onNavigate={navigate} />
  }

  return (
    <div key={path} className="app-route">
      {page}
    </div>
  )
}

export default App
