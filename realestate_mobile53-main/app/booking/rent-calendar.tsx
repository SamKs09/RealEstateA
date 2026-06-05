import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { CalendarPicker } from "../../components/Ui";
import { useTranslation } from "../../hooks/useTranslation";
import {
  getAvailability,
  checkDateAvailability,
  AvailabilityData,
} from "../../services/bookingService";

export default function RentCalendarScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams();

  // Extract listing details from params
  const {
    listingId,
    listingType,
    propertyName,
    location,
    pricePerNight,
    propertyImage,
    bedrooms,
    bathrooms,
    capacity,
  } = params;

  const [selectedStartDate, setSelectedStartDate] = useState(0);
  const [selectedEndDate, setSelectedEndDate] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [availability, setAvailability] = useState<AvailabilityData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const months = [
    t("bookings.january"),
    t("bookings.february"),
    t("bookings.march"),
    t("bookings.april"),
    t("bookings.may"),
    t("bookings.june"),
    t("bookings.july"),
    t("bookings.august"),
    t("bookings.september"),
    t("bookings.october"),
    t("bookings.november"),
    t("bookings.december"),
  ];

  // Fetch availability data on mount
  useEffect(() => {
    fetchAvailability();
  }, [listingId, listingType]);

  const fetchAvailability = async () => {
    if (!listingId || !listingType) {
      setErrorMessage("Missing listing information");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");
      const data = await getAvailability(
        listingId as string,
        listingType as "property" | "vehicle",
      );
      setAvailability(data);
    } catch (error: any) {
      console.error("Error fetching availability:", error);
      setErrorMessage(error.message || "Failed to load availability");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedStartDate(0);
    setSelectedEndDate(0);
    setErrorMessage("");
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedStartDate(0);
    setSelectedEndDate(0);
    setErrorMessage("");
  };

  const isDateAvailable = (date: number): boolean => {
    if (!availability) return true;

    const checkDate = new Date(currentYear, currentMonth - 1, date);
    const checkDateStr = checkDate.toISOString().split("T")[0];

    // Check if date is in booked ranges
    for (const range of availability.bookedRanges) {
      const start = new Date(range.startDate).toISOString().split("T")[0];
      const end = new Date(range.endDate).toISOString().split("T")[0];
      if (checkDateStr >= start && checkDateStr <= end) {
        return false;
      }
    }

    // Check if date is in blocked ranges
    for (const range of availability.blockedRanges) {
      const start = new Date(range.startDate).toISOString().split("T")[0];
      const end = new Date(range.endDate).toISOString().split("T")[0];
      if (checkDateStr >= start && checkDateStr <= end) {
        return false;
      }
    }

    // If defaultAvailable is false, check if date is in available ranges
    if (!availability.defaultAvailable) {
      let isInAvailableRange = false;
      for (const range of availability.availableRanges) {
        const start = new Date(range.startDate).toISOString().split("T")[0];
        const end = new Date(range.endDate).toISOString().split("T")[0];
        if (checkDateStr >= start && checkDateStr <= end) {
          isInAvailableRange = true;
          break;
        }
      }
      return isInAvailableRange;
    }

    return true;
  };

  const handleDateSelect = (date: number) => {
    // Check if date is in the past
    const selectedDate = new Date(currentYear, currentMonth - 1, date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setErrorMessage("Cannot select past dates");
      return;
    }

    // Check if date is available
    if (!isDateAvailable(date)) {
      setErrorMessage("This date is not available");
      return;
    }

    setErrorMessage("");

    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // First selection or reset: set start date
      setSelectedStartDate(date);
      setSelectedEndDate(0);
    } else if (selectedStartDate && !selectedEndDate) {
      // Second selection: set end date
      if (date > selectedStartDate) {
        // Check if all dates in range are available
        let allAvailable = true;
        for (let d = selectedStartDate; d <= date; d++) {
          if (!isDateAvailable(d)) {
            allAvailable = false;
            break;
          }
        }

        if (allAvailable) {
          setSelectedEndDate(date);
        } else {
          setErrorMessage("Some dates in this range are not available");
        }
      } else {
        // If selected date is before start date, make it the new start date
        setSelectedStartDate(date);
        setSelectedEndDate(0);
      }
    }
  };

  const validateAndProceed = async () => {
    if (!selectedStartDate) {
      setErrorMessage("Please select check-in date");
      return;
    }

    if (!selectedEndDate) {
      setErrorMessage("Please select check-out date");
      return;
    }

    setIsValidating(true);
    setErrorMessage("");

    try {
      // Format dates for API
      const startDate = new Date(
        currentYear,
        currentMonth - 1,
        selectedStartDate,
      ).toISOString();
      const endDate = new Date(
        currentYear,
        currentMonth - 1,
        selectedEndDate,
      ).toISOString();

      // Validate with backend
      const result = await checkDateAvailability(
        listingId as string,
        listingType as "property" | "vehicle",
        startDate,
        endDate,
      );

      if (!result.available) {
        setErrorMessage(result.reason || "Selected dates are not available");
        return;
      }

      // Check minimum rental days
      if (availability?.minRentalDays) {
        const duration = selectedEndDate - selectedStartDate + 1;
        if (duration < availability.minRentalDays) {
          setErrorMessage(
            `Minimum rental period is ${availability.minRentalDays} days`,
          );
          return;
        }
      }

      // Check maximum rental days
      if (availability?.maxRentalDays) {
        const duration = selectedEndDate - selectedStartDate + 1;
        if (duration > availability.maxRentalDays) {
          setErrorMessage(
            `Maximum rental period is ${availability.maxRentalDays} days`,
          );
          return;
        }
      }

      // Navigate to booking form
      router.push({
        pathname: "/booking/booking-form" as any,
        params: {
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
        },
      });
    } catch (error: any) {
      console.error("Error validating dates:", error);
      setErrorMessage(error.message || "Failed to validate dates");
    } finally {
      setIsValidating(false);
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
          <Ionicons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {listingType === "vehicle"
            ? t("bookings.selectRentalDates")
            : t("bookings.selectDates")}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Listing Info */}
        <View style={styles.listingInfo}>
          <Text style={styles.listingName}>{propertyName || "Property"}</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color="#666666" />
            <Text style={styles.locationText}>{location || "Location"}</Text>
          </View>
          <Text style={styles.priceText}>
            ${pricePerNight || "0"} / {t("bookings.night")}
          </Text>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF8C42" />
            <Text style={styles.loadingText}>Loading availability...</Text>
          </View>
        )}

        {/* Error Message */}
        {errorMessage && !isLoading && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#FF3B30" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Calendar Section */}
        {!isLoading && (
          <View style={styles.calendarSection}>
            <CalendarPicker
              selectedStartDate={selectedStartDate}
              selectedEndDate={selectedEndDate}
              currentMonth={currentMonth}
              currentYear={currentYear}
              onDateSelect={handleDateSelect}
              onPreviousMonth={handlePreviousMonth}
              onNextMonth={handleNextMonth}
              disabledDates={(date) => !isDateAvailable(date)}
            />

            {/* Selected Date Range Display */}
            {selectedStartDate > 0 && (
              <View style={styles.selectedDatesContainer}>
                <Text style={styles.selectedDatesTitle}>
                  {t("bookings.selectedDates")}
                </Text>
                <View style={styles.dateRangeDisplay}>
                  <View style={styles.dateItem}>
                    <Text style={styles.dateLabel}>
                      {listingType === "vehicle"
                        ? t("bookings.pickupDate")
                        : t("bookings.checkIn")}
                    </Text>
                    <View style={styles.dateValueContainer}>
                      <Text style={styles.dateValue}>{selectedStartDate}</Text>
                      <Text style={styles.monthText}>
                        {" "}
                        {months[currentMonth - 1]}{" "}
                      </Text>
                      <Text style={styles.dateValue}>{currentYear}</Text>
                    </View>
                  </View>
                  {selectedEndDate > 0 && (
                    <View style={styles.dateItem}>
                      <Text style={styles.dateLabel}>
                        {listingType === "vehicle"
                          ? t("bookings.returnDate")
                          : t("bookings.checkOut")}
                      </Text>
                      <View style={styles.dateValueContainer}>
                        <Text style={styles.dateValue}>{selectedEndDate}</Text>
                        <Text style={styles.monthText}>
                          {" "}
                          {months[currentMonth - 1]}{" "}
                        </Text>
                        <Text style={styles.dateValue}>{currentYear}</Text>
                      </View>
                    </View>
                  )}
                </View>
                {selectedEndDate > 0 && (
                  <Text style={styles.durationText}>
                    {selectedEndDate - selectedStartDate + 1}{" "}
                    {t("bookings.days")}
                  </Text>
                )}
              </View>
            )}

            {/* Availability Legend */}
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#FF8C42" }]}
                />
                <Text style={styles.legendText}>Available</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#E0E0E0" }]}
                />
                <Text style={styles.legendText}>Unavailable</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: "#4CAF50" }]}
                />
                <Text style={styles.legendText}>Selected</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!selectedStartDate || !selectedEndDate || isValidating) &&
              styles.disabledButton,
          ]}
          onPress={validateAndProceed}
          disabled={!selectedStartDate || !selectedEndDate || isValidating}
        >
          {isValidating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.continueText}>{t("bookings.continue")}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
  listingInfo: {
    marginVertical: 20,
    padding: 15,
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
  },
  listingName: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "raleway-600SemiBold",
    color: "#333333",
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: "#666666",
    fontFamily: "raleway-400Regular",
    marginLeft: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "raleway-600SemiBold",
    color: "#FF8C42",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666666",
    fontFamily: "raleway-400Regular",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE5E5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#FF3B30",
    fontFamily: "raleway-400Regular",
  },
  calendarSection: {
    borderColor: "#FF8C42",
    borderWidth: 1,
    borderRadius: 15,
    marginVertical: 20,
    padding: 10,
  },
  selectedDatesContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: "#F9F9F9",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  selectedDatesTitle: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "raleway-600SemiBold",
    color: "#333333",
    marginBottom: 10,
  },
  dateRangeDisplay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateItem: {
    flex: 1,
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 5,
    fontWeight: "500",
    fontFamily: "raleway-500Medium",
  },
  dateValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dateValue: {
    fontSize: 16,
    color: "#333333",
    fontWeight: "bold",
    fontFamily: "raleway-700Bold",
  },
  monthText: {
    fontSize: 16,
    color: "#333333",
    fontWeight: "bold",
    fontFamily: "raleway-600SemiBold",
  },
  durationText: {
    textAlign: "center",
    fontSize: 14,
    color: "#FF8C42",
    fontFamily: "raleway-500Medium",
    marginTop: 10,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#666666",
    fontFamily: "raleway-400Regular",
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
