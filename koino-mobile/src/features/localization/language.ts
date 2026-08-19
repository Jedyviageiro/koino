export type AppLanguage = 'en' | 'pt';

let currentLanguage: AppLanguage = 'en';

export function getCurrentLanguage() { return currentLanguage; }
export function setCurrentLanguage(language: string) {
  currentLanguage = language.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}
