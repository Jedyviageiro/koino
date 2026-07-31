import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import CountryFlag from '@/components/common/CountryFlag.jsx'
import { COUNTRY_OPTIONS } from '@/utils/country.js'

function CountrySelect({ value, onChange }) {
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const selected = COUNTRY_OPTIONS.find((country) => country.code === value)
    || COUNTRY_OPTIONS[0]

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    function closeOnEscape(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  return (
    <div ref={rootRef} className="relative mt-2">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-full items-center gap-2.5 rounded-[7px] border border-[#dfe3e8] bg-white px-3.5 text-left text-[12px] font-normal outline-none transition-colors focus:border-[#e8a33d]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected.code && <CountryFlag code={selected.code} />}
        <span className="min-w-0 flex-1 truncate">{selected.label}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#737b87]" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Country"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-60 overflow-y-auto rounded-[7px] border border-[#dfe3e8] bg-white p-1.5 shadow-[0_14px_35px_rgba(20,24,30,0.12)]"
        >
          {COUNTRY_OPTIONS.map((country) => {
            const active = country.code === selected.code
            return (
              <button
                key={country.code || 'none'}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(country.code)
                  setOpen(false)
                }}
                className={`flex h-9 w-full items-center gap-2.5 rounded-[5px] px-2.5 text-left text-[11px] ${
                  active ? 'bg-[#f7f0e6] text-[#765019]' : 'hover:bg-[#f6f7f8]'
                }`}
              >
                <span className="flex w-5 justify-center">
                  {country.code && <CountryFlag code={country.code} />}
                </span>
                <span className="flex-1">{country.label}</span>
                {active && <Check className="h-3.5 w-3.5" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CountrySelect
