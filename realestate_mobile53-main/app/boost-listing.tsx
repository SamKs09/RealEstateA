import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { HeaderWithBackButton } from "@/components/Ui/HeaderWithBackButton";
import { SuccessModal } from "@/components/Ui";
import PrimaryButton from "@/components/Ui/PrimaryButton";
import {
  getProperty,
  boostProperty,
  initiatePropertyBoostPayment,
  type Property,
} from "@/services/propertyService";
import {
  boostVehicle,
  getVehicle,
  initiateVehicleBoostPayment,
  type Vehicle,
} from "@/services/vehicleService";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/userService";
import { Colors } from "../components/styles";

type BoostPlanKey = "1day" | "3day" | "7day";

interface BoostPlan {
  key: BoostPlanKey;
  label: string;
  description: string;
  price: number;
  visibility: string;
}

const BOOST_PLANS: BoostPlan[] = [
  {
    key: "1day",
    label: "1 day boost",
    description: "Top of search results for 24h",
    price: 1,
    visibility: "Top of search",
  },
  {
    key: "3day",
    label: "3 day boost",
    description: "Featured badge · 3 days",
    price: 1,
    visibility: "Top of search",
  },
  {
    key: "7day",
    label: "7 day boost",
    description: "Featured badge · 3 days",
    price: 1,
    visibility: "Top of search",
  },
];

export default function BoostListingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    type?: string;
    paymentStatus?: string;
    transactionId?: string;
  }>();
  const listingId = params.id as string;
  const listingType = params.type === "vehicle" ? "vehicle" : "property";
  const isVehicle = listingType === "vehicle";
  const { user, updateUser } = useAuth();

  const [listing, setListing] = useState<Property | Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [boosting, setBoosting] = useState(false);
  const [boostingMode, setBoostingMode] = useState<"pack" | "pay" | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<BoostPlanKey>("7day");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [confirmingTransactionId, setConfirmingTransactionId] = useState<
    string | null
  >(null);

  const loadListing = useCallback(async () => {
    try {
      setLoading(true);
      if (isVehicle) {
        const response = await getVehicle(listingId);
        setListing(response.data);
      } else {
        const data = await getProperty(listingId);
        setListing(data);
      }
    } catch (error: any) {
      console.error("Error loading listing:", error);
      Alert.alert(
        "Error",
        `Failed to load ${isVehicle ? "vehicle" : "property"} details`,
      );
      router.back();
    } finally {
      setLoading(false);
    }
  }, [isVehicle, listingId, router]);

  useEffect(() => {
    if (!listingId) return;
    loadListing();
  }, [listingId, loadListing]);

  useEffect(() => {
    const paymentStatus = Array.isArray(params.paymentStatus)
      ? params.paymentStatus[0]
      : params.paymentStatus;
    const transactionId = Array.isArray(params.transactionId)
      ? params.transactionId[0]
      : params.transactionId;

    if (
      !paymentStatus ||
      !transactionId ||
      confirmingTransactionId === transactionId
    ) {
      return;
    }

    const finalizeBoostPayment = async () => {
      setConfirmingTransactionId(transactionId);

      try {
        if (paymentStatus !== "success") {
          Alert.alert(
            "Payment not completed",
            "The standalone boost payment was not completed.",
          );
          return;
        }

        // Retry up to 5 times with 2-second delays to handle the brief window between
        // Flouci redirecting to the success URL and verify_payment returning SUCCESS.
        let transaction = null;
        const MAX_ATTEMPTS = 5;
        const RETRY_DELAY_MS = 2000;

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          if (attempt > 0) {
            await new Promise<void>((resolve) =>
              setTimeout(resolve, RETRY_DELAY_MS),
            );
          }
          const response =
            await userService.getPaymentTransaction(transactionId);
          if (response.data?.status === "paid") {
            transaction = response.data;
            break;
          }
        }

        if (!transaction || transaction.status !== "paid") {
          throw new Error(
            "Payment confirmation is still pending. Please wait a moment and try again.",
          );
        }

        await loadListing();
        setShowSuccessModal(true);
      } catch (error: any) {
        Alert.alert(
          "Payment verification failed",
          error.message || "We could not verify the boost payment yet.",
        );
      } finally {
        setConfirmingTransactionId(null);
        router.replace({
          pathname: "/boost-listing",
          params: { id: listingId, type: listingType },
        });
      }
    };

    finalizeBoostPayment();
  }, [
    confirmingTransactionId,
    listingId,
    listingType,
    loadListing,
    params.paymentStatus,
    params.transactionId,
    router,
  ]);

  const handlePackBoost = async () => {
    if (!listingId) return;
    try {
      setBoosting(true);
      setBoostingMode("pack");
      const result = isVehicle
        ? await boostVehicle(listingId, selectedPlan)
        : await boostProperty(listingId, selectedPlan);
      if (result?.user) {
        await updateUser(result.user);
      }
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Error boosting listing:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to boost listing. Please try again.";
      Alert.alert("Boost Failed", message);
    } finally {
      setBoosting(false);
      setBoostingMode(null);
    }
  };

  const handlePayBoost = async () => {
    if (!listingId) return;
    try {
      setBoosting(true);
      setBoostingMode("pay");
      const checkout = isVehicle
        ? await initiateVehicleBoostPayment(listingId, selectedPlan)
        : await initiatePropertyBoostPayment(listingId, selectedPlan);
      if (!checkout?.checkoutUrl || !checkout.transactionId) {
        throw new Error("Failed to start boost payment.");
      }
      router.push({
        pathname: "/profile/payment-webview",
        params: {
          paymentLink: checkout.checkoutUrl,
          transactionId: checkout.transactionId,
          returnPath: "/boost-listing",
          returnParams: JSON.stringify({ id: listingId, type: listingType }),
        },
      });
    } catch (error: any) {
      console.error("Error boosting listing:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to start boost payment. Please try again.";
      Alert.alert("Boost Failed", message);
    } finally {
      setBoosting(false);
      setBoostingMode(null);
    }
  };

  const getSelectedPlanData = () => {
    return BOOST_PLANS.find((p) => p.key === selectedPlan)!;
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
      default:
        return "#8E8E93";
    }
  };

  const getStatusLabel = (status?: string) => {
    return status
      ? status.charAt(0).toUpperCase() + status.slice(1)
      : "Unknown";
  };

  const getPrice = () => {
    if (!listing) return "";
    if (listing.listingType === "sale") {
      return `${listing.pricing?.salePrice?.toLocaleString()}DT`;
    }
    return `${listing.pricing?.rentPrice?.toLocaleString()}DT / Month`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <HeaderWithBackButton
          onBackPress={() => router.back()}
          title={`Boost your ${isVehicle ? "vehicle" : "listing"}`}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  const primaryImage = listing?.media?.images?.[0];
  const planData = getSelectedPlanData();
  const remainingBoosts = user?.boost?.number ?? 0;
  const usesPackBoost = remainingBoosts > 0;

  const daysRemaining = listing?.promotionExpiry
    ? Math.max(
        0,
        Math.ceil(
          (new Date(listing.promotionExpiry).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;
  const isAlreadyBoosted = !!(listing?.isPromoted && daysRemaining > 0);

  return (
    <View style={styles.container}>
      <HeaderWithBackButton
        onBackPress={() => router.back()}
        title={`Boost your ${isVehicle ? "vehicle" : "listing"}`}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active boost status banner */}
        {isAlreadyBoosted && (
          <View style={styles.activeBoostBanner}>
            <View style={styles.activeBoostRow}>
              <Ionicons name="flash" size={16} color="#34C759" />
              <Text style={styles.activeBoostTitle}>Active boost</Text>
              <View style={styles.activeBoostDaysBadge}>
                <Text style={styles.activeBoostDaysText}>
                  {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} left
                </Text>
              </View>
            </View>
            {(listing as Vehicle | Property & { boostPlan?: string })?.boostPlan && (
              <Text style={styles.activeBoostPlan}>
                {(listing as any).boostPlan === "1day"
                  ? "1 day boost"
                  : (listing as any).boostPlan === "3day"
                    ? "3 day boost"
                    : "7 day boost"}
                {" · "}
                Expires{" "}
                {new Date(listing!.promotionExpiry!).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            )}
          </View>
        )}

        <View style={styles.remainingBoostBanner}>
          <View>
            <Text style={styles.remainingBoostLabel}>Boosts remaining</Text>
            <Text style={styles.remainingBoostHint}>
              {usesPackBoost
                ? isAlreadyBoosted
                  ? "A new boost will replace the active one."
                  : "This boost will use your current pack credit."
                : "No pack boosts left. You can still pay for a standalone boost."}
            </Text>
          </View>
          <Text style={styles.remainingBoostValue}>{remainingBoosts}</Text>
        </View>

        {/* Listing Card */}
        <View style={styles.propertyCard}>
          <View style={styles.propertyImageContainer}>
            {primaryImage ? (
              <Image
                source={{ uri: primaryImage }}
                style={styles.propertyImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons
                  name={isVehicle ? "car-outline" : "home-outline"}
                  size={32}
                  color="#CCCCCC"
                />
              </View>
            )}
          </View>

          <View style={styles.propertyInfo}>
            <View style={styles.propertyHeader}>
              <Text style={styles.propertyTitle} numberOfLines={1}>
                {listing?.title}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(listing?.status) },
                ]}
              >
                <Text style={styles.statusText}>
                  {getStatusLabel(listing?.status)}
                </Text>
              </View>
            </View>

            <Text style={styles.propertyPrice}>{getPrice()}</Text>

            <View style={styles.propertyDetails}>
              {!isVehicle &&
                (listing as Property)?.propertyDetails?.bedrooms !==
                  undefined && (
                  <View style={styles.detailItem}>
                    <Ionicons name="bed-outline" size={16} color="#888" />
                    <Text style={styles.detailText}>
                      {(listing as Property).propertyDetails?.bedrooms} Bedroom
                    </Text>
                  </View>
                )}
              {!isVehicle &&
                (listing as Property)?.propertyDetails?.bathrooms !==
                  undefined && (
                  <View style={styles.detailItem}>
                    <Ionicons name="water-outline" size={16} color="#888" />
                    <Text style={styles.detailText}>
                      {(listing as Property).propertyDetails?.bathrooms}{" "}
                      Bathroom
                    </Text>
                  </View>
                )}
              {isVehicle &&
                (listing as Vehicle)?.vehicleDetails?.year !== undefined && (
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={16} color="#888" />
                    <Text style={styles.detailText}>
                      {(listing as Vehicle).vehicleDetails?.year}
                    </Text>
                  </View>
                )}
              {isVehicle &&
                (listing as Vehicle)?.vehicleDetails?.mileage !== undefined && (
                  <View style={styles.detailItem}>
                    <Ionicons
                      name="speedometer-outline"
                      size={16}
                      color="#888"
                    />
                    <Text style={styles.detailText}>
                      {(listing as Vehicle).vehicleDetails?.mileage} km
                    </Text>
                  </View>
                )}
            </View>
          </View>
        </View>

        {/* Purchase a boost section */}
        <Text style={styles.sectionLabel}>Purchase a boost</Text>

        {/* Boost Plan Cards */}
        {BOOST_PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.key;
          return (
            <TouchableOpacity
              key={plan.key}
              style={[styles.planCard, isSelected && styles.planCardSelected]}
              onPress={() => setSelectedPlan(plan.key)}
              activeOpacity={0.7}
            >
              <View style={styles.planInfo}>
                <Text
                  style={[
                    styles.planLabel,
                    isSelected && styles.planLabelSelected,
                  ]}
                >
                  {plan.label}
                </Text>
                <Text style={styles.planDescription}>{plan.description}</Text>
              </View>
              <Text
                style={[
                  styles.planPrice,
                  isSelected && styles.planPriceSelected,
                ]}
              >
                {plan.price}DT
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Summary section */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Selected</Text>
            <Text style={styles.summaryValue}>{planData.label}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Visibility</Text>
            <Text style={styles.summaryValue}>{planData.visibility}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.totalPrice}>{planData.price}DT</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.bottomSection}>
        {remainingBoosts > 0 && (
          <TouchableOpacity
            style={[
              styles.packBoostBtn,
              (boosting || confirmingTransactionId !== null) && styles.packBoostBtnDisabled,
            ]}
            onPress={handlePackBoost}
            disabled={boosting || confirmingTransactionId !== null}
            activeOpacity={0.8}
          >
            {boosting && boostingMode === "pack" ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="flash" size={18} color="#fff" />
            )}
            <Text style={styles.packBoostBtnText}>
              {isAlreadyBoosted
                ? `Replace boost · ${remainingBoosts} credit${remainingBoosts !== 1 ? "s" : ""} left`
                : `Use pack boost · ${remainingBoosts} remaining`}
            </Text>
          </TouchableOpacity>
        )}
        <PrimaryButton
          title={
            boosting && boostingMode === "pay"
              ? "Processing..."
              : `Pay and boost · ${planData.price}DT`
          }
          onPress={handlePayBoost}
          disabled={boosting || confirmingTransactionId !== null}
        />
      </View>

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        title="Boosted!"
        message={`Your ${isVehicle ? "vehicle" : "listing"} has been boosted successfully and will appear at the top of search results.`}
        buttonText="OK"
        onClose={() => {
          setShowSuccessModal(false);
          router.back();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    paddingHorizontal: 20,
    paddingBottom: 120,
    paddingTop: 10,
  },
  // Active Boost Banner
  activeBoostBanner: {
    backgroundColor: "#F0FFF4",
    borderWidth: 1.5,
    borderColor: "#34C759",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  activeBoostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  activeBoostTitle: {
    fontSize: 14,
    fontFamily: "Raleway-Bold",
    color: "#1A7A36",
    flex: 1,
  },
  activeBoostDaysBadge: {
    backgroundColor: "#34C759",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  activeBoostDaysText: {
    fontSize: 12,
    fontFamily: "Raleway-Bold",
    color: "#fff",
  },
  activeBoostPlan: {
    fontSize: 12,
    fontFamily: "Raleway",
    color: "#2E7D32",
    marginTop: 2,
  },

  remainingBoostBanner: {
    backgroundColor: "#FFF5EC",
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  remainingBoostLabel: {
    fontSize: 14,
    color: "#8A8A8A",
    fontWeight: "600",
  },
  remainingBoostValue: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: "700",
  },
  remainingBoostHint: {
    marginTop: 4,
    maxWidth: 240,
    fontSize: 12,
    color: "#8A8A8A",
  },

  // Property Card
  propertyCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 24,
    alignItems: "center",
  },
  propertyImageContainer: {
    width: 100,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    marginRight: 14,
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
    borderRadius: 12,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  propertyTitle: {
    fontSize: 16,
    fontFamily: "Raleway-Bold",
    color: "#1A1A1A",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Raleway-SemiBold",
    color: "white",
  },
  propertyPrice: {
    fontSize: 14,
    fontFamily: "Raleway-SemiBold",
    color: Colors.primary,
    marginBottom: 6,
  },
  propertyDetails: {
    flexDirection: "row",
    gap: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    fontFamily: "Raleway",
    color: "#888",
  },

  // Section Label
  sectionLabel: {
    fontSize: 14,
    fontFamily: "Raleway-SemiBold",
    color: "#8A8A8A",
    marginBottom: 14,
  },

  // Boost Plan Cards
  planCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  planCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: "#FFF9F5",
  },
  planInfo: {
    flex: 1,
  },
  planLabel: {
    fontSize: 16,
    fontFamily: "Raleway-Bold",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  planLabelSelected: {
    color: "#1A1A1A",
  },
  planDescription: {
    fontSize: 13,
    fontFamily: "Raleway",
    color: "#8A8A8A",
  },
  planPrice: {
    fontSize: 20,
    fontFamily: "Raleway-Bold",
    color: "#1A1A1A",
    marginLeft: 16,
  },
  planPriceSelected: {
    color: "#1A1A1A",
  },

  // Summary
  summaryContainer: {
    marginTop: 16,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: "Raleway",
    color: "#8A8A8A",
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: "Raleway-SemiBold",
    color: "#1A1A1A",
  },
  totalPrice: {
    fontSize: 18,
    fontFamily: "Raleway-Bold",
    color: Colors.primary,
  },

  // Bottom Section
  bottomSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  packBoostBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
  },
  packBoostBtnDisabled: {
    opacity: 0.5,
  },
  packBoostBtnText: {
    fontSize: 15,
    fontFamily: "Raleway-Bold",
    color: "#fff",
  },
});
