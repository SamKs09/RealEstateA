import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Linking,
  Platform,
  TextInput,
} from "react-native";
import { Image } from "expo-image";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getProperty } from "../services/propertyService";
import * as vehicleService from "../services/vehicleService";
import { chatService } from "../services/chatService";
import {
  recordSave,
  recordView,
  removeSave,
  type ListingType,
} from "../services/analyticsService";
import { userService } from "../services/userService";
import { useTranslation } from "../hooks/useTranslation";
import { useAuth } from "../contexts/AuthContext";
import { usePopup } from "../contexts/PopupContext";
import { PrimaryButton, ScreenWrapper, MapPicker } from "../components/Ui";
import { Colors } from "../components/styles/GlobalStyles";
import { WebView } from "react-native-webview";
import { apiService } from "../services/api";

export default function PropertyInfo() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { showError, showInfo, showSuccess } = usePopup();

  const propertyId = (params.id || params.propertyId) as string;
  const listingType: ListingType =
    params.type === "vehicle" ? "vehicle" : "property";

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [, setChatLoading] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [videoVisible] = useState(false);
  const [videoUri] = useState<string | null>(null);
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [offerMessage, setOfferMessage] = useState("");
  const [offerLoading, setOfferLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const mapRef = useRef<MapView>(null);
  const viewedListingRef = useRef<string | null>(null);

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const imageTranslateX = useSharedValue(0);

  useEffect(() => {
    if (!propertyId) return;

    setLoading(true);

    const fetchData =
      listingType === "vehicle"
        ? vehicleService.getVehicle(propertyId).then((r: any) => r.data)
        : getProperty(propertyId);

    fetchData
      .then(setProperty)
      .catch(() => showError("Error loading property"))
      .finally(() => setLoading(false));
  }, [propertyId, listingType, showError]);

  useEffect(() => {
    if (!property?._id || viewedListingRef.current === property._id) {
      return;
    }

    viewedListingRef.current = property._id;
    recordView(property._id, listingType);
  }, [property?._id, listingType]);

  useEffect(() => {
    if (!propertyId || !user?._id) {
      setIsSaved(false);
      return;
    }

    let isActive = true;

    userService
      .getFavoriteListingIds(listingType)
      .then((favoriteIds) => {
        if (isActive) {
          setIsSaved(favoriteIds.includes(propertyId));
        }
      })
      .catch((error) => {
        console.warn("Failed to load favorite state:", error);
      });

    return () => {
      isActive = false;
    };
  }, [propertyId, listingType, user?._id]);

  const images = property?.media?.images || [];
  const ownerId = property?.owner?._id || property?.owner?.id;
  const isOwnerViewing = !!user?._id && !!ownerId && user._id === ownerId;

  const openImageModal = (index: number) => {
    setModalIndex(index);
    setModalVisible(true);
    scale.value = withTiming(1);
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    imageTranslateX.value = withTiming(0);
  };

  const goNext = () => {
    if (modalIndex < images.length - 1) {
      setModalIndex((prev) => prev + 1);
    }
  };

  const goPrev = () => {
    if (modalIndex > 0) {
      setModalIndex((prev) => prev - 1);
    }
  };

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1.1) {
        translateX.value = e.translationX;
        translateY.value = e.translationY;
      } else {
        imageTranslateX.value = e.translationX;
      }
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > 120) {
        runOnJS(e.translationX > 0 ? goPrev : goNext)();
      }
      imageTranslateX.value = withSpring(0);
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const pinch = Gesture.Pinch().onUpdate((e) => {
    scale.value = e.scale;
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: imageTranslateX.value },
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const handleCallOwner = () => {
    if (isOwnerViewing) {
      return;
    }

    if (property?.owner?.phone) {
      Linking.openURL(`tel:${property.owner.phone}`);
    } else {
      showError("No phone available");
    }
  };

  const handleChatOwner = async () => {
    if (isOwnerViewing) {
      return;
    }

    if (!user?._id) {
      showError("Login required", "Error");
      return;
    }

    try {
      setChatLoading(true);
      const thread = await chatService.getOrCreateThread(
        property.owner._id,
        property.owner?.name || property.owner?.firstName,
        {
          listingId: propertyId,
          listingType,
        },
      );

      if (thread?._id) {
        router.push({
          pathname: "/chat/[id]",
          params: { id: thread._id },
        });
      }
    } catch {
      showError("Chat failed");
    } finally {
      setChatLoading(false);
    }
  };

  const handleMakeOffer = async () => {
    if (!user?._id) {
      showError(t("authentication.signInText"), t("error"));
      return;
    }

    if (!offerMessage.trim()) {
      showInfo(t("offers.makeOfferMessage"), t("error"));
      return;
    }

    try {
      setOfferLoading(true);
      const res = await apiService.post("/seller/offers", {
        itemId: propertyId,
        type: params.type === "vehicle" ? "car" : "property",
        message: offerMessage,
      });

      if (res.success) {
        showSuccess(t("offers.offerSent"), t("success"));
        setOfferModalVisible(false);
        setOfferMessage("");
      }
    } catch (err: any) {
      showError(err.message || "Failed to send offer", "Error");
    } finally {
      setOfferLoading(false);
    }
  };

  const handleToggleSave = async () => {
    if (!user?._id) {
      showError(t("authentication.signInText"), t("error"));
      return;
    }

    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    setBookmarkLoading(true);

    try {
      if (nextSaved) {
        await userService.addFavoriteListing(propertyId, listingType);
        void recordSave(propertyId, listingType).catch((error) => {
          console.warn("Failed to record property save analytics:", error);
        });
      } else {
        await userService.removeFavoriteListing(propertyId, listingType);
        void removeSave(propertyId, listingType).catch((error) => {
          console.warn("Failed to remove property save analytics:", error);
        });
      }
    } catch (error: any) {
      setIsSaved(!nextSaved);
      showError(error.message || "Failed to update favorites", "Error");
    } finally {
      setBookmarkLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const region = property?.location?.coordinates || {
    latitude: 35.8954,
    longitude: 10.5972,
  };
  const mapRegion = {
    latitude:
      typeof region?.latitude === "number" && Number.isFinite(region.latitude)
        ? region.latitude
        : 35.8954,
    longitude:
      typeof region?.longitude === "number" && Number.isFinite(region.longitude)
        ? region.longitude
        : 10.5972,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  };

  return (
    <ScreenWrapper
      backgroundColor={Colors.background}
      edges={["top", "bottom"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* IMAGE HEADER with gradient and icons */}
        <View style={styles.imageCard}>
          <Image
            source={
              images[0]
                ? { uri: images[0] }
                : require("../assets/images/ScreensImages/House1.jpg")
            }
            style={styles.mainImage}
            contentFit="cover"
            cachePolicy="none"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.gradientOverlay}
            pointerEvents="none"
          />
          <View style={styles.topIcons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleToggleSave}
              disabled={bookmarkLoading}
            >
              <Ionicons
                name={isSaved ? "bookmark" : "bookmark-outline"}
                size={22}
                color={isSaved ? "#FFD166" : "#fff"}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.imageContent}>
            <Text style={styles.title}>{property.title}</Text>
            <Text style={styles.location}>
              {property.location?.address}, {property.location?.city}
            </Text>
          </View>
        </View>

        {/* DESCRIPTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text
            style={styles.descriptionText}
            numberOfLines={descriptionExpanded ? undefined : 3}
          >
            {property.description}
          </Text>
          <TouchableOpacity
            onPress={() => setDescriptionExpanded(!descriptionExpanded)}
          >
            <Text style={styles.link}>
              {descriptionExpanded ? "Show less" : "Show more"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* OWNER CARD */}
        <TouchableOpacity
          style={styles.ownerCard}
          onPress={() => {
            if (isOwnerViewing) {
              return;
            }

            const sellerId = property.owner?._id || property.owner?.id;
            if (sellerId) {
              router.push(`/seller-profile/${sellerId}`);
            }
          }}
          activeOpacity={isOwnerViewing ? 1 : 0.2}
        >
          <View style={styles.ownerInfo}>
            <Image
              source={
                property.owner?.avatar
                  ? { uri: property.owner.avatar }
                  : require("../assets/images/ScreensImages/ProfileComplete.png")
              }
              style={styles.ownerAvatar}
              contentFit="cover"
            />
            <View style={styles.ownerText}>
              <Text style={styles.ownerName}>
                {property.owner?.name || "Owner"}
              </Text>
              <Text style={styles.ownerRole}>Owner</Text>
            </View>
          </View>
          {!isOwnerViewing && (
            <View style={styles.ownerActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  handleCallOwner();
                }}
              >
                <Ionicons name="call" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  handleChatOwner();
                }}
              >
                <Ionicons name="chatbubble" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>

        {/* GALLERY */}
        {images.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gallery</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {images.map((img: string, i: number) => (
                <TouchableOpacity
                  key={i}
                  style={styles.galleryWrapper}
                  onPress={() => openImageModal(i)}
                >
                  <Image
                    source={{ uri: img }}
                    style={styles.galleryImage}
                    contentFit="cover"
                    cachePolicy="none"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* MAP CARD */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <TouchableOpacity
            style={styles.mapContainer}
            onPress={() => setShowMapPicker(true)}
            activeOpacity={0.9}
          >
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              region={mapRegion}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              minZoomLevel={5}
              maxZoomLevel={18}
            >
              <Marker coordinate={mapRegion} />
            </MapView>
            <View style={styles.mapOverlay}>
              <Ionicons name="location" size={16} color="#FF6B35" />
              <Text style={styles.mapOverlayText} numberOfLines={1}>
                {property.location?.address}, {property.location?.city}
              </Text>
              <Ionicons
                name="open-outline"
                size={14}
                color="#666"
                style={styles.editIcon}
              />
            </View>
          </TouchableOpacity>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footerFixed}>
        <View style={styles.footerContent}>
          <View style={styles.footerPriceBlock}>
            <Text style={styles.priceLabel}>Price</Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                flexWrap: "nowrap",
              }}
            >
              <Text style={styles.priceValue} numberOfLines={1}>
                {property.pricing?.rentPrice
                  ? `${property.pricing.rentPrice.toLocaleString()} ${property.pricing.currency || "TND"}`
                  : property.pricing?.salePrice
                    ? `${property.pricing.salePrice.toLocaleString()} ${property.pricing.currency || "TND"}`
                    : "N/A"}
              </Text>
              {property.pricing?.rentPrice && property.pricing?.rentPeriod ? (
                <Text style={styles.pricePeriod}>
                  {" "}
                  / {property.pricing.rentPeriod}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={styles.footerDivider} />
          <View style={styles.footerButtons}>
            <PrimaryButton
              title={t("propertyInfo.bookNow") || "Book Now"}
              onPress={() => {
                if (!user?._id) {
                  showError(t("authentication.signInText"), t("error"));
                  return;
                }

                // Navigate to rent calendar with listing details
                router.push({
                  pathname: "/booking/rent-calendar" as any,
                  params: {
                    listingId: propertyId,
                    listingType:
                      params.type === "vehicle" ? "vehicle" : "property",
                    propertyName: property.title,
                    location: `${property.location?.address}, ${property.location?.city}`,
                    pricePerNight: (
                      property.pricing?.rentPrice ||
                      property.pricing?.salePrice ||
                      0
                    ).toString(),
                    propertyImage: images[0] || "",
                    bedrooms: property.bedrooms || "0",
                    bathrooms: property.bathrooms || "0",
                    capacity:
                      property.capacity || property.seatingCapacity || "4",
                  },
                });
              }}
              style={styles.footerButton}
              innerStyle={{
                paddingVertical: 10,
                paddingHorizontal: 18,
                minHeight: 44,
              }}
              textStyle={{ fontSize: 14, fontWeight: "bold" }}
              icon={
                <Ionicons
                  name="calendar"
                  size={20}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
              }
            />
          </View>
        </View>
      </View>

      {/* OFFER MODAL */}
      <Modal visible={offerModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.offerModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("offers.makeOffer")}</Text>
              <TouchableOpacity onPress={() => setOfferModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {t("offers.makeOfferMessage")}
            </Text>

            <TextInput
              style={styles.offerInput}
              placeholder={t("offers.readyToNegotiate")}
              multiline
              numberOfLines={4}
              value={offerMessage}
              onChangeText={setOfferMessage}
            />

            <PrimaryButton
              title={t("offers.sendOffer")}
              onPress={handleMakeOffer}
              loading={offerLoading}
              style={{ marginTop: 20 }}
            />
          </View>
        </View>
      </Modal>

      {/* IMAGE MODAL */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modal}>
          <GestureDetector gesture={Gesture.Simultaneous(pan, pinch)}>
            <Animated.View style={[styles.modalImageContainer, animatedStyle]}>
              <Image
                source={{ uri: images[modalIndex] }}
                style={styles.modalImage}
                contentFit="contain"
              />
            </Animated.View>
          </GestureDetector>
        </View>
      </Modal>

      {/* VIDEO MODAL */}
      <Modal visible={videoVisible}>
        <WebView source={{ uri: videoUri || "" }} />
      </Modal>

      <MapPicker
        visible={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        initialLocation={mapRegion}
        readOnly
        onLocationSelect={() => {}}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  imageCard: {
    height: 320,
    width: "100%",
    position: "relative",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "50%",
  },
  topIcons: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
  },
  imageContent: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  location: {
    fontSize: 16,
    color: "#ddd",
    marginBottom: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#252B5C",
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: "#53587A",
    lineHeight: 22,
  },
  link: {
    color: Colors.primary,
    fontWeight: "bold",
    marginTop: 4,
    fontSize: 14,
  },
  ownerCard: {
    marginTop: 24,
    marginHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F5F4F8",
    padding: 16,
    borderRadius: 16,
  },
  ownerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  ownerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  ownerText: {
    justifyContent: "center",
  },
  ownerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#252B5C",
  },
  ownerRole: {
    fontSize: 12,
    color: "#A1A5C1",
    marginTop: 2,
  },
  ownerActions: {
    flexDirection: "row",
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    backgroundColor: Colors.primary,
    shadowColor: "rgba(255, 140, 0, 0.2)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  galleryWrapper: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
    overflow: "hidden",
    position: "relative",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  mapContainer: {
    height: 120,
    borderRadius: 25,
    overflow: "hidden",
    position: "relative",
    marginTop: 5,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  mapOverlayText: {
    fontSize: 12,
    color: "#333333",
    flex: 1,
  },
  editIcon: {
    marginLeft: 8,
  },
  footerFixed: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    paddingBottom: Platform.OS === "ios" ? 24 : 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 100,
  },
  footerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 28,
    paddingRight: 4,
    paddingTop: 16,
  },
  footerPriceBlock: {
    flex: 1.5,
    justifyContent: "center",
    alignItems: "flex-start",
    minWidth: 0,
  },
  footerDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#ECECEC",
    marginHorizontal: 10,
    borderRadius: 2,
    opacity: 0.7,
  },
  footerButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
    elevation: 0,
  },
  priceLabel: {
    fontSize: 12,
    color: "#A1A5C1",
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#252B5C",
    flexShrink: 1,
  },
  pricePeriod: {
    fontSize: 12,
    color: "#A1A5C1",
    fontWeight: "500",
    flexShrink: 0,
  },
  modal: { flex: 1, backgroundColor: "#000", justifyContent: "center" },
  modalImageContainer: { flex: 1, justifyContent: "center" },
  modalImage: { width: "100%", height: "100%" },
  footerButtons: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
  },
  offerButton: {
    width: 45,
    height: 45,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  offerModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    minHeight: 350,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  offerInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 15,
    padding: 15,
    height: 120,
    textAlignVertical: "top",
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: "#F8F8F8",
  },
});
