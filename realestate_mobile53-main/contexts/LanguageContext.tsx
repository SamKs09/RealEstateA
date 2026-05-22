/**
 * LanguageContext
 * 
 * Provides language state management across the entire app.
 * Triggers re-renders when language changes to update all translated content.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { setLanguage as setI18nLanguage, getCurrentLanguage } from '../services/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_STORAGE_KEY = '@app_language';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (languageCode: string) => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Change the app language and persist to storage
   */
  const changeLanguage = useCallback(async (languageCode: string) => {
    setIsLoading(true);
    try {
      // Update i18n locale
      const success = setI18nLanguage(languageCode);
      
      if (success) {
        // Update state to trigger re-render
        setCurrentLanguage(languageCode);
        
        // Persist to AsyncStorage
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
        
        console.log('Language changed to:', languageCode);
      }
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: LanguageContextType = {
    currentLanguage,
    changeLanguage,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Hook to access language context
 */
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
};

/**
 * Load saved language from storage
 */
export const loadSavedLanguage = async (): Promise<string | null> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return savedLanguage;
  } catch (error) {
    console.error('Error loading saved language:', error);
    return null;
  }
};
