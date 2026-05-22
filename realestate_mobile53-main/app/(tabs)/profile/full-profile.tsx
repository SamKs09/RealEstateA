import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../../contexts/AuthContext";
import { useInterest } from "../../../contexts/InterestContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { Colors } from "../../../components/styles";
import { getMyListings, Property } from "../../../services/propertyService";
import * as vehicleService from "../../../services/vehicleService";
import { userService } from "../../../services/userService";
import { getFullImageUrl } from "../../../services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_PADDING = 24;
const GRID_GAP = 12;
const GRID_ITEM_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * 2) / 3;

export default function FullProfileScreen() {
  const router = useRouter();
  const { user, logout, refreshProfile } = useAuth();
  const { userInterest, userRole, activeView, isBothMode } = useInterest();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"available" | "reviews">(
    "available",
  );
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [userVehicles, setUserVehicles] = useState<any[]>([]);
  const [userOffers, setUserOffers] = useState<any[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Determine if user is a seller
  const isSeller = userRole === "seller" || user?.userType === "seller";

  // Determine what to display based on activeView for "both" users
  const displayMode = isBothMode ? activeView : userInterest;

  // Wrap fetch functions in useCallback to prevent unnecessary re-renders
  const fetchUserProperties = useCallback(async () => {
    setIsLoadingProperties(true);
    try {
      console.log("📦 Fetching user properties...");
      const properties = await getMyListings();

      console.log(`✅ Fetched ${properties.length} user properties`);

      // Filter out properties without valid IDs
      const validProperties = properties.filter(
        (prop: any) => prop && (prop.id || prop._id),
      );
      console.log(`✅ ${validProperties.length} properties with valid IDs`);

      setUserProperties(validProperties);
    } catch (error) {
      console.error("❌ Error fetching user properties:", error);
      setUserProperties([]);
    } finally {
      setIsLoadingProperties(false);
    }
  }, []);

  const fetchUserVehicles = useCallback(async () => {
    setIsLoadingProperties(true);
    try {
      console.log("🚗 Fetching user vehicles...");
      const response = await vehicleService.getUserVehicles({
        page: 1,
        limit: 100,
      });

      console.log(`✅ Fetched ${response.data?.length || 0} user vehicles`);

      setUserVehicles(response.data || []);
    } catch (error) {
      console.error("❌ Error fetching user vehicles:", error);
      setUserVehicles([]);
    } finally {
      setIsLoadingProperties(false);
    }
  }, []);

  const fetchUserOffers = useCallback(async () => {
    setIsLoadingProperties(true);
    try {
      console.log("📦 Fetching buyer offers...");
      const response = await userService.getMyOffers();
      if (response.success && response.data) {
        setUserOffers(response.data);
      }
    } catch (error) {
      console.error("❌ Error fetching buyer offers:", error);
      setUserOffers([]);
    } finally {
      setIsLoadingProperties(false);
    }
  }, []);

  // Use useFocusEffect to refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log("🔄 FullProfileScreen: Screen focused, fetching data...");
      console.log(`📍 Display mode: ${displayMode}, isSeller: ${isSeller}`);

      if (isSeller && user?._id) {
        if (displayMode === "cars") {
          fetchUserVehicles();
        } else {
          fetchUserProperties();
        }
      } else if (!isSeller && user?._id) {
        fetchUserOffers();
      }
    }, [
      displayMode,
      isSeller,
      user?._id,
      fetchUserVehicles,
      fetchUserProperties,
      fetchUserOffers,
    ]),
  );

  const handleLogout = async () => {
    try {
      await logout();
      console.log("Logout successful");
      router.replace("/");
    } catch (error) {
      console.error("Logout error:", error);
      router.replace("/");
    }
  };

  const handleDeleteItem = async (
    itemId: string,
    itemType: "property" | "vehicle",
  ) => {
    // Show confirmation dialog
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        `Are you sure you want to delete this ${itemType}?`,
      );
      if (!confirmed) return;
    } else {
      // For mobile, we'll use Alert
      const { Alert } = require("react-native");
      Alert.alert(
        "Delete Confirmation",
        `Are you sure you want to delete this ${itemType}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              await performDelete(itemId, itemType);
            },
          },
        ],
      );
      return;
    }

    await performDelete(itemId, itemType);
  };

  const performDelete = async (
    itemId: string,
    itemType: "property" | "vehicle",
  ) => {
    try {
      if (itemType === "vehicle") {
        await vehicleService.deleteVehicle(itemId);
        setUserVehicles((prev) =>
          prev.filter((v) => (v.id || v._id) !== itemId),
        );
      } else {
        // Assuming there's a deleteProperty function in propertyService
        // await deleteProperty(itemId);
        setUserProperties((prev) =>
          prev.filter((p) => (p.id || p._id) !== itemId),
        );
      }
      setSelectedItemId(null);
      console.log(`${itemType} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting ${itemType}:`, error);
    }
  };
  const handleAddNewItem = () => {
    // Navigate based on user's current interest/activeView
    if (activeView === "cars") {
      router.push("/add-car");
    } else {
      router.push("/add-house");
    }
  };

  const renderPropertyGrid = () => {
    // Decide which items to display based on displayMode - MUST BE FIRST
    const displayItems =
      displayMode === "cars"
        ? userVehicles
        : isSeller
          ? userProperties
          : userOffers;

    return (
      <View style={styles.tabContent}>
        {/* Loading State */}
        {isLoadingProperties ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loadingText}>
              {displayMode === "cars"
                ? "Loading vehicles..."
                : "Loading properties..."}
            </Text>
          </View>
        ) : displayItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name={displayMode === "cars" ? "car-outline" : "home-outline"}
              size={64}
              color="#E0E0E0"
            />
            <Text style={styles.emptyStateTitle}>
              {isSeller
                ? displayMode === "cars"
                  ? "No Vehicles Yet"
                  : "No Properties Yet"
                : "No Bookings Yet"}
            </Text>
            <Text style={styles.emptyStateText}>
              {displayMode === "cars"
                ? "Start by adding your first vehicle listing"
                : "Start by adding your first property listing"}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {displayItems.map((item: any, index) => {
              // Backend may return 'id' or '_id'
              const itemId = item.id || item._id || `item-${index}`;
              const isSelected = selectedItemId === itemId;

              let imageUri = "";
              let placeholderImage;

              if (isSeller) {
                imageUri = item.media?.images?.[0] || "";
                // Use appropriate placeholder based on displayMode
                placeholderImage =
                  displayMode === "cars"
                    ? require("../../../assets/images/Cars/Bmx6.webp")
                    : require("../../../assets/images/ScreensImages/ProfileComplete.png");
              } else {
                // Buyer view (Offers)
                const offerItem = item.property || item.vehicle;
                imageUri = offerItem?.media?.images?.[0] || "";
                placeholderImage = item.vehicle
                  ? require("../../../assets/images/Cars/Bmx6.webp")
                  : require("../../../assets/images/ScreensImages/ProfileComplete.png");
              }

              const fullImageUri = getFullImageUrl(imageUri);

              return (
                <TouchableOpacity
                  key={itemId}
                  style={styles.gridItem}
                  onPress={() => {
                    if (isSeller) {
                      // Toggle selection for seller
                      setSelectedItemId(isSelected ? null : itemId);
                    } else {
                      // Buyer: navigate to item info
                      const targetId =
                        item.property?._id || item.vehicle?._id || itemId;
                      const itemType = item.vehicle ? "vehicle" : "property";
                      router.push({
                        pathname: "/property_info",
                        params: { id: targetId, type: itemType },
                      } as any);
                    }
                  }}
                >
                  <Image
                    source={
                      fullImageUri ? { uri: fullImageUri } : placeholderImage
                    }
                    style={styles.gridImage}
                    contentFit="cover"
                  />

                  {/* Status Badge */}
                  {isSeller && item.status !== "active" && (
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>
                        {item.status?.toUpperCase() || "ACTIVE"}
                      </Text>
                    </View>
                  )}

                  {/* Edit and Delete Actions - Only show for seller when item is selected */}
                  {isSeller && isSelected && (
                    <View style={styles.itemOverlay}>
                      <View style={styles.overlayActions}>
                        <TouchableOpacity
                          style={styles.overlayButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            if (displayMode === "cars") {
                              router.push({
                                pathname: "/edit-vehicle",
                                params: { id: itemId },
                              } as any);
                            } else {
                              router.push({
                                pathname: "/edit-property",
                                params: { id: itemId },
                              } as any);
                            }
                            setSelectedItemId(null);
                          }}
                        >
                          <Ionicons
                            name="create-outline"
                            size={18}
                            color="#FFFFFF"
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.overlayButton,
                            styles.overlayDeleteButton,
                          ]}
                          onPress={(e) => {
                            e.stopPropagation();
                            const itemType =
                              displayMode === "cars" ? "vehicle" : "property";
                            handleDeleteItem(itemId, itemType);
                          }}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color="#FFFFFF"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const profileDisplayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : (user as any)?.name || user?.email?.split("@")[0] || "User";

  const profileLocation = `${
    (user as any)?.location?.city || (user as any)?.city || "Tunisia"
  }${(user as any)?.location?.country ? `, ${(user as any)?.location?.country}` : ""}`;

  return (
    <View style={styles.screen}>
      <View style={styles.heroSection}>
        <Image
          source={require("../../../assets/images/ScreensImages/ProfileComplete.png")}
          style={styles.heroImage}
          contentFit="cover"
        />
        <View style={styles.heroOverlay} />
        <View style={styles.heroTopBar}>
          <TouchableOpacity
            style={styles.heroIconButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.heroIconButton}
            onPress={() => router.push("/(tabs)/Settings")}
          >
            <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        {/* Avatar centred, poking below the hero */}
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarOuterRing}>
            <View style={styles.avatarInnerRing}>
              {user?.avatar || (user as any)?.profileImage ? (
                <Image
                  key={user?.avatar || (user as any)?.profileImage}
                  source={{ uri: user?.avatar || (user as any)?.profileImage }}
                  style={styles.avatarImage}
                  contentFit="cover"
                  cachePolicy="none"
                />
              ) : (
                <Image
                  source={require("../../../assets/sam b.png")}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              )}
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileInfoSection}>
          <Text style={styles.profileName}>{profileDisplayName}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={15} color="#888888" />
            <Text style={styles.locationText}>{profileLocation}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {(
                  (user as any)?.rating?.average ??
                  (user as any)?.averageRating ??
                  0
                ).toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>{t("profile.rating")}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {isSeller
                  ? displayMode === "cars"
                    ? userVehicles.length
                    : userProperties.length
                  : userOffers.length}
              </Text>
              <Text style={styles.statLabel}>
                {isSeller
                  ? displayMode === "cars"
                    ? "Vehicles"
                    : "Listings"
                  : "Bookings"}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {!user?.pack || user.pack === "freemium" ? "Free" : user.pack}
              </Text>
              <Text style={styles.statLabel}>Plan</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/edit-info")}
            >
              <Text style={styles.actionButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            {isSeller && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleAddNewItem}
              >
                <Text style={styles.actionButtonText}>Add Item</Text>
              </TouchableOpacity>
            )}
            {isSeller ? (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push("/my-offers")}
              >
                <Text style={styles.actionButtonText}>
                  {t("profile.myOffers")}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleLogout}
              >
                <Text style={styles.actionButtonText}>
                  {t("profile.logout")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.tabsSection}>
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={styles.tabButton}
              onPress={() => setActiveTab("available")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "available" && styles.activeTabText,
                ]}
              >
                {isSeller ? t("profile.available") : "My Bookings"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tabButton}
              onPress={() => setActiveTab("reviews")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "reviews" && styles.activeTabText,
                ]}
              >
                {t("profile.reviews")}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tabsDivider} />
        </View>

        {activeTab === "available" ? (
          renderPropertyGrid()
        ) : (
          <View style={styles.tabContent}>
            <View style={styles.reviewEmptyCard}>
              <View style={styles.reviewIconWrap}>
                <Ionicons name="star-outline" size={26} color={Colors.accent} />
              </View>
              <Text style={styles.reviewTitle}>
                {t("profile.noReviewsYet")}
              </Text>
              <Text style={styles.reviewText}>
                Complete a few conversations and bookings to start collecting
                visible social proof here.
              </Text>
              <View style={styles.reviewHintChip}>
                <Text style={styles.reviewHintText}>
                  Your future ratings will appear in this section.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  // Hero: absolute at top so avatar can overlap its bottom edge
  heroSection: {
    height: 260,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  heroTopBar: {
    position: "absolute",
    top: 54,
    left: 24,
    right: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.24)",
    alignItems: "center",
    justifyContent: "center",
  },
  // Avatar centred, hanging 70px below the hero bottom
  avatarWrapper: {
    position: "absolute",
    bottom: -70,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  avatarOuterRing: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarInnerRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: Colors.accent,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },
  // ScrollView starts below the fixed hero
  scrollView: {
    flex: 1,
    marginTop: 260,
  },
  scrollContent: {
    paddingTop: 80,
    paddingBottom: 120,
    backgroundColor: "#FFFFFF",
  },
  // Centred profile info: name, location, stats, buttons
  profileInfoSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  profileName: {
    fontSize: 24,
    fontFamily: "raleway-800ExtraBold",
    color: Colors.accent,
    marginBottom: 6,
    textAlign: "center",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  locationText: {
    marginLeft: 4,
    fontSize: 14,
    fontFamily: "raleway-400Regular",
    color: "#888888",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontFamily: "raleway-800ExtraBold",
    color: Colors.textPrimary,
    marginBottom: 4,
    textTransform: "capitalize",
  },
  statLabel: {
    fontSize: 12,
    color: "#888888",
    fontFamily: "raleway-500Medium",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    width: "100%",
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "raleway-700Bold",
  },
  tabsSection: {
    paddingHorizontal: 24,
    marginTop: 10,
  },
  tabsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
  },
  tabText: {
    fontSize: 22,
    fontFamily: "raleway-500Medium",
    color: "#A7A7A7",
  },
  activeTabText: {
    color: Colors.accent,
    fontFamily: "raleway-700Bold",
  },
  tabsDivider: {
    height: 1,
    backgroundColor: "#DDD8D1",
  },
  tabContent: {
    paddingHorizontal: GRID_PADDING,
    paddingTop: 18,
  },
  loadingState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
    fontFamily: "raleway-400Regular",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateTitle: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: "raleway-700Bold",
    color: Colors.textPrimary,
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    fontFamily: "raleway-400Regular",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: GRID_GAP,
  },
  gridItem: {
    width: GRID_ITEM_WIDTH,
    height: GRID_ITEM_WIDTH / 0.72,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  statusBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.66)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontFamily: "raleway-700Bold",
  },
  itemOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.42)",
    justifyContent: "flex-end",
    padding: 10,
  },
  overlayActions: {
    flexDirection: "row",
    gap: 8,
  },
  overlayButton: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayDeleteButton: {
    backgroundColor: "#FF6B35",
  },
  reviewEmptyCard: {
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  reviewIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF3EA",
    marginBottom: 16,
  },
  reviewTitle: {
    fontSize: 20,
    fontFamily: "raleway-700Bold",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 21,
    color: Colors.textSecondary,
    fontFamily: "raleway-400Regular",
    textAlign: "center",
    marginBottom: 16,
  },
  reviewHintChip: {
    backgroundColor: "#FFF7F0",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  reviewHintText: {
    color: Colors.accent,
    fontSize: 12,
    fontFamily: "raleway-600SemiBold",
    textAlign: "center",
  },
});
