import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../contexts/AuthContext";
import { useInterest } from "../../contexts/InterestContext";
import { useTranslation } from "../../hooks/useTranslation";
import { ProfileStyles, GlobalStyles } from "../../components/styles";
import { ErrorPopup } from "../../components/Ui/ErrorPopup";
import {
  getMyListings,
  getPublicUserProperties,
  Property,
} from "../../services/propertyService";
import { getFullImageUrl } from "../../services/api";
import { getUserVehicles } from "../../services/vehicleService";
import { userService } from "../../services/userService";
import { getGuestBookings, BookingData } from "../../services/bookingService";

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id: profileUserId } = useLocalSearchParams<{ id: string }>();
  const { user: authUser, logout, refreshProfile } = useAuth();
  const { userRole, activeView } = useInterest();

  const [activeTab, setActiveTab] = useState<"items" | "reviews">("items");
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Use a local state for the user being displayed
  const [displayedUser, setDisplayedUser] = useState<any>(null);
  const [userListings, setUserListings] = useState<Property[]>([]);
  const [userVehicles, setUserVehicles] = useState<any[]>([]);
  const [userOffers, setUserOffers] = useState<BookingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingListings, setIsLoadingListings] = useState(false);

  // Determine if this is the authenticated user's own profile
  const isOwnProfile = !profileUserId || profileUserId === authUser?._id;

  // Determine if user is a seller - check multiple sources
  const isSeller = React.useMemo(() => {
    if (isOwnProfile) {
      // For own profile, check userRole from context and authUser
      return (
        userRole === "seller" ||
        authUser?.userType === "seller" ||
        (Array.isArray(authUser?.role) ? authUser.role.includes("seller") : authUser?.role === "seller")
      );
    } else {
      // For public profile, check displayedUser
      return (
        displayedUser?.userType === "seller" || displayedUser?.role === "seller"
      );
    }
  }, [isOwnProfile, userRole, authUser, displayedUser]);

  // Use useFocusEffect to refresh data whenever screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const loadProfileData = async () => {
        setIsLoading(true);
        console.log(
          "🔄 Loading profile data for:",
          profileUserId || "own profile",
        );

        try {
          if (isOwnProfile) {
            // Own profile: use auth user data
            await refreshProfile();
            setDisplayedUser(authUser);

            // Fetch own listings
            const isSeller =
              userRole === "seller" || authUser?.userType === "seller";
            if (isSeller) {
              setIsLoadingListings(true);
              // Fetch both property and vehicle listings so we can filter by activeView
              const [listings, vehiclesRes] = await Promise.all([
                getMyListings(),
                getUserVehicles().catch(() => ({ data: [] })),
              ]);
              setUserListings(listings);
              setUserVehicles((vehiclesRes as any).data || []);
              setIsLoadingListings(false);
            } else {
              // Fetch all buyer bookings; filter by activeView when rendering
              setIsLoadingListings(true);
              const bookings = await getGuestBookings(authUser!._id);
              setUserOffers(bookings || []);
              setIsLoadingListings(false);
            }
          } else {
            // Public profile: fetch user by ID
            const userResponse = await userService.getUserById(profileUserId!);
            if (userResponse.success && userResponse.data) {
              setDisplayedUser(userResponse.data);

              // Fetch public listings for this user
              setIsLoadingListings(true);
              const listings = await getPublicUserProperties(profileUserId!);
              setUserListings(listings);
              setIsLoadingListings(false);
            } else {
              setErrorMessage("User not found");
              setShowError(true);
            }
          }
        } catch (error) {
          console.error("Error loading profile data:", error);
          setErrorMessage("Failed to load profile");
          setShowError(true);
        } finally {
          setIsLoading(false);
        }
      };

      loadProfileData();
    }, [profileUserId, authUser, isOwnProfile, refreshProfile, userRole]),
  );

  // Sync displayedUser with authUser when it's the own profile
  React.useEffect(() => {
    if (isOwnProfile && authUser) {
      setDisplayedUser(authUser);
    }
  }, [authUser, isOwnProfile]);



  // Get appropriate label based on role and current activeView
  const getItemsLabel = () => {
    if (isSeller) {
      return activeView === "cars" ? t("profile.myCars") : t("profile.myListings");
    } else {
      return activeView === "cars" ? t("profile.carBookings") : t("profile.propertyBookings");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      console.log("Logout successful");
      router.replace("/");
    } catch (error: any) {
      console.error("Logout error:", error);
      setErrorMessage(
        error?.message ||
          (typeof error === "string" ? error : JSON.stringify(error)) ||
          "Unknown error",
      );
      setShowError(true);
      router.replace("/");
    }
  };

  const renderItemGrid = () => {
    if (isLoadingListings) {
      return (
        <View style={{ padding: 20, alignItems: "center" }}>
          <Text>{t("common.loading") || "Loading..."}</Text>
        </View>
      );
    }

    // Determine what to display based on activeView
    const displayItems = isSeller
      ? activeView === "cars"
        ? userVehicles
        : userListings
      : userOffers.filter((b) =>
          activeView === "cars"
            ? b.listingType === "vehicle"
            : b.listingType === "property",
        );

    if (displayItems.length === 0) {
      return (
        <View style={{ padding: 40, alignItems: "center" }}>
          <Ionicons
            name={activeView === "cars" ? "car-outline" : "home-outline"}
            size={48}
            color="#CCC"
          />
          <Text style={{ marginTop: 10, color: "#666" }}>
            {isSeller
              ? t("profile.noListings") || "No listings found"
              : t("bookings.noBookings") || "No bookings yet"}
          </Text>
        </View>
      );
    }

    return (
      <View style={ProfileStyles.propertyGrid}>
        {displayItems.map((item: any) => {
          const itemId = item._id || item.id;
          let placeholderImage;

          // For offers, the image comes from the nested property/vehicle
          let imageUri = "";
          if (isSeller) {
            // Vehicles store images under media.images; properties same structure
            imageUri = item.media?.images?.[0] || "";
            placeholderImage =
              activeView === "cars"
                ? require("../../assets/images/Cars/Bmx6.webp")
                : require("../../assets/images/ScreensImages/ProfileComplete.png");
          } else {
            // Buyer booking — image from nested property or vehicle
            const offerItem = item.property || item.vehicle;
            imageUri = offerItem?.media?.images?.[0] || "";
            placeholderImage = item.vehicle
              ? require("../../assets/images/Cars/Bmx6.webp")
              : require("../../assets/images/ScreensImages/ProfileComplete.png");
          }

          const fullImageUri = getFullImageUrl(imageUri);

          return (
            <TouchableOpacity
              key={itemId}
              style={ProfileStyles.propertyGridItem}
              onPress={() => {
                if (isOwnProfile && isSeller) {
                  router.push({
                    pathname: "/edit-property",
                    params: { id: itemId },
                  } as any);
                } else if (!isSeller) {
                  // Buyer: navigate to offer details or item info
                  const targetId =
                    item.property?._id || item.vehicle?._id || itemId;
                  router.push({
                    pathname: "/property_info",
                    params: { id: targetId },
                  } as any);
                } else {
                  // Public view: navigate to property_info
                  router.push({
                    pathname: "/property_info",
                    params: { id: itemId },
                  } as any);
                }
              }}
            >
              <Image
                source={fullImageUri ? { uri: fullImageUri } : placeholderImage}
                style={ProfileStyles.propertyGridImage}
                contentFit="cover"
              />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // Render main profile layout (used for both sellers and buyers)
  const renderMainProfile = () => isLoading ? null : (
    <View style={GlobalStyles.container}>
      <ErrorPopup
        message={errorMessage}
        visible={showError}
        onHide={() => setShowError(false)}
      />
      {/* Header with background image */}
      <View style={ProfileStyles.headerContainer}>
        <Image
          source={require("../../assets/images/ScreensImages/ProfileComplete.png")}
          style={ProfileStyles.headerBackgroundImage}
          contentFit="cover"
        />
        {/* Header navigation */}
        <View style={ProfileStyles.headerTop}>
          <TouchableOpacity
            style={ProfileStyles.iconButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {isOwnProfile && (
            <TouchableOpacity
              style={ProfileStyles.iconButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Profile image positioned at bottom of header */}
        <View style={ProfileStyles.profileImageWrapper}>
          <View style={ProfileStyles.profileImageContainer}>
            {displayedUser?.avatar || displayedUser?.profileImage ? (
              <Image
                key={displayedUser?.avatar || displayedUser?.profileImage}
                source={{
                  uri: getFullImageUrl(displayedUser?.avatar || displayedUser?.profileImage),
                }}
                style={ProfileStyles.profileImage}
                contentFit="cover"
                cachePolicy="none"
              />
            ) : (
              <Image
                source={require("../../assets/sam b.png")}
                style={ProfileStyles.profileImage}
                contentFit="cover"
                cachePolicy="none"
              />
            )}
          </View>
        </View>
      </View>

      <ScrollView
        style={ProfileStyles.profileContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Info Section */}
        <View style={ProfileStyles.profileSection}>
          <Text style={ProfileStyles.profileName}>
            {displayedUser?.firstName && displayedUser?.lastName
              ? `${displayedUser.firstName} ${displayedUser.lastName}`
              : displayedUser?.name ||
                displayedUser?.email?.split("@")[0] ||
                t("profile.defaultUserName")}
          </Text>
          <View style={ProfileStyles.locationContainer}>
            <Ionicons name="location" size={16} color="#666666" />
            <Text style={ProfileStyles.locationText}>
              {displayedUser?.location?.city ||
                displayedUser?.city ||
                "Tunisia"}
              {displayedUser?.location?.country
                ? `, ${displayedUser?.location?.country}`
                : ""}
            </Text>
          </View>

          {/* Stats Section */}
          <View style={ProfileStyles.statsContainer}>
            {isSeller && (
              <>
                <View style={ProfileStyles.statItem}>
                  <Text style={ProfileStyles.statNumber}>
                    {displayedUser?.rating?.average || "0"}
                  </Text>
                  <Text style={ProfileStyles.statLabel}>
                    {t("profile.rating")}
                  </Text>
                </View>
                <View style={ProfileStyles.statItem}>
                  <Text style={ProfileStyles.statNumber}>
                    {activeView === "cars"
                      ? userVehicles.length
                      : userListings.length}
                  </Text>
                  <Text style={ProfileStyles.statLabel}>
                    {activeView === "cars" ? t("explore.switchCars") : t("explore.switchProperties")}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Action Buttons - Only show for own profile */}
          {isOwnProfile && (
            <View style={ProfileStyles.actionButtons}>
              {isSeller ? (
                // Seller: Edit Profile + Add Item
                <>
                  <TouchableOpacity
                    style={ProfileStyles.outlineButton}
                    onPress={() => router.push("/edit-info")}
                  >
                    <Text style={ProfileStyles.outlineButtonText}>
                      {t("profile.editProfile")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={ProfileStyles.filledButton}
                    onPress={() => {
                      // Route based on current activeView (toggle is visible for all users)
                      if (activeView === "cars") {
                        router.push("/add-car");
                      } else {
                        router.push("/add-house");
                      }
                    }}
                  >
                    <Text style={ProfileStyles.filledButtonText}>{t("profile.addItem")}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                // Buyer: Only Edit Profile button
                <TouchableOpacity
                  style={[ProfileStyles.filledButton, { flex: 1 }]}
                  onPress={() => router.push("/edit-info")}
                >
                  <Text style={ProfileStyles.filledButtonText}>
                    {t("profile.editProfile")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Tabs Section */}
        <View style={ProfileStyles.tabsContainer}>
          <TouchableOpacity
            style={[
              ProfileStyles.tab,
              activeTab === "items" && ProfileStyles.activeTab,
            ]}
            onPress={() => setActiveTab("items")}
          >
            <Text
              style={[
                ProfileStyles.tabText,
                activeTab === "items" && ProfileStyles.activeTabText,
              ]}
            >
              {getItemsLabel()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              ProfileStyles.tab,
              activeTab === "reviews" && ProfileStyles.activeTab,
            ]}
            onPress={() => setActiveTab("reviews")}
          >
              <Text
              style={[
                ProfileStyles.tabText,
                activeTab === "reviews" && ProfileStyles.activeTabText,
              ]}
            >
              {t("profile.reviews")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on active tab */}
        {activeTab === "items" ? (
          renderItemGrid()
        ) : (
          <View style={ProfileStyles.reviewsContainer}>
            <Text style={ProfileStyles.reviewsText}>{t("profile.noReviewsYet")}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  // Both sellers and buyers use the same main profile layout now
  return renderMainProfile();
}
