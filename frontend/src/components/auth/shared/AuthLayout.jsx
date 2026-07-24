import { Zap } from 'lucide-react'
import koinoLogo from '@/assets/brand/logos/koino-wordmark.png'
import formImage from '@/assets/images/Form-img.png'

function AuthSwitcher({ mode, onNavigate }) {
  function goTo(event, path) {
    event.preventDefault()
    onNavigate(path)
  }

  return (
    <nav
      className="relative mt-5 grid h-[41px] grid-cols-2 rounded-[10px] bg-[#f3f3f5] p-1"
      aria-label="Account access"
    >
      <span
        className={`absolute bottom-1 left-1 top-1 w-[calc(50%-0.25rem)] rounded-lg bg-white ring-1 ring-black/[0.04] transition-transform duration-300 ease-out ${
          mode === 'register' ? 'translate-x-full' : 'translate-x-0'
        }`}
        style={{ viewTransitionName: 'auth-mode-pill' }}
        aria-hidden="true"
      />
      <a
        href="/"
        onClick={(event) => goTo(event, '/')}
        className={`relative z-10 flex items-center justify-center rounded-lg text-[12px] font-semibold transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-[#1e55e5] ${
          mode === 'login' ? 'text-[#111114]' : 'text-[#777b84]'
        }`}
      >
        Sign In
      </a>
      <a
        href="/register"
        onClick={(event) => goTo(event, '/register')}
        className={`relative z-10 flex items-center justify-center rounded-lg text-[12px] font-semibold transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-[#1e55e5] ${
          mode === 'register' ? 'text-[#111114]' : 'text-[#777b84]'
        }`}
      >
        Sign Up
      </a>
    </nav>
  )
}

function AuthLayout({
  mode,
  title,
  subtitle,
  onNavigate,
  onboardingLoading = false,
  children,
}) {
  return (
    <main className="min-h-svh bg-white px-7 py-6 font-sans text-[#111114] sm:px-9 sm:py-7">
      <div className="mx-auto grid min-h-[650px] w-full max-w-[1380px] lg:grid-cols-[minmax(370px,0.79fr)_minmax(0,1.21fr)] lg:gap-6 xl:min-h-[700px]">
        <section
          className={`flex justify-center px-6 py-12 sm:px-9 lg:px-10 lg:pt-16 ${
            onboardingLoading ? 'lg:order-2' : 'lg:order-1'
          }`}
        >
          {onboardingLoading ? (
            <div
              className="w-full max-w-[620px] animate-[skeleton-panel-in_480ms_ease-out]"
              role="status"
              aria-label="Loading onboarding"
            >
              <div className="auth-skeleton h-7 w-28 rounded-md" />
              <div className="mt-12 auth-skeleton h-8 w-3/5 rounded-md" />
              <div className="mt-3 auth-skeleton h-4 w-2/5 rounded" />
              <div className="mt-10 grid grid-cols-2 gap-4">
                <div className="auth-skeleton h-24 rounded-[12px]" />
                <div className="auth-skeleton h-24 rounded-[12px]" />
              </div>
              <div className="mt-5 auth-skeleton h-14 w-full rounded-[12px]" />
              <div className="mt-3 auth-skeleton h-14 w-full rounded-[12px]" />
              <div className="mt-8 flex items-center gap-3">
                <div className="auth-skeleton h-11 w-11 rounded-full" />
                <div className="min-w-0 flex-1">
                  <div className="auth-skeleton h-3 w-2/5 rounded" />
                  <div className="mt-2 auth-skeleton h-3 w-3/5 rounded" />
                </div>
              </div>
              <span className="sr-only">Preparing onboarding</span>
            </div>
          ) : (
            <div className="w-full max-w-[336px]">
              <a
                href="/"
                onClick={(event) => {
                  event.preventDefault()
                  onNavigate('/')
                }}
                aria-label="Koino home"
                className="mb-8 block w-20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1e55e5]"
              >
                <img src={koinoLogo} alt="Koino" className="h-auto w-full" />
              </a>

              <div className="animate-[auth-panel-in_240ms_ease-out]">
                <h1 className="text-[24px] font-semibold leading-tight tracking-normal">
                  {title}
                </h1>
                <p className="mt-1 text-[12px] leading-5 text-[#777b84]">
                  {subtitle}
                </p>
              </div>

              <AuthSwitcher mode={mode} onNavigate={onNavigate} />
              <div className="animate-[auth-panel-in_240ms_ease-out]">
                {children}
              </div>
            </div>
          )}
        </section>

        <section
          className={`relative hidden min-h-[650px] overflow-hidden rounded-[24px] lg:block xl:min-h-[700px] ${
            onboardingLoading ? 'lg:order-1' : 'lg:order-2'
          }`}
          style={{ viewTransitionName: 'auth-visual' }}
        >
          <img
            src={formImage}
            alt="A Koino member studying the Bible"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(8,13,24,0.06) 20%, rgba(22,57,130,0.45) 66%, rgba(4,9,19,0.94) 100%), linear-gradient(90deg, rgba(6,12,24,0.24) 0%, transparent 50%)',
            }}
            aria-hidden="true"
          />
          <div className="absolute inset-x-8 bottom-7 max-w-[460px] text-white">
            <p className="text-[24px] font-semibold leading-[1.2] tracking-normal">
              Grow in faith, one day at a time.
            </p>
            <p className="mt-1.5 text-[12px] leading-5 text-white/85">
              Your Bible reading, progress, and community in one place.
            </p>
          </div>
        </section>
      </div>

      <footer className="mx-auto mt-7 flex w-full max-w-[1380px] flex-col items-center border-t border-[#ececef] px-6 pb-2 pt-5 text-center">
        <p className="text-[14px] font-medium text-[#676b73]">Powered By</p>
        <div className="mt-1.5 flex items-center justify-center gap-1 text-[#777b84]">
          <Zap
            className="h-8 w-8 shrink-0 fill-[#1e55e5] text-[#1e55e5]"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p className="text-[12px] leading-5">
            <strong className="font-semibold text-[#555960]">
              Matthew 28:19:
            </strong>{' '}
            &ldquo;Go therefore and make disciples of all the nations...&rdquo;
          </p>
        </div>
      </footer>
    </main>
  )
}

export default AuthLayout
