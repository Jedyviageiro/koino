import {
  AO,
  AU,
  BR,
  CA,
  GB,
  KE,
  MZ,
  NG,
  PT,
  US,
  ZA,
} from 'country-flag-icons/react/3x2'

const FLAG_COMPONENTS = { AO, AU, BR, CA, GB, KE, MZ, NG, PT, US, ZA }

function CountryFlag({ code, className = 'h-3.5 w-5' }) {
  const Flag = FLAG_COMPONENTS[code?.trim().toUpperCase()]
  if (!Flag) return null
  return <Flag className={`shrink-0 rounded-[2px] ${className}`} aria-hidden="true" />
}

export default CountryFlag
