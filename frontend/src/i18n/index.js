import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { API_BASE_URL } from '@/config/env.js'
import { getAuthSession } from '@/features/auth/authStorage.js'
import en from '@/locales/en.json'
import pt from '@/locales/pt.json'

const LOCALE_STORAGE_KEY = 'koino.locale'

export function normalizeLocale(value) {
  return String(value || '').toLowerCase().startsWith('pt') ? 'pt-BR' : 'en'
}

export function getStoredLocale() {
  const accountLanguage = getAuthSession()?.language
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  return accountLanguage || stored
    ? normalizeLocale(accountLanguage || stored)
    : null
}

async function detectRequestLocale() {
  try {
    const response = await fetch(`${API_BASE_URL}/i18n/locale`, {
      headers: { Accept: 'application/json' },
    })
    if (response.ok) return normalizeLocale((await response.json()).locale)
  } catch {
    // The status flow handles availability; locale detection has a local fallback.
  }
  return normalizeLocale(navigator.languages?.[0] || navigator.language)
}

export async function initializeI18n() {
  const locale = getStoredLocale() || (await detectRequestLocale())
  await i18n.use(initReactI18next).init({
    resources: { en: { translation: en }, 'pt-BR': { translation: pt } },
    lng: locale,
    fallbackLng: 'en',
    supportedLngs: ['en', 'pt-BR'],
    interpolation: { escapeValue: false },
  })
  document.documentElement.lang = locale
  return locale
}

export async function changeAppLanguage(value, { persist = true } = {}) {
  const locale = normalizeLocale(value)
  if (persist) localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  document.documentElement.lang = locale
  await i18n.changeLanguage(locale)
  window.dispatchEvent(new CustomEvent('koino:locale', { detail: locale }))
  return locale
}

export function apiLanguage() {
  return normalizeLocale(i18n.resolvedLanguage || i18n.language)
}

export default i18n
