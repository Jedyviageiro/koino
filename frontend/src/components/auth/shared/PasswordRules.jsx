import { Check } from 'lucide-react'
import { getPasswordChecks } from '@/features/auth/passwordPolicy.js'
import { useTranslation } from 'react-i18next'

function PasswordRules({ password }) {
  const { t } = useTranslation()
  const checks = getPasswordChecks(password)
  const rules = [
    ['length', t('authExtra.rules.length')],
    ['uppercase', t('authExtra.rules.uppercase')],
    ['lowercase', t('authExtra.rules.lowercase')],
    ['number', t('authExtra.rules.number')],
    ['symbol', t('authExtra.rules.symbol')],
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
