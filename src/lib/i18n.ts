import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import commonIT from '../locales/it/common.json';
import componentsIT from '../locales/it/components.json';
import pagesIT from '../locales/it/pages.json';
import adminIT from '../locales/it/admin.json';

import translationEN from '../locales/en/translation.json';
import translationNL from '../locales/nl/translation.json';

const resources = {
  it: {
    common: commonIT,
    components: componentsIT,
    pages: pagesIT,
    admin: adminIT,
  },
  en: {
    translation: translationEN,
  },
  nl: {
    translation: translationNL,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'it',
    supportedLngs: ['it', 'en', 'nl'],
    // Define namespaces
    ns: ['common', 'components', 'pages', 'admin'],
    // Set default namespace
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;