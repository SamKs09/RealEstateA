import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { useInterest } from "../contexts/InterestContext";
import { useTranslation } from "../hooks/useTranslation";
import { HeaderWithBackButton } from "../components/Ui/HeaderWithBackButton";
import { getMyListings, Property } from "../services/propertyService";
import * as vehicleService from "../services/vehicleService";
import { getFullImageUrl } from "../services/api";

type ListingStatus = "all" | "active" | "pending" | "sold";

interface ListingStats {
  total: number;
  active: number;
  pending: number;
  sold: number;
}

export default function SellerDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { userInterest, activeView, isBothMode } = useInterest();
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState<ListingStatus>("all");
  const [properties, setProperties] = useState<Property[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<ListingStats>({
    total: 0,
    active: 0,
    pending: 0,
    sold: 0,
  });

  // Determine display mode
  const displayMode = isBothMode ? activeView : userInterest;

  const fetchListings = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (displayMode === "cars") {
        const response = await vehicleService.getUserVehicles({
          page: 1,
          limit: 100,
        });
        const vehicleData = response.data || [];
        setVehicles(vehicleData);
        
        // Calculate stats for vehicles
        const vehicleStats = {
          total: vehicleData.length,
          active: vehicleData.filter((v: any) => v.status === "active").length,
          pending: vehicleData.filter((v: any) => v.status === "pending").length,
          sold: vehicleData.filter((v: any) => v.status === "sold").length,
        };
        setStats(vehicleStats);
      } else {
        const propertyData = await getMyListings();
        setProperties(propertyData);
        
        // Calculate stats for properties
        const propertyStats = {
          total: propertyData.length,
          active: propertyData.filter((p: any) => p.status === "active").length,
          pending: propertyData.filter((p: any) => p.status === "pending").length,
          sold: propertyData.filter((p: any) => p.status === "sold").length,
        };
        setStats(propertyStats);
      }
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [displayMode]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  }, [fetchListings]);

  useFocusEffect(
    React.useCallback(() => {
      fetchListings();
    }, [fetchListings])
  );

  const getFilteredListings = () => {
    const listings = displayMode === "cars" ? vehicles : properties;
    
    if (activeTab === "all") return listings;
    return listings.filter((item: any) => item.status === activeTab);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#4CAF50";
      case "pending":
        return "#FF9800";
      case "sold":
        return "#9E9E9E";
      default:
        return "#4CAF50";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "pending":
        return "Pending";
      case "sold":
        return "Sold";
      default:
        return "Active";
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
    const placeholderImage = displayMode === "cars" 
      ? require("../assets/images/Cars/Bmx6.webp")
      : require("../assets/images/ScreensImages/ProfileComplete.png");

    const price = displayMode === "cars" 
      ? item.pricing?.salePrice || item.pricing?.rentPrice
      : item.pricing?.salePrice || item.pricing?.rentPrice;

    const location = item.location?.city || item.location?.address || "Location";
    const itemId = item.id || item._id;
    const itemTitle = item.title || (displayMode === "cars" ? item.make + " " + item.model : "Property");
    const itemType = displayMode === "cars" ? "vehicle" : "property";

    return (
      <View
        key={`${itemId}-${index}`}
        style={styles.listingItem}
      >
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
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status || "active") }]}>
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
              {price ? `${price.toLocaleString()} DT` : "Price on request"}
              {item.listingType === "rent" && " /month"}
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
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <HeaderWithBackButton 
          title="My Listings"
          onBackPress={() => router.back()} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading your listings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderWithBackButton 
        title="My Listings"
        onBackPress={() => router.back()} 
      />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.boostBanner}>
          <Text style={styles.boostBannerLabel}>Boosts remaining</Text>
          <Text style={styles.boostBannerValue}>{user?.boost?.number ?? 0}</Text>
          <Text style={styles.boostBannerMeta}>
            Pack: {user?.pack || "freemium"} · Slots: {user?.listingConfig?.number || 1}
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {renderStatsCard("Total", stats.total, activeTab === "all")}
          {renderStatsCard("Active", stats.active, activeTab === "active")}
          {renderStatsCard("Pending", stats.pending, activeTab === "pending")}
          {renderStatsCard("Sold", stats.sold, activeTab === "sold")}
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "all" && styles.activeTab]}
            onPress={() => setActiveTab("all")}
          >
            <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === "active" && styles.activeTab]}
            onPress={() => setActiveTab("active")}
          >
            <Text style={[styles.tabText, activeTab === "active" && styles.activeTabText]}>
              Active
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === "pending" && styles.activeTab]}
            onPress={() => setActiveTab("pending")}
          >
            <Text style={[styles.tabText, activeTab === "pending" && styles.activeTabText]}>
              Pending
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === "sold" && styles.activeTab]}
            onPress={() => setActiveTab("sold")}
          >
            <Text style={[styles.tabText, activeTab === "sold" && styles.activeTabText]}>
              Sold
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
                No {activeTab === "all" ? "" : activeTab} listings yet
              </Text>
              <Text style={styles.emptySubtitle}>
                {displayMode === "cars" 
                  ? "Start by adding your first vehicle listing"
                  : "Start by adding your first property listing"}
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
                  Add {displayMode === "cars" ? "Vehicle" : "Property"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            getFilteredListings().map((item, index) => renderListingItem(item, index))
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
  boostBanner: {
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#FFF5EC",
    borderWidth: 1,
    borderColor: "#FFD7BD",
  },
  boostBannerLabel: {
    fontSize: 12,
    color: "#8A8A8A",
    marginBottom: 4,
    fontFamily: "raleway-500Medium",
  },
  boostBannerValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FF6B35",
    fontFamily: "raleway-700Bold",
  },
  boostBannerMeta: {
    marginTop: 6,
    fontSize: 13,
    color: "#666",
    fontFamily: "raleway-400Regular",
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