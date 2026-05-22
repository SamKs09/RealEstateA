import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "../../hooks/useTranslation";
import { formatDate } from "../../services/bookingService";

export default function OfferSubmittedScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams();

  const {
    bookingId,
    chatThreadId,
    propertyName,
    location,
    startDate,
    endDate,
    proposedPrice,
    duration,
  } = params;

  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const [countdown, setCountdown] = React.useState(5);
  const [visible, setVisible] = React.useState(true);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const navigateAfterClose = React.useRef<(() => void) | null>(null);

  // When visible flips to false, fire the pending navigation after the fade-out
  React.useEffect(() => {
    if (!visible && navigateAfterClose.current) {
      const nav = navigateAfterClose.current;
      navigateAfterClose.current = null;
      const t = setTimeout(nav, 250);
      return () => clearTimeout(t);
    }
  }, [visible]);

  React.useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timerRef.current = setTimeout(() => {
      navigateAfterClose.current = () => router.replace("/(tabs)/Explore");
      setVisible(false);
    }, 5000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const stopTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const dismiss = () => {
    stopTimers();
    navigateAfterClose.current = () => router.replace("/(tabs)/Explore");
    setVisible(false);
  };

  const handleOpenChat = () => {
    stopTimers();
    if (chatThreadId) {
      navigateAfterClose.current = () =>
        router.push({ pathname: `/chat/${chatThreadId}` as any });
    } else {
      navigateAfterClose.current = () => router.replace("/(tabs)/Explore");
    }
    setVisible(false);
  };

  const handleViewBookings = () => {
    stopTimers();
    navigateAfterClose.current = () => router.replace("/(tabs)/Bookings");
    setVisible(false);
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={dismiss}
      statusBarTranslucent
    >
      <BlurView intensity={90} tint="dark" style={styles.blurBg}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={dismiss}
        />
        <View style={styles.card}>
          {/* Countdown badge */}
          <View style={styles.countdownBadge}>
            <Text style={styles.countdownText}>{countdown}s</Text>
          </View>

          {/* Success Animation */}
          <Animated.View
            style={{ transform: [{ scale: scaleAnim }], marginBottom: 12 }}
          >
            <Ionicons name="checkmark-circle" size={90} color="#4CAF50" />
          </Animated.View>

          <Text style={styles.successTitle}>
            {t("bookings.offerSubmitted")}
          </Text>
          <Text style={styles.successSubtitle}>
            {t("bookings.offerSubmittedSubtitle")}
          </Text>

          {/* Booking Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Ionicons name="home-outline" size={18} color="#666666" />
              <Text style={styles.summaryValue} numberOfLines={1}>
                {"  "}
                {propertyName}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="location-outline" size={18} color="#666666" />
              <Text style={styles.summaryValue} numberOfLines={1}>
                {"  "}
                {location}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="calendar-outline" size={18} color="#666666" />
              <Text style={styles.summaryValue} numberOfLines={1}>
                {"  "}
                {formatDate(startDate as string)} –{" "}
                {formatDate(endDate as string)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                {t("bookings.yourOfferLabel")}
              </Text>
              <Text style={styles.priceValue}>
                ${parseFloat(proposedPrice as string).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleOpenChat}
            >
              <Ionicons name="chatbubble-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>
                {t("bookings.openChat")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleViewBookings}
            >
              <Ionicons name="list-outline" size={18} color="#FF8C42" />
              <Text style={styles.secondaryButtonText}>
                {t("bookings.viewMyBookings")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.textButton} onPress={dismiss}>
              <Text style={styles.textButtonText}>
                {t("bookings.backToHome")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  blurBg: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 16,
  },
  countdownBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#FF8C42",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countdownText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: "raleway-700Bold",
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "bold",
    fontFamily: "raleway-700Bold",
    color: "#333333",
    marginBottom: 6,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 14,
    color: "#666666",
    fontFamily: "raleway-400Regular",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  summaryCard: {
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: "100%",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryValue: {
    fontSize: 14,
    color: "#333333",
    fontFamily: "raleway-500Medium",
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 12,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "raleway-600SemiBold",
    color: "#333333",
  },
  priceValue: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "raleway-700Bold",
    color: "#4CAF50",
  },
  actionsContainer: {
    gap: 10,
    width: "100%",
  },
  primaryButton: {
    backgroundColor: "#FF8C42",
    borderRadius: 25,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "bold",
    fontFamily: "raleway-600SemiBold",
    color: "#FFFFFF",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: "#FF8C42",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "bold",
    fontFamily: "raleway-600SemiBold",
    color: "#FF8C42",
  },
  textButton: {
    paddingVertical: 10,
    alignItems: "center",
  },
  textButtonText: {
    fontSize: 13,
    color: "#999999",
    fontFamily: "raleway-500Medium",
  },
});
