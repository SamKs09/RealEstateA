import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { useInterest } from "../contexts/InterestContext";
import { useTranslation } from "../hooks/useTranslation";
import { HeaderWithBackButton } from "../components/Ui/HeaderWithBackButton";
import {
  getMyListings,
  archiveProperty,
  Property,
} from "../services/propertyService";
import * as vehicleService from "../services/vehicleService";
import { archiveVehicle } from "../services/vehicleService";
import { getOwnerBookings, BookingData } from "../services/bookingService";
import { getFullImageUrl } from "../services/api";

type ListingStatus = "all" | "active" | "pending";

interface ListingStats {
  total: number;
  active: number;
  pending: number;
}

export default function SellerDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { userInterest, activeView, isBothMode } = useInterest();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<ListingStatus>("all");
  const [properties, setProperties] = useState<Property[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [ownerBookings, setOwnerBookings] = useState<BookingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ListingStats>({
    total: 0,
    active: 0,
    pending: 0,
  });

  // Determine display mode
  const displayMode = isBothMode ? activeView : userInterest;

  const isBookedToday = useCallback(
    (listingId: string): boolean => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      return ownerBookings.some((b) => {
        if (b.status !== "accepted") return false;
        const refId =
          displayMode === "cars"
            ? b.vehicle?._id || b.vehicle?.id
            : b.property?._id || b.property?.id;
        if (refId !== listingId) return false;
        const start = new Date(b.startDate);
        const end = new Date(b.endDate);
        end.setHours(23, 59, 59, 999);
        return today >= start && today <= end;
      });
    },
    [ownerBookings, displayMode],
  );

  const fetchListings = useCallback(async () => {
    try {
      setIsLoading(true);
      const userId = (user as any)?._id || (user as any)?.id;
      const bookingsPromise = userId
        ? getOwnerBookings(userId).catch(() => [] as BookingData[])
        : Promise.resolve<BookingData[]>([]);

      if (displayMode === "cars") {
        const [response, bookings] = await Promise.all([
          vehicleService.getUserVehicles({ page: 1, limit: 100 }),
          bookingsPromise,
        ]);
        const vehicleData = response.data || [];
        setVehicles(vehicleData);
        setOwnerBookings(bookings);
        setStats({
          total: vehicleData.length,
          active: vehicleData.filter((v: any) => v.isPromoted === true).length,
          pending: 0, // recalculated after bookings load
        });
      } else {
        const [propertyData, bookings] = await Promise.all([
          getMyListings(),
          bookingsPromise,
        ]);
        setProperties(propertyData);
        setOwnerBookings(bookings);
        setStats({
          total: propertyData.length,
          active: propertyData.filter((p: any) => p.isPromoted === true).length,
          pending: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [displayMode, user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  }, [fetchListings]);

  useFocusEffect(
    React.useCallback(() => {
      fetchListings();
    }, [fetchListings]),
  );

  const allListings = displayMode === "cars" ? vehicles : properties;

  const archivedCount = useMemo(
    () => allListings.filter((item: any) => item.status === "archived").length,
    [allListings],
  );

  // Keep stats.pending in sync
  const displayStats = useMemo(
    () => ({
      ...stats,
      pending: archivedCount,
    }),
    [stats, archivedCount],
  );

  const getFilteredListings = () => {
    if (activeTab === "all")
      return allListings.filter((item: any) => item.status !== "archived");
    if (activeTab === "active")
      return allListings.filter(
        (item: any) => item.isPromoted === true && item.status !== "archived",
      );
    if (activeTab === "pending")
      return allListings.filter((item: any) => item.status === "archived");
    return allListings;
  };

  const handleArchive = (id: string, title: string) => {
    Alert.alert(
      t("sellerDashboard.archiveTitle"),
      t("sellerDashboard.archiveConfirm", { title }),
      [
        { text: t("sellerDashboard.cancel"), style: "cancel" },
        {
          text: t("sellerDashboard.archiveButton"),
          onPress: async () => {
            try {
              if (displayMode === "cars") {
                await archiveVehicle(id);
              } else {
                await archiveProperty(id);
              }
              fetchListings();
            } catch {
              Alert.alert("Error", t("sellerDashboard.archiveFailed"));
            }
          },
        },
      ],
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#4CAF50";
      case "inactive":
        return "#FF9800";
      case "pending":
        return "#FF9800";
      case "sold":
        return "#9E9E9E";
      case "rented":
        return "#007AFF";
      case "archived":
        return "#8E8E93";
      default:
        return "#4CAF50";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return t("sellerDashboard.statusActive");
      case "inactive":
        return t("sellerDashboard.statusInactive");
      case "pending":
        return t("sellerDashboard.statusPending");
      case "sold":
        return t("sellerDashboard.statusSold");
      case "rented":
        return t("sellerDashboard.statusRented");
      case "archived":
        return t("sellerDashboard.statusArchived");
      default:
        return t("sellerDashboard.statusActive");
    }
  };

  const renderStatsCard = (title: string, count: number, isActive: boolean) => (
    <View style={[styles.statsCard, isActive && styles.activeStatsCard]}>
      <Text style={[styles.statsNumber, isActive && styles.activeStatsNumber]}>
        {count}
      </Text>
      <Text style={[styles.statsLabel, isActive && styles.activeStatsLabel]}>
        {title}
      </Text>
    </View>
  );

  const renderListingItem = (item: any, index: number) => {
    const imageUri = item.media?.images?.[0] || "";
    const fullImageUri = imageUri ? getFullImageUrl(imageUri) : null;
    const placeholderImage =
      displayMode === "cars"
        ? require("../assets/images/Cars/Bmx6.webp")
        : require("../assets/images/ScreensImages/ProfileComplete.png");

    const price =
      displayMode === "cars"
        ? item.pricing?.salePrice || item.pricing?.rentPrice
        : item.pricing?.salePrice || item.pricing?.rentPrice;

    const location =
      item.location?.city || item.location?.address || "Location";
    const itemId = item.id || item._id;
    const itemTitle =
      item.title ||
      (displayMode === "cars" ? item.make + " " + item.model : "Property");
    const itemType = displayMode === "cars" ? "vehicle" : "property";

    return (
      <View key={`${itemId}-${index}`} style={styles.listingItem}>
        <TouchableOpacity
          style={styles.listingContent}
          onPress={() => {
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
          }}
        >
          <Image
            source={fullImageUri ? { uri: fullImageUri } : placeholderImage}
            style={styles.listingImage}
          />

          <View style={styles.listingInfo}>
            <View style={styles.listingHeader}>
              <Text style={styles.listingTitle} numberOfLines={1}>
                {itemTitle}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status || "active") },
                ]}
              >
                <Text style={styles.statusText}>
                  {getStatusText(item.status || "active")}
                </Text>
              </View>
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#8A8A8A" />
              <Text style={styles.locationText} numberOfLines={1}>
                {location}
              </Text>
            </View>

            <Text style={styles.priceText}>
              {price
                ? `${price.toLocaleString()} DT`
                : t("sellerDashboard.priceOnRequest")}
              {item.listingType === "rent" && t("sellerDashboard.perMonth")}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.listingActionColumn}>
          <TouchableOpacity
            style={styles.boostActionButton}
            onPress={() => {
              router.push({
                pathname: "/boost-listing",
                params: { id: itemId, type: itemType },
              } as any);
            }}
          >
            <Ionicons name="rocket-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.analyticsButton}
            onPress={() => {
              router.push({
                pathname: "/listing-analytics",
                params: {
                  id: itemId,
                  title: itemTitle,
                  type: itemType,
                },
              } as any);
            }}
          >
            <Ionicons name="stats-chart" size={20} color="#FF6B35" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.archiveButton}
            onPress={() => handleArchive(itemId, itemTitle)}
          >
            <Ionicons name="archive-outline" size={18} color="#8E8E93" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <HeaderWithBackButton
          title={t("sellerDashboard.title")}
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>{t("sellerDashboard.loading")}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderWithBackButton
        title={t("sellerDashboard.title")}
        onBackPress={() => router.back()}
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Promo / motivational banner */}
        <View style={styles.promoBanner}>
          <View style={styles.promoTopRow}>
            <View style={styles.promoTextBlock}>
              <Text style={styles.promoHeadline}>
                {t("sellerDashboard.promoHeadline")}
              </Text>
              <Text style={styles.promoSub}>
                {t("sellerDashboard.promoSub")}{" "}
                <Text style={styles.promoHighlight}>
                  {t("sellerDashboard.promoHighlight")}
                </Text>{" "}
                {t("sellerDashboard.promoSubEnd")}
              </Text>
            </View>
            <View style={styles.promoRocketWrap}>
              <Ionicons name="rocket" size={36} color="#FF6B35" />
            </View>
          </View>

          <View style={styles.promoStatsRow}>
            <View style={styles.promoStat}>
              <Text style={styles.promoStatValue}>
                {user?.boost?.number ?? 0}
              </Text>
              <Text style={styles.promoStatLabel}>
                {t("sellerDashboard.boostsLeft")}
              </Text>
            </View>
            <View style={styles.promoStatDivider} />
            <View style={styles.promoStat}>
              <Text style={styles.promoStatValue}>
                {(user?.pack || "freemium").charAt(0).toUpperCase() +
                  (user?.pack || "freemium").slice(1)}
              </Text>
              <Text style={styles.promoStatLabel}>
                {t("sellerDashboard.currentPlan")}
              </Text>
            </View>
            <View style={styles.promoStatDivider} />
            <View style={styles.promoStat}>
              <Text style={styles.promoStatValue}>
                {user?.listingConfig?.number || 1}
              </Text>
              <Text style={styles.promoStatLabel}>
                {t("sellerDashboard.listingSlots")}
              </Text>
            </View>
          </View>

          <View style={styles.promoCTARow}>
            <TouchableOpacity
              style={styles.promoCTAPrimary}
              onPress={() => router.push("/free-trial" as any)}
            >
              <Ionicons name="star-outline" size={15} color="#fff" />
              <Text style={styles.promoCTAPrimaryText}>
                {t("sellerDashboard.upgradePlan")}
              </Text>
            </TouchableOpacity>
          </View>

          {(user?.boost?.number ?? 0) === 0 && (
            <View style={styles.promoNudge}>
              <Ionicons
                name="information-circle-outline"
                size={14}
                color="#FF6B35"
              />
              <Text style={styles.promoNudgeText}>
                {t("sellerDashboard.noBoostsNudge")}
              </Text>
            </View>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {renderStatsCard(
            t("sellerDashboard.statTotal"),
            displayStats.total,
            activeTab === "all",
          )}
          {renderStatsCard(
            t("sellerDashboard.statBoosted"),
            displayStats.active,
            activeTab === "active",
          )}
          {renderStatsCard(
            t("sellerDashboard.statArchived"),
            displayStats.pending,
            activeTab === "pending",
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "all" && styles.activeTab]}
            onPress={() => setActiveTab("all")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "all" && styles.activeTabText,
              ]}
            >
              {t("sellerDashboard.tabAll")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "active" && styles.activeTab]}
            onPress={() => setActiveTab("active")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "active" && styles.activeTabText,
              ]}
            >
              {t("sellerDashboard.tabBoosted")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "pending" && styles.activeTab]}
            onPress={() => setActiveTab("pending")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "pending" && styles.activeTabText,
              ]}
            >
              {t("sellerDashboard.tabArchived")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Listings */}
        <View style={styles.listingsContainer}>
          {getFilteredListings().length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name={displayMode === "cars" ? "car-outline" : "home-outline"}
                size={64}
                color="#E0E0E0"
              />
              <Text style={styles.emptyTitle}>
                {activeTab === "all"
                  ? t("sellerDashboard.noListings")
                  : activeTab === "active"
                    ? t("sellerDashboard.noBoostedListings")
                    : t("sellerDashboard.noArchivedListings")}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === "pending"
                  ? t("sellerDashboard.archivedWillAppear")
                  : displayMode === "cars"
                    ? t("sellerDashboard.addFirstVehicle")
                    : t("sellerDashboard.addFirstProperty")}
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  if (displayMode === "cars") {
                    router.push("/add-car");
                  } else {
                    router.push("/add-house");
                  }
                }}
              >
                <Text style={styles.addButtonText}>
                  {displayMode === "cars"
                    ? t("sellerDashboard.addVehicle")
                    : t("sellerDashboard.addProperty")}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            getFilteredListings().map((item, index) =>
              renderListingItem(item, index),
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    fontFamily: "raleway-400Regular",
  },
  promoBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 18,
    backgroundColor: "#FFF5EC",
    borderWidth: 1,
    borderColor: "#FFD7BD",
  },
  promoTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  promoTextBlock: {
    flex: 1,
    paddingRight: 10,
  },
  promoHeadline: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    fontFamily: "raleway-700Bold",
    marginBottom: 4,
  },
  promoSub: {
    fontSize: 13,
    color: "#555",
    fontFamily: "raleway-400Regular",
    lineHeight: 18,
  },
  promoHighlight: {
    color: "#FF6B35",
    fontFamily: "raleway-700Bold",
  },
  promoRocketWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFE8D6",
    alignItems: "center",
    justifyContent: "center",
  },
  promoStatsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 14,
  },
  promoStat: {
    flex: 1,
    alignItems: "center",
  },
  promoStatDivider: {
    width: 1,
    backgroundColor: "#F0E8E0",
  },
  promoStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF6B35",
    fontFamily: "raleway-700Bold",
  },
  promoStatLabel: {
    fontSize: 11,
    color: "#8A8A8A",
    fontFamily: "raleway-400Regular",
    marginTop: 2,
  },
  promoCTARow: {
    flexDirection: "row",
    gap: 10,
  },
  promoCTAPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FF6B35",
    paddingVertical: 11,
    borderRadius: 12,
  },
  promoCTAPrimaryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "raleway-600SemiBold",
  },
  promoCTASecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#FF6B35",
  },
  promoCTASecondaryText: {
    color: "#FF6B35",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "raleway-600SemiBold",
  },
  promoNudge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    backgroundColor: "#FFE8D6",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  promoNudgeText: {
    flex: 1,
    fontSize: 12,
    color: "#CC4A10",
    fontFamily: "raleway-400Regular",
    lineHeight: 16,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  activeStatsCard: {
    backgroundColor: "#FF6B35",
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FF6B35",
    fontFamily: "raleway-700Bold",
    marginBottom: 4,
  },
  activeStatsNumber: {
    color: "#FFFFFF",
  },
  statsLabel: {
    fontSize: 12,
    color: "#8A8A8A",
    fontFamily: "raleway-400Regular",
  },
  activeStatsLabel: {
    color: "#FFFFFF",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#FF6B35",
  },
  tabText: {
    fontSize: 16,
    color: "#8A8A8A",
    fontFamily: "raleway-500Medium",
  },
  activeTabText: {
    color: "#FF6B35",
    fontWeight: "600",
  },
  listingsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  listingItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  listingContent: {
    flexDirection: "row",
    flex: 1,
  },
  listingImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
  },
  listingInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  listingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    fontFamily: "raleway-600SemiBold",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "600",
    fontFamily: "raleway-600SemiBold",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: "#8A8A8A",
    fontFamily: "raleway-400Regular",
    marginLeft: 4,
    flex: 1,
  },
  priceText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B35",
    fontFamily: "raleway-600SemiBold",
  },
  listingActionColumn: {
    marginLeft: 12,
    gap: 10,
  },
  analyticsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF5F0",
    alignItems: "center",
    justifyContent: "center",
  },
  archiveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  boostActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    fontFamily: "raleway-600SemiBold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#8A8A8A",
    fontFamily: "raleway-400Regular",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "raleway-600SemiBold",
  },
});
