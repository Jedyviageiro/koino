import { useState } from 'react'
import { CloudOff, RefreshCw } from 'lucide-react'
import koinoLogo from '@/assets/brand/logos/koino-wordmark.png'
import { API_BASE_URL } from '@/config/env.js'

function StatusPage({ returnPath = '/home', onRecover }) {
  const [checking, setChecking] = useState(false)
  const [stillUnavailable, setStillUnavailable] = useState(false)

  async function retry() {
    if (checking) return
    setChecking(true)
    setStillUnavailable(false)
    try {
      const response = await fetch(`${API_BASE_URL}/bible/books`, {
        cache: 'no-store',
      })
      if (!response.ok) throw new Error('Service unavailable')
      onRecover(returnPath)
    } catch {
      setStillUnavailable(true)
    } finally {
      setChecking(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-[#fbfcfe] px-6 py-12 text-[#16191f]">
      <section className="w-full max-w-[520px] text-center">
        <img
          src={koinoLogo}
          alt="Koino"
          className="mx-auto h-auto w-[92px]"
        />
        <span className="mx-auto mt-12 flex h-16 w-16 items-center justify-center rounded-full bg-[#f6efe4] text-[#9a6829]">
          <CloudOff className="h-7 w-7" strokeWidth={1.5} />
        </span>
        <h1 className="mt-7 text-[32px] font-semibold leading-tight sm:text-[38px]">
          We&apos;re working on it
        </h1>
        <p className="mx-auto mt-4 max-w-[430px] text-[13px] leading-7 text-[#687183]">
          Koino is temporarily unavailable. We&apos;re already working to
          restore the connection, and your saved progress will be waiting when
          you return.
        </p>

        <button
          type="button"
          onClick={retry}
          disabled={checking}
          className="mx-auto mt-8 flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-[7px] bg-[#d99a3e] px-5 text-[12px] font-semibold text-white transition-colors hover:bg-[#c9892f] disabled:cursor-wait disabled:opacity-65"
        >
          <RefreshCw
            className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`}
            strokeWidth={1.8}
          />
          {checking ? 'Checking...' : 'Try again'}
        </button>

        <p
          className="mt-4 min-h-5 text-[11px] text-[#8a6530]"
          aria-live="polite"
        >
          {stillUnavailable
            ? 'The service is still unavailable. Please try again shortly.'
            : ''}
        </p>
      </section>
    </main>
  )
}

export default StatusPage
