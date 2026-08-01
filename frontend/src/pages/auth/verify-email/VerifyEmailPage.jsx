import { useEffect, useState } from 'react'
import { CheckCircle2, LoaderCircle, MailCheck, ShieldCheck } from 'lucide-react'
import BrandMark from '@/components/common/BrandMark.jsx'
import confirmEmailArtwork from '@/assets/images/confirm-email-artwork.png'
import {
  confirmEmail,
  resendVerification,
} from '@/features/auth/authService.js'
import { useTranslation } from 'react-i18next'

function VerifyEmailPage({ onNavigate }) {
  const { t } = useTranslation()
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token') || ''
  const email = params.get('email') || ''
  const [state, setState] = useState(token ? 'verifying' : 'waiting')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) return
    let active = true
    confirmEmail(token)
      .then((response) => {
        if (active) {
          setState('verified')
          setMessage(response.message)
        }
      })
      .catch((error) => {
        if (active) {
          setState('error')
          setMessage(error.message)
        }
      })
    return () => {
      active = false
    }
  }, [token])

  async function resend() {
    setState('sending')
    try {
      const response = await resendVerification(email)
      setState('waiting')
      setMessage(response.message)
    } catch (error) {
      setState('error')
      setMessage(error.message)
    }
  }

  const verified = state === 'verified'
  const busy = state === 'verifying' || state === 'sending'

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#faf9f7] px-5 py-8 font-sans text-[#181816] sm:px-8">
      <section className="w-full max-w-[720px] overflow-hidden rounded-[16px] border border-[#e8e3dc] bg-white shadow-[0_18px_55px_rgba(41,35,27,0.08)]">
        <header className="flex h-[76px] items-center justify-center border-b border-[#eeeae4] px-8">
          <a
            href="/"
            onClick={(event) => {
              event.preventDefault()
              onNavigate('/')
            }}
            aria-label="Koino home"
            className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e8a33d]"
          >
            <BrandMark iconClassName="h-8 w-8" className="gap-2.5" />
          </a>
        </header>

        <div className="grid lg:grid-cols-[1.03fr_0.97fr]">
          <div className="flex flex-col justify-center px-7 py-9 sm:px-10 lg:px-11">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#fff5e5]">
              {busy ? (
                <LoaderCircle className="h-5 w-5 animate-spin text-[#c98522]" />
              ) : verified ? (
                <CheckCircle2 className="h-6 w-6 text-[#217a45]" />
              ) : (
                <MailCheck className="h-6 w-6 text-[#c98522]" />
              )}
            </div>
            <h1 className="text-[30px] font-medium leading-[1.12] tracking-normal">
              {verified ? t('authExtra.emailConfirmed') : t('authExtra.confirmEmail')}
            </h1>
            <p className="mt-3 text-[12px] leading-6 text-[#6f746f]">
              {verified
                ? t('authExtra.accountReady')
                : t('authExtra.secureLink', {
                    destination: email
                      ? t('authExtra.toEmail', { email })
                      : '',
                  })}
            </p>
            <div
              className={`min-h-[60px] pt-4 text-[11px] leading-5 ${
                state === 'error' ? 'text-[#c73434]' : 'text-[#6f747d]'
              }`}
              aria-live="polite"
            >
              {message || t('authExtra.openEmail')}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="flex h-[46px] w-full items-center justify-center rounded-[9px] bg-[#e8a33d] text-[12px] font-semibold text-white transition-colors hover:bg-[#d8922e]"
            >
              {verified ? t('authExtra.continueLogin') : t('authExtra.backLogin')}
            </button>
            {!verified && email && (
              <button
                type="button"
                disabled={state === 'sending'}
                onClick={resend}
                className="mt-3 h-9 w-full text-[10px] font-semibold text-[#555b66] disabled:opacity-50"
              >
                {t('authExtra.resend')}
              </button>
            )}
            <div className="mt-5 flex items-center gap-2 border-t border-[#eeeae4] pt-4 text-[9px] leading-4 text-[#858983]">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#c98522]" />
              {t('authExtra.expiry')}
            </div>
          </div>

          <div className="relative min-h-[280px] overflow-hidden bg-[#f8efe2] lg:min-h-[470px]">
            <img
              src={confirmEmailArtwork}
              alt="A Koino confirmation letter overlooking a mountain landscape"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/25 to-transparent px-7 pb-6 pt-16 text-white">
              <p className="text-[13px] font-semibold">{t('authExtra.closer')}</p>
              <p className="mt-1 text-[10px] text-white/85">
                {t('authExtra.closerText')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default VerifyEmailPage
