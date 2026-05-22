const { getTranslator, SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } = require('../utils/i18n');

/**
 * Language detection middleware.
 * Attaches req.lang (string) and req.t (translator function) to every request.
 *
 * Detection priority:
 *   1. x-language header  (e.g., x-language: ar)
 *   2. Accept-Language header (e.g., Accept-Language: ar,fr;q=0.9,en;q=0.8)
 *   3. Default language ('en')
 */
function languageMiddleware(req, res, next) {
  // 1. Custom header takes highest priority
  let lang = req.headers['x-language'];

  // 2. Parse Accept-Language if custom header missing or unsupported
  if (!lang || !SUPPORTED_LANGUAGES.includes(lang)) {
    const acceptLanguage = req.headers['accept-language'] || '';
    const preferred = acceptLanguage
      .split(',')
      .map((part) => part.split(';')[0].trim().toLowerCase().substring(0, 2))
      .find((code) => SUPPORTED_LANGUAGES.includes(code));
    lang = preferred || DEFAULT_LANGUAGE;
  }

  req.lang = lang;
  req.t = getTranslator(lang);
  next();
}

module.exports = languageMiddleware;
