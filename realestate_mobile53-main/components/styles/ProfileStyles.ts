import { StyleSheet, Dimensions } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from './GlobalStyles';

const { width } = Dimensions.get('window');

export const ProfileStyles = StyleSheet.create({
  // Scroll Container
  scrollContainer: {
    flex: 1,
    margin: 0,
    padding: 0,
    marginTop: 280,
  },

  // Header Styles
  headerContainer: {
    height: 280,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 1,
    marginLeft: 0,
    marginRight: 0,
    resizeMode: 'cover',
  },

  headerBackgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  headerTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: 50,
    paddingBottom: Spacing.xl,
  },

  // Icon Buttons (Back, More, etc.)
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconButtonSolid: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },

  // Profile Image Styles
  profileImageWrapper: {
    position: 'absolute',
    bottom: -60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },

  profileImageContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.background,
    padding: 3,
    borderWidth: 3,
    borderColor: Colors.accent,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },

  profileImageContainerSmall: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background,
    padding: 2,
    borderWidth: 2,
    borderColor: Colors.accent,
    ...Shadows.sm,
  },

  profileImage: {
    width: 137,
    height: 137,
    borderRadius: 68.5,
  },

  profileImageSmall: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },

  // Profile Info Section
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
  },

  profileName: {
    fontSize: Typography.fontSize.xl + 2, // 22px
    fontWeight: Typography.fontWeight.bold,
    color: Colors.accent,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },

  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing['2xl'] + 1, // 25px
  },

  locationText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },

  bioText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: Spacing.sm,
    fontFamily: 'raleway-400Regular',
  },

  // Stats Section
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginBottom: Spacing['3xl'] - 2, // 30px
    paddingHorizontal: Spacing['3xl'] - 2, // 30px
  },

  statItem: {
    alignItems: 'center',
    flex: 1,
  },

  statNumber: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },

  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: '#888888',
    textAlign: 'center',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing['2xl'] + 1, // 25px
    gap: 15,
  },

  outlineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.accent,
    borderRadius: BorderRadius['2xl'],
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 6,
    minHeight: 44,
  },

  outlineButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.accent,
    fontWeight: Typography.fontWeight.semibold,
  },

  filledButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius['2xl'] + 1, // 25px
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },

  filledButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textWhite,
    fontWeight: Typography.fontWeight.medium,
  },

  // Profile Management Buttons (above tabs)
  profileManagementButtons: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },

  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: BorderRadius['2xl'],
    gap: 6,
    minHeight: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  primaryButtonText: {
    color: '#fff',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: 12,
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },

  activeTab: {
    borderBottomWidth: 0,
  },

  tabText: {
    fontSize: 20,
    color: '#A6A6A6',
    fontWeight: Typography.fontWeight.medium,
  },

  activeTabText: {
    color: Colors.accent,
    fontWeight: Typography.fontWeight.semibold,
  },

  profileTabsSection: {
    marginTop: 6,
    marginHorizontal: Spacing.xl,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#D8D2CC',
  },

  profileTabContent: {
    marginTop: 0,
  },

  contentSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    gap: 0,
  },

  sectionHeaderCard: {
    backgroundColor: '#FFF9F4',
    borderWidth: 1,
    borderColor: '#F4D9C4',
    borderRadius: 22,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },

  sectionEyebrow: {
    fontSize: Typography.fontSize.xs,
    color: '#A06A43',
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: Spacing.md,
  },

  sectionTitle: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.bold,
  },

  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  sectionCountPill: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  sectionCountText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.accent,
    fontWeight: Typography.fontWeight.bold,
  },

  sectionBodyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },

  // Property Grid
  propertyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
  },

  propertyGridItem: {
    width: (width - 60) / 3,
    aspectRatio: 1,
    marginBottom: Spacing.sm + 2, // 10px
    borderRadius: Spacing.sm + 2, // 10px
    overflow: 'hidden',
  },

  propertyGridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // Reviews
  reviewsContainer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['4xl'],
    alignItems: 'center',
  },

  reviewsText: {
    fontSize: Typography.fontSize.base,
    color: '#999999',
  },

  boostSummaryCard: {
    width: '100%',
    marginTop: 18,
    borderRadius: 22,
    padding: 18,
    backgroundColor: '#FFF8F1',
    borderWidth: 1,
    borderColor: '#F5DBC6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },

  boostSummaryTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },

  boostSummaryEyebrow: {
    fontSize: Typography.fontSize.xs,
    color: '#A06A43',
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  boostSummaryTitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.bold,
  },

  boostSummaryBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  boostSummaryBadgeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.accent,
    fontWeight: Typography.fontWeight.bold,
    textTransform: 'capitalize',
  },

  boostSummaryNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 10,
  },

  boostSummaryNumber: {
    fontSize: 34,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.bold,
  },

  boostSummaryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  boostSummaryMeta: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  reviewsShowcaseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },

  reviewsIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFF4E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  reviewsShowcaseTitle: {
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 8,
  },

  reviewsShowcaseText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 16,
  },

  reviewsHintChip: {
    backgroundColor: '#FFF8F1',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  reviewsHintText: {
    fontSize: Typography.fontSize.xs,
    color: '#9B6A46',
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },

  navItem: {
    flex: 1,
    alignItems: 'center',
  },

  // Content Container
  profileContent: {
    flex: 1,
    paddingTop: 85,
  },

  // Settings List
  settingsList: {
    paddingHorizontal: Spacing.xl,
  },

  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },

  settingsItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  settingsItemIcon: {
    marginRight: Spacing.md,
  },

  settingsItemText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },

  settingsItemSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
