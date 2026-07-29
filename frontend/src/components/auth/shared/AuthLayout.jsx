import koinoLogo from '@/assets/brand/logos/koino-wordmark.png'
import formImage from '@/assets/images/Form-img.png'

function OnboardingSkeleton({ overlay = false }) {
  return (
    <div
      className={`w-full ${
        overlay
          ? 'pointer-events-none absolute inset-0 z-10 bg-white animate-[onboarding-skeleton-exit_1100ms_ease-in-out_forwards]'
          : ''
      }`}
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
  )
}

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
        className={`relative z-10 flex items-center justify-center rounded-lg text-[12px] font-semibold transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-[#e8a33d] ${
          mode === 'login' ? 'text-[#111114]' : 'text-[#777b84]'
        }`}
      >
        Sign In
      </a>
      <a
        href="/register"
        onClick={(event) => goTo(event, '/register')}
        className={`relative z-10 flex items-center justify-center rounded-lg text-[12px] font-semibold transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-[#e8a33d] ${
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
  onboardingContent = null,
  hideSwitcher = false,
  children,
}) {
  const onboardingActive = onboardingLoading || Boolean(onboardingContent)

  return (
    <main className="min-h-svh bg-white px-7 py-5 font-sans text-[#111114] sm:px-9 sm:py-6">
      <div
        className={`mx-auto grid w-full max-w-[1160px] lg:h-[590px] lg:gap-5 xl:h-[620px] ${
          onboardingActive
            ? 'lg:grid-cols-[minmax(0,1.08fr)_minmax(390px,0.92fr)]'
            : 'lg:grid-cols-[minmax(370px,0.79fr)_minmax(0,1.21fr)]'
        }`}
      >
        <section
          className={`flex min-h-0 justify-center px-6 py-10 sm:px-9 lg:px-9 ${
            onboardingActive
              ? 'lg:order-2 lg:overflow-hidden lg:py-6'
              : 'lg:order-1 lg:py-10'
          }`}
        >
          {onboardingContent ? (
            <div className="relative min-h-full w-full max-w-[550px]">
              <div
                className={
                  onboardingLoading
                    ? 'animate-[onboarding-content-reveal_1100ms_ease-out_forwards]'
                    : 'animate-[auth-panel-in_320ms_ease-out]'
                }
              >
                {onboardingContent}
              </div>
              {onboardingLoading && <OnboardingSkeleton overlay />}
            </div>
          ) : onboardingLoading ? (
            <div className="w-full max-w-[550px] animate-[skeleton-panel-in_480ms_ease-out]">
              <OnboardingSkeleton />
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
                className="mb-8 block w-20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e8a33d]"
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

              {!hideSwitcher && (
                <AuthSwitcher mode={mode} onNavigate={onNavigate} />
              )}
              <div className="animate-[auth-panel-in_240ms_ease-out]">
                {children}
              </div>
            </div>
          )}
        </section>

        <section
          className={`relative hidden h-full min-h-0 overflow-hidden rounded-[20px] lg:block ${
            onboardingActive ? 'lg:order-1' : 'lg:order-2'
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
    </main>
  )
}

export default AuthLayout
