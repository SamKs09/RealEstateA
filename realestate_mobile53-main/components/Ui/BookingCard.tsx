import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "../../hooks/useTranslation";

interface BookingCardProps {
  propertyName: string;
  propertyImage: any;
  location: string;
  price: string;
  status: string;
  onPress?: () => void;
  onStatusPress?: () => void;
  style?: any;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  propertyName,
  propertyImage,
  location,
  price,
  status,
  onPress,
  onStatusPress,
  style,
}) => {
  const { t } = useTranslation();
  
  return (
    <TouchableOpacity
      style={[styles.bookingCard, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image source={propertyImage} style={styles.propertyImage} />

      <View style={styles.cardContent}>
        <Text
          style={[styles.propertyName, { fontFamily: "raleway-500Medium" }]}
        >
          {propertyName}
        </Text>
        <Text style={[styles.location, { fontFamily: "raleway-400Regular" }]}>
          {location}
        </Text>

        <View style={styles.priceSection}>
          <Text style={[styles.price, { fontFamily: "raleway-500Medium" }]}>
            {price}
          </Text>
          <Text
            style={[styles.priceLabel, { fontFamily: "raleway-400Regular" }]}
          >
            {t("bookings.perMonth")}
          </Text>
        </View>

        <View style={styles.bookingFooter}>
          <Text
            style={[styles.bookingLabel, { fontFamily: "raleway-400Regular" }]}
          >
            {t("bookings.status")}
          </Text>
          <View style={styles.statusButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.statusButton,
                status.toLowerCase() === "completed"
                  ? styles.completedButton
                  : styles.inactiveButton,
              ]}
              onPress={() => onStatusPress && onStatusPress()}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  status.toLowerCase() === "completed"
                    ? styles.completedText
                    : styles.inactiveText,
                  { fontFamily: "raleway-500Medium" },
                ]}
              >
                {t("bookings.completed")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.statusButton,
                status.toLowerCase() === "pending"
                  ? styles.pendingButton
                  : styles.inactiveButton,
              ]}
              onPress={() => onStatusPress && onStatusPress()}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  status.toLowerCase() === "pending"
                    ? styles.pendingText
                    : styles.inactiveText,
                  { fontFamily: "raleway-500Medium" },
                ]}
              >
                {t("bookings.pending")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bookingCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  propertyImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  cardContent: {
    padding: 20,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: "#8A8A8A",
    marginBottom: 15,
  },
  priceSection: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 20,
  },
  price: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
  },
  priceLabel: {
    fontSize: 16,
    color: "#8A8A8A",
    marginLeft: 4,
  },
  bookingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookingLabel: {
    fontSize: 14,
    color: "#8A8A8A",
  },
  statusButtonsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    alignItems: "center",
  },
  completedButton: {
    backgroundColor: "#FF8C42",
    borderColor: "#FF8C42",
  },
  pendingButton: {
    backgroundColor: "#FF8C42",
    borderColor: "#FF8C42",
  },
  inactiveButton: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E0E0E0",
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  completedText: {
    color: "#FFFFFF",
  },
  pendingText: {
    color: "#FFFFFF",
  },
  inactiveText: {
    color: "#999999",
  },
});
