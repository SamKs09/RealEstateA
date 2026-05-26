import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "../hooks/useTranslation";
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
} from "../components/styles";
import PrimaryButton from "../components/Ui/PrimaryButton";
import { SectionCard } from "../components/Ui";
import { useInterest } from "../contexts/InterestContext";

export default function PaymentScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { userInterest } = useInterest();

  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [numberOfNights] = useState(1);
  // const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("card");

  // Property details from params
  const propertyName = params.propertyName || "Villa Mahasen";
  const pricePerNight = parseInt(params.pricePerNight as string) || 180;
  const driverEnabled = params.driverEnabled === "true";
  const arrivingTime = params.arrivingTime || "09:00 AM";
  const leavingTime = params.leavingTime || "05:00 PM";

  // Additional costs
  const driverCost = driverEnabled ? 50 : 0;
  const serviceFee = 25;
  const taxes = Math.round((pricePerNight * numberOfNights + driverCost) * 0.1);

  // Total calculation
  const subtotal = pricePerNight * numberOfNights + driverCost;
  const total = subtotal + serviceFee + taxes;

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

      // Use the provided checkOutDate if available
      if (params.checkOutDate && params.checkOutDate !== params.checkInDate) {
        setCheckOutDate(formatDate(params.checkOutDate as string));
      } else {
        // Same day booking
        setCheckOutDate(formatDate(params.checkInDate as string));
      }
    } else {
      // Set default dates if no params
      const today = new Date();
      const tomorrow = new Date(
        today.getTime() + numberOfNights * 24 * 60 * 60 * 1000
      );
      setCheckInDate(formatDate(today.toDateString()));
      setCheckOutDate(formatDate(tomorrow.toDateString()));
    }
  }, [params.checkInDate, params.checkOutDate, numberOfNights]);





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

  const handlePayNow = () => {
    // Process payment logic here
    console.log("Processing payment:", {
      propertyName,
      checkInDate,
      checkOutDate,
      numberOfNights,
      total,
      paymentMethod: "mastercard",
      driverEnabled,
    });

    // Navigate to success screen or back to bookings
    router.push("/(tabs)/Bookings");
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
        <Text style={styles.headerTitle}>{t("payment.title")}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* HERO IMAGE WITH PROPERTY INFO */}
        <View style={styles.heroSection}>
          <Image
            source={require("../assets/images/Auth/Appartment.png")}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay}>
            <View style={styles.propertyBadge}>
              <Text style={styles.villaName}>{propertyName}</Text>
              <View style={styles.propertyDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="bed-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.detailText}>
                    {userInterest === "cars"
                      ? "450 kW"
                      : t("property.bedrooms")}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="car-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.detailText}>
                    {userInterest === "cars"
                      ? "280 km/h"
                      : t("property.bathrooms")}
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
              <Text style={styles.dateLabel}>
                {userInterest === "cars"
                  ? t("payment.pickup")
                  : t("payment.from")}
              </Text>
              <Text style={styles.dateText}>{checkInDate || "22/09/2025"}</Text>
              <Text style={styles.timeText}>{arrivingTime}</Text>
            </View>
            <View style={styles.dateButton}>
              <Text style={styles.dateLabel}>
                {userInterest === "cars"
                  ? t("payment.return")
                  : t("payment.to")}
              </Text>
              <Text style={styles.dateText}>
                {checkOutDate || "23/09/2025"}
              </Text>
              <Text style={styles.timeText}>{leavingTime}</Text>
            </View>
          </View>
        </SectionCard>

        {/* PAYMENT SECTION - BOTTOM */}
        <SectionCard style={styles.paymentSection} shadow="base">
          <Text style={styles.paymentTitle}>{t("payment.payment")}</Text>
          <View style={styles.mastercardContainer}>
            <View style={styles.mastercardHeader}>
              <View style={styles.mastercardCircles}>
                <View style={[styles.circle, styles.redCircle]} />
                <View style={[styles.circle, styles.yellowCircle]} />
              </View>
              <Text style={styles.mastercardText}>{t("payment.masterCard")}</Text>
            </View>
            <Text style={styles.cardDetails}>**** **** **** 7852</Text>
          </View>
        </SectionCard>


      </ScrollView>

      {/* Pay Now Button */}
      <View style={styles.bottomSection}>
        <PrimaryButton
          title={`${t("payment.payNow")} | ${total}DT`}
          onPress={handlePayNow}
        />
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
    marginBottom: Spacing.sm,
    fontFamily: "raleway-500Medium",
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
    marginBottom: Spacing.xl,
    fontFamily: "raleway-500Medium",
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
    marginBottom: 2,
    fontFamily: "raleway-600SemiBold",
  },
  dateLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: 5,
    textTransform: "uppercase",
  },
  timeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.normal,
    fontFamily: "raleway-400Regular",
    color: Colors.textSecondary,
  },
  // Payment Section Styles
  paymentSection: {
    marginVertical: Spacing.lg,
  },
  historySection: {
    marginVertical: Spacing.lg,
  },
  historyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: "raleway-500Medium",
    color: Colors.textPrimary,
    marginBottom: Spacing.xl,
  },
  historyContainer: {
    gap: Spacing.md,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  historyContent: {
    flex: 1,
  },
  historyDesc: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontFamily: "raleway-400Regular",
  },
  historyAmount: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingVertical: Spacing.md,
  },
  paymentTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: "raleway-500Medium",
    color: Colors.textPrimary,
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
    fontFamily: "raleway-500Medium",
    color: Colors.textPrimary,
  },
  cardDetails: {
    fontFamily: "raleway-500Medium",
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 5,
  },
});
