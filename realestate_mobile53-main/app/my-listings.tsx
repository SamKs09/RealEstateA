import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  archiveProperty,
  type Property,
} from "@/services/propertyService";
import {
  getUserVehicles,
  deleteVehicle,
  archiveVehicle,
  type Vehicle,
} from "@/services/vehicleService";
import { getOwnerBookings, type BookingData } from "@/services/bookingService";
import { useInterest } from "@/contexts/InterestContext";

type FilterTab = "all" | "active" | "pending";

export default function MyListingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isSeller, activeView, isBothMode, userInterest } = useInterest();

  const currentMode = isBothMode ? activeView : userInterest;
  const isVehicleMode = currentMode === "cars";

  const [properties, setProperties] = useState<Property[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [ownerBookings, setOwnerBookings] = useState<BookingData[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!isSeller) {
      Alert.alert("Access Denied", "Only sellers can access listings.", [
        { text: "OK", onPress: () => router.replace("/(tabs)/Explore") },
      ]);
    }
  }, [isSeller, router]);

  const loadData = useCallback(async () => {
    try {
      const userId = (user as any)?._id || (user as any)?.id;
      const bookingsPromise = userId
        ? getOwnerBookings(userId).catch(() => [] as BookingData[])
        : Promise.resolve<BookingData[]>([]);

      if (isVehicleMode) {
        const [vehicleResult, bookings] = await Promise.all([
          getUserVehicles(),
          bookingsPromise,
        ]);
        setVehicles(vehicleResult.data || []);
        setOwnerBookings(bookings);
      } else {
        const [props, bookings] = await Promise.all([
          getMyListings(),
          bookingsPromise,
        ]);
        setProperties(props);
        setOwnerBookings(bookings);
      }
    } catch (error: any) {
      console.error("Error loading listings:", error);
      Alert.alert("Error", "Failed to load your listings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isVehicleMode, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const allListings: (Property | Vehicle)[] = isVehicleMode
    ? vehicles
    : properties;

  const isBookedToday = useCallback(
    (listingId: string): boolean => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const listingType = isVehicleMode ? "vehicle" : "property";
      return ownerBookings.some((b) => {
        if (b.status !== "accepted") return false;
        const refId =
          listingType === "property"
            ? b.property?._id || b.property?.id
            : b.vehicle?._id || b.vehicle?.id;
        if (refId !== listingId) return false;
        const start = new Date(b.startDate);
        const end = new Date(b.endDate);
        end.setHours(23, 59, 59, 999);
        return today >= start && today <= end;
      });
    },
    [ownerBookings, isVehicleMode],
  );

  const activeBoostedCount = useMemo(
    () => allListings.filter((item) => item.isPromoted === true).length,
    [allListings],
  );

  const pendingBookedCount = useMemo(
    () =>
      allListings.filter((item) =>
        isBookedToday(item._id || (item as any).id || ""),
      ).length,
    [allListings, isBookedToday],
  );

  const filteredListings = useMemo(() => {
    switch (filter) {
      case "active":
        return allListings.filter((item) => item.isPromoted === true);
      case "pending":
        return allListings.filter((item) =>
          isBookedToday(item._id || (item as any).id || ""),
        );
      default:
        return allListings;
    }
  }, [allListings, filter, isBookedToday]);

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      "Delete Listing",
      `Are you sure you want to delete "${title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (isVehicleMode) {
                await deleteVehicle(id);
              } else {
                await deleteProperty(id);
              }
              setSuccessMessage("Listing deleted successfully");
              setShowSuccessModal(true);
              loadData();
            } catch {
              Alert.alert("Error", "Failed to delete listing");
            }
          },
        },
      ],
    );
  };

  const handleArchive = (id: string, title: string) => {
    Alert.alert(
      "Archive Listing",
      `Archive "${title}"? It will be hidden from public searches but kept in your account.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          onPress: async () => {
            try {
              if (isVehicleMode) {
                await archiveVehicle(id);
              } else {
                await archiveProperty(id);
              }
              setSuccessMessage("Listing archived successfully");
              setShowSuccessModal(true);
              loadData();
            } catch {
              Alert.alert("Error", "Failed to archive listing");
            }
          },
        },
      ],
    );
  };

  const handleEdit = (id: string) => {
    if (isVehicleMode) {
      router.push({ pathname: "/edit-vehicle", params: { id } } as any);
    } else {
      router.push({ pathname: "/edit-property", params: { id } } as any);
    }
  };

  const handleBoost = (id: string) => {
    router.push({ pathname: "/boost-listing", params: { id } } as any);
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
        return "#FF9500";
      case "archived":
        return "#8E8E93";
      default:
        return "#8E8E93";
    }
  };

  const getStatusLabel = (status?: string) =>
    status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";

  const renderCard = (item: Property | Vehicle) => {
    const id = item._id || (item as any).id || "";
    const vehicle = item as Vehicle;
    const property = item as Property;

    const primaryImage = isVehicleMode
      ? vehicle.media?.images?.[0]
      : property.media?.images?.[0];

    const title =
      item.title ||
      (isVehicleMode
        ? `${vehicle.vehicleDetails?.make} ${vehicle.vehicleDetails?.model} ${vehicle.vehicleDetails?.year}`
        : "Untitled");

    const price = isVehicleMode
      ? vehicle.listingType === "sale"
        ? `${vehicle.pricing?.currency || "TND"} ${vehicle.pricing?.salePrice?.toLocaleString()}`
        : `${vehicle.pricing?.currency || "TND"} ${vehicle.pricing?.rentPrice?.toLocaleString()}/${vehicle.pricing?.rentPeriod}`
      : property.listingType === "sale"
        ? `TND ${property.pricing?.salePrice?.toLocaleString()}`
        : `TND ${property.pricing?.rentPrice?.toLocaleString()}/${property.pricing?.rentPeriod}`;

    const location = isVehicleMode
      ? `${vehicle.location?.city}, ${vehicle.location?.country}`
      : `${property.location?.city}, ${property.location?.country}`;

    const views = isVehicleMode ? vehicle.views || 0 : property.views || 0;
    const likes = isVehicleMode
      ? Array.isArray(vehicle.likes)
        ? vehicle.likes.length
        : 0
      : typeof property.likes === "number"
        ? property.likes
        : 0;

    const isBoosted = item.isPromoted === true;
    const isBooked = isBookedToday(id);
    const isArchived = (item as any).status === "archived";

    return (
      <View key={id} style={styles.card}>
        <View style={styles.imageContainer}>
          {primaryImage ? (
            <Image source={{ uri: primaryImage }} style={styles.cardImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons
                name={isVehicleMode ? "car-outline" : "home-outline"}
                size={48}
                color="#CCCCCC"
              />
            </View>
          )}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor((item as any).status) },
            ]}
          >
            <Text style={styles.statusText}>
              {getStatusLabel((item as any).status)}
            </Text>
          </View>
          {isBoosted && (
            <View style={styles.boostBadge}>
              <Ionicons name="rocket" size={12} color="white" />
              <Text style={styles.boostBadgeText}>Boosted</Text>
            </View>
          )}
          {isBooked && (
            <View style={styles.bookedBadge}>
              <Ionicons name="calendar" size={12} color="white" />
              <Text style={styles.bookedBadgeText}>Booked</Text>
            </View>
          )}
        </View>

        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.cardLocation} numberOfLines={1}>
            <Ionicons name="location-outline" size={13} color="#666" />{" "}
            {location}
          </Text>

          {!isVehicleMode && (
            <View style={styles.detailsRow}>
              {property.propertyDetails?.bedrooms != null && (
                <View style={styles.detailChip}>
                  <Ionicons name="bed-outline" size={14} color="#666" />
                  <Text style={styles.detailChipText}>
                    {property.propertyDetails.bedrooms}
                  </Text>
                </View>
              )}
              {property.propertyDetails?.bathrooms != null && (
                <View style={styles.detailChip}>
                  <Ionicons name="water-outline" size={14} color="#666" />
                  <Text style={styles.detailChipText}>
                    {property.propertyDetails.bathrooms}
                  </Text>
                </View>
              )}
              {property.propertyDetails?.area != null && (
                <View style={styles.detailChip}>
                  <Ionicons name="resize-outline" size={14} color="#666" />
                  <Text style={styles.detailChipText}>
                    {property.propertyDetails.area}{" "}
                    {property.propertyDetails.areaUnit}
                  </Text>
                </View>
              )}
            </View>
          )}

          {isVehicleMode && (
            <View style={styles.detailsRow}>
              {vehicle.vehicleDetails?.make && (
                <View style={styles.detailChip}>
                  <Ionicons name="car-outline" size={14} color="#666" />
                  <Text style={styles.detailChipText}>
                    {vehicle.vehicleDetails.make}
                  </Text>
                </View>
              )}
              {vehicle.vehicleDetails?.year && (
                <View style={styles.detailChip}>
                  <Ionicons name="calendar-outline" size={14} color="#666" />
                  <Text style={styles.detailChipText}>
                    {vehicle.vehicleDetails.year}
                  </Text>
                </View>
              )}
              {vehicle.vehicleDetails?.mileage != null && (
                <View style={styles.detailChip}>
                  <Ionicons name="speedometer-outline" size={14} color="#666" />
                  <Text style={styles.detailChipText}>
                    {vehicle.vehicleDetails.mileage.toLocaleString()} km
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.price}>{price}</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Ionicons name="eye-outline" size={15} color="#999" />
                <Text style={styles.statText}>{views}</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="heart-outline" size={15} color="#999" />
                <Text style={styles.statText}>{likes}</Text>
              </View>
            </View>
          </View>

          {!isArchived ? (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.boostBtn]}
                onPress={() => handleBoost(id)}
              >
                <Ionicons name="rocket-outline" size={17} color="white" />
                <Text style={styles.actionBtnText}>Boost</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.editBtn]}
                onPress={() => handleEdit(id)}
              >
                <Ionicons name="create-outline" size={17} color="white" />
                <Text style={styles.actionBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.archiveBtn]}
                onPress={() => handleArchive(id, title)}
              >
                <Ionicons name="archive-outline" size={17} color="white" />
                <Text style={styles.actionBtnText}>Archive</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={() => handleDelete(id, title)}
              >
                <Ionicons name="trash-outline" size={17} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.archivedNote}>
              <Ionicons name="archive-outline" size={15} color="#8E8E93" />
              <Text style={styles.archivedNoteText}>
                Archived — hidden from searches
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <HeaderWithBackButton onBackPress={() => router.back()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF8C42" />
        </View>
      </View>
    );
  }

  const modeLabel = isVehicleMode ? "Cars & Motorcycles" : "Properties";

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <HeaderWithBackButton onBackPress={() => router.back()} />
        <Text style={styles.headerTitle}>My Listings</Text>
        <View style={styles.modeBadge}>
          <Ionicons
            name={isVehicleMode ? "car-outline" : "home-outline"}
            size={13}
            color="#FF8C42"
          />
          <Text style={styles.modeBadgeText}>{modeLabel}</Text>
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statItemValue}>{allListings.length}</Text>
          <Text style={styles.statItemLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statItemValue, { color: "#FF8C42" }]}>
            {activeBoostedCount}
          </Text>
          <Text style={styles.statItemLabel}>Boosted</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statItemValue, { color: "#007AFF" }]}>
            {pendingBookedCount}
          </Text>
          <Text style={styles.statItemLabel}>Booked Today</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statItemValue, { color: "#34C759" }]}>
            {user?.boost?.number ?? 0}
          </Text>
          <Text style={styles.statItemLabel}>Boosts Left</Text>
        </View>
      </View>

      <View style={styles.tabsRow}>
        {(["all", "active", "pending"] as FilterTab[]).map((tab) => {
          const count =
            tab === "all"
              ? allListings.length
              : tab === "active"
                ? activeBoostedCount
                : pendingBookedCount;
          const label =
            tab === "all"
              ? "All"
              : tab === "active"
                ? "Boosted"
                : "Booked Today";
          const isActive = filter === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setFilter(tab)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {label}
              </Text>
              <View
                style={[styles.tabBadge, isActive && styles.tabBadgeActive]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    isActive && styles.tabBadgeTextActive,
                  ]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredListings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name={isVehicleMode ? "car-outline" : "home-outline"}
              size={72}
              color="#CCCCCC"
            />
            <Text style={styles.emptyTitle}>
              {filter === "all"
                ? "No listings yet"
                : filter === "active"
                  ? "No boosted listings"
                  : "Nothing booked for today"}
            </Text>
            <Text style={styles.emptyText}>
              {filter === "all"
                ? "Add your first listing to get started"
                : filter === "active"
                  ? "Boost a listing to appear at the top of searches"
                  : "Your listings have no active bookings today"}
            </Text>
            {filter === "all" && (
              <TouchableOpacity
                style={styles.addFirstBtn}
                onPress={() =>
                  router.push(isVehicleMode ? "/add-car" : "/add-house")
                }
              >
                <Text style={styles.addFirstBtnText}>Add Listing</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View>{filteredListings.map(renderCard)}</View>
        )}
      </ScrollView>

      {allListings.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push(isVehicleMode ? "/add-car" : "/add-house")}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      )}

      <SuccessModal
        visible={showSuccessModal}
        title="Success!"
        message={successMessage}
        buttonText="OK"
        onClose={() => setShowSuccessModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerContainer: { backgroundColor: "white", paddingBottom: 12 },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Raleway-Bold",
    color: "#333333",
    textAlign: "center",
    marginTop: -30,
  },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 4,
  },
  modeBadgeText: {
    fontSize: 12,
    color: "#FF8C42",
    fontFamily: "Raleway-SemiBold",
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 16,
    paddingVertical: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  statItem: { flex: 1, alignItems: "center" },
  statItemValue: {
    fontSize: 22,
    fontFamily: "Raleway-Bold",
    color: "#1A1A1A",
  },
  statItemLabel: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
    fontFamily: "Raleway",
    textAlign: "center",
  },
  statDivider: { width: 1, backgroundColor: "#F0F0F0", marginVertical: 4 },
  tabsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 10,
    gap: 5,
  },
  tabActive: { backgroundColor: "#FF8C42" },
  tabText: { fontSize: 12, fontFamily: "Raleway-SemiBold", color: "#888" },
  tabTextActive: { color: "white" },
  tabBadge: {
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabBadgeActive: { backgroundColor: "rgba(255,255,255,0.3)" },
  tabBadgeText: { fontSize: 11, fontFamily: "Raleway-SemiBold", color: "#666" },
  tabBadgeTextActive: { color: "white" },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Raleway-Bold",
    color: "#1A1A1A",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Raleway",
    color: "#888",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 21,
  },
  addFirstBtn: {
    backgroundColor: "#FF8C42",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 32,
  },
  addFirstBtnText: {
    fontSize: 15,
    fontFamily: "Raleway-SemiBold",
    color: "white",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  imageContainer: { width: "100%", height: 190, position: "relative" },
  cardImage: { width: "100%", height: "100%" },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontFamily: "Raleway-SemiBold", color: "white" },
  boostBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FF8C42",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },
  boostBadgeText: {
    fontSize: 11,
    fontFamily: "Raleway-SemiBold",
    color: "white",
  },
  bookedBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#007AFF",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },
  bookedBadgeText: {
    fontSize: 11,
    fontFamily: "Raleway-SemiBold",
    color: "white",
  },
  cardInfo: { padding: 14 },
  cardTitle: {
    fontSize: 17,
    fontFamily: "Raleway-Bold",
    color: "#1A1A1A",
    marginBottom: 5,
  },
  cardLocation: {
    fontSize: 13,
    fontFamily: "Raleway",
    color: "#666",
    marginBottom: 10,
  },
  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  detailChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  detailChipText: { fontSize: 12, fontFamily: "Raleway", color: "#555" },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  price: { fontSize: 18, fontFamily: "Raleway-Bold", color: "#FF8C42" },
  statsRow: { flexDirection: "row", gap: 12 },
  stat: { flexDirection: "row", alignItems: "center", gap: 3 },
  statText: { fontSize: 13, fontFamily: "Raleway", color: "#999" },
  actions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
  },
  boostBtn: { backgroundColor: "#FF8C42" },
  editBtn: { backgroundColor: "#007AFF" },
  archiveBtn: { backgroundColor: "#8E8E93" },
  deleteBtn: { flex: 0, paddingHorizontal: 14, backgroundColor: "#FF3B30" },
  actionBtnText: {
    fontSize: 13,
    fontFamily: "Raleway-SemiBold",
    color: "white",
  },
  archivedNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  archivedNoteText: { fontSize: 13, color: "#8E8E93", fontFamily: "Raleway" },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#FF8C42",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#FF8C42",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
