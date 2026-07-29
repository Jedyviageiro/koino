import { useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

function ModalShell({
  children,
  labelledBy,
  describedBy,
  onClose,
  dismissible = true,
  panelClassName = '',
}) {
  const modalRef = useRef(null)

  useLayoutEffect(() => {
    const previousOverflow = document.body.style.overflow
    const previousPaddingRight = document.body.style.paddingRight
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
    document.body.style.overflow = 'hidden'
    modalRef.current?.focus({ preventScroll: true })

    function handleKeyDown(event) {
      if (event.key === 'Escape' && dismissible) onClose?.()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.paddingRight = previousPaddingRight
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [dismissible, onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[100] grid min-h-dvh place-items-center overflow-y-auto bg-black/45 px-5 py-8 backdrop-blur-[3px] animate-[modal-backdrop-in_220ms_ease-out]"
      role="presentation"
      onMouseDown={(event) => {
        if (
          dismissible &&
          event.target === event.currentTarget
        ) {
          onClose?.()
        }
      }}
    >
      <section
        ref={modalRef}
        tabIndex={-1}
        className={`relative flex h-[330px] w-full max-w-[360px] flex-col overflow-hidden rounded-[22px] bg-white text-center shadow-[0_28px_80px_rgba(0,0,0,0.24)] animate-[modal-card-in_420ms_cubic-bezier(0.16,1,0.3,1)] ${panelClassName}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
      >
        {children}
      </section>
    </div>,
    document.body,
  )
}

export default ModalShell
