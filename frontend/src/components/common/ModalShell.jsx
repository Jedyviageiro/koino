import { useEffect, useRef } from 'react'

function ModalShell({
  children,
  labelledBy,
  describedBy,
  onClose,
  dismissible = true,
}) {
  const modalRef = useRef(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    modalRef.current?.focus({ preventScroll: true })

    function handleKeyDown(event) {
      if (event.key === 'Escape' && dismissible) onClose?.()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [dismissible, onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-5 py-8 backdrop-blur-[3px] animate-[modal-backdrop-in_220ms_ease-out]"
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
        className="relative flex h-[330px] w-full max-w-[360px] flex-col overflow-hidden rounded-[22px] bg-white text-center shadow-[0_28px_80px_rgba(0,0,0,0.24)] animate-[modal-card-in_420ms_cubic-bezier(0.16,1,0.3,1)]"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
      >
        {children}
      </section>
    </div>
  )
}

export default ModalShell
