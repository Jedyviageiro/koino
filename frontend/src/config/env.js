const configuredApiUrl = (import.meta.env.VITE_API_URL || '/api')
  .trim()
  .replace(/\/+$/, '')

const normalizedApiUrl =
  configuredApiUrl === '/api' || configuredApiUrl.endsWith('/api')
    ? configuredApiUrl
    : `${configuredApiUrl}/api`

const isVercelDeployment =
  typeof window !== 'undefined' &&
  window.location.hostname.endsWith('.vercel.app')

export const API_BASE_URL = isVercelDeployment ? '/api' : normalizedApiUrl
