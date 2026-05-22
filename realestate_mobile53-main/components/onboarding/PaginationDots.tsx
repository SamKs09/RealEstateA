/**
 * PaginationDots Component
 * 
 * Visual indicator showing current position in the onboarding flow.
 * Displays dots for each screen with the active dot highlighted.
 */

import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { PaginationDotsProps } from '../../types/onboarding';
import { ONBOARDING_COLORS } from '../../constants/onboardingScreens';

/**
 * PaginationDots
 * 
 * Renders a row of dots indicating the current screen position.
 * The active dot is highlighted with the primary orange color.
 * 
 * @param props - Component props
 * @returns JSX.Element
 */
export const PaginationDots: React.FC<PaginationDotsProps> = ({
  activeIndex,
  totalDots,
  dotColor = ONBOARDING_COLORS.dotInactive,
  activeDotColor = ONBOARDING_COLORS.dotActive,
  dotSize = 8,
  spacing = 8,
}) => {
  return (
    <View style={styles.container} accessibilityRole="progressbar">
      {Array.from({ length: totalDots }).map((_, index) => {
        const isActive = index === activeIndex;
        
        return (
          <View
            key={`dot-${index}`}
            style={[
              styles.dot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                marginHorizontal: spacing / 2,
                backgroundColor: isActive ? activeDotColor : dotColor,
                opacity: isActive ? 1 : 0.4,
              },
            ]}
            accessibilityLabel={`Screen ${index + 1} of ${totalDots}`}
            accessibilityState={{ selected: isActive }}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  dot: {
    // Dynamic styles applied inline
  },
});
