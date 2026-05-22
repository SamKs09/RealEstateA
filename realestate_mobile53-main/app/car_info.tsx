import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
  Linking,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";

import Ionicons from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { vehicleService } from "../services";
import { chatService } from "../services/chatService";
import {
  recordSave,
  recordView,
  removeSave,
} from "../services/analyticsService";
import { userService } from "../services/userService";
import { useTranslation } from "../hooks/useTranslation";
import { useAuth } from "../contexts/AuthContext";
import { usePopup } from "../contexts/PopupContext";
import i18n from "../services/i18n";
import PrimaryButton from "../components/Ui/PrimaryButton";
import { Colors } from "../components/styles/GlobalStyles";
import ScreenWrapper from "../components/Ui/ScreenWrapper";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function CarInfo() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { showError, showInfo } = usePopup();
  const [locale, setLocale] = React.useState(i18n.locale);

  const vehicleId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalIndex, setModalIndex] = useState<number>(0);
  const [chatLoading, setChatLoading] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const viewedListingRef = useRef<string | null>(null);

  // Listen for language changes
  React.useEffect(() => {
    const checkLocale = setInterval(() => {
      if (i18n.locale !== locale) {
        setLocale(i18n.locale);
      }
    }, 100);

    return () => clearInterval(checkLocale);
  }, [locale]);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const imageTranslateX = useSharedValue(0);
  const savedImageTranslateX = useSharedValue(0);

  const images = vehicle?.media?.images || [];

  const goToNext = useCallback(() => {
    if (modalIndex < images.length - 1) {
      setModalIndex(modalIndex + 1);
      imageTranslateX.value = withTiming(0);
    } else {
      imageTranslateX.value = withSpring(0);
    }
  }, [modalIndex, images.length, imageTranslateX]);

  const goToPrev = useCallback(() => {
    if (modalIndex > 0) {
      setModalIndex(modalIndex - 1);
      imageTranslateX.value = withTiming(0);
    } else {
      imageTranslateX.value = withSpring(0);
    }
  }, [modalIndex, imageTranslateX]);

  const pan = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      savedImageTranslateX.value = imageTranslateX.value;
    })
    .onUpdate((event) => {
      if (scale.value > 1.1) {
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      } else {
        imageTranslateX.value = savedImageTranslateX.value + event.translationX;
      }
    })
    .onEnd((event) => {
      if (scale.value > 1.1) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      } else {
        const threshold = screenWidth * 0.25;
        if (event.velocityX > 600 || event.translationX > threshold) {
          runOnJS(goToPrev)();
        } else if (event.velocityX < -600 || event.translationX < -threshold) {
          runOnJS(goToNext)();
        } else {
          imageTranslateX.value = withSpring(0);
        }
      }
    });

  const pinch = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withTiming(1);
      } else if (scale.value > 2) {
        scale.value = withTiming(2);
      }
    });

  const composedGesture = Gesture.Simultaneous(pan, pinch);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: imageTranslateX.value },
        { scale: scale.value },
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  const openImageModal = useCallback(
    (imgIndex: number) => {
      setModalIndex(imgIndex);
      setModalVisible(true);
      scale.value = withTiming(1);
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
      imageTranslateX.value = withTiming(0);
    },
    [scale, translateX, translateY, imageTranslateX],
  );

  const closeImageModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  useEffect(() => {
    if (!vehicleId) return;

    vehicleService
      .getVehicle(vehicleId)
      .then((response) => setVehicle(response.data))
      .finally(() => setLoading(false));
  }, [vehicleId]);

  useEffect(() => {
    if (!vehicle?._id || viewedListingRef.current === vehicle._id) {
      return;
    }

    viewedListingRef.current = vehicle._id;
    recordView(vehicle._id, "vehicle");
  }, [vehicle?._id]);

  useEffect(() => {
    if (!vehicleId || !user?._id) {
      setIsSaved(false);
      return;
    }

    let isActive = true;

    userService
      .getFavoriteListingIds("vehicle")
      .then((favoriteIds) => {
        if (isActive) {
          setIsSaved(favoriteIds.includes(vehicleId as string));
        }
      })
      .catch((error) => {
        console.warn("Failed to load vehicle favorite state:", error);
      });

    return () => {
      isActive = false;
    };
  }, [vehicleId, user?._id]);

  const ownerId = vehicle?.owner?._id || vehicle?.owner?.id || vehicle?.owner;
  const isOwnerViewing = !!user?._id && !!ownerId && user._id === ownerId;

  const handleCallOwner = () => {
    if (isOwnerViewing) {
      return;
    }

    if (vehicle?.owner?.phone) {
      Linking.openURL(`tel:${vehicle.owner.phone}`);
    } else {
      showInfo(t("carInfo.infoNoPhone"), "Info");
    }
  };

  const handleChatOwner = async () => {
    if (isOwnerViewing) {
      return;
    }

    if (!user || !user._id) {
      showError("You must be logged in to start a chat.", "Error");
      return;
    }
    if (!vehicle?.owner) return;

    if (!ownerId) {
      showError(t("carInfo.errorOwnerMissing"), t("error"));
      return;
    }

    try {
      setChatLoading(true);
      const thread = await chatService.getOrCreateThread(
        ownerId,
        vehicle.owner.name || vehicle.owner.firstName || "Owner",
        {
          listingId: vehicleId as string,
          listingType: "vehicle",
        }
      );

      if (thread && thread._id) {
        router.push({
          pathname: "/chat/[id]",
          params: {
            id: thread._id,
            name: vehicle.owner.name || vehicle.owner.firstName || "Owner",
            avatar:
              vehicle.owner.profileImage ||
              vehicle.owner.avatar ||
              `https://ui-avatars.com/api/?name=Owner`,
          },
        });
      } else {
        showInfo(
          t("carInfo.chatUnavailableMessage"),
          t("carInfo.chatUnavailable"),
        );
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      showError(t("carInfo.errorChatFailed"), t("error"));
    } finally {
      setChatLoading(false);
    }
  };

  const handleToggleSave = async () => {
    if (!user?._id) {
      showError("You must be logged in to save this vehicle.", "Error");
      return;
    }

    const listingId = vehicleId as string;
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    setBookmarkLoading(true);

    try {
      if (nextSaved) {
        await userService.addFavoriteListing(listingId, "vehicle");
        void recordSave(listingId, "vehicle").catch((error) => {
          console.warn("Failed to record vehicle save analytics:", error);
        });
      } else {
        await userService.removeFavoriteListing(listingId, "vehicle");
        void removeSave(listingId, "vehicle").catch((error) => {
          console.warn("Failed to remove vehicle save analytics:", error);
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
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <ScreenWrapper
      backgroundColor={Colors.background}
      edges={["top", "bottom"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* IMAGE CARD */}
        <View style={styles.imageCard}>
          <Image
            source={
              images[0]
                ? { uri: images[0] }
                : require("../assets/images/ScreensImages/House1.jpg")
            }
            style={styles.mainImage}
            contentFit="cover"
            transition={500}
            cachePolicy="none"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.gradientOverlay}
          />

          <View style={styles.topIcons}>
            <BlurView
              intensity={50}
              tint="dark"
              style={styles.blurIconContainer}
            >
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.back()}
              >
                <Ionicons name="chevron-back" size={22} color="#fff" />
              </TouchableOpacity>
            </BlurView>

            <BlurView
              intensity={50}
              tint="dark"
              style={styles.blurIconContainer}
            >
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
            </BlurView>
          </View>

          <View style={styles.imageContent}>
            <Text style={styles.title}>{vehicle.title}</Text>
            <Text style={styles.location}>
              {vehicle.location?.city || ""}
              {vehicle.location?.city && vehicle.location?.country ? ", " : ""}
              {vehicle.location?.country || ""}
            </Text>

            {/* Quick Stats */}
            <View style={styles.quickStatsRow}>
              {/* Power/Engine */}
              <View style={styles.statBox}>
                <Ionicons
                  name="flash"
                  size={16}
                  color="#fff"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.statText}>
                  {vehicle.vehicleDetails?.engineCapacity
                    ? `${vehicle.vehicleDetails.engineCapacity} KW (${Math.round(vehicle.vehicleDetails.engineCapacity * 1.34)})`
                    : "85 KW (116)"}
                </Text>
              </View>

              {/* Charging/Fuel Type */}
              {vehicle.vehicleDetails?.fuelType === "electric" && (
                <View style={styles.statBox}>
                  <Ionicons name="battery-charging" size={16} color="#fff" />
                </View>
              )}

              {/* Mileage */}
              <View style={styles.statBox}>
                <Ionicons
                  name="speedometer"
                  size={16}
                  color="#fff"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.statText}>
                  {vehicle.vehicleDetails?.mileage
                    ? `${vehicle.vehicleDetails.mileage.toLocaleString()} km`
                    : "300,000 km"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* DESCRIPTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("carInfo.description")}</Text>
          <Text
            style={styles.descriptionText}
            numberOfLines={descriptionExpanded ? undefined : 3}
          >
            {vehicle.description}
          </Text>
          <TouchableOpacity
            onPress={() => setDescriptionExpanded(!descriptionExpanded)}
          >
            <Text style={styles.showMoreText}>
              {descriptionExpanded
                ? t("carInfo.showLess")
                : t("carInfo.showMore")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* OVERVIEW */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("carInfo.overview")}</Text>
          <View style={styles.specsGrid}>
            {/* Make & Model */}
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Make & Model</Text>
              <Text style={styles.specValue}>
                {vehicle.vehicleDetails?.make} {vehicle.vehicleDetails?.model}
              </Text>
            </View>

            {/* Year */}
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Year</Text>
              <Text style={styles.specValue}>
                {vehicle.vehicleDetails?.year || "N/A"}
              </Text>
            </View>

            {/* Color */}
            {vehicle.vehicleDetails?.color && (
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Color</Text>
                <Text style={styles.specValue}>
                  {vehicle.vehicleDetails.color.charAt(0).toUpperCase() +
                    vehicle.vehicleDetails.color.slice(1)}
                </Text>
              </View>
            )}

            {/* Condition */}
            {vehicle.vehicleDetails?.condition && (
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Condition</Text>
                <Text style={styles.specValue}>
                  {vehicle.vehicleDetails.condition.charAt(0).toUpperCase() +
                    vehicle.vehicleDetails.condition.slice(1)}
                </Text>
              </View>
            )}

            {/* Powertrain */}
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>{t("carInfo.powertrain")}</Text>
              <Text style={styles.specValue}>
                {vehicle.vehicleDetails?.fuelType?.charAt(0).toUpperCase() +
                  vehicle.vehicleDetails?.fuelType?.slice(1) || "N/A"}
              </Text>
            </View>

            {/* Transmission */}
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>{t("carInfo.transmission")}</Text>
              <Text style={styles.specValue}>
                {vehicle.vehicleDetails?.transmission === "automatic"
                  ? t("carInfo.speedAutomatic")
                  : vehicle.vehicleDetails?.transmission
                      ?.charAt(0)
                      .toUpperCase() +
                    vehicle.vehicleDetails?.transmission?.slice(1)}
              </Text>
            </View>

            {/* Mileage */}
            {vehicle.vehicleDetails?.mileage && (
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Mileage</Text>
                <Text style={styles.specValue}>
                  {vehicle.vehicleDetails.mileage.toLocaleString()} km
                </Text>
              </View>
            )}

            {/* Engine Capacity / Power */}
            {vehicle.vehicleDetails?.engineCapacity && (
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>{t("carInfo.power")}</Text>
                <Text style={styles.specValue}>
                  {vehicle.vehicleDetails.engineCapacity} kW (
                  {Math.round(vehicle.vehicleDetails.engineCapacity * 1.34)} hp)
                </Text>
              </View>
            )}

            {/* Seating Capacity */}
            {vehicle.vehicleDetails?.seatingCapacity && (
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Seating</Text>
                <Text style={styles.specValue}>
                  {vehicle.vehicleDetails.seatingCapacity} seats
                </Text>
              </View>
            )}

            {/* Vehicle Type */}
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Type</Text>
              <Text style={styles.specValue}>
                {vehicle.type?.charAt(0).toUpperCase() + vehicle.type?.slice(1)}
              </Text>
            </View>

            {/* Listing Type */}
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Available For</Text>
              <Text style={styles.specValue}>
                {vehicle.listingType === "rent" ? "Rent" : "Sale"}
              </Text>
            </View>

            {/* Registration */}
            {vehicle.vehicleDetails?.registrationNumber && (
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Registration</Text>
                <Text style={styles.specValue}>
                  {vehicle.vehicleDetails.registrationNumber}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* FEATURES */}
        {vehicle.vehicleDetails?.features &&
          vehicle.vehicleDetails.features.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Features</Text>
              <View style={styles.featuresContainer}>
                {vehicle.vehicleDetails.features.map(
                  (feature: string, index: number) => (
                    <View key={index} style={styles.featureItem}>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={Colors.accent}
                      />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ),
                )}
              </View>
            </View>
          )}

        {/* PRICING & LOCATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsContainer}>
            {/* Pricing */}
            {vehicle.pricing?.rentPrice && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rent Price:</Text>
                <Text style={styles.detailValue}>
                  {vehicle.pricing.rentPrice.toLocaleString()}{" "}
                  {vehicle.pricing.currency || "TND"}/
                  {vehicle.pricing.rentPeriod || "day"}
                </Text>
              </View>
            )}
            {vehicle.pricing?.salePrice && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Sale Price:</Text>
                <Text style={styles.detailValue}>
                  {vehicle.pricing.salePrice.toLocaleString()}{" "}
                  {vehicle.pricing.currency || "TND"}
                </Text>
              </View>
            )}
            {vehicle.pricing?.deposit && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Deposit:</Text>
                <Text style={styles.detailValue}>
                  {vehicle.pricing.deposit.toLocaleString()}{" "}
                  {vehicle.pricing.currency || "TND"}
                </Text>
              </View>
            )}
            {vehicle.pricing?.negotiable !== undefined && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Negotiable:</Text>
                <Text style={styles.detailValue}>
                  {vehicle.pricing.negotiable ? "Yes" : "No"}
                </Text>
              </View>
            )}

            {/* Location */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>
                {vehicle.location?.city}
                {vehicle.location?.state
                  ? `, ${vehicle.location.state}`
                  : ""}, {vehicle.location?.country}
              </Text>
            </View>

            {vehicle.location?.address && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address:</Text>
                <Text style={styles.detailValue}>
                  {vehicle.location.address}
                </Text>
              </View>
            )}

            {/* Status */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: vehicle.status === "active" ? "#34A853" : "#888" },
                ]}
              >
                {vehicle.status?.charAt(0).toUpperCase() +
                  vehicle.status?.slice(1)}
              </Text>
            </View>

            {/* Views */}
            {vehicle.views !== undefined && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Views:</Text>
                <Text style={styles.detailValue}>{vehicle.views}</Text>
              </View>
            )}

            {/* Posted Date */}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Posted:</Text>
              <Text style={styles.detailValue}>
                {new Date(vehicle.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* OWNER */}
        <TouchableOpacity
          style={styles.ownerSection}
          onPress={() => {
            if (isOwnerViewing) {
              return;
            }

            const sellerId = vehicle?.owner?._id || vehicle?.owner?.id;
            if (sellerId) {
              router.push(`/seller-profile/${sellerId}`);
            }
          }}
          activeOpacity={isOwnerViewing ? 1 : 0.7}
        >
          <View style={styles.ownerInfo}>
            <Image
              source={
                vehicle.owner?.avatar || vehicle.owner?.profileImage
                  ? { uri: vehicle.owner.avatar || vehicle.owner.profileImage }
                  : require("../assets/images/ScreensImages/ProfileComplete.png")
              }
              style={styles.ownerAvatar}
              contentFit="cover"
            />
            <View style={styles.ownerText}>
              <Text style={styles.ownerName}>
                {vehicle.owner?.name || vehicle.owner?.firstName || "Owner"}
              </Text>
              <Text style={styles.ownerRole}>{t("carInfo.owner")}</Text>
            </View>
          </View>
          {!isOwnerViewing && (
            <View style={styles.ownerActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#FF8C00" }]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleCallOwner();
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Call vehicle owner"
              >
                <Ionicons name="call" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#FF8C00" }]}
                onPress={(e) => {
                  e.stopPropagation();
                  handleChatOwner();
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Message vehicle owner"
              >
                <Ionicons name="chatbubble" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>

        {/* GALLERY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("carInfo.gallery")}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
          >
            {images.slice(0, 5).map((img: string, index: number) => (
              <TouchableOpacity
                key={index}
                style={styles.galleryWrapper}
                onPress={() => openImageModal(index)}
              >
                <Image
                  source={{ uri: img }}
                  style={styles.galleryImage}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="none"
                />
                {index === 4 && images.length > 5 && (
                  <View style={styles.overlayCount}>
                    <Text style={styles.countText}>+{images.length - 5}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* BOTTOM SPACER */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FOOTER - Price & Rent/Buy */}
      <View style={styles.footer}>
        <View style={styles.footerPriceBlock}>
          <Text style={styles.priceLabel}>{t("carInfo.price")}</Text>
          <Text style={styles.priceValue} numberOfLines={1} adjustsFontSizeToFit>
            {vehicle.pricing?.rentPrice
              ? `${vehicle.pricing.rentPrice.toLocaleString()} ${vehicle.pricing.currency || "DT"}`
              : vehicle.pricing?.salePrice
                ? `${vehicle.pricing.salePrice.toLocaleString()} ${vehicle.pricing.currency || "DT"}`
                : "N/A"}
          </Text>
        </View>
        <PrimaryButton
          title={
            vehicle.listingType === "sale"
              ? t("carInfo.buyNow")
              : t("carInfo.rentNow")
          }
          onPress={() =>
            router.push({
              pathname: "/booking/booking-details",
              params: {
                listingId: vehicle._id,
                analyticsListingType: "vehicle",
                propertyName:
                  vehicle.title ||
                  `${vehicle.vehicleDetails?.make} ${vehicle.vehicleDetails?.model}`,
                location: vehicle.location?.city || "",
                pricePerNight: (
                  vehicle.pricing?.rentPrice ||
                  vehicle.pricing?.salePrice ||
                  0
                ).toString(),
                propertyImage: vehicle.media?.images?.[0] || "",
                listingType: vehicle.listingType,
              },
            })
          }
          style={{ marginBottom: 0 }}
          innerStyle={{ paddingVertical: 10, paddingHorizontal: 22, minHeight: 44 }}
          textStyle={{ fontSize: 14, fontWeight: "bold" }}
        />
      </View>

      {/* FULL SCREEN IMAGE MODAL */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={closeImageModal}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          <GestureDetector gesture={composedGesture}>
            <Animated.View
              style={[styles.modalImageContainer, containerAnimatedStyle]}
            >
              <Image
                source={{ uri: images[modalIndex] }}
                style={styles.modalImage}
                contentFit="contain"
              />
            </Animated.View>
          </GestureDetector>
        </View>
      </Modal>

      {chatLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageCard: {
    height: screenHeight * 0.5,
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
  blurIconContainer: {
    borderRadius: 12,
    overflow: "hidden",
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  imageContent: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: "Raleway-Bold",
    color: "#fff",
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  location: {
    fontSize: 16,
    fontFamily: "Raleway-Regular",
    color: "#ddd",
    marginBottom: 12,
  },
  quickStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backdropFilter: "blur(10px)",
  },
  statText: {
    fontSize: 12,
    fontFamily: "Raleway-SemiBold",
    color: "#fff",
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Raleway-Bold",
    color: "#252B5C",
    marginBottom: 16,
  },
  specsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  specItem: {
    width: "48%",
    backgroundColor: "#F8F8F8",
    padding: 16,
    borderRadius: 12,
  },
  specLabel: {
    fontSize: 12,
    fontFamily: "Raleway-Regular",
    color: "#A1A5C1",
    marginBottom: 8,
  },
  specValue: {
    fontSize: 14,
    fontFamily: "Raleway-SemiBold",
    color: "#252B5C",
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: "Raleway-Regular",
    color: "#53587A",
    lineHeight: 22,
  },
  showMoreText: {
    color: Colors.primary,
    fontFamily: "Raleway-Bold",
    marginTop: 4,
    fontSize: 14,
  },
  ownerSection: {
    marginTop: 24,
    marginHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 0,
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
    fontFamily: "Raleway-Bold",
    color: "#252B5C",
  },
  ownerRole: {
    fontSize: 12,
    fontFamily: "Raleway-Regular",
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
    shadowColor: "rgba(255, 140, 0, 0.2)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  galleryWrapper: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 12,
    overflow: "hidden",
    position: "relative",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  overlayCount: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  countText: {
    color: "#fff",
    fontFamily: "Raleway-Bold",
    fontSize: 16,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === "ios" ? 100 : 80,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 24,
    paddingRight: 4,
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  footerPriceBlock: {
    flex: 1.5,
    justifyContent: "center",
    alignItems: "flex-start",
    minWidth: 0,
  },
  priceLabel: {
    fontSize: 10,
    fontFamily: "Raleway-Regular",
    color: "#A1A5C1",
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 18,
    fontFamily: "Raleway-Bold",
    color: "#252B5C",
    flexShrink: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  modalImageContainer: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  featuresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 13,
    fontFamily: "Raleway-Medium",
    color: "#252B5C",
    marginLeft: 6,
  },
  detailsContainer: {
    backgroundColor: "#F8F8F8",
    borderRadius: 16,
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: "Raleway-Medium",
    color: "#7D7F88",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: "Raleway-SemiBold",
    color: "#252B5C",
    flex: 1,
    textAlign: "right",
  },
});
