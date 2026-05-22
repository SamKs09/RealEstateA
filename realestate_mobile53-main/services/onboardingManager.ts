/**
 * OnboardingManager Service
 * 
 * Manages onboarding state persistence using AsyncStorage.
 * Handles first-launch detection and completion tracking.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage key for onboarding completion status
 */
const STORAGE_KEY = 'hasCompletedOnboarding';

/**
 * In-memory cache for completion status to reduce AsyncStorage reads
 */
let cachedStatus: boolean | null = null;

/**
 * OnboardingManager
 * 
 * Provides methods to check and manage onboarding completion status.
 */
export class OnboardingManager {
  /**
   * Check if user has completed onboarding
   * 
   * @returns Promise<boolean> - true if onboarding completed, false otherwise
   * 
   * @example
   * const hasCompleted = await OnboardingManager.hasCompletedOnboarding();
   * if (!hasCompleted) {
   *   // Show onboarding
   * }
   */
  static async hasCompletedOnboarding(): Promise<boolean> {
    try {
      // Return cached value if available
      if (cachedStatus !== null) {
        return cachedStatus;
      }

      // Read from AsyncStorage
      const value = await AsyncStorage.getItem(STORAGE_KEY);
      
      // Parse and cache the result
      cachedStatus = value === 'true';
      return cachedStatus;
    } catch (error) {
      // On error, assume first launch (safe default)
      console.error('❌ Error checking onboarding status:', error);
      return false;
    }
  }

  /**
   * Mark onboarding as complete
   * 
   * Persists completion status to AsyncStorage and updates cache.
   * 
   * @returns Promise<void>
   * 
   * @example
   * await OnboardingManager.markOnboardingComplete();
   * // User will not see onboarding on next launch
   */
  static async markOnboardingComplete(): Promise<void> {
    try {
      // Write to AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
      
      // Update cache
      cachedStatus = true;
      
      console.log('✅ Onboarding marked as complete');
    } catch (error) {
      // Log error but don't block navigation
      console.error('❌ Error saving onboarding status:', error);
      throw error;
    }
  }

  /**
   * Reset onboarding status (for testing/debugging)
   * 
   * Clears completion status from AsyncStorage and cache.
   * User will see onboarding on next launch.
   * 
   * @returns Promise<void>
   * 
   * @example
   * await OnboardingManager.resetOnboarding();
   * // Onboarding will show again on next launch
   */
  static async resetOnboarding(): Promise<void> {
    try {
      // Remove from AsyncStorage
      await AsyncStorage.removeItem(STORAGE_KEY);
      
      // Clear cache
      cachedStatus = null;
      
      console.log('🔄 Onboarding status reset');
    } catch (error) {
      console.error('❌ Error resetting onboarding status:', error);
      throw error;
    }
  }

  /**
   * Clear the in-memory cache
   * 
   * Forces next hasCompletedOnboarding() call to read from AsyncStorage.
   * Useful for testing or when you need to ensure fresh data.
   * 
   * @example
   * OnboardingManager.clearCache();
   */
  static clearCache(): void {
    cachedStatus = null;
  }
}
