import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import tr from './tr.json';
import en from './en.json';
import ru from './ru.json';

i18n.use(initReactI18next).init({
  resources: {
    tr: { translation: tr },
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: (() => {
    try {
      const saved = localStorage.getItem('renarvo-app');
      if (saved) return JSON.parse(saved)?.state?.locale ?? 'tr';
    } catch {}
    return 'tr';
  })(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
