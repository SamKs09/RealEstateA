import { StyleSheet } from 'react-native';

// Brand Colors
export const Colors = {
  // Primary Colors
  primary: '#F85B00',
  primaryLight: '#FCB78E',
  accent: '#FF8C42', // Orange accent color for toggle and filters
  
  // Text Colors
  textPrimary: '#333333',
  textSecondary: '#8A8A8A',
  textLight: '#B0B0B0',
  textWhite: '#ffffff',
  
  // Background Colors
  background: '#ffffff',
  backgroundLight: '#F8F8F8',
  backgroundGray: '#E8E8E8',
  
  // Status Colors
  error: '#FF6B6B',
  success: '#4CAF50',
  warning: '#FFC107',
  
  // Border Colors
  border: '#E8E8E8',
  borderLight: '#F0F0F0',
};


export const Typography = {
  fontFamily: {
    light: 'raleway-300Light',
    regular: 'raleway-400Regular',
    medium: 'raleway-500Medium',
    semibold: 'raleway-600SemiBold',
    bold: 'raleway-700Bold',
    extrabold: 'raleway-800ExtraBold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
  },
 
  fontWeight: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
  
  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
};

// Spacing System
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 56,
  '7xl': 64,
};

// Border Radius
export const BorderRadius = {
  sm: 8,
  base: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  full: 9999,
};

// Shadow Presets
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: '#F85B00',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  primary: {
    shadowColor: '#F85B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Global Styles
export const GlobalStyles = StyleSheet.create({
  // Container Styles
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing['2xl'],
  },
  
  containerCentered: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Flexbox Utilities
  flex1: { flex: 1 },
  flexRow: { flexDirection: 'row' },
  flexColumn: { flexDirection: 'column' },
  justifyCenter: { justifyContent: 'center' },
  justifyBetween: { justifyContent: 'space-between' },
  justifyAround: { justifyContent: 'space-around' },
  alignCenter: { alignItems: 'center' },
  alignStart: { alignItems: 'flex-start' },
  alignEnd: { alignItems: 'flex-end' },
  
  // Text Styles
  textCenter: { textAlign: 'center' },
  textLeft: { textAlign: 'left' },
  textRight: { textAlign: 'right' },
  
  // Common Text Variants
  heading1: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: Typography.letterSpacing.wide,
    fontFamily: Typography.fontFamily.medium,
  },
  
  heading2: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.medium,
  },
  
  heading3: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.medium,
  },
  
  bodyText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.normal,
    color: Colors.textPrimary,
    lineHeight: Typography.lineHeight.normal,
    fontFamily: Typography.fontFamily.regular,
  },
  
  captionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily.regular,
  },
  
  errorText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.error,
    marginTop: Spacing.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  
  // Home Page Text Styles
  locationLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  
  locationText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginRight: 4,
  },
  
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  
  seeMore: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  
  propertyTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  
  propertySubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  
  propertyPrice: {
    fontSize: Typography.fontSize.sm,
    color: '#4A90E2',
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: 8,
  },
  
  featureText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  
  distanceText: {
    color: Colors.textWhite,
    fontSize: Typography.fontSize.xs,
    marginLeft: 4,
  },
  
  // Spacing Utilities
  marginTopSm: { marginTop: Spacing.sm },   
  marginTopMd: { marginTop: Spacing.md },
  marginTopLg: { marginTop: Spacing.lg },
  marginTopXl: { marginTop: Spacing.xl },
  marginTop2xl: { marginTop: Spacing['2xl'] },
  
  marginBottomSm: { marginBottom: Spacing.sm },
  marginBottomMd: { marginBottom: Spacing.md },
  marginBottomLg: { marginBottom: Spacing.lg },
  marginBottomXl: { marginBottom: Spacing.xl },
  marginBottom2xl: { marginBottom: Spacing['2xl'] },
  
  paddingXs: { padding: Spacing.xs },
  paddingSm: { padding: Spacing.sm },
  paddingMd: { padding: Spacing.md },
  paddingLg: { padding: Spacing.lg },
  paddingXl: { padding: Spacing.xl },
  
  // Background Colors
  bgWhite: { backgroundColor: Colors.background },
  bgLight: { backgroundColor: Colors.backgroundLight },
  bgPrimary: { backgroundColor: Colors.primary },
});