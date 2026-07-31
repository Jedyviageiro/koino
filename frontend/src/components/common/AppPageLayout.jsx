import { createContext, useContext } from 'react'
import { ArrowLeft } from 'lucide-react'
import HomeSidebar from '@/components/home/HomeSidebar.jsx'
import AppHeaderActions from '@/components/common/AppHeaderActions.jsx'

const PageLayoutContext = createContext(null)

function AppPageLayout({
  children,
  name,
  onNavigate,
  activePath,
  showSidebar = true,
  contentClassName = '',
  mainClassName = '',
}) {
  const content = (
    <main
      className={`min-w-0 px-[18px] pb-14 pt-7 sm:px-7 lg:px-8 lg:pb-12 lg:pt-8 ${mainClassName}`}
    >
      <div className={`mx-auto w-full max-w-[1100px] ${contentClassName}`}>
        {children}
      </div>
    </main>
  )

  if (!showSidebar) {
    return (
      <PageLayoutContext.Provider value={{ onNavigate }}>
        <div className="min-h-svh bg-[#fbfcfe] text-[#0d0f12]">{content}</div>
      </PageLayoutContext.Provider>
    )
  }

  return (
    <PageLayoutContext.Provider value={{ onNavigate }}>
      <div className="min-h-svh bg-[#fbfcfe] text-[#0d0f12] lg:grid lg:grid-cols-[164px_minmax(0,1fr)]">
        <HomeSidebar
          name={name || 'Koino Reader'}
          onNavigate={onNavigate}
          activePath={activePath}
        />
        {content}
      </div>
    </PageLayoutContext.Provider>
  )
}

function PageHeader({ title, subtitle, actions, eyebrow, className = '' }) {
  const layout = useContext(PageLayoutContext)
  const resolvedActions = layout?.onNavigate ? (
    <>
      {actions}
      <AppHeaderActions onNavigate={layout.onNavigate} />
    </>
  ) : actions
  return (
    <header
      className={`mb-7 flex min-h-[58px] items-start justify-between gap-4 ${className}`}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[10px] font-semibold uppercase text-[#a86d16]">
            {eyebrow}
          </p>
        )}
        <h1 className="font-serif text-[28px] font-semibold leading-[1.2] text-[#111318]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-[13px] leading-5 text-[#667089]">
            {subtitle}
          </p>
        )}
      </div>
      {resolvedActions && (
        <div className="flex shrink-0 items-center gap-2">{resolvedActions}</div>
      )}
    </header>
  )
}

function PageBackLink({ children, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mb-6 inline-flex h-8 items-center gap-2 text-[11px] font-medium text-[#667089] transition-colors hover:text-[#16191f] ${className}`}
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.8} />
      {children}
    </button>
  )
}

function SectionTitle({ children, action, className = '' }) {
  return (
    <div className={`mb-3 flex items-center justify-between gap-3 ${className}`}>
      <h2 className="font-serif text-[16px] font-semibold leading-6 text-[#171a1f]">
        {children}
      </h2>
      {action}
    </div>
  )
}

export { AppPageLayout, PageBackLink, PageHeader, SectionTitle }
