import { useState } from 'react'
import {
  CircleCheck,
  CircleX,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
} from 'lucide-react'

const inputClassName =
  'h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-[12px] font-medium tracking-normal text-[#111114] outline-none placeholder:font-normal placeholder:text-[#a4a7ae] disabled:cursor-not-allowed'

function AuthField({
  icon: Icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  required = true,
  minLength,
  disabled = false,
  validationState = 'idle',
  autoFocus = false,
  ariaLabel,
}) {
  return (
    <div
      className={`flex h-[49px] items-center rounded-[11px] border bg-white px-3 transition-colors ${
        validationState === 'invalid'
          ? 'border-[#e1a7a7]'
          : 'border-[#dedfe3]'
      }`}
    >
      <div className="flex h-6 w-8 shrink-0 items-center border-r border-[#e3e4e7]">
        <Icon
          className="h-[15px] w-[15px] text-[#3c4047]"
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        disabled={disabled}
        autoFocus={autoFocus}
        className={inputClassName}
      />
      {validationState === 'valid' && (
        <CircleCheck
          className="h-4 w-4 shrink-0 fill-[#24bf8b] text-white"
          strokeWidth={2.2}
          aria-hidden="true"
        />
      )}
      {validationState === 'invalid' && (
        <CircleX
          className="h-4 w-4 shrink-0 fill-[#d94c4c] text-white"
          strokeWidth={2.2}
          aria-hidden="true"
        />
      )}
      {validationState === 'checking' && (
        <LoaderCircle
          className="h-4 w-4 shrink-0 animate-spin text-[#a4a7ae]"
          strokeWidth={1.8}
          aria-hidden="true"
        />
      )}
    </div>
  )
}

function PasswordField({
  value,
  onChange,
  autoComplete,
  disabled = false,
  autoFocus = false,
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="flex h-[49px] items-center rounded-[11px] border border-[#dedfe3] bg-white px-3">
      <div className="flex h-6 w-8 shrink-0 items-center border-r border-[#e3e4e7]">
        <LockKeyhole
          className="h-[15px] w-[15px] text-[#3c4047]"
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </div>
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder="Password"
        aria-label="Password"
        autoComplete={autoComplete}
        required
        minLength={6}
        disabled={disabled}
        autoFocus={autoFocus}
        className={inputClassName}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="flex h-7 w-7 shrink-0 items-center justify-center text-[#92959c] hover:text-[#555860] focus-visible:outline-2 focus-visible:outline-[#1e55e5]"
        aria-label={visible ? 'Hide password' : 'Show password'}
        title={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? (
          <EyeOff className="h-4 w-4" strokeWidth={1.7} />
        ) : (
          <Eye className="h-4 w-4" strokeWidth={1.7} />
        )}
      </button>
    </div>
  )
}

export { AuthField, PasswordField }
