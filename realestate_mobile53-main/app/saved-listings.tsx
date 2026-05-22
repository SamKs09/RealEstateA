import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { HeaderWithBackButton } from "@/components/Ui/HeaderWithBackButton";
import { useInterest } from "@/contexts/InterestContext";
import { usePopup } from "@/contexts/PopupContext";
import { useTranslation } from "@/hooks/useTranslation";
import { getFullImageUrl } from "@/services/api";
import userService, {
  type FavoriteListing,
  type FavoriteListingType,
} from "@/services/userService";
import type { Property } from "@/services/propertyService";
import type { Vehicle } from "@/services/vehicleService";

const getListingId = (listing: FavoriteListing) =>
  (listing as Property)._id ||
  (listing as Property).id ||
  (listing as Vehicle)._id ||
  (listing as Vehicle).id ||
  "";

export default function SavedListingsScreen() {
  const router = useRouter();
  const { activeView } = useInterest();
  const { t } = useTranslation();
  const { showError } = usePopup();
  const listingType: FavoriteListingType =
    activeView === "cars" ? "vehicle" : "property";
  const [savedListings, setSavedListings] = useState<FavoriteListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSavedListings = useCallback(async () => {
    try {
      const favorites = await userService.getFavoriteListings(listingType);
      setSavedListings(favorites);
    } catch (error) {
      console.error("Failed to load saved listings:", error);
      showError(t("settings.savedItemsLoadError"), t("settings.error"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [listingType, showError, t]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadSavedListings();
    }, [loadSavedListings])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadSavedListings();
  }, [loadSavedListings]);

  const handlePress = useCallback(
    (listing: FavoriteListing) => {
      const id = getListingId(listing);

      if (!id) {
        return;
      }

      if (listingType === "vehicle") {
        router.push({
          pathname: "/car_info",
          params: { id },
        });
        return;
      }

      router.push({
        pathname: "/property_info",
        params: { id },
      });
    },
    [listingType, router]
  );

  const renderItem = ({ item }: { item: FavoriteListing }) => {
    const property = item as Property;
    const vehicle = item as Vehicle;
    const imageUrl = getFullImageUrl(
      property.media?.images?.[0] || vehicle.media?.images?.[0]
    );
    const title =
      listingType === "vehicle"
        ? vehicle.title ||
          `${vehicle.vehicleDetails?.make || ""} ${vehicle.vehicleDetails?.model || ""}`.trim()
        : property.title;
    const subtitle =
      listingType === "vehicle"
        ? vehicle.location?.city || vehicle.location?.address || ""
        : property.location?.address || property.location?.city || "";
    const price =
      listingType === "vehicle"
        ? vehicle.pricing?.rentPrice || vehicle.pricing?.salePrice
        : property.pricing?.rentPrice || property.pricing?.salePrice;
    const currency =
      listingType === "vehicle"
        ? vehicle.pricing?.currency || "DT"
        : property.pricing?.currency || "DT";

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handlePress(item)}
        activeOpacity={0.85}
      >
        <View style={styles.imageWrapper}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              contentFit="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons
                name={listingType === "vehicle" ? "car-outline" : "home-outline"}
                size={28}
                color="#9CA3AF"
              />
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {title || "-"}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle || "-"}
          </Text>
          <Text style={styles.price}>
            {price ? `${price} ${currency}` : "N/A"}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <HeaderWithBackButton
        title={
          listingType === "vehicle"
            ? t("settings.savedCars")
            : t("settings.savedProperties")
        }
      />

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#FF8C42" />
        </View>
      ) : (
        <FlatList
          data={savedListings}
          keyExtractor={(item) => getListingId(item)}
          contentContainerStyle={
            savedListings.length === 0 ? styles.emptyListContent : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF8C42"
              colors={["#FF8C42"]}
            />
          }
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Ionicons
                name={listingType === "vehicle" ? "car-outline" : "bookmark-outline"}
                size={56}
                color="#D1D5DB"
              />
              <Text style={styles.emptyTitle}>
                {listingType === "vehicle"
                  ? t("settings.noSavedCars")
                  : t("settings.noSavedProperties")}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyListContent: {
    flexGrow: 1,
    padding: 24,
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  imageWrapper: {
    width: 88,
    height: 88,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
    marginRight: 12,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  price: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FF8C42",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4B5563",
    textAlign: "center",
  },
});