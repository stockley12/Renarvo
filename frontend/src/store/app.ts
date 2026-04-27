import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';
export type Locale = 'tr' | 'en' | 'ru';
export type Currency = 'TRY' | 'USD' | 'EUR' | 'RUB';

interface AppState {
  theme: Theme;
  locale: Locale;
  currency: Currency;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setLocale: (l: Locale) => void;
  setCurrency: (c: Currency) => void;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      locale: 'tr',
      currency: 'TRY',
      setTheme: (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        set({ theme });
      },
      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', next === 'dark');
        set({ theme: next });
      },
      setLocale: (locale) => set({ locale }),
      setCurrency: (currency) => set({ currency }),
    }),
    { name: 'renarvo-app' }
  )
);

if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('renarvo-app');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed?.state?.theme === 'dark') document.documentElement.classList.add('dark');
    } catch {
      /* ignore */
    }
  }
}
