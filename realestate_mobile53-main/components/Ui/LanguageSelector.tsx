import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import { supportedLanguages, getCurrentLanguageInfo } from '../../services/i18n';
import { Colors } from '../styles';
import { BottomSheet } from './BottomSheet';
import { BottomSheetModalMethods } from './BottomSheet';

interface LanguageSelectorProps {
  style?: any;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ style }) => {
  const { changeLanguage } = useLanguage();
  const { t } = useTranslation();
  const currentLanguageInfo = getCurrentLanguageInfo();
  
  const bottomSheetRef = useRef<BottomSheetModalMethods>(null);

  const handleLanguageSelect = async (languageCode: string) => {
    try {
      await changeLanguage(languageCode);
      bottomSheetRef.current?.dismiss();
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={() => bottomSheetRef.current?.present()}
        activeOpacity={0.7}
      >
        <View style={styles.content}>
          <Text style={styles.label}>{t('language')}</Text>
          <View style={styles.selectedLanguage}>
            <Text style={styles.languageText}>
              {currentLanguageInfo.nativeName}
            </Text>
            <Ionicons
              name="chevron-down"
              size={16}
              color="#8A8A8A"
              style={styles.chevron}
            />
          </View>
        </View>
      </TouchableOpacity>

      <BottomSheet
        ref={bottomSheetRef}
        title={t('selectLanguage')}
        snapPoints={['50%']}
      >
        <FlatList
          data={supportedLanguages}
          keyExtractor={(item) => item.code}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.languageItem,
                currentLanguageInfo.code === item.code && styles.selectedLanguageItem,
              ]}
              onPress={() => handleLanguageSelect(item.code)}
            >
              <View style={styles.languageItemContent}>
                <Text style={styles.languageName}>{item.name}</Text>
                <Text style={styles.languageNativeName}>{item.nativeName}</Text>
              </View>
              {currentLanguageInfo.code === item.code && (
                <Ionicons name="checkmark" size={20} color={Colors.primary} />
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
      </BottomSheet>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 16,
    marginVertical: 8,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  selectedLanguage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 14,
    color: '#8A8A8A',
    marginRight: 8,
  },
  chevron: {
    marginLeft: 4,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  selectedLanguageItem: {
    backgroundColor: '#FFF0E6',
  },
  languageItemContent: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 2,
  },
  languageNativeName: {
    fontSize: 14,
    color: '#8A8A8A',
  },
  listContent: {
    paddingBottom: 20,
  },
});
