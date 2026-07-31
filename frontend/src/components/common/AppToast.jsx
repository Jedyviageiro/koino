import { X } from 'lucide-react'
import { useEffect } from 'react'

function AppToast({ icon: Icon, title, message, onOpen, onClose }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 6500)
    return () => window.clearTimeout(timer)
  }, [onClose, title])

  return (
    <aside
      className="fixed right-4 top-[150px] z-[85] w-[min(350px,calc(100vw-32px))] rounded-[8px] border border-[#dde3e8] bg-white p-3.5 shadow-[0_18px_48px_rgba(30,34,42,0.16)] animate-[auth-panel-in_220ms_ease-out]"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff4e3] text-[#b87512]">
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </span>
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 text-left"
        >
          <span className="block text-[11px] font-semibold text-[#20242b]">
            {title}
          </span>
          <span className="mt-1 line-clamp-2 block text-[9px] leading-4 text-[#707887]">
            {message}
          </span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center text-[#858d99] hover:text-[#2c3139]"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  )
}

export default AppToast
