import { useEffect, useRef, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import {
  getGoogleConfig,
  loginWithGoogle,
} from '@/features/auth/authService.js'
import { useTranslation } from 'react-i18next'

const GOOGLE_SCRIPT_ID = 'google-identity-services'

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }
    const existing = document.getElementById(GOOGLE_SCRIPT_ID)
    if (existing) {
      existing.addEventListener('load', resolve, { once: true })
      existing.addEventListener('error', reject, { once: true })
      return
    }
    const script = document.createElement('script')
    script.id = GOOGLE_SCRIPT_ID
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function GoogleSignInButton({ onSuccess, onFailure }) {
  const { t, i18n } = useTranslation()
  const containerRef = useRef(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    Promise.all([getGoogleConfig(), loadGoogleScript()])
      .then(([config]) => {
        if (!active || !containerRef.current || !config.clientId) {
          throw new Error(t('authExtra.googleUnavailable'))
        }
        window.google.accounts.id.initialize({
          client_id: config.clientId,
          callback: async ({ credential }) => {
            setLoading(true)
            try {
              const session = await loginWithGoogle(credential)
              onSuccess(session)
            } catch (error) {
              onFailure(error.message || t('authExtra.googleFailed'))
            } finally {
              setLoading(false)
            }
          },
        })
        containerRef.current.replaceChildren()
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: 336,
          locale: i18n.language.startsWith('pt') ? 'pt-BR' : 'en',
        })
        setLoading(false)
      })
      .catch((error) => {
        if (active) {
          setLoading(false)
          onFailure(error.message || t('authExtra.googleUnavailable'))
        }
      })

    return () => {
      active = false
    }
  }, [i18n.language, onFailure, onSuccess, t])

  return (
    <div className="relative h-[45px] w-full overflow-hidden rounded-[7px]">
      <div ref={containerRef} className="h-[45px] w-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center border border-[#dedfe3] bg-white">
          <LoaderCircle className="h-4 w-4 animate-spin text-[#92959c]" />
        </div>
      )}
    </div>
  )
}

export default GoogleSignInButton
