import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

// Import translation files
import en from '../locales/en';
import fr from '../locales/fr';
import ar from '../locales/ar';

// Supported languages
export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
];

// Create the i18n instance
const i18n = new I18n();

// Set the translations
i18n.translations = {
  en,
  fr,
  ar,
};

// Set the default locale
i18n.defaultLocale = 'en';

// Enable fallbacks for missing translations
i18n.enableFallback = true;

// Set initial locale based on device settings
try {
  const deviceLocale = Localization.getLocales()?.[0]?.languageCode || 'en';
  i18n.locale = supportedLanguages.find(lang => lang.code === deviceLocale) ? deviceLocale : 'en';
} catch (error) {
  console.log('Error getting device locale, using default:', error);
  i18n.locale = 'en';
}

// Export the translation function
export const t = (key: string, options?: any) => {
  return i18n.t(key, options);
};

// Export the i18n instance for direct access
export default i18n;

// Helper functions
export const getCurrentLanguage = () => i18n.locale;

export const getCurrentLanguageInfo = () => {
  return supportedLanguages.find(lang => lang.code === i18n.locale) || supportedLanguages[0];
};

export const setLanguage = (locale: string) => {
  if (supportedLanguages.find(lang => lang.code === locale)) {
    i18n.locale = locale;
    return true;
  }
  return false;
};

export const isRTL = () => {
  return i18n.locale === 'ar';
};