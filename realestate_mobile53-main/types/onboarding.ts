/**
 * Onboarding Types
 * 
 * Type definitions for the onboarding flow feature.
 */

import { ImageSourcePropType } from 'react-native';

/**
 * Represents a single onboarding screen configuration
 */
export interface OnboardingScreen {
  /** Unique identifier for the screen */
  id: string;
  
  /** Main heading text */
  title: string;
  
  /** Optional subtitle (used in Screen 1) */
  subtitle?: string;
  
  /** Body text description */
  description?: string;
  
  /** Hero image asset */
  image: ImageSourcePropType;
  
  /** Background color (default: white) */
  backgroundColor?: string;
  
  /** CTA button text ("Next" or "Get Started") */
  buttonText: string;
  
  /** Whether to show skip link */
  showSkip: boolean;
}

/**
 * Props for the OnboardingFlow component
 */
export interface OnboardingFlowProps {
  /** Callback when onboarding is completed */
  onComplete: () => void;
}

/**
 * Props for individual OnboardingSlide component
 */
export interface OnboardingSlideProps {
  /** Screen configuration data */
  screen: OnboardingScreen;
  
  /** Whether this slide is currently active */
  isActive: boolean;
  
  /** Index of this slide */
  index: number;
  
  /** Total number of screens */
  totalScreens: number;
  
  /** Callback when Next button is pressed */
  onNext: () => void;
  
  /** Callback when Skip link is pressed */
  onSkip: () => void;
  
  /** Callback when Get Started button is pressed */
  onGetStarted: () => void;
}

/**
 * Props for PaginationDots component
 */
export interface PaginationDotsProps {
  /** Currently active dot index */
  activeIndex: number;
  
  /** Total number of dots to display */
  totalDots: number;
  
  /** Color for inactive dots (default: light gray) */
  dotColor?: string;
  
  /** Color for active dot (default: orange) */
  activeDotColor?: string;
  
  /** Size of each dot in pixels (default: 8) */
  dotSize?: number;
  
  /** Spacing between dots in pixels (default: 8) */
  spacing?: number;
}

/**
 * Internal state for onboarding flow
 */
export interface OnboardingState {
  /** Current screen index (0-3) */
  currentIndex: number;
  
  /** Whether screen transition is in progress */
  isTransitioning: boolean;
  
  /** Persisted completion status */
  hasCompletedOnboarding: boolean;
}
