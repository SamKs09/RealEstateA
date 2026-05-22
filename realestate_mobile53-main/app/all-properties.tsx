import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { HeaderWithBackButton } from "@/components/Ui/HeaderWithBackButton";
import { searchProperties, type Property } from "@/services/propertyService";
import { searchVehicles } from "@/services/vehicleService";
import { getFullImageUrl } from "@/services/api";
import { useInterest } from "@/contexts/InterestContext";
import { useTranslation } from "@/hooks/useTranslation";

type ViewMode = "grid" | "list";
type SortOption = "newest" | "price-low" | "price-high" | "popular";

export default function AllPropertiesScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isCarsMode = mode === "cars";
  const { userInterest } = useInterest();
  const { t } = useTranslation();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [totalCount, setTotalCount] = useState(0);

  const loadProperties = async (
    pageNum: number = 1,
    append: boolean = false,
  ) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      if (isCarsMode) {
        // Load vehicles
        const response = await searchVehicles({
          status: "active",
          page: pageNum,
          limit: 20,
        });
        const newItems = response.data || [];
        if (append) {
          setProperties((prev) => {
            const combined = [...prev, ...(newItems as any[])];
            return combined.filter(
              (item, index, self) =>
                index === self.findIndex((i) => (i._id || i.id) === (item._id || item.id))
            );
          });
        } else {
          setProperties(newItems as any[]);
        }
        setTotalCount(response.total || 0);
        setHasMore(pageNum < (response.pages || 1));
        return;
      }

      // Load properties
      let sortParam = "-createdAt";
      if (sortBy === "price-low")
        sortParam = "pricing.salePrice,pricing.rentPrice";
      if (sortBy === "price-high")
        sortParam = "-pricing.salePrice,-pricing.rentPrice";
      if (sortBy === "popular") sortParam = "-views,-likes";

      const response = await searchProperties({
        status: "active",
        page: pageNum,
        limit: 20,
        sort: sortParam,
      });

      const newProperties = response.properties || [];

      if (append) {
        setProperties((prev) => {
          const combined = [...prev, ...newProperties];
          // Filter out duplicates by _id or id
          const unique = combined.filter((prop, index, self) =>
            index === self.findIndex((p) => (
              (p._id || p.id) === (prop._id || prop.id)
            ))
          );
          return unique;
        });
      } else {
        setProperties(newProperties);
      }

      setTotalCount(response.pagination?.totalProperties || 0);
      setHasMore(response.pagination?.hasNextPage || false);
    } catch (error) {
      console.error("Error loading properties:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadProperties(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await loadProperties(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadProperties(nextPage, true);
    }
  };

  const handlePropertyPress = (property: any) => {
    if (isCarsMode) {
      router.push({
        pathname: "/property_info",
        params: {
          id: property._id || property.id,
          type: "vehicle",
        },
      });
    } else {
      router.push({
        pathname: "/property_info",
        params: {
          id: property._id || property.id,
        },
      });
    }
  };

  const formatProperty = (property: Property) => {
    const imageUrl = getFullImageUrl(property.media?.images?.[0]);

    // Format property type
    const propertyId = property._id || property.id || "";
    const propertyType = property.type
      ? property.type.charAt(0).toUpperCase() + property.type.slice(1)
      : "";

    // Format listing type
    const listingType =
      property.listingType === "rent" ? "For Rent" : "For Sale";

    return {
      id: property._id || property.id || "",
      image: imageUrl ? { uri: imageUrl } : undefined,
      title: property.title,
      propertyType,
      listingType,
      price: property.pricing?.rentPrice
        ? `${property.pricing.rentPrice}DT ${t("property.perMonth")}`
        : property.pricing?.salePrice
          ? `${property.pricing.salePrice}DT`
          : "N/A",
      address:
        property.location?.address || property.location?.city || "Unknown",
      area: property.location?.city || property.location?.state || "Unknown",
      bedrooms: property.propertyDetails?.bedrooms || 0,
      bathrooms: property.propertyDetails?.bathrooms || 0,
      size: property.propertyDetails?.area
        ? `${property.propertyDetails.area} ${property.propertyDetails.areaUnit || "sqft"}`
        : null,
      views: property.views || 0,
      likes: property.likes || 0,
    };
  };

  return (
    <View style={styles.container}>
      <HeaderWithBackButton
        title={isCarsMode ? (t("explore.allCars") || "All Cars") : (t("explore.allProperties") || "All Properties")}
      />

      {/* Stats and Controls Bar */}
      <View style={styles.controlsBar}>
        <View style={styles.statsSummaryContainer}>
          <Text style={styles.statsText}>
            {loading
              ? "..."
              : `${totalCount} ${isCarsMode ? (totalCount === 1 ? "Car" : "Cars") : (totalCount === 1 ? "Property" : "Properties")}`}
          </Text>
        </View>

        <View style={styles.controlsRight}>
          {/* Sort Dropdown */}
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => {
              // Cycle through sort options
              const options: SortOption[] = [
                "newest",
                "price-low",
                "price-high",
                "popular",
              ];
              const currentIndex = options.indexOf(sortBy);
              const nextIndex = (currentIndex + 1) % options.length;
              setSortBy(options[nextIndex]);
            }}
          >
            <Ionicons name="swap-vertical" size={16} color="#FF8C42" />
            <Text style={styles.sortButtonText}>
              {sortBy === "newest" && "Newest"}
              {sortBy === "price-low" && "Price: Low"}
              {sortBy === "price-high" && "Price: High"}
              {sortBy === "popular" && "Popular"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8C42" />
          <Text style={styles.loadingText}>Loading properties...</Text>
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => item._id || item.id || String(Math.random())}
          numColumns={1}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF8C42"
              colors={["#FF8C42"]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name={isCarsMode ? "car-outline" : "home-outline"} size={80} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>{isCarsMode ? "No Cars Found" : "No Properties Found"}</Text>
              <Text style={styles.emptyText}>
                {isCarsMode
                  ? "There are no cars available at the moment"
                  : "There are no properties available at the moment"}
              </Text>
            </View>
          }
          ListFooterComponent={
            <>
              {loadingMore && (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color="#FF8C42" />
                  <Text style={styles.loadingMoreText}>Loading more...</Text>
                </View>
              )}
              {!hasMore && properties.length > 0 && (
                <View style={styles.endContainer}>
                  <View style={styles.endDivider} />
                  <Text style={styles.endText}>
                    You&apos;ve reached the end
                  </Text>
                  <View style={styles.endDivider} />
                </View>
              )}
            </>
          }
          renderItem={({ item: property }) => {
            const formattedProperty = formatProperty(property);
            return (
              <View style={styles.propertyCardWrapper}>
                <TouchableOpacity
                  onPress={() => handlePropertyPress(property)}
                  activeOpacity={0.8}
                  style={styles.cardContainer}
                >
                  {/* Property Image */}
                  <View style={styles.imageContainer}>
                    <Image
                      source={
                        formattedProperty.image ||
                        require("@/assets/images/Auth/Appartment.png")
                      }
                      style={styles.propertyImage}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      transition={200}
                    />
                    {/* Listing Type Badge */}
                    <View style={styles.badgeContainer}>
                      <View
                        style={[
                          styles.badge,
                          property.listingType === "rent"
                            ? styles.rentBadge
                            : styles.saleBadge,
                        ]}
                      >
                        <Text style={styles.badgeText}>
                          {formattedProperty.listingType}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Property Info */}
                  <View style={styles.propertyInfo}>
                    {/* Property Type */}
                    <View style={styles.typeContainer}>
                      <Ionicons name="home-outline" size={14} color="#FF8C42" />
                      <Text style={styles.propertyTypeText}>
                        {formattedProperty.propertyType}
                      </Text>
                    </View>

                    {/* Title */}
                    <Text style={styles.propertyTitle} numberOfLines={1}>
                      {formattedProperty.title}
                    </Text>

                    {/* Location */}
                    <View style={styles.locationContainer}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color="#666"
                      />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {formattedProperty.address}
                      </Text>
                    </View>

                    {/* Features */}
                    <View style={styles.featuresRow}>
                      {formattedProperty.bedrooms > 0 && (
                        <View style={styles.feature}>
                          <Ionicons name="bed-outline" size={14} color="#666" />
                          <Text style={styles.featureText}>
                            {formattedProperty.bedrooms}
                          </Text>
                        </View>
                      )}
                      {formattedProperty.bathrooms > 0 && (
                        <View style={styles.feature}>
                          <Ionicons
                            name="water-outline"
                            size={14}
                            color="#666"
                          />
                          <Text style={styles.featureText}>
                            {formattedProperty.bathrooms}
                          </Text>
                        </View>
                      )}
                      {formattedProperty.size && (
                        <View style={styles.feature}>
                          <Ionicons
                            name="resize-outline"
                            size={14}
                            color="#666"
                          />
                          <Text style={styles.featureText}>
                            {formattedProperty.size}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Price and Stats */}
                    <View style={styles.bottomRow}>
                      <Text style={styles.priceText}>
                        {formattedProperty.price}
                      </Text>
                      <View style={styles.statsContainer}>
                        {formattedProperty.views > 0 && (
                          <View style={styles.stat}>
                            <Ionicons
                              name="eye-outline"
                              size={12}
                              color="#999"
                            />
                            <Text style={styles.statText}>
                              {formattedProperty.views}
                            </Text>
                          </View>
                        )}
                        {formattedProperty.likes > 0 && (
                          <View style={styles.stat}>
                            <Ionicons
                              name="heart-outline"
                              size={12}
                              color="#999"
                            />
                            <Text style={styles.statText}>
                              {formattedProperty.likes}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  controlsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsSummaryContainer: {
    flex: 1,
  },
  statsText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  controlsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFF5F0",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF8C42",
  },
  sortButtonText: {
    fontSize: 13,
    color: "#FF8C42",
    fontWeight: "600",
  },
  viewModeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF5F0",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF8C42",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  propertyCardWrapper: {
    width: "100%",
    marginBottom: 20,
  },
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#F5F5F5",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 200,
    backgroundColor: "#F0F0F0",
  },
  propertyImage: {
    width: "100%",
    height: "100%",
  },
  badgeContainer: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rentBadge: {
    backgroundColor: "#4CAF50",
  },
  saleBadge: {
    backgroundColor: "#2196F3",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  propertyInfo: {
    padding: 16,
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  propertyTypeText: {
    fontSize: 11,
    color: "#FF8C42",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  propertyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
  },
  locationText: {
    fontSize: 12,
    color: "#666",
    flex: 1,
  },
  featuresRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  featureText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF8C42",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  statText: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
  },
  loadingMoreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
  },
  loadingMoreText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  endContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  endDivider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  endText: {
    fontSize: 13,
    color: "#999",
    fontWeight: "500",
    marginHorizontal: 16,
  },
});
