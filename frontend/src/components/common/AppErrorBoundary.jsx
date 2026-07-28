import { Component } from 'react'
import StatusPage from '@/pages/status/StatusPage.jsx'

class AppErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error('Koino interface error', error)
    sessionStorage.setItem(
      'koino.status.returnPath',
      window.location.pathname,
    )
    window.history.replaceState({}, '', '/status')
  }

  render() {
    if (this.state.failed) {
      return (
        <StatusPage
          returnPath={
            sessionStorage.getItem('koino.status.returnPath') || '/home'
          }
          onRecover={(path) => window.location.replace(path)}
        />
      )
    }
    return this.props.children
  }
}

export default AppErrorBoundary
