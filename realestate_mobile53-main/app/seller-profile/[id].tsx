import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "../../hooks/useTranslation";
import { useAuth } from "../../contexts/AuthContext";
import { useInterest } from "../../contexts/InterestContext";
import { usePopup } from "../../contexts/PopupContext";
import { PrimaryButton, ScreenWrapper } from "../../components/Ui";
import { Colors } from "../../components/styles/GlobalStyles";
import sellerService, {
  SellerProfile,
  SellerListing,
  Review,
  ReviewableItem,
} from "../../services/sellerService";
import { chatService } from "../../services/chatService";
import ReviewCard from "../../components/ReviewCard";

const { width: screenWidth } = Dimensions.get("window");

export default function SellerProfileScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { showError, showSuccess } = usePopup();
  const { activeView } = useInterest();

  const sellerId = params.id as string;

  // State management
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"listings" | "reviews">(
    "listings",
  );
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewableItems, setReviewableItems] = useState<ReviewableItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ReviewableItem | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // Cache for 5 minutes
  const [lastFetch, setLastFetch] = useState<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    if (!sellerId) return;
    loadSellerProfile();
  }, [sellerId]);

  const loadSellerProfile = async (forceRefresh: boolean = false) => {
    try {
      const now = Date.now();
      if (!forceRefresh && profile && now - lastFetch < CACHE_DURATION) {
        return; // Use cached data
      }

      setLoading(true);

      // Parallel loading for better performance
      const [profileData, listingsData, reviewsData, followStatus] =
        await Promise.all([
          sellerService.getSellerProfile(sellerId).catch((err) => {
            console.error("Profile fetch error:", err);
            throw err;
          }),
          sellerService.getSellerListings(sellerId, 1, 20).catch(() => ({
            listings: [],
            totalListings: 0,
            totalPages: 0,
            currentPage: 1,
            hasNext: false,
            hasPrev: false,
          })),
          sellerService.getSellerReviews(sellerId, 1, 20).catch(() => ({
            reviews: [],
            pagination: {
              totalReviews: 0,
              totalPages: 0,
              currentPage: 1,
              hasNext: false,
              hasPrev: false,
            },
          })),
          user
            ? sellerService
                .getFollowStatus(sellerId)
                .catch(() => ({ isFollowing: false, followerCount: 0 }))
            : Promise.resolve({ isFollowing: false, followerCount: 0 }),
        ]);

      setProfile(profileData);
      setListings(listingsData.listings || []);
      setReviews(reviewsData.reviews || []);
      setIsFollowing(followStatus.isFollowing);
      setLastFetch(now);
    } catch (error: any) {
      showError(error.message || "Failed to load seller profile");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSellerProfile(true);
  }, []);

  const handleFollow = async () => {
    if (!user) {
      showError("Please log in to follow sellers");
      return;
    }

    try {
      if (isFollowing) {
        const result = await sellerService.unfollowUser(sellerId);
        setIsFollowing(false);
        if (profile) {
          setProfile({
            ...profile,
            statistics: {
              ...profile.statistics,
              followers: result.followerCount,
            },
          });
        }
        showSuccess("Unfollowed successfully");
      } else {
        const result = await sellerService.followUser(sellerId);
        setIsFollowing(true);
        if (profile) {
          setProfile({
            ...profile,
            statistics: {
              ...profile.statistics,
              followers: result.followerCount,
            },
          });
        }
        showSuccess("Following successfully");
      }
    } catch (error: any) {
      showError(error.message || "Failed to update follow status");
    }
  };

  const handleMessage = async () => {
    if (!user) {
      showError("Please log in to send messages");
      return;
    }

    if (!profile) return;

    try {
      setChatLoading(true);
      const thread = await chatService.getOrCreateThread(
        sellerId,
        profile.name,
      );

      if (!thread) {
        showError("Failed to create chat thread");
        return;
      }

      router.push(`/chat/${thread._id}`);
    } catch (error: any) {
      showError(error.message || "Failed to start conversation");
    } finally {
      setChatLoading(false);
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

  const handleListingPress = (listing: SellerListing) => {
    if (listing.type === "property") {
      router.push({ pathname: "/property_info", params: { id: listing.id } });
    } else {
      router.push({ pathname: "/car_info", params: { id: listing.id } });
    }
  };

  const handleReviewReply = async (reviewId: string, replyText: string) => {
    try {
      await sellerService.replyToReview(reviewId, replyText);
      showSuccess("Reply posted");
      loadSellerProfile(true);
    } catch (error: any) {
      showError(error.message || "Failed to post reply");
    }
  };

  const handleReviewReport = async (reviewId: string, reason: string) => {
    try {
      await sellerService.reportReview(reviewId, reason);
      showSuccess("Review reported");
    } catch (error: any) {
      showError(error.message || "Failed to report review");
    }
  };

  const handleReviewEdit = async (reviewId: string, rating: number, comment: string) => {
    try {
      await sellerService.updateReview(reviewId, rating, comment);
      showSuccess("Review updated");
      loadSellerProfile(true);
    } catch (error: any) {
      showError(error.message || "Failed to update review");
    }
  };

  const handleReviewDelete = async (reviewId: string) => {
    try {
      await sellerService.deleteReview(reviewId);
      showSuccess("Review deleted");
      loadSellerProfile(true);
    } catch (error: any) {
      showError(error.message || "Failed to delete review");
    }
  };

  const handleOpenReviewModal = async () => {
    if (!user) {
      showError("Please log in to submit reviews");
      return;
    }

    try {
      const items = await sellerService.getReviewableItems(sellerId);
      if (items.length === 0) {
        showError("No active listings available to review");
        return;
      }
      setReviewableItems(items);
      setReviewModalVisible(true);
    } catch (error: any) {
      showError(error.message || "Failed to load reviewable items");
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedItem) {
      showError("Please select an item to review");
      return;
    }

    if (rating === 0) {
      showError("Please select a rating");
      return;
    }

    if (comment.trim().length < 10) {
      showError("Review comment must be at least 10 characters");
      return;
    }

    if (comment.trim().length > 500) {
      showError("Review comment cannot exceed 500 characters");
      return;
    }

    try {
      setSubmittingReview(true);
      await sellerService.createReview({
        sellerId,
        itemId: selectedItem.id,
        itemType: selectedItem.type === "property" ? "Property" : "Vehicle",
        rating,
        comment: comment.trim(),
      });

      showSuccess("Review submitted successfully");
      setReviewModalVisible(false);
      setSelectedItem(null);
      setRating(0);
      setComment("");

      // Refresh reviews
      loadSellerProfile(true);
    } catch (error: any) {
      showError(error.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (
    rating: number,
    size: number = 16,
    color: string = "#FFD700",
  ) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={
              star <= rating
                ? "star"
                : star - 0.5 <= rating
                  ? "star-half"
                  : "star-outline"
            }
            size={size}
            color={color}
          />
        ))}
      </View>
    );
  };

  const renderRatingSelector = () => {
    return (
      <View style={styles.ratingSelector}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={40}
              color="#FFD700"
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderHeader = () => {
    if (!profile) return null;

    return (
      <View style={styles.headerContainer}>
        {/* Cover Photo */}
        <Image
          source={require("../../assets/images/ScreensImages/ProfileComplete.png")}
          style={styles.headerBackgroundImage}
          contentFit="cover"
        />

        {/* Header navigation */}
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Profile image positioned at bottom of header */}
        <View style={styles.profileImageWrapper}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{
                uri: profile.avatar || "https://via.placeholder.com/150",
              }}
              style={styles.profileImage}
              contentFit="cover"
            />
          </View>
        </View>
      </View>
    );
  };

  const renderTabBar = () => {
    return (
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "listings" && styles.activeTab]}
          onPress={() => setActiveTab("listings")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "listings" && styles.activeTabText,
            ]}
          >
            {t("profile.available")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "reviews" && styles.activeTab]}
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
    );
  };

  const renderListingItem = ({ item }: { item: SellerListing }) => {
    return (
      <TouchableOpacity
        style={styles.listingCard}
        onPress={() => handleListingPress(item)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.image || "https://via.placeholder.com/150" }}
          style={styles.listingImage}
          contentFit="cover"
        />
        <View style={styles.listingInfo}>
          <Text style={styles.listingTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.listingType}>
            {item.type === "property" ? t("property") : t("vehicle")} •{" "}
            {item.listingType === "sale" ? t("for_sale") : t("for_rent")}
          </Text>
          <Text style={styles.listingPrice}>
            {item.pricing.currency} {item.pricing.amount.toLocaleString()}
          </Text>
          {item.type === "property" && item.details.bedrooms && (
            <View style={styles.listingDetails}>
              <Ionicons name="bed-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{item.details.bedrooms}</Text>
              <Ionicons
                name="water-outline"
                size={14}
                color="#666"
                style={{ marginLeft: 8 }}
              />
              <Text style={styles.detailText}>{item.details.bathrooms}</Text>
              {item.details.area && (
                <>
                  <Ionicons
                    name="resize-outline"
                    size={14}
                    color="#666"
                    style={{ marginLeft: 8 }}
                  />
                  <Text style={styles.detailText}>{item.details.area}m²</Text>
                </>
              )}
            </View>
          )}
          {item.type === "vehicle" && item.details.make && (
            <Text style={styles.vehicleDetails}>
              {item.details.year} {item.details.make} {item.details.model}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderReviewItem = ({ item }: { item: Review }) => (
    <ReviewCard
      review={item}
      currentUserId={user?._id}
      sellerId={sellerId}
      onReply={handleReviewReply}
      onReport={handleReviewReport}
      onEdit={handleReviewEdit}
      onDelete={handleReviewDelete}
    />
  );

  const renderReviewModal = () => {
    return (
      <Modal
        visible={reviewModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("write_review")}</Text>
              <TouchableOpacity onPress={() => setReviewModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Select Item */}
              <Text style={styles.modalLabel}>
                {t("select_item_to_review")}
              </Text>
              <View style={styles.itemSelector}>
                {reviewableItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.itemOption,
                      selectedItem?.id === item.id && styles.itemOptionSelected,
                    ]}
                    onPress={() => setSelectedItem(item)}
                  >
                    <Image
                      source={{
                        uri: item.image || "https://via.placeholder.com/60",
                      }}
                      style={styles.itemOptionImage}
                      contentFit="cover"
                    />
                    <Text style={styles.itemOptionTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Rating */}
              <Text style={styles.modalLabel}>{t("rating")}</Text>
              {renderRatingSelector()}

              {/* Comment */}
              <Text style={styles.modalLabel}>
                {t("comment")} ({comment.length}/500)
              </Text>
              <TextInput
                style={styles.commentInput}
                multiline
                numberOfLines={6}
                placeholder={t("write_your_review_here")}
                value={comment}
                onChangeText={setComment}
                maxLength={500}
              />

              <PrimaryButton
                title={submittingReview ? t("submitting") : t("submit_review")}
                onPress={handleSubmitReview}
                disabled={submittingReview || !selectedItem || rating === 0}
                loading={submittingReview}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading && !profile) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView
        style={styles.profileContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Info Section */}
        <View style={styles.profileSection}>
          <Text style={styles.profileName}>{profile?.name || "User"}</Text>

          {profile?.location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={16} color="#666666" />
              <Text style={styles.locationText}>{profile.location}</Text>
            </View>
          )}

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() =>
                router.push({
                  pathname: "/seller-profile/followers",
                  params: { userId: sellerId, name: profile?.name },
                })
              }
            >
              <Text style={styles.statNumber}>
                {profile?.statistics.followers || 0}
              </Text>
              <Text style={styles.statLabel}>{t("profile.followers")}</Text>
            </TouchableOpacity>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {profile?.statistics.rating?.toFixed(1) || "0.0"}
              </Text>
              <Text style={styles.statLabel}>{t("profile.rating")}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {profile?.statistics.soldRent || 0}
              </Text>
              <Text style={styles.statLabel}>{t("profile.sold_rent")}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          {user && user._id !== sellerId ? (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.filledButton,
                  isFollowing && styles.followingButton,
                ]}
                onPress={handleFollow}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filledButtonText,
                    isFollowing && styles.followingButtonText,
                  ]}
                >
                  {isFollowing ? t("profile.following") : t("profile.follow")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filledButton}
                onPress={handleMessage}
                disabled={chatLoading}
                activeOpacity={0.7}
              >
                {chatLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.filledButtonText}>
                    {t("profile.message")}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filledButton}
                onPress={handleOpenReviewModal}
                activeOpacity={0.7}
              >
                <Text style={styles.filledButtonText}>
                  {t("profile.review")}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {renderTabBar()}

        {/* Listings Tab */}
        {activeTab === "listings" && (
          <View style={styles.tabContent}>
            {listings.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="home-outline" size={64} color="#ccc" />
                <Text style={styles.emptyStateText}>
                  {t("profile.no_active_listings")}
                </Text>
              </View>
            ) : (
              <View style={styles.listingsGrid}>
                {listings.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.gridItem}
                    onPress={() => handleListingPress(item)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{
                        uri: item.image || "https://via.placeholder.com/150",
                      }}
                      style={styles.gridImage}
                      contentFit="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <View style={styles.tabContent}>
            {user && user._id !== sellerId && (
              <TouchableOpacity
                style={styles.writeReviewButton}
                onPress={handleOpenReviewModal}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={Colors.primary}
                />
                <Text style={styles.writeReviewText}>
                  {t("profile.write_a_review")}
                </Text>
              </TouchableOpacity>
            )}

            {reviews.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="star-outline" size={64} color="#ccc" />
                <Text style={styles.emptyStateText}>
                  {t("profile.noReviewsYet")}
                </Text>
              </View>
            ) : (
              <FlatList
                data={reviews}
                renderItem={renderReviewItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.reviewsContainer}
              />
            )}
          </View>
        )}
      </ScrollView>

      {renderReviewModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Header Styles (matching ProfileStyles)
  headerContainer: {
    height: 280,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    zIndex: 1,
  },
  headerBackgroundImage: {
    width: "100%",
    height: "100%",
  },
  headerTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Profile Image Styles (matching ProfileStyles)
  profileImageWrapper: {
    position: "absolute",
    bottom: -60,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  profileImageContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#FFFFFF",
    padding: 3,
    borderWidth: 3,
    borderColor: Colors.accent || Colors.primary,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  profileImage: {
    width: 137,
    height: 137,
    borderRadius: 68.5,
  },

  // Profile Content
  profileContent: {
    flex: 1,
    marginTop: 280,
  },

  // Profile Info Section (matching ProfileStyles)
  profileSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 15,
    backgroundColor: "#FFFFFF",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.accent || Colors.primary,
    marginTop: 10,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  locationText: {
    fontSize: 14,
    color: "#666666",
    marginLeft: 4,
  },

  // Stats Section (matching ProfileStyles)
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    marginBottom: 30,
    paddingHorizontal: 30,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#888888",
    textAlign: "center",
  },

  // Action Buttons (matching ProfileStyles)
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 25,
    gap: 10,
  },
  outlineButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.accent || Colors.primary,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 6,
    minHeight: 44,
  },
  outlineButtonText: {
    fontSize: 14,
    color: Colors.accent || Colors.primary,
    fontWeight: "600",
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 24,
    gap: 6,
    minHeight: 44,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  filledButton: {
    flex: 1,
    backgroundColor: Colors.accent || Colors.primary,
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  filledButtonText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  followingButton: {
    backgroundColor: "#E8E8E8",
  },
  followingButtonText: {
    color: "#666666",
  },

  // Tabs (matching ProfileStyles)
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 20,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.accent || Colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: "#999999",
    fontWeight: "500",
  },
  activeTabText: {
    color: Colors.accent || Colors.primary,
  },
  tabContent: {
    paddingBottom: 20,
  },

  // Listings Grid (matching ProfileStyles)
  listingsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  gridItem: {
    width: (screenWidth - 60) / 3,
    aspectRatio: 1,
    marginBottom: 10,
    borderRadius: 10,
    overflow: "hidden",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },

  // Empty State
  emptyState: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999999",
    marginTop: 10,
  },
  listingsContainer: {
    padding: 16,
  },
  listingCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  listingImage: {
    width: "100%",
    height: 200,
  },
  listingInfo: {
    padding: 12,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  listingType: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  listingPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 8,
  },
  listingDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  vehicleDetails: {
    fontSize: 14,
    color: "#666",
  },
  reviewsContainer: {
    padding: 16,
  },
  writeReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 8,
    minHeight: 44,
  },
  writeReviewText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  reviewCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: "#999",
  },
  reviewComment: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewedItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  reviewedItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  reviewedItemTitle: {
    flex: 1,
    fontSize: 14,
    color: "#666",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalBody: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    marginTop: 16,
  },
  itemSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  itemOption: {
    width: (screenWidth - 60) / 2,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  itemOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#f0f8ff",
  },
  itemOptionImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemOptionTitle: {
    fontSize: 12,
    color: "#333",
    textAlign: "center",
  },
  ratingSelector: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 16,
  },
});
