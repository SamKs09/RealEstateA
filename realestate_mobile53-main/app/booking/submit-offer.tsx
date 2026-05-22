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
import { useAuth } from "../../contexts/AuthContext";
import { usePopup } from "../../contexts/PopupContext";
import { useTranslation } from "../../hooks/useTranslation";
import { createBooking, formatDate } from "../../services/bookingService";

export default function SubmitOfferScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showError } = usePopup();
  const params = useLocalSearchParams();

  // Extract params
  const {
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
    basePrice,
    duration,
    totalPrice,
  } = params;

  const basePriceNum = parseFloat(basePrice as string) || 0;
  const durationNum = parseInt(duration as string) || 1;
  const totalPriceNum = parseFloat(totalPrice as string) || 0;

  const [proposedPrice, setProposedPrice] = useState(totalPriceNum.toString());
  const [guestMessage, setGuestMessage] = useState("");
  const [errors, setErrors] = useState<{ price?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick suggestion percentages
  const suggestions = [
    { label: "-5%", value: totalPriceNum * 0.95 },
    { label: "-10%", value: totalPriceNum * 0.9 },
    { label: "-15%", value: totalPriceNum * 0.85 },
    { label: "-20%", value: totalPriceNum * 0.8 },
  ];

  const validateForm = (): boolean => {
    const newErrors: { price?: string } = {};
    const price = parseFloat(proposedPrice);

    if (!proposedPrice || isNaN(price)) {
      newErrors.price = t("bookings.priceRequired");
    } else if (price <= 0) {
      newErrors.price = t("bookings.priceGreaterThanZero");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSuggestionPress = (value: number) => {
    setProposedPrice(value.toFixed(2));
    setErrors({});
  };

  const handleSubmitOffer = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user?._id) {
      showError(t("bookings.guestsRequired"), t("error"));
      return;
    }

    setIsSubmitting(true);

    try {
      const bookingData = {
        listingId: listingId as string,
        listingType: listingType as "property" | "vehicle",
        startDate: startDate as string,
        endDate: endDate as string,
        numberOfGuests: parseInt(numberOfGuests as string),
        proposedPrice: parseFloat(proposedPrice),
        guestMessage: guestMessage || undefined,
        specialRequests: (specialRequests as string) || undefined,
      };

      const result = await createBooking(bookingData);

      // Navigate to Offer Submitted confirmation screen
      router.replace({
        pathname: "/booking/offer-submitted" as any,
        params: {
          bookingId: result.booking._id,
          chatThreadId: result.chatThreadId,
          propertyName,
          location,
          startDate,
          endDate,
          proposedPrice,
          duration,
        },
      });
    } catch (error: any) {
      console.error("Error submitting offer:", error);
      showError(error.message || t("bookings.offerNote"), t("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const pricePerDay = parseFloat(proposedPrice) / durationNum;

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
        <Text style={styles.headerTitle}>{t("bookings.submitOffer")}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Booking Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            {t("bookings.bookingSummary")}
          </Text>

          {propertyImage && (
            <Image
              source={{ uri: propertyImage as string }}
              style={styles.summaryImage}
              contentFit="cover"
            />
          )}

          <View style={styles.summaryDetails}>
            <Text style={styles.summaryPropertyName}>{propertyName}</Text>
            <View style={styles.summaryRow}>
              <Ionicons name="location-outline" size={14} color="#666666" />
              <Text style={styles.summaryText}>{location}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="calendar-outline" size={14} color="#666666" />
              <Text style={styles.summaryText}>
                {formatDate(startDate as string)} -{" "}
                {formatDate(endDate as string)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="time-outline" size={14} color="#666666" />
              <Text style={styles.summaryText}>
                {duration}{" "}
                {durationNum === 1 ? t("bookings.day") : t("bookings.days")}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Ionicons name="people-outline" size={14} color="#666666" />
              <Text style={styles.summaryText}>
                {numberOfGuests}{" "}
                {parseInt(numberOfGuests as string) === 1
                  ? t("payment.guest")
                  : t("payment.guests")}
              </Text>
            </View>
          </View>
        </View>

        {/* Base Price Display */}
        <View style={styles.basePriceCard}>
          <Text style={styles.basePriceLabel}>
            {t("bookings.ownersListedPrice")}
          </Text>
          <Text style={styles.basePriceValue}>${totalPriceNum.toFixed(2)}</Text>
          <Text style={styles.basePriceSubtext}>
            ${basePriceNum.toFixed(2)} {t("bookings.perDay")} × {duration}{" "}
            {t("bookings.days")}
          </Text>
        </View>

        {/* Quick Price Suggestions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("bookings.quickPriceSuggestions")}
          </Text>
          <View style={styles.suggestionsContainer}>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.suggestionButton,
                  parseFloat(proposedPrice) === suggestion.value &&
                    styles.suggestionButtonActive,
                ]}
                onPress={() => handleSuggestionPress(suggestion.value)}
              >
                <Text
                  style={[
                    styles.suggestionLabel,
                    parseFloat(proposedPrice) === suggestion.value &&
                      styles.suggestionLabelActive,
                  ]}
                >
                  {suggestion.label}
                </Text>
                <Text
                  style={[
                    styles.suggestionValue,
                    parseFloat(proposedPrice) === suggestion.value &&
                      styles.suggestionValueActive,
                  ]}
                >
                  ${suggestion.value.toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom Price Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("bookings.yourOfferPrice")} *
          </Text>
          <View style={styles.priceInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.priceInput}
              value={proposedPrice}
              onChangeText={(text) => {
                setProposedPrice(text);
                setErrors({});
              }}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#CCCCCC"
            />
          </View>
          {errors.price && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#FF3B30" />
              <Text style={styles.errorText}>{errors.price}</Text>
            </View>
          )}
          <Text style={styles.pricePerDayText}>
            ${pricePerDay.toFixed(2)} {t("bookings.perDay")}
          </Text>
        </View>

        {/* Total Price Display */}
        <View style={styles.totalPriceCard}>
          <View style={styles.totalPriceRow}>
            <Text style={styles.totalPriceLabel}>
              {t("bookings.totalOffer")}
            </Text>
            <Text style={styles.totalPriceValue}>
              ${parseFloat(proposedPrice || "0").toFixed(2)}
            </Text>
          </View>
          {parseFloat(proposedPrice) < totalPriceNum && (
            <View style={styles.savingsContainer}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.savingsText}>
                {t("bookings.yourOfferLabel")}: $
                {(totalPriceNum - parseFloat(proposedPrice)).toFixed(2)}{" "}
                {t("bookings.perDay")}
              </Text>
            </View>
          )}
        </View>

        {/* Message to Seller */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t("bookings.messageToSeller")} ({t("bookings.optional")})
          </Text>
          <TextInput
            style={styles.textArea}
            value={guestMessage}
            onChangeText={setGuestMessage}
            placeholder="Introduce yourself and explain your offer..."
            placeholderTextColor="#999999"
            multiline
            numberOfLines={5}
            maxLength={500}
          />
          <Text style={styles.characterCount}>{guestMessage.length}/500</Text>
        </View>

        {/* Important Note */}
        <View style={styles.noteCard}>
          <Ionicons name="information-circle" size={20} color="#FF8C42" />
          <Text style={styles.noteText}>{t("bookings.offerNote")}</Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.disabledButton]}
          onPress={handleSubmitOffer}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.submitText}>Submit Offer</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </>
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
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "raleway-600SemiBold",
    color: "#333333",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryCard: {
    marginTop: 20,
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    overflow: "hidden",
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "raleway-600SemiBold",
    color: "#333333",
    padding: 15,
    paddingBottom: 10,
  },
  summaryImage: {
    width: "100%",
    height: 150,
  },
  summaryDetails: {
    padding: 15,
  },
  summaryPropertyName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "raleway-600SemiBold",
    color: "#333333",
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 13,
    color: "#666666",
    fontFamily: "raleway-400Regular",
    marginLeft: 6,
  },
  basePriceCard: {
    marginTop: 20,
    backgroundColor: "#FFF5F0",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFE0D0",
  },
  basePriceLabel: {
    fontSize: 14,
    color: "#666666",
    fontFamily: "raleway-400Regular",
    marginBottom: 8,
  },
  basePriceValue: {
    fontSize: 32,
    fontWeight: "bold",
    fontFamily: "raleway-700Bold",
    color: "#FF8C42",
    marginBottom: 4,
  },
  basePriceSubtext: {
    fontSize: 13,
    color: "#999999",
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
  suggestionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  suggestionButton: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  suggestionButtonActive: {
    backgroundColor: "#FFF5F0",
    borderColor: "#FF8C42",
  },
  suggestionLabel: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "raleway-600SemiBold",
    color: "#666666",
    marginBottom: 4,
  },
  suggestionLabelActive: {
    color: "#FF8C42",
  },
  suggestionValue: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "raleway-700Bold",
    color: "#333333",
  },
  suggestionValueActive: {
    color: "#FF8C42",
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "raleway-700Bold",
    color: "#333333",
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "bold",
    fontFamily: "raleway-700Bold",
    color: "#333333",
    paddingVertical: 15,
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
  pricePerDayText: {
    fontSize: 13,
    color: "#999999",
    fontFamily: "raleway-400Regular",
    marginTop: 8,
    textAlign: "center",
  },
  totalPriceCard: {
    marginTop: 20,
    backgroundColor: "#F0F8FF",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#D0E8FF",
  },
  totalPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalPriceLabel: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "raleway-600SemiBold",
    color: "#333333",
  },
  totalPriceValue: {
    fontSize: 28,
    fontWeight: "bold",
    fontFamily: "raleway-700Bold",
    color: "#2196F3",
  },
  savingsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#D0E8FF",
  },
  savingsText: {
    flex: 1,
    fontSize: 13,
    color: "#4CAF50",
    fontFamily: "raleway-500Medium",
    marginLeft: 6,
  },
  textArea: {
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 15,
    fontSize: 14,
    fontFamily: "raleway-400Regular",
    color: "#333333",
    minHeight: 120,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  characterCount: {
    fontSize: 12,
    color: "#999999",
    fontFamily: "raleway-400Regular",
    textAlign: "right",
    marginTop: 6,
  },
  noteCard: {
    flexDirection: "row",
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: "#FFF5F0",
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#FFE0D0",
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: "#666666",
    fontFamily: "raleway-400Regular",
    marginLeft: 10,
    lineHeight: 20,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  submitButton: {
    backgroundColor: "#FF8C42",
    borderRadius: 25,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
  },
  submitText: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "raleway-600SemiBold",
    color: "#FFFFFF",
  },
});
