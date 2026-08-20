import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import ChatPage from '@/pages/chat/ChatPage.jsx'
import ChallengeToast from '@/components/common/ChallengeToast.jsx'
import WatchMiniPlayer from '@/components/watch/WatchMiniPlayer.jsx'
import ChatMessageToast from '@/components/chat/ChatMessageToast.jsx'
import { apiRequest, STATUS_RETURN_PATH_KEY } from '@/services/api/client.js'
import {
  AUTH_LOGOUT_EVENT,
  getAuthToken,
} from '@/features/auth/authStorage.js'

const WATCH_PLAYER_KEY = 'koino.watch.player'

const PAGE_TITLE_KEYS = {
  '/': 'signIn', '/register': 'register', '/verify-email': 'verifyEmail',
  '/forgot-password': 'forgotPassword', '/reset-password': 'resetPassword',
  '/onboarding': 'onboarding', '/home': 'home', '/plans': 'plans',
  '/reading': 'reading', '/devotional': 'devotional', '/bible': 'bible',
  '/bookmarks': 'bookmarks', '/community': 'community', '/chat': 'chat',
  '/watch': 'watch', '/watch/player': 'nowPlaying', '/settings': 'settings',
  '/battle-space': 'battle', '/status': 'status',
}

function storedWatchVideo() {
  try {
    return JSON.parse(sessionStorage.getItem(WATCH_PLAYER_KEY)) || null
  } catch {
    sessionStorage.removeItem(WATCH_PLAYER_KEY)
    return null
  }
}

function App() {
  const { t, i18n } = useTranslation()
  const [locationKey, setLocationKey] = useState(
    () => `${window.location.pathname}${window.location.search}`,
  )
  const path = window.location.pathname
  const [watchVideo, setWatchVideo] = useState(storedWatchVideo)
  const [statusReturnPath] = useState(
    () => sessionStorage.getItem(STATUS_RETURN_PATH_KEY) || '/home',
  )

  useEffect(() => {
    function handlePopState() {
      setLocationKey(`${window.location.pathname}${window.location.search}`)
    }

    function handleLogout() {
      sessionStorage.removeItem(WATCH_PLAYER_KEY)
      setWatchVideo(null)
      window.history.replaceState({}, '', '/')
      setLocationKey('/')
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener(AUTH_LOGOUT_EVENT, handleLogout)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener(AUTH_LOGOUT_EVENT, handleLogout)
    }
  }, [])

  useEffect(() => {
    const pageTitle = path.startsWith('/u/')
      ? t('titles.profile')
      : PAGE_TITLE_KEYS[path]
        ? t(`titles.${PAGE_TITLE_KEYS[path]}`)
        : t('common.appName')
    document.title = pageTitle === t('common.appName')
      ? t('common.appName')
      : `${pageTitle} | ${t('common.appName')}`
  }, [locationKey, path, i18n.resolvedLanguage, t])

  useEffect(() => {
    const keepSessionCurrent = () => {
      if (document.visibilityState === 'visible' && getAuthToken()) {
        apiRequest('/users/me').catch(() => {})
      }
    }
    const timer = window.setInterval(keepSessionCurrent, 60000)
    document.addEventListener('visibilitychange', keepSessionCurrent)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', keepSessionCurrent)
    }
  }, [])

  const rememberWatchVideo = useCallback((video) => {
    if (!getAuthToken()) return
    setWatchVideo((current) => {
      const sameVideo = current?.catalogKey === video.catalogKey
      const next = {
        ...(sameVideo ? current : {}),
        ...video,
        playbackSeconds:
          video.playbackSeconds ?? (sameVideo ? current.playbackSeconds : 0),
      }
      sessionStorage.setItem(WATCH_PLAYER_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  function closeWatchVideo() {
    setWatchVideo(null)
    sessionStorage.removeItem(WATCH_PLAYER_KEY)
  }

  function navigate(nextPath) {
    const nextUrl = new URL(nextPath, window.location.origin)
    if (
      `${nextUrl.pathname}${nextUrl.search}` === locationKey
    ) {
      return
    }
    const isOnboardingTransition =
      path === '/register' && nextUrl.pathname === '/onboarding'

    function updateRoute() {
      window.history.pushState({}, '', `${nextUrl.pathname}${nextUrl.search}`)
      setLocationKey(`${nextUrl.pathname}${nextUrl.search}`)
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
    setLocationKey(nextPath)
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
  } else if (path === '/chat') {
    page = <ChatPage onNavigate={navigate} />
  } else if (path === '/watch/player') {
    page = (
      <WatchPlayerPage
        onNavigate={navigate}
        onVideoActive={rememberWatchVideo}
        playbackVideo={watchVideo}
      />
    )
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
    <>
      <div key={locationKey} className="app-route">
        {page}
      </div>
      {path !== '/status' && (
        <>
          <ChallengeToast onNavigate={navigate} routePath={locationKey} />
          <ChatMessageToast onNavigate={navigate} />
        </>
      )}
      {watchVideo && path !== '/status' && !path.startsWith('/watch') && (
        <WatchMiniPlayer
          video={watchVideo}
          onClose={closeWatchVideo}
          onProgress={(playbackSeconds) =>
            rememberWatchVideo({ ...watchVideo, playbackSeconds })
          }
          onMaximize={() =>
            navigate(
              `/watch/player?video=${encodeURIComponent(watchVideo.catalogKey)}`,
            )
          }
        />
      )}
    </>
  )
}

export default App
