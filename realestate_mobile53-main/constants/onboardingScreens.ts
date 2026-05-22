/**
 * Onboarding Screens Configuration
 * 
 * Defines the content and configuration for all onboarding screens.
 */

import { OnboardingScreen } from '../types/onboarding';
import { t } from '../services/i18n';

/**
 * Get onboarding screens data with translations
 * 
 * Array of 4 screens that showcase the app's core features:
 * 1. Splash/Welcome - App branding with orange gradient
 * 2. Find Your Perfect Home - Property marketplace
 * 3. Buy or Rent Vehicles - Vehicle marketplace
 * 4. Connect & Close Deals - Chat and booking features
 */
export const getOnboardingScreens = (): OnboardingScreen[] => [
  {
    id: 'screen-1',
    title: t('onboarding.locationApp'),
    subtitle: t('onboarding.subtitle'),
    image: require('../assets/Onboarding/Onboarding 1.png'), // Orange gradient with house icon
    backgroundColor: '#FF7043',
    buttonText: t('continue'),
    showSkip: false,
  },
  {
    id: 'screen-2',
    title: t('onboarding.findHome'),
    description: t('onboarding.findHomeDesc'),
    image: require('../assets/Onboarding/Onboarding 4.png'), // House image
    buttonText: t('next'),
    showSkip: true,
  },
  {
    id: 'screen-3',
    title: t('onboarding.buyRentVehicles'),
    description: t('onboarding.buyRentVehiclesDesc'),
    image: require('../assets/Onboarding/Onboarding 3.png'), // Car image
    buttonText: t('next'),
    showSkip: true,
  },
  {
    id: 'screen-4',
    title: t('onboarding.connectDeals'),
    description: t('onboarding.connectDealsDesc'),
    image: require('../assets/Onboarding/Onboarding 2.png'), // Handshake image
    buttonText: t('getStarted'),
    showSkip: true,
  },
];

/**
 * Onboarding screens data (for backward compatibility)
 */
export const ONBOARDING_SCREENS = getOnboardingScreens();

/**
 * Total number of onboarding screens
 */
export const TOTAL_ONBOARDING_SCREENS = 4;

/**
 * Onboarding colors
 */
export const ONBOARDING_COLORS = {
  primary: '#FF7043',
  secondary: '#FF8C5A',
  textPrimary: '#333333',
  textSecondary: '#9E9E9E',
  textWhite: '#FFFFFF',
  dotInactive: '#FFD4C4',
  dotActive: '#FF7043',
};
