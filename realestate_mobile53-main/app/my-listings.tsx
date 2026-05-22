import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { HeaderWithBackButton } from "@/components/Ui/HeaderWithBackButton";
import { SuccessModal } from "@/components/Ui";
import { useAuth } from "@/contexts/AuthContext";
import {
  getMyListings,
  deleteProperty,
  type Property,
} from "@/services/propertyService";
import { useInterest } from "@/contexts/InterestContext";

export default function MyListingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isSeller, activeView, isBothMode, userInterest } = useInterest();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Redirect if user is not a seller
  useEffect(() => {
    if (!isSeller) {
      Alert.alert(
        "Access Denied",
        "Only sellers can access property listings.",
        [{ text: "OK", onPress: () => router.replace("/(tabs)/Explore") }]
      );
    }
  }, [isSeller, router]);

  const loadProperties = async () => {
    try {
      const data = await getMyListings();
      setProperties(data);
    } catch (error: any) {
      console.error("Error loading properties:", error);
      Alert.alert("Error", "Failed to load your properties");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProperties();
  }, []);

  const handleDelete = (propertyId: string, propertyTitle: string) => {
    Alert.alert(
      "Delete Property",
      `Are you sure you want to delete "${propertyTitle}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProperty(propertyId);
              setSuccessMessage("Property deleted successfully");
              setShowSuccessModal(true);
              loadProperties();
            } catch {
              Alert.alert("Error", "Failed to delete property");
            }
          },
        },
      ]
    );
  };

  const handleEdit = (propertyId: string) => {
    router.push({
      pathname: "/edit-property",
      params: { id: propertyId },
    } as any);
  };

  const handleBoost = (propertyId: string) => {
    router.push({
      pathname: "/boost-listing",
      params: { id: propertyId },
    } as any);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "#34C759";
      case "inactive":
        return "#FF9500";
      case "sold":
        return "#FF3B30";
      case "rented":
        return "#007AFF";
      case "pending":
        return "#8E8E93";
      default:
        return "#8E8E93";
    }
  };

  const getStatusLabel = (status?: string) => {
    return status
      ? status.charAt(0).toUpperCase() + status.slice(1)
      : "Unknown";
  };

  const renderProperty = (property: Property) => {
    const primaryImage = property.media?.images?.[0];
    const price =
      property.listingType === "sale"
        ? `$${property.pricing?.salePrice?.toLocaleString()}`
        : `$${property.pricing?.rentPrice?.toLocaleString()}/${
            property.pricing?.rentPeriod
          }`;

    return (
      <View key={property._id} style={styles.propertyCard}>
        <View style={styles.propertyImageContainer}>
          {primaryImage ? (
            <Image
              source={{ uri: primaryImage }}
              style={styles.propertyImage}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="home-outline" size={48} color="#CCCCCC" />
            </View>
          )}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(property.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {getStatusLabel(property.status)}
            </Text>
          </View>
        </View>

        <View style={styles.propertyInfo}>
          <Text style={styles.propertyTitle} numberOfLines={2}>
            {property.title}
          </Text>

          <Text style={styles.propertyLocation} numberOfLines={1}>
            <Ionicons name="location-outline" size={14} color="#666" />{" "}
            {property.location.city}, {property.location.country}
          </Text>

          <View style={styles.propertyDetails}>
            {property.propertyDetails?.bedrooms && (
              <View style={styles.detailItem}>
                <Ionicons name="bed-outline" size={16} color="#666" />
                <Text style={styles.detailText}>
                  {property.propertyDetails.bedrooms}
                </Text>
              </View>
            )}
            {property.propertyDetails?.bathrooms && (
              <View style={styles.detailItem}>
                <Ionicons name="water-outline" size={16} color="#666" />
                <Text style={styles.detailText}>
                  {property.propertyDetails.bathrooms}
                </Text>
              </View>
            )}
            {property.propertyDetails?.area && (
              <View style={styles.detailItem}>
                <Ionicons name="resize-outline" size={16} color="#666" />
                <Text style={styles.detailText}>
                  {property.propertyDetails.area}{" "}
                  {property.propertyDetails.areaUnit}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{price}</Text>
            <View style={styles.statsContainer}>
              <View style={styles.stat}>
                <Ionicons name="eye-outline" size={16} color="#666" />
                <Text style={styles.statText}>{property.views || 0}</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="heart-outline" size={16} color="#666" />
                <Text style={styles.statText}>{property.likes || 0}</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.boostButton]}
              onPress={() => handleBoost(property._id!)}
            >
              <Ionicons name="rocket-outline" size={20} color="white" />
              <Text style={styles.actionButtonText}>Boost</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => handleEdit(property._id!)}
            >
              <Ionicons name="create-outline" size={20} color="white" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDelete(property._id!, property.title)}
            >
              <Ionicons name="trash-outline" size={20} color="white" />
              <Text style={styles.actionButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <HeaderWithBackButton onBackPress={() => router.back()} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <HeaderWithBackButton onBackPress={() => router.back()} />
        <Text style={styles.headerTitle}>My Listings</Text>
      </View>

      <View style={styles.boostSummaryCard}>
        <Text style={styles.boostSummaryLabel}>Boosts remaining</Text>
        <Text style={styles.boostSummaryValue}>{user?.boost?.number ?? 0}</Text>
        <Text style={styles.boostSummaryMeta}>
          Pack: {user?.pack || "freemium"} · Listing slots: {user?.listingConfig?.number || 1}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {properties.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="home-outline" size={80} color="#CCCCCC" />
            <Text style={styles.emptyStateTitle}>No Listings Yet</Text>
            <Text style={styles.emptyStateText}>
              Start by adding your first property listing
            </Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={() => {
                const targetInterest = isBothMode ? activeView : userInterest;
                router.push(targetInterest === "cars" ? "/add-car" : "/add-house");
              }}
            >
              <Text style={styles.addFirstButtonText}>Add Property</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listingsContainer}>
            <Text style={styles.listingsCount}>
              {properties.length}{" "}
              {properties.length === 1 ? "Listing" : "Listings"}
            </Text>
            {properties.map(renderProperty)}
          </View>
        )}
      </ScrollView>

      {properties.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            const targetInterest = isBothMode ? activeView : userInterest;
            router.push(targetInterest === "cars" ? "/add-car" : "/add-house");
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      )}

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        title="Success!"
        message={successMessage}
        buttonText="OK"
        onClose={() => {
          setShowSuccessModal(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  headerContainer: {
    backgroundColor: "white",
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Raleway-Bold",
    textAlign: "center",
    marginTop: -30,
    color: "#1A1A1A",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontFamily: "Raleway-Bold",
    color: "#1A1A1A",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: "Raleway",
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  addFirstButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  addFirstButtonText: {
    fontSize: 16,
    fontFamily: "Raleway-SemiBold",
    color: "white",
  },
  listingsContainer: {
    flex: 1,
  },
  listingsCount: {
    fontSize: 18,
    fontFamily: "Raleway-SemiBold",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  boostSummaryCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#FFF5EC",
    borderWidth: 1,
    borderColor: "#FFD7BD",
  },
  boostSummaryLabel: {
    fontSize: 12,
    color: "#8A8A8A",
    marginBottom: 4,
  },
  boostSummaryValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FF8C42",
  },
  boostSummaryMeta: {
    marginTop: 6,
    fontSize: 13,
    color: "#666",
  },
  propertyCard: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  propertyImageContainer: {
    width: "100%",
    height: 200,
    position: "relative",
  },
  propertyImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Raleway-SemiBold",
    color: "white",
  },
  propertyInfo: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: 20,
    fontFamily: "Raleway-Bold",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  propertyLocation: {
    fontSize: 14,
    fontFamily: "Raleway",
    color: "#666",
    marginBottom: 12,
  },
  propertyDetails: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    fontFamily: "Raleway",
    color: "#666",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  price: {
    fontSize: 22,
    fontFamily: "Raleway-Bold",
    color: "#007AFF",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 14,
    fontFamily: "raleway-400Regular",
    color: "#666",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  editButton: {
    backgroundColor: "#007AFF",
  },
  boostButton: {
    backgroundColor: "#F85B00",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: "Raleway-SemiBold",
    color: "white",
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});
