/**
 * OnboardingFlow Component
 * 
 * Main container component that orchestrates the entire onboarding experience.
 * Manages screen transitions, handles completion/skip actions, and coordinates
 * with OnboardingManager for persistence.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingSlide } from '../../../components/onboarding/OnboardingSlide';
import { PaginationDots } from '../../../components/onboarding/PaginationDots';
import { OnboardingManager } from '../../../services/onboardingManager';
import { getOnboardingScreens } from '../../../constants/onboardingScreens';
import { OnboardingFlowProps, OnboardingScreen } from '../../../types/onboarding';
import { useLanguage } from '../../../contexts/LanguageContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * OnboardingFlow
 * 
 * Displays a horizontal scrollable carousel of onboarding screens.
 * Supports both swipe gestures and button navigation.
 * Persists completion status to AsyncStorage.
 * 
 * @param props - Component props
 * @returns JSX.Element
 */
export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const router = useRouter();
  const flatListRef = useRef<FlatList<OnboardingScreen>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const { currentLanguage } = useLanguage();
  const [screens, setScreens] = useState(getOnboardingScreens());

  // Update screens when language changes
  useEffect(() => {
    setScreens(getOnboardingScreens());
  }, [currentLanguage]);
  
  const ONBOARDING_SCREENS = screens;

  /**
   * Handle navigation to next screen with smooth animation
   */
  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;

    if (nextIndex < ONBOARDING_SCREENS.length) {
      // Navigate to next screen with smooth animation
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    } else {
      // Last screen - complete onboarding
      handleComplete();
    }
  }, [currentIndex, ONBOARDING_SCREENS.length]);

  /**
   * Handle skip action
   */
  const handleSkip = useCallback(async () => {
    try {
      await OnboardingManager.markOnboardingComplete();
      onComplete();
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      // Still navigate even if storage fails
      onComplete();
    }
  }, [onComplete]);

  /**
   * Handle onboarding completion
   */
  const handleComplete = useCallback(async () => {
    try {
      await OnboardingManager.markOnboardingComplete();
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Still navigate even if storage fails
      onComplete();
    }
  }, [onComplete]);

  /**
   * Handle scroll to update current index with smooth transition
   */
  const handleScroll = useCallback(
    Animated.event(
      [{ nativeEvent: { contentOffset: { x: scrollX } } }],
      { useNativeDriver: false }
    ),
    [scrollX]
  );

  /**
   * Handle scroll end to update current index
   */
  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / SCREEN_WIDTH);
      
      if (index !== currentIndex) {
        setCurrentIndex(index);
      }
    },
    [currentIndex]
  );

  /**
   * Handle scroll begin drag for better responsiveness
   */
  const handleScrollBeginDrag = useCallback(() => {
    // Optional: Add haptic feedback or other interactions
  }, []);

  /**
   * Render individual slide
   */
  const renderSlide = useCallback(
    ({ item, index }: { item: OnboardingScreen; index: number }) => (
      <OnboardingSlide
        screen={item}
        isActive={index === currentIndex}
        index={index}
        totalScreens={ONBOARDING_SCREENS.length}
        onNext={handleNext}
        onSkip={handleSkip}
        onGetStarted={handleComplete}
      />
    ),
    [currentIndex, ONBOARDING_SCREENS.length, handleNext, handleSkip, handleComplete]
  );

  /**
   * Get item layout for FlatList optimization
   */
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    []
  );

  /**
   * Extract key for each item
   */
  const keyExtractor = useCallback((item: OnboardingScreen) => item.id, []);

  return (
    <View style={styles.container}>
      <FlatList
        key={currentLanguage}
        ref={flatListRef}
        data={ONBOARDING_SCREENS}
        renderItem={renderSlide}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="center"
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        getItemLayout={getItemLayout}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews={Platform.OS === 'android'}
        scrollEventThrottle={16}
        overScrollMode="never"
      />

      {/* Pagination dots are already in the images, so we don't render them separately */}
    </View>
  );
};

export default OnboardingFlow;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
