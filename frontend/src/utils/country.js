export const COUNTRY_OPTIONS = [
  { code: '', label: 'Select country' },
  { code: 'MZ', label: 'Mozambique' },
  { code: 'ZA', label: 'South Africa' },
  { code: 'AO', label: 'Angola' },
  { code: 'BR', label: 'Brazil' },
  { code: 'PT', label: 'Portugal' },
  { code: 'NG', label: 'Nigeria' },
  { code: 'KE', label: 'Kenya' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'US', label: 'United States' },
  { code: 'CA', label: 'Canada' },
  { code: 'AU', label: 'Australia' },
]

export function countryFlag(countryCode) {
  const code = countryCode?.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(code || '')) return ''
  return [...code]
    .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
    .join('')
}
