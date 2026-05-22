/**
 * LanguagePicker Component
 * 
 * Professional language selector for onboarding screen.
 * Allows users to switch between English, French, and Arabic.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supportedLanguages } from '../../services/i18n';
import { useLanguage } from '../../contexts/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * LanguagePicker
 * 
 * Displays current language with a dropdown to select from available languages.
 * Updates the app's language when a selection is made.
 * 
 * @returns JSX.Element
 */
export const LanguagePicker: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { currentLanguage, changeLanguage } = useLanguage();

  const handleLanguageSelect = async (languageCode: string) => {
    await changeLanguage(languageCode);
    setIsModalVisible(false);
  };

  const getCurrentLanguageName = () => {
    const lang = supportedLanguages.find(l => l.code === currentLanguage);
    return lang?.nativeName || 'English';
  };

  const getLanguageFlag = (code: string) => {
    switch (code) {
      case 'en':
        return '🇬🇧';
      case 'fr':
        return '🇫🇷';
      case 'ar':
        return '🇹🇳';
      default:
        return '🌐';
    }
  };

  return (
    <>
      {/* Language Selector Button */}
      <TouchableOpacity
        style={styles.languageButton}
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.languageButtonContent}>
          <Text style={styles.languageFlag}>{getLanguageFlag(currentLanguage)}</Text>
          <Text style={styles.languageText}>{getCurrentLanguageName()}</Text>
          <Ionicons name="chevron-down" size={18} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      {/* Language Selection Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#424242" />
              </TouchableOpacity>
            </View>

            <View style={styles.languageList}>
              {supportedLanguages.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageOption,
                    currentLanguage === language.code && styles.languageOptionActive,
                  ]}
                  onPress={() => handleLanguageSelect(language.code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.languageOptionContent}>
                    <Text style={styles.languageOptionFlag}>
                      {getLanguageFlag(language.code)}
                    </Text>
                    <View style={styles.languageOptionText}>
                      <Text style={styles.languageOptionName}>
                        {language.nativeName}
                      </Text>
                      <Text style={styles.languageOptionSubname}>
                        {language.name}
                      </Text>
                    </View>
                  </View>
                  {currentLanguage === language.code && (
                    <Ionicons name="checkmark-circle" size={24} color="#FF7043" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Language Button (Top Right)
  languageButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
  },
  languageButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  languageFlag: {
    fontSize: 18,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'raleway-600SemiBold',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: SCREEN_WIDTH - 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 24,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#424242',
    fontFamily: 'raleway-700Bold',
  },
  closeButton: {
    padding: 4,
  },

  // Language List
  languageList: {
    paddingTop: 12,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  languageOptionActive: {
    backgroundColor: '#FFF5F2',
  },
  languageOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  languageOptionFlag: {
    fontSize: 32,
  },
  languageOptionText: {
    gap: 2,
  },
  languageOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
    fontFamily: 'raleway-600SemiBold',
  },
  languageOptionSubname: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9E9E9E',
    fontFamily: 'raleway-400Regular',
  },
});
