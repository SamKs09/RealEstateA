/**
 * OnboardingSlide Component
 * 
 * Renders individual onboarding screen with hero image/gradient, text content, and action buttons.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingSlideProps } from '../../types/onboarding';
import { LanguagePicker } from './LanguagePicker';
import { useTranslation } from '../../hooks/useTranslation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * OnboardingSlide
 * 
 * Displays a single onboarding screen with:
 * - Hero image or gradient background
 * - Title and description text
 * - Next/Get Started button
 * - Optional Skip link
 * 
 * @param props - Component props
 * @returns JSX.Element
 */
export const OnboardingSlide: React.FC<OnboardingSlideProps> = ({
  screen,
  isActive,
  index,
  totalScreens,
  onNext,
  onSkip,
  onGetStarted,
}) => {
  const { t } = useTranslation();
  const isLastScreen = index === totalScreens - 1;
  const isFirstScreen = index === 0;

  const handleButtonPress = () => {
    if (isLastScreen) {
      onGetStarted();
    } else {
      onNext();
    }
  };

  // First screen: Orange gradient with centered content
  if (isFirstScreen) {
    return (
      <LinearGradient
        colors={['#FF8C5A', '#FF7043']}
        style={styles.container}
      >
        {/* Language Picker */}
        <LanguagePicker />
        
        <View style={styles.firstScreenContent}>
          <Image
            source={require('../../assets/images/Auth/Appartment.png')}
            style={styles.houseIcon}
            resizeMode="contain"
          />
          <Text style={styles.firstScreenTitle}>{screen.title}</Text>
          <Text style={styles.firstScreenSubtitle}>{screen.subtitle}</Text>
        </View>
        
        {/* Continue button */}
        <View style={styles.firstScreenButtonContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleButtonPress}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>{screen.buttonText}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // Screens 2-4: Image at top, content at bottom
  return (
    <View style={styles.container}>
      {/* Hero Image */}
      <View style={styles.imageContainer}>
        <Image
          source={screen.image}
          style={styles.heroImage}
          resizeMode="cover"
        />
      </View>

      {/* Content Section */}
      <View style={styles.contentSection}>
        {/* Pagination dots */}
        <View style={styles.paginationContainer}>
          {[0, 1, 2].map((dotIndex) => (
            <View
              key={dotIndex}
              style={[
                styles.paginationDot,
                dotIndex === index - 1 && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>

        {/* Title and Description */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{screen.title}</Text>
          {screen.description && (
            <Text style={styles.description}>{screen.description}</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleButtonPress}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>{screen.buttonText}</Text>
          </TouchableOpacity>

          {screen.showSkip && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={onSkip}
              activeOpacity={0.6}
            >
              <Text style={styles.skipButtonText}>{t('skip')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#FFFFFF',
  },
  
  // First screen styles (gradient background)
  firstScreenContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  houseIcon: {
    width: 120,
    height: 120,
    marginBottom: 30,
  },
  firstScreenTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'raleway-700Bold',
  },
  firstScreenSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    fontFamily: 'raleway-400Regular',
  },
  firstScreenButtonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  continueButton: {
    width: SCREEN_WIDTH - 48,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF7043',
    fontFamily: 'raleway-600SemiBold',
  },

  // Screens 2-4 styles (image + content)
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.5,
    backgroundColor: '#F5F5F5',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  contentSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    justifyContent: 'space-between',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD4C4',
    marginHorizontal: 6,
  },
  paginationDotActive: {
    backgroundColor: '#FF7043',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF7043',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'raleway-700Bold',
  },
  description: {
    fontSize: 15,
    fontWeight: '400',
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'raleway-400Regular',
  },
  buttonContainer: {
    alignItems: 'center',
  },
  nextButton: {
    width: SCREEN_WIDTH - 48,
    height: 56,
    backgroundColor: '#FF7043',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#FF7043',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'raleway-600SemiBold',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#BDBDBD',
    fontFamily: 'raleway-400Regular',
  },
});
