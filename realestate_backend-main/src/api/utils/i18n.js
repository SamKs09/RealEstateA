const en = require('../locales/en');
const ar = require('../locales/ar');
const fr = require('../locales/fr');

const locales = { en, ar, fr };
const SUPPORTED_LANGUAGES = ['en', 'ar', 'fr'];
const DEFAULT_LANGUAGE = 'en';

/**
 * Returns a translator function bound to the given language.
 *
 * Usage:
 *   const t = getTranslator('ar');
 *   t('loginSuccess')                          // → "تم تسجيل الدخول بنجاح"
 *   t('registrationSuccessEmail', email)       // → calls locale function with args
 */
function getTranslator(lang) {
  const language = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
  const locale = locales[language];

  return function t(key, ...args) {
    const value = locale[key];
    if (value === undefined) {
      // Fallback to English
      const fallback = locales[DEFAULT_LANGUAGE][key];
      if (fallback === undefined) {
        console.warn(`[i18n] Missing translation key: "${key}"`);
        return key;
      }
      return typeof fallback === 'function' ? fallback(...args) : fallback;
    }
    return typeof value === 'function' ? value(...args) : value;
  };
}

module.exports = { getTranslator, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE };
