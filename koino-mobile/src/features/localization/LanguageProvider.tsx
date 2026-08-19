import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getAuthSession, saveAuthSession } from '@/features/auth/authStorage';
import { AppLanguage, setCurrentLanguage } from './language';

const copy = {
  en: { home: 'Home', plans: 'Plans', bible: 'Bible', community: 'Community', chat: 'Chat', settings: 'Settings' },
  pt: { home: 'Início', plans: 'Planos', bible: 'Bíblia', community: 'Comunidade', chat: 'Conversa', settings: 'Definições' },
} as const;

type Key = keyof typeof copy.en;
type LanguageContextValue = { language: AppLanguage; setLanguage: (value: AppLanguage) => Promise<void>; t: (key: Key) => string };
const LanguageContext = createContext<LanguageContextValue>({ language: 'en', setLanguage: async () => {}, t: (key) => copy.en[key] });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en');
  useEffect(() => { getAuthSession().then((session) => { const value = session?.language?.startsWith('pt') ? 'pt' : 'en'; setCurrentLanguage(value); setLanguageState(value); }); }, []);
  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: async (next) => {
      setCurrentLanguage(next); setLanguageState(next);
      const session = await getAuthSession();
      if (session) await saveAuthSession({ ...session, language: next });
    },
    t: (key) => copy[language][key],
  }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { return useContext(LanguageContext); }
