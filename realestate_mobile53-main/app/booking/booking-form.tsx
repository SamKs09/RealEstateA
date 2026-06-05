import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "../../hooks/useTranslation";
import { formatDate, calculateDuration } from "../../services/bookingService";

export default function BookingFormScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams();

  // Extract params
  const {
    listingId,
    listingType,
    startDate,
    endDate,
    propertyName,
    location,
    pricePerNight,
    propertyImage,
    bedrooms,
    bathrooms,
    capacity,
  } = params;

  const [numberOfGuests, setNumberOfGuests] = useState("1");
  const [specialRequests, setSpecialRequests] = useState("");
  const [errors, setErrors] = useState<{ guests?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxCapacity = parseInt(capacity as string) || 4;
  const duration = calculateDuration(startDate as string, endDate as string);
  const basePrice = parseFloat(pricePerNight as string) || 0;
  const totalPrice = basePrice * duration;

  const validateForm = (): boolean => {
    const newErrors: { guests?: string } = {};
    const guests = parseInt(numberOfGuests);

    if (!numberOfGuests || isNaN(guests)) {
      newErrors.guests = t("bookings.guestsRequired");
    } else if (guests < 1) {
      newErrors.guests = t("bookings.atLeastOneGuest");
    } else if (guests > maxCapacity) {
      newErrors.guests = `${t("bookings.maxCapacityGuests").replace("{{count}}", String(maxCapacity))}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (!validateForm()) {
      return;
    }

    // Navigate to Submit Offer screen
    router.push({
      pathname: "/booking/submit-offer" as any,
      params: {
        listingId,
        listingType,
        startDate,
        endDate,
        numberOfGuests,
        specialRequests,
        propertyName,
        location,
        pricePerNight,
        propertyImage,
        bedrooms,
        bathrooms,
        capacity,
        basePrice: basePrice.toString(),
        duration: duration.toString(),
        totalPrice: totalPrice.toString(),
      },
    });
  };

  const incrementGuests = () => {
    const current = parseInt(numberOfGuests) || 0;
    if (current < maxCapacity) {
      setNumberOfGuests((current + 1).toString());
      setErrors({});
    }
  };

  const decrementGuests = () => {
    const current = parseInt(numberOfGuests) || 0;
    if (current > 1) {
      setNumberOfGuests((current - 1).toString());
      setErrors({});
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("bookings.bookingDetails")}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Listing Card */}
        <View style={styles.listingCard}>
          {propertyImage && (
            <Image
              source={{ uri: propertyImage as string }}
              style={styles.listingImage}
              contentFit="cover"
            />
          )}
          <View style={styles.listingDetails}>
            <Text style={styles.listingName}>
              {propertyName || t("bookings.property") || "Property"}
            </Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={14} color="#666666" />
              <Text style={styles.locationText}>{location || "Location"}</Text>
            </View>
            {listingType === "property" && bedrooms && bathrooms && (
              <View style={styles.amenitiesContainer}>
                <View style={styles.amenityItem}>
                  <Ionicons name="bed-outline" size={14} color="#666666" />
                  <Text style={styles.amenityText}>
                    {bedrooms} {t("explore.beds") || "beds"}
                  </Text>
                </View>
                <View style={styles.amenityItem}>
                  <Ionicons name="water-outline" size={14} color="#666666" />
                  <Text style={styles.amenityText}>
                    {bathrooms} {t("explore.baths") || "baths"}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Selected Dates (Read-only) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("bookings.selectedDates")}</Text>
          <View style={styles.datesContainer}>
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>
                {listingType === "vehicle"
                  ? t("bookings.pickupDate")
                  : t("bookings.checkIn")}
              </Text>
              <Text style={styles.dateValue}>
                {formatDate(startDate as string)}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#FF8C42" />
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>
                {listingType === "vehicle"
                  ? t("bookings.returnDate")
                  : t("bookings.checkOut")}
              </Text>
              <Text style={styles.dateValue}>
                {formatDate(endDate as string)}
              </Text>
            </View>
          </View>
          <Text style={styles.durationText}>
            {duration} {duration === 1 ? t("bookings.day") : t("bookings.days")}
          </Text>
        </View>

        {/* Number of Guests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("bookings.numberOfGuests")} *
          </Text>
          <View style={styles.guestsContainer}>
            <TouchableOpacity
              style={[
                styles.guestButton,
                parseInt(numberOfGuests) <= 1 && styles.guestButtonDisabled,
              ]}
              onPress={decrementGuests}
              disabled={parseInt(numberOfGuests) <= 1}
            >
              <Ionicons
                name="remove"
                size={20}
                color={parseInt(numberOfGuests) <= 1 ? "#CCCCCC" : "#FF8C42"}
              />
            </TouchableOpacity>
            <TextInput
              style={styles.guestsInput}
              value={numberOfGuests}
              onChangeText={(text) => {
                setNumberOfGuests(text);
                setErrors({});
              }}
              keyboardType="number-pad"
              maxLength={2}
            />
            <TouchableOpacity
              style={[
                styles.guestButton,
                parseInt(numberOfGuests) >= maxCapacity &&
                  styles.guestButtonDisabled,
              ]}
              onPress={incrementGuests}
              disabled={parseInt(numberOfGuests) >= maxCapacity}
            >
              <Ionicons
                name="add"
                size={20}
                color={
                  parseInt(numberOfGuests) >= maxCapacity
                    ? "#CCCCCC"
                    : "#FF8C42"
                }
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.capacityText}>
            {t("bookings.maximumCapacity").replace(
              "{{count}}",
              String(maxCapacity),
            )}
          </Text>
          {errors.guests && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#FF3B30" />
              <Text style={styles.errorText}>{errors.guests}</Text>
            </View>
          )}
        </View>

        {/* Special Requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("bookings.specialRequests")} ({t("bookings.optional")})
          </Text>
          <TextInput
            style={styles.textArea}
            value={specialRequests}
            onChangeText={setSpecialRequests}
            placeholder={
              t("bookings.specialRequests") ||
              "Any special requests or requirements?"
            }
            placeholderTextColor="#999999"
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.characterCount}>
            {specialRequests.length}/500
          </Text>
        </View>

        {/* Price Summary */}
        <View style={styles.priceSummary}>
          <Text style={styles.priceSummaryTitle}>{t("payment.overview")}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              ${basePrice.toFixed(2)} × {duration}{" "}
              {duration === 1 ? t("bookings.day") : t("bookings.days")}
            </Text>
            <Text style={styles.priceValue}>${totalPrice.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>{t("payment.subtotal")}</Text>
            <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
          </View>
          <Text style={styles.priceNote}>{t("bookings.submitOffer")}</Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.continueButton, isSubmitting && styles.disabledButton]}
          onPress={handleContinue}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.continueText}>{t("bookings.continue")}</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F8F8",
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
    paddingHorizontal: 20,
  },
  listingCard: {
    marginTop: 20,
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    overflow: "hidden",
  },
  listingImage: {
    width: "100%",
    height: 180,
  },
  listingDetails: {
    padding: 15,
  },
  listingName: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "raleway-600SemiBold",
    color: "#333333",
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationText: {
    fontSize: 13,
    color: "#666666",
    fontFamily: "raleway-400Regular",
    marginLeft: 4,
  },
  amenitiesContainer: {
    flexDirection: "row",
    gap: 15,
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  amenityText: {
    fontSize: 13,
    color: "#666666",
    fontFamily: "raleway-400Regular",
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "raleway-600SemiBold",
    color: "#333333",
    marginBottom: 12,
  },
  datesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9F9F9",
    padding: 15,
    borderRadius: 12,
  },
  dateBox: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: "#666666",
    fontFamily: "raleway-400Regular",
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "raleway-600SemiBold",
    color: "#333333",
  },
  durationText: {
    fontSize: 14,
    color: "#FF8C42",
    fontFamily: "raleway-500Medium",
    marginTop: 8,
    textAlign: "center",
  },
  guestsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9F9F9",
    padding: 15,
    borderRadius: 12,
  },
  guestButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF8C42",
  },
  guestButtonDisabled: {
    borderColor: "#E0E0E0",
    backgroundColor: "#F5F5F5",
  },
  guestsInput: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "raleway-700Bold",
    color: "#333333",
    textAlign: "center",
    minWidth: 60,
    marginHorizontal: 20,
  },
  capacityText: {
    fontSize: 12,
    color: "#666666",
    fontFamily: "raleway-400Regular",
    textAlign: "center",
    marginTop: 8,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 12,
  },
  errorText: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
    color: "#FF3B30",
    fontFamily: "raleway-400Regular",
  },
  textArea: {
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 15,
    fontSize: 14,
    fontFamily: "raleway-400Regular",
    color: "#333333",
    minHeight: 100,
    textAlignVertical: "top",
  },
  characterCount: {
    fontSize: 12,
    color: "#999999",
    fontFamily: "raleway-400Regular",
    textAlign: "right",
    marginTop: 6,
  },
  priceSummary: {
    marginTop: 24,
    marginBottom: 20,
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 20,
  },
  priceSummaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "raleway-600SemiBold",
    color: "#333333",
    marginBottom: 15,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 14,
    color: "#666666",
    fontFamily: "raleway-400Regular",
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "raleway-600SemiBold",
    color: "#333333",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "raleway-600SemiBold",
    color: "#333333",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "raleway-700Bold",
    color: "#FF8C42",
  },
  priceNote: {
    fontSize: 12,
    color: "#999999",
    fontFamily: "raleway-400Regular",
    fontStyle: "italic",
    marginTop: 10,
    textAlign: "center",
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  continueButton: {
    backgroundColor: "#FF8C42",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
  },
  continueText: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "raleway-600SemiBold",
    color: "#FFFFFF",
  },
});
