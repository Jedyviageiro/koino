import { Check } from 'lucide-react'
import { getPasswordChecks } from '@/features/auth/passwordPolicy.js'

function PasswordRules({ password }) {
  const checks = getPasswordChecks(password)
  const rules = [
    ['length', '8-72 characters'],
    ['uppercase', 'Uppercase'],
    ['lowercase', 'Lowercase'],
    ['number', 'Number'],
    ['symbol', 'Symbol'],
  ]

  return (
    <div
      id="password-rules"
      className="grid min-h-[44px] grid-cols-2 content-start gap-x-3 gap-y-1 pt-2 text-[9px] text-[#858992]"
      aria-live="polite"
    >
      {rules.map(([key, label]) => (
        <span
          key={key}
          className={`flex items-center gap-1 ${
            checks[key] ? 'text-[#217a45]' : ''
          }`}
        >
          <Check className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
          {label}
        </span>
      ))}
    </div>
  )
}

export default PasswordRules
