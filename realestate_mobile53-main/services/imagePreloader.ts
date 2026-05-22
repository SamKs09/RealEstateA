import { Image } from 'expo-image';

// All images that need to be preloaded for better performance
export const SCREEN_IMAGES = {
  house1: require('../assets/images/ScreensImages/House1.jpg'),
  house2: require('../assets/images/ScreensImages/House2.jpg'),
  // Add more images as needed
};

export const ICON_IMAGES = {
  bed: require('../assets/Icons/IC_Bed.png'),
  bath: require('../assets/Icons/IC_Bath.png'),
  shadow: require('../assets/images/Effet/Shadow.png'),
  // Add more icons as needed
};

class ImagePreloaderService {
  private preloadedImages = new Set<string>();

  async preloadCriticalImages(): Promise<void> {
    try {
      console.log('🖼️ Starting critical image preload...');
      
      // Preload screen images with high priority
      const screenImagePromises = Object.values(SCREEN_IMAGES).map(imageSource => 
        this.preloadSingleImage(imageSource, 'screen')
      );

      // Preload icons with medium priority
      const iconImagePromises = Object.values(ICON_IMAGES).map(imageSource => 
        this.preloadSingleImage(imageSource, 'icon')
      );

      // Wait for all critical images to load
      await Promise.all([...screenImagePromises, ...iconImagePromises]);
      
      console.log('✅ Critical image preload completed successfully');
    } catch (error) {
      console.warn('⚠️ Some images failed to preload:', error);
      // Don't throw - app should continue even if preloading fails
    }
  }

  private async preloadSingleImage(imageSource: any, type: 'screen' | 'icon'): Promise<void> {
    try {
      const cachePolicy = type === 'screen' ? 'memory-disk' : 'memory';
      await Image.prefetch(imageSource, { cachePolicy });
      
      const imageKey = typeof imageSource === 'string' ? imageSource : JSON.stringify(imageSource);
      this.preloadedImages.add(imageKey);
      
      console.log(`✅ Preloaded ${type} image successfully`);
    } catch (error) {
      console.warn(`⚠️ Failed to preload ${type} image:`, error);
    }
  }

  async clearImageCache(): Promise<void> {
    try {
      await Image.clearMemoryCache();
      await Image.clearDiskCache();
      this.preloadedImages.clear();
      console.log('🧹 Image cache cleared successfully');
    } catch (error) {
      console.warn('⚠️ Failed to clear image cache:', error);
    }
  }

  getOptimizedImageProps(source: any, cachePolicy: 'none' | 'disk' | 'memory' | 'memory-disk' = 'none') {
    return {
      source,
      contentFit: 'cover' as const,
      transition: 150, // Faster transition for better perceived performance
      cachePolicy: cachePolicy as any,
      priority: 'high' as const, // High priority loading
      recyclingKey: typeof source === 'string' ? source : `image_${Date.now()}`, // Use source as key if possible
    };
  }

  getOptimizedIconProps(source: any) {
    return {
      source,
      contentFit: 'contain' as const,
      transition: 100, // Very fast for icons
      cachePolicy: 'memory' as const,
      priority: 'normal' as const,
    };
  }
}

export const imagePreloader = new ImagePreloaderService();
export default imagePreloader;