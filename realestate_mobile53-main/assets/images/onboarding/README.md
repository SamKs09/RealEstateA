# Onboarding Images

## Required Images

This folder should contain 4 hero images for the onboarding screens:

### 1. house-icon.png
- **Screen**: Screen 1 (Splash/Welcome)
- **Description**: 3D house illustration or icon
- **Current**: Using `ScreensImages/House1.jpg` as temporary placeholder
- **Specs**: 1080x1080px, < 500KB, PNG format

### 2. handshake.png
- **Screen**: Screen 2 (Connect & Close Deals)
- **Description**: Business handshake photo
- **Current**: Using `ScreensImages/ProfileComplete.png` as temporary placeholder
- **Specs**: 1080x1080px, < 500KB, PNG format

### 3. bmw-car.png
- **Screen**: Screen 3 (Buy or Rent Vehicles)
- **Description**: White BMW car on scenic road
- **Current**: Using `Cars/Bmx6.webp` as temporary placeholder
- **Specs**: 1080x1080px, < 500KB, PNG format

### 4. house.png
- **Screen**: Screen 4 (Find Your Perfect Home)
- **Description**: Beautiful house with palm trees
- **Current**: Using `ScreensImages/House2.jpg` as temporary placeholder
- **Specs**: 1080x1080px, < 500KB, PNG format

## Image Specifications

- **Format**: PNG (preferred) or WebP
- **Dimensions**: 1080x1080px (1:1 aspect ratio)
- **File size**: < 500KB per image
- **Color space**: sRGB
- **Optimization**: Compressed for mobile

## How to Replace

1. Add your images to this folder with the exact names above
2. Update `constants/onboardingScreens.ts` to use the new images:
   ```typescript
   image: require('../assets/images/onboarding/house-icon.png'),
   ```
3. Restart the Metro bundler

## Current Status

✅ **Temporary placeholders in use** - The app is using existing images from the app as temporary placeholders. Replace with proper onboarding images before production deployment.
