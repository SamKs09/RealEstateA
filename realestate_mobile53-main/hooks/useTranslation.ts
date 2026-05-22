/**
 * useTranslation Hook
 * 
 * Custom hook that provides translation function with automatic re-rendering
 * when language changes.
 */

import { useLanguage } from '../contexts/LanguageContext';
import { t as translateFn, isRTL as checkRTL } from '../services/i18n';

/**
 * Hook to use translations with automatic re-rendering on language change
 * Use this instead of importing t() directly in components
 * 
 * @returns Translation function and language info
 */
export const useTranslation = () => {
  // This will cause re-render when language changes
  const { currentLanguage } = useLanguage();
  
  return {
    t: translateFn,
    currentLanguage,
    isRTL: checkRTL(),
  };
};
