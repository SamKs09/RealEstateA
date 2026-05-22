import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { imagePreloader } from '../services/imagePreloader';

function isAndroidExpoGoRuntime() {
  return (
    Platform.OS === 'android' &&
    (Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient')
  );
}

export const useAppInitialization = () => {
  const [isImagesPreloaded, setIsImagesPreloaded] = useState(false);
  const [preloadError, setPreloadError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing app with image preloading...');

        // Start preloading critical images immediately
        await imagePreloader.preloadCriticalImages();

        // Initialize notification service
        if (!isAndroidExpoGoRuntime()) {
          try {
            const { notificationService } = await import('../services/notificationService');
            await notificationService.initialize();
            console.log('✅ Notification service initialized');
          } catch (notifError) {
            console.warn('⚠️ Notification service failed to initialize:', notifError);
          }
        }

        setIsImagesPreloaded(true);
        console.log('✅ App initialization completed successfully');
      } catch (error) {
        console.warn('⚠️ App initialization had issues:', error);
        setPreloadError(error as Error);
        // Still mark as completed to not block the UI
        setIsImagesPreloaded(true);
      }
    };

    initializeApp();
  }, []);

  return {
    isImagesPreloaded,
    preloadError,
  };
};

export default useAppInitialization;