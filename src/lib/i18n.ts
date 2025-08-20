import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Italian
import commonIT from '../locales/it/common.json';
import componentsIT from '../locales/it/components.json';
import pagesIT from '../locales/it/pages.json';
import toastsIT from '../locales/it/toasts.json';
import validationIT from '../locales/it/validation.json';

// English
import commonEN from '../locales/en/common.json';
import componentsEN from '../locales/en/components.json';
import pagesEN from '../locales/en/pages.json';
import toastsEN from '../locales/en/toasts.json';
import validationEN from '../locales/en/validation.json';

// Dutch
import commonNL from '../locales/nl/common.json';
import componentsNL from '../locales/nl/components.json';
import pagesNL from '../locales/nl/pages.json';
import toastsNL from '../locales/nl/toasts.json';
import validationNL from '../locales/nl/validation.json';

const resources = {
  it: {
    common: commonIT,
    components: componentsIT,
    pages: pagesIT,
    toasts: toastsIT,
    validation: validationIT,
  },
  en: {
    common: commonEN,
    components: componentsEN,
    pages: pagesEN,
    toasts: toastsEN,
    validation: validationEN,
  },
  nl: {
    common: commonNL,
    components: componentsNL,
    pages: pagesNL,
    toasts: toastsNL,
    validation: validationNL,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'it',
    ns: ['common', 'components', 'pages', 'toasts', 'validation'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;