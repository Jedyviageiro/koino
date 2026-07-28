import { useEffect } from 'react'
import { Check, XCircle } from 'lucide-react'
import ModalShell from '@/components/common/ModalShell.jsx'

function StatusModal({
  type,
  title,
  message,
  onClose,
  autoCloseMs,
}) {
  const isSuccess = type === 'success'

  useEffect(() => {
    const timer = autoCloseMs
      ? window.setTimeout(onClose, autoCloseMs)
      : undefined

    return () => {
      if (timer) window.clearTimeout(timer)
    }
  }, [autoCloseMs, onClose])

  return (
    <ModalShell
      labelledBy="status-modal-title"
      describedBy="status-modal-message"
      onClose={onClose}
    >
        <div
          className={`relative flex h-[142px] items-center justify-center overflow-hidden ${
            isSuccess ? 'bg-[#f3fcf9]' : 'bg-[#fff7f7]'
          }`}
        >
          <div
            className={`absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full ${
              isSuccess ? 'bg-[#2ccf9b]/10' : 'bg-[#e25b5b]/10'
            }`}
            aria-hidden="true"
          />
          <div
            className={`absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full ${
              isSuccess ? 'bg-[#2ccf9b]/15' : 'bg-[#e25b5b]/15'
            }`}
            aria-hidden="true"
          />
          <div
            className={`relative flex h-14 w-14 items-center justify-center rounded-full text-white ${
              isSuccess ? 'bg-[#22bf8d]' : 'bg-[#d94c4c]'
            }`}
          >
            {isSuccess ? (
              <Check
                className="h-6 w-6"
                strokeWidth={2.4}
                aria-hidden="true"
              />
            ) : (
              <XCircle
                className="h-7 w-7"
                strokeWidth={2.1}
                aria-hidden="true"
              />
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col px-8 pb-8 pt-6">
          <h2
            id="status-modal-title"
            className="text-[20px] font-semibold tracking-normal text-[#17171a]"
          >
            {title}
          </h2>
          <p
            id="status-modal-message"
            className="mx-auto mt-2 max-w-[280px] text-[12px] leading-[1.6] text-[#747880]"
          >
            {message}
          </p>

          {!isSuccess && (
            <button
              type="button"
              onClick={onClose}
              className="mt-auto h-11 w-full rounded-[11px] bg-[#e8a33d] text-[12px] font-semibold text-white transition-colors hover:bg-[#d8922e] active:bg-[#bf7416] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8a33d]"
            >
              Try Again
            </button>
          )}
        </div>
    </ModalShell>
  )
}

export default StatusModal
