import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "../../hooks/useTranslation";
import { useAuth } from "../../contexts/AuthContext";
import paymentService from "../../services/paymentService";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "../../components/styles";
import { SectionCard } from "../../components/Ui";
import { LinearGradient } from "expo-linear-gradient";

export default function PaymentScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  // const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card");

  // Property details from params
  const propertyName = params.propertyName || "Villa Mahasen";
  const pricePerNight = parseInt(params.pricePerNight as string) || 180;
  const driverEnabled = params.driverEnabled === "true";
  const arrivingTime = params.arrivingTime || "09:00 AM";
  const leavingTime = params.leavingTime || "05:00 PM";

  // Additional costs
  // Pricing policy
  const DRIVER_FLAT_COST = 50;
  const SERVICE_FEE = 25;

  const driverCost = driverEnabled ? DRIVER_FLAT_COST : 0;

  // Helper: compute number of nights from ISO dates (at least 1)
  const computeNumberOfNights = (ci?: string, co?: string) => {
    try {
      const ciDate = ci ? new Date(ci) : null;
      const coDate = co ? new Date(co) : null;
      if (
        ciDate &&
        coDate &&
        !isNaN(ciDate.getTime()) &&
        !isNaN(coDate.getTime())
      ) {
        // Zero out time-of-day to count full nights
        const ciMid = new Date(
          ciDate.getFullYear(),
          ciDate.getMonth(),
          ciDate.getDate(),
        );
        const coMid = new Date(
          coDate.getFullYear(),
          coDate.getMonth(),
          coDate.getDate(),
        );
        const diffMs = coMid.getTime() - ciMid.getTime();
        const days = Math.round(diffMs / (24 * 60 * 60 * 1000));
        return days > 0 ? days : 1;
      }
    } catch {
      // fall through
    }
    return 1;
  };

  const rawCheckIn = params.checkInDate as string | undefined;
  const rawCheckOut = params.checkOutDate as string | undefined;
  const numberOfNights = computeNumberOfNights(rawCheckIn, rawCheckOut);

  // Taxes (10% of itemized subtotal), subtotal does not include service fee
  const taxes = Math.round((pricePerNight * numberOfNights + driverCost) * 0.1);

  // Total calculation
  const subtotal = pricePerNight * numberOfNights;
  const total = subtotal + driverCost + SERVICE_FEE + taxes;

  // Helper function to format date as dd/mm/yyyy
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Return current date if parsing fails
        const now = new Date();
        const day = now.getDate().toString().padStart(2, "0");
        const month = (now.getMonth() + 1).toString().padStart(2, "0");
        const year = now.getFullYear();
        return `${day}/${month}/${year}`;
      }
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      // Return current date if any error occurs
      const now = new Date();
      const day = now.getDate().toString().padStart(2, "0");
      const month = (now.getMonth() + 1).toString().padStart(2, "0");
      const year = now.getFullYear();
      return `${day}/${month}/${year}`;
    }
  };

  useEffect(() => {
    if (params.checkInDate) {
      setCheckInDate(formatDate(params.checkInDate as string));
      // For demo purposes, set checkout to next day
      // In real app, this would come from user selection
      const checkIn = new Date(params.checkInDate as string);
      if (!isNaN(checkIn.getTime())) {
        const checkOut = new Date(
          checkIn.getTime() + numberOfNights * 24 * 60 * 60 * 1000,
        );
        setCheckOutDate(formatDate(checkOut.toDateString()));
      } else {
        // Fallback if date parsing fails
        const today = new Date();
        const tomorrow = new Date(
          today.getTime() + numberOfNights * 24 * 60 * 60 * 1000,
        );
        setCheckInDate(formatDate(today.toDateString()));
        setCheckOutDate(formatDate(tomorrow.toDateString()));
      }
    } else {
      // Set default dates if no params
      const today = new Date();
      const tomorrow = new Date(
        today.getTime() + numberOfNights * 24 * 60 * 60 * 1000,
      );
      setCheckInDate(formatDate(today.toDateString()));
      setCheckOutDate(formatDate(tomorrow.toDateString()));
    }
  }, [params.checkInDate, numberOfNights]);

  // const paymentMethods = [
  //   {
  //     id: "card",
  //     name: "Credit/Debit Card",
  //     icon: "card-outline",
  //     details: "**** **** **** 1234"
  //   },
  //   {
  //     id: "paypal",
  //     name: "PayPal",
  //     icon: "logo-paypal",
  //     details: "user@email.com"
  //   },
  //   {
  //     id: "apple",
  //     name: "Apple Pay",
  //     icon: "logo-apple",
  //     details: "Touch ID or Face ID"
  //   }
  // ];

  // const handlePaymentMethodSelect = (methodId: string) => {
  //   setSelectedPaymentMethod(methodId);
  // };

  const handlePayNow = async () => {
    try {
      setIsProcessing(true);

      // Prepare payment data
      const paymentData = {
        propertyId: (params.propertyId as string) || "",
        propertyName: String(propertyName),
        amount: total,
        checkInDate: rawCheckIn || new Date().toISOString(),
        checkOutDate: rawCheckOut || new Date().toISOString(),
        numberOfNights,
        driverEnabled,
        arrivingTime: String(arrivingTime),
        leavingTime: String(leavingTime),
      };

      console.log("🔐 Initiating payment:", paymentData);

      // Call backend to create Konnect checkout
      const response = await paymentService.initiateBookingPayment(paymentData);

      if (response.success && response.data?.checkoutUrl) {
        console.log("✅ Payment initiated successfully");
        console.log("🌐 Opening Konnect payment page...");

        // Open Konnect payment page in browser
        const checkoutUrl = response.data.checkoutUrl;
        const canOpen = await Linking.canOpenURL(checkoutUrl);

        if (canOpen) {
          await Linking.openURL(checkoutUrl);

          // Show info alert
          Alert.alert(
            t("payment.redirected") || "Payment",
            t("payment.completePayment") ||
              "Complete your payment in the browser. You can return to the app after payment is completed.",
            [
              {
                text: t("common.ok") || "OK",
                onPress: () => {
                  // After user acknowledges, navigate back to bookings
                  router.push("../(tabs)/Bookings");
                },
              },
            ],
          );
        } else {
          throw new Error("Cannot open payment URL");
        }
      } else {
        throw new Error(response.message || "Failed to create payment");
      }
    } catch (error: any) {
      console.error("❌ Payment initiation failed:", error);

      Alert.alert(
        t("payment.error") || "Payment Error",
        error.message ||
          t("payment.errorMessage") ||
          "Failed to process payment. Please try again.",
        [{ text: t("common.ok") || "OK" }],
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* HERO IMAGE WITH PROPERTY INFO */}
        <View style={styles.heroSection}>
          <Image
            source={
              params.propertyImage
                ? { uri: params.propertyImage as string }
                : require("../../assets/images/Auth/Appartment.png")
            }
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay}>
            <View style={styles.propertyBadge}>
              <Text style={styles.villaName}>{propertyName}</Text>
              <View style={styles.propertyDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="bed-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.detailText}>
                    {params.bedrooms || 0} Bedroom
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="water-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.detailText}>
                    {params.bathrooms || 0} Bathroom
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* OVERVIEW SECTION - MIDDLE */}
        <SectionCard style={styles.overviewSection} shadow="base">
          <Text style={styles.overviewTitle}>{t("payment.overview")}</Text>
          <View style={styles.datesContainer}>
            <View style={styles.dateButton}>
              <Text style={styles.dateLabel}>{t("bookings.checkIn")}</Text>
              <Text style={styles.dateText}>{checkInDate || "22/09/2025"}</Text>
              <Text style={styles.timeText}>{arrivingTime}</Text>
            </View>
            <View style={styles.dateButton}>
              <Text style={styles.dateLabel}>{t("bookings.checkOut")}</Text>
              <Text style={styles.dateText}>
                {checkOutDate || "23/09/2025"}
              </Text>
              <Text style={styles.timeText}>{leavingTime}</Text>
            </View>
          </View>
        </SectionCard>

        {/* PAYMENT SECTION - BOTTOM */}
        <SectionCard style={styles.paymentSection} shadow="base">
          <Text style={styles.paymentTitle}>{t("payment.title")}</Text>

          {/* Price breakdown */}
          <View style={styles.breakdownSection}>
            <View style={styles.lineItem}>
              <Text style={styles.lineLabel}>{t("payment.pricePerNight")}</Text>
              <Text style={styles.lineValue}>{pricePerNight} DT</Text>
            </View>
            <View style={styles.lineItem}>
              <Text style={styles.lineLabel}>{t("payment.nights")}</Text>
              <Text style={styles.lineValue}>{numberOfNights}</Text>
            </View>
            <View style={styles.lineItem}>
              <Text style={styles.lineLabel}>{t("payment.subtotal")}</Text>
              <Text style={styles.lineValue}>{subtotal} DT</Text>
            </View>
            {driverCost > 0 && (
              <View style={styles.lineItem}>
                <Text style={styles.lineLabel}>{t("payment.driverCost")}</Text>
                <Text style={styles.lineValue}>{driverCost} DT</Text>
              </View>
            )}
            <View style={styles.lineItem}>
              <Text style={styles.lineLabel}>{t("payment.serviceFee")}</Text>
              <Text style={styles.lineValue}>{SERVICE_FEE} DT</Text>
            </View>
            <View style={styles.lineItem}>
              <Text style={styles.lineLabel}>{t("payment.taxes")}</Text>
              <Text style={styles.lineValue}>{taxes} DT</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t("payment.total")}</Text>
              <Text style={styles.totalValue}>{total} DT</Text>
            </View>
          </View>

          <View style={styles.mastercardContainer}>
            <View style={styles.mastercardHeader}>
              <View style={styles.mastercardCircles}>
                <View style={[styles.circle, styles.redCircle]} />
                <View style={[styles.circle, styles.yellowCircle]} />
              </View>
              <Text style={styles.mastercardText}>
                {t("payment.masterCard")}
              </Text>
            </View>
            <Text style={styles.cardDetails}>**** **** **** 7852</Text>
          </View>
        </SectionCard>
      </ScrollView>

      {/* Pay Now Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
          onPress={handlePayNow}
          disabled={isProcessing}
        >
          <LinearGradient
            colors={
              isProcessing
                ? [Colors.borderLight, Colors.borderLight]
                : [Colors.primary, Colors.primaryLight]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.payButtonGradient}
          >
            <View style={styles.payButtonContent}>
              {isProcessing ? (
                <>
                  <ActivityIndicator color={Colors.textWhite} size="small" />
                  <Text style={[styles.payButtonTextLabel, { marginLeft: 8 }]}>
                    {t("payment.processing") || "Processing..."}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.payButtonTextLabel}>
                    {t("payment.payNow")} |{" "}
                  </Text>
                  <Text style={styles.payButtonTextAmount}>{total}DT</Text>
                </>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing["5xl"],
    paddingBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.backgroundLight,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Raleway-Bold",
    color: "#333333",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },

  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  // Hero Section Styles
  heroSection: {
    position: "relative",
    marginHorizontal: -Spacing.xl,
    marginTop: -Spacing.xl,
  },
  heroImage: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
  },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: Spacing.xl,
  },
  propertyBadge: {
    backgroundColor: "rgba(255, 140, 66, 0.9)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  villaName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textWhite,
    fontFamily: "raleway-500Medium",
    marginBottom: Spacing.sm,
  },
  propertyDetails: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  detailText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textWhite,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: "raleway-500Medium",
  },
  // Overview Section Styles
  overviewSection: {
    marginVertical: Spacing.lg,
  },
  overviewTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    fontFamily: "raleway-500Medium",
    marginBottom: Spacing.xl,
  },
  datesContainer: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  dateButton: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius["3xl"],
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
  },
  dateText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    fontFamily: "raleway-600SemiBold",
    marginBottom: 2,
  },
  dateLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    fontFamily: "raleway-500Medium",
    marginBottom: 5,
    textTransform: "uppercase",
  },
  timeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.normal,
    color: Colors.textSecondary,
    fontFamily: "raleway-400Regular",
  },
  // Payment Section Styles
  paymentSection: {
    marginVertical: Spacing.lg,
  },
  paymentTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    fontFamily: "raleway-500Medium",
    marginBottom: Spacing.xl,
  },
  mastercardContainer: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  mastercardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  mastercardCircles: {
    flexDirection: "row",
    marginRight: Spacing.md,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.sm,
    marginRight: -5,
  },
  redCircle: {
    backgroundColor: "#FF5F00",
  },
  yellowCircle: {
    backgroundColor: "#FFB700",
  },
  mastercardText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    fontFamily: "raleway-500Medium",
  },
  cardDetails: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontFamily: "raleway-400Regular",
    marginTop: 5,
  },
  // Breakdown styles
  breakdownSection: {
    backgroundColor: Colors.backgroundLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  lineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  lineLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontFamily: "raleway-400Regular",
  },
  lineValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: "raleway-600SemiBold",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  totalLabel: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: "raleway-500Medium",
  },
  totalValue: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: "raleway-700Bold",
  },
  payButton: {
    borderRadius: BorderRadius["3xl"],
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  payButtonGradient: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius["3xl"],
    alignItems: "center",
    justifyContent: "center",
  },
  payButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  payButtonTextLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textWhite,
    fontFamily: "raleway-500Medium",
  },
  payButtonTextAmount: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textWhite,
    fontFamily: "raleway-700Bold",
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
});
