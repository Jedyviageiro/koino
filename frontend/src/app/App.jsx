import { useEffect, useState } from 'react'
import LoginPage from '@/pages/auth/login/LoginPage.jsx'
import RegisterPage from '@/pages/auth/register/RegisterPage.jsx'

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

    function updateRoute() {
      window.history.pushState({}, '', nextPath)
      setPath(nextPath)
    }

    if (document.startViewTransition) {
      document.startViewTransition(updateRoute)
    } else {
      updateRoute()
    }
  }

  return path === '/register' ? (
    <RegisterPage onNavigate={navigate} />
  ) : (
    <LoginPage onNavigate={navigate} />
  )
}

export default App
