# Onboarding Screens - Quick Start Guide

## 🚀 Quick Start

The onboarding screens are **already integrated** and will automatically show on first app launch. No additional setup required!

## 📱 Testing the Onboarding Flow

### 1. Run the App
```bash
cd realestate_mobile53-main
npm start
```

### 2. First Launch
On first launch, you'll see:
- Screen 1: Orange gradient splash screen with "Location app"
- Screen 2: "Connect & Close Deals" with handshake image
- Screen 3: "Buy or Rent Vehicles" with car image
- Screen 4: "Find Your Perfect Home" with house image

### 3. Navigation
- **Swipe left/right** to navigate between screens
- **Tap "Next"** to go to the next screen
- **Tap "Skip"** (screens 2-4) to skip onboarding
- **Tap "Get Started"** (screen 4) to complete onboarding

### 4. Subsequent Launches
After completing onboarding, the app will skip directly to the main content.

## 🔄 Reset Onboarding (for Testing)

To see the onboarding again:

```typescript
// Option 1: Add to a debug menu
import { OnboardingManager } from '../../services/onboardingManager';

const resetOnboarding = async () => {
  await OnboardingManager.resetOnboarding();
  console.log('Onboarding reset! Restart the app.');
};

// Option 2: Run in React Native Debugger console
OnboardingManager.resetOnboarding();
```

Then restart the app to see onboarding again.

## 🎨 Customizing Content

### Change Screen Text
Edit `constants/onboardingScreens.ts`:

```typescript
export const ONBOARDING_SCREENS: OnboardingScreen[] = [
  {
    id: 'screen-1',
    title: 'Your Custom Title',        // ← Change this
    subtitle: 'Your Custom Subtitle',  // ← Change this
    // ...
  },
];
```

### Change Colors
Edit `constants/onboardingScreens.ts`:

```typescript
export const ONBOARDING_COLORS = {
  primary: '#FF6B35',      // ← Change primary color
  secondary: '#FF8C42',    // ← Change secondary color
  // ...
};
```

### Replace Images
1. Add your images to `assets/images/onboarding/`
2. Ensure they're named:
   - `house-icon.png` (Screen 1)
   - `handshake.png` (Screen 2)
   - `bmw-car.png` (Screen 3)
   - `house.png` (Screen 4)
3. Optimize images: < 500KB, 1080x1080px

## 🐛 Troubleshooting

### Onboarding shows every time
```typescript
// Check if completion is being saved
import { OnboardingManager } from '../../services/onboardingManager';

const checkStatus = async () => {
  const completed = await OnboardingManager.hasCompletedOnboarding();
  console.log('Onboarding completed:', completed);
};
```

### Images not loading
- Verify files exist in `assets/images/onboarding/`
- Check file names match exactly
- Ensure images are valid PNG files

### Skip button not working
- Verify `showSkip: true` in screen config
- Check console for errors
- Ensure AsyncStorage permissions are granted

## 📚 More Information

- **Full Documentation**: See `README.md` in this directory
- **Implementation Details**: See `ONBOARDING_IMPLEMENTATION.md` in project root
- **Design Specs**: See `.kiro/specs/onboarding-screens/design.md`
- **Requirements**: See `.kiro/specs/onboarding-screens/requirements.md`

## 🎯 Key Files

```
app/
├── index.tsx                          # Entry point (integrated)
└── onboarding/
    ├── HomePage.tsx                   # Destination after onboarding
    └── screens/
        └── OnboardingFlow.tsx         # Main component

components/onboarding/
├── OnboardingSlide.tsx               # Individual slides
├── PaginationDots.tsx                # Pagination indicator
└── index.ts                           # Exports

services/
└── onboardingManager.ts               # Persistence logic

constants/
└── onboardingScreens.ts               # Screen data (customize here!)

types/
└── onboarding.ts                      # TypeScript types
```

## ✅ Quick Checklist

Before deploying:
- [ ] Replace placeholder images with actual images
- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Verify swipe gestures work
- [ ] Verify skip functionality works
- [ ] Verify completion persists across restarts
- [ ] Test with screen reader (accessibility)

## 💡 Pro Tips

1. **Testing**: Use `OnboardingManager.resetOnboarding()` to test repeatedly
2. **Images**: Keep images under 500KB for fast loading
3. **Colors**: Use the existing design system colors for consistency
4. **Text**: Keep text concise and scannable
5. **Accessibility**: Always test with VoiceOver/TalkBack

---

**Need Help?** Check the full README.md or implementation docs!
