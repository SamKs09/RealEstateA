import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  CalendarPicker,
  TimeSelector,
  ToggleSwitch,
  TimePickerModal,
} from "../../components/Ui";
import { useTranslation } from "../../hooks/useTranslation";
import { useInterest } from "../../contexts/InterestContext";

export default function BookingDetailsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { userInterest } = useInterest();

  const {
    listingId,
    analyticsListingType,
    propertyName,
    location,
    pricePerNight,
    propertyImage,
    bedrooms,
    bathrooms,
  } = params;

  const [selectedStartDate, setSelectedStartDate] = useState(0);
  const [selectedEndDate, setSelectedEndDate] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(10); // October = 10
  const [currentYear, setCurrentYear] = useState(2025);
  const [arrivingTime, setArrivingTime] = useState("09:00 AM");
  const [leavingTime, setLeavingTime] = useState("05:00 PM");
  const arrivingModalRef = useRef<any>(null);
  const leavingModalRef = useRef<any>(null);
  const [driverEnabled, setDriverEnabled] = useState(true);

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

  const timeSlots = [
    "06:00 AM",
    "07:00 AM",
    "08:00 AM",
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM",
    "06:00 PM",
    "07:00 PM",
    "08:00 PM",
    "09:00 PM",
    "10:00 PM",
  ];

  const handlePreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedStartDate(0); // Reset selected dates when changing month
    setSelectedEndDate(0);
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedStartDate(0); // Reset selected dates when changing month
    setSelectedEndDate(0);
  };

  const handleDateSelect = (date: number) => {
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // First selection or reset: set start date
      setSelectedStartDate(date);
      setSelectedEndDate(0);
    } else if (selectedStartDate && !selectedEndDate) {
      // Second selection: set end date
      if (date > selectedStartDate) {
        setSelectedEndDate(date);
      } else {
        // If selected date is before start date, make it the new start date
        setSelectedStartDate(date);
        setSelectedEndDate(0);
      }
    }
  };

  const handleArrivingTimeSelect = (time: string) => {
    setArrivingTime(time);
    arrivingModalRef.current?.dismiss();
  };

  const handleLeavingTimeSelect = (time: string) => {
    setLeavingTime(time);
    leavingModalRef.current?.dismiss();
  };

  const handleConfirmBooking = () => {
    // Format dates properly for payment page
    const formatDateForPayment = (day: number, month: number, year: number) => {
      const date = new Date(year, month - 1, day);
      return date.toISOString();
    };

    const checkInDate = formatDateForPayment(
      selectedStartDate,
      currentMonth,
      currentYear
    );
    let checkOutDate = checkInDate; // Default to same day if no end date selected

    if (selectedEndDate) {
      checkOutDate = formatDateForPayment(
        selectedEndDate,
        currentMonth,
        currentYear
      );
    }

    // Navigate to payment screen with booking data
    router.push({
      pathname: "/payment" as any,
      params: {
        listingId: (listingId as string) || "",
        analyticsListingType: (analyticsListingType as string) || "",
        checkInDate,
        checkOutDate,
        arrivingTime,
        leavingTime,
        driverEnabled: driverEnabled.toString(),
        propertyName: (propertyName as string) || t("bookings.sampleProperty1"),
        location: (location as string) || t("bookings.sampleLocation"),
        pricePerNight: (pricePerNight as string) || "180",
        propertyImage: (propertyImage as string) || "",
        bedrooms: (bedrooms as string) || "0",
        bathrooms: (bathrooms as string) || "0",
      },
    });
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
        <Text style={styles.headerTitle}>{t("bookings.confirmBooking")}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Book with Driver Section - Only show for cars */}
        {userInterest === "cars" && (
          <View style={styles.driverSection}>
            <View style={styles.driverHeader}>
              <View style={styles.driverIconContainer}>
                <Ionicons name="car" size={24} color="#FF8C42" />
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverTitle}>
                  {t("bookings.bookWithDriver")}
                </Text>
                <Text style={styles.driverSubtitle}>
                  {t("bookings.professionalDriverService")}
                </Text>
              </View>
            </View>
            <ToggleSwitch
              label=""
              value={driverEnabled}
              onToggle={setDriverEnabled}
            />
          </View>
        )}

        {/* Calendar Section */}
        <View style={styles.calendarSection}>
          <CalendarPicker
            selectedStartDate={selectedStartDate}
            selectedEndDate={selectedEndDate}
            currentMonth={currentMonth}
            currentYear={currentYear}
            onDateSelect={handleDateSelect}
            onPreviousMonth={handlePreviousMonth}
            onNextMonth={handleNextMonth}
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
                    {userInterest === "cars"
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
                      {userInterest === "cars"
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
              {!selectedEndDate && (
                <Text style={styles.singleDayNote}>
                  {t("bookings.singleDayBooking")}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Time Selection Section */}
        <View style={styles.timeSection}>
          <View style={styles.timeRow}>
            <TimeSelector
              label={
                userInterest === "cars"
                  ? t("bookings.pickupTime")
                  : t("bookings.arrivingTime")
              }
              selectedTime={arrivingTime}
              onPress={() => arrivingModalRef.current?.present()}
            />

            <TimeSelector
              label={
                userInterest === "cars"
                  ? t("bookings.returnTime")
                  : t("bookings.leavingTime")
              }
              selectedTime={leavingTime}
              onPress={() => leavingModalRef.current?.present()}
            />
          </View>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            !selectedStartDate && styles.disabledButton,
          ]}
          onPress={handleConfirmBooking}
          disabled={!selectedStartDate}
        >
          <Text style={styles.confirmText}>{t("bookings.confirmBooking")}</Text>
        </TouchableOpacity>
      </View>

      {/* Time Picker Bottom Sheets */}
      <TimePickerModal
        ref={arrivingModalRef}
        title={
          userInterest === "cars"
            ? t("bookings.selectPickupTime")
            : t("bookings.selectArrivingTime")
        }
        selectedTime={arrivingTime}
        timeSlots={timeSlots}
        onTimeSelect={handleArrivingTimeSelect}
      />

      <TimePickerModal
        ref={leavingModalRef}
        title={
          userInterest === "cars"
            ? t("bookings.selectReturnTime")
            : t("bookings.selectLeavingTime")
        }
        selectedTime={leavingTime}
        timeSlots={timeSlots}
        onTimeSelect={handleLeavingTimeSelect}
      />
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
  // Driver Section Styles
  driverSection: {
    marginVertical: 20,
    backgroundColor: "#F8F8F8",
    borderRadius: 15,
    padding: 15,
  },
  driverHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  driverIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  driverInfo: {
    flex: 1,
  },
  driverTitle: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "raleway-500Medium",
    color: "#333333",
    marginBottom: 4,
  },
  driverSubtitle: {
    fontSize: 14,
    color: "#8A8A8A",
    fontFamily: "raleway-400Regular",
  },
  // Calendar Section Styles
  calendarSection: {
    borderColor: "#F85B00",
    borderWidth: 1,
    borderRadius: 15,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "raleway-500Medium",
    color: "#333333",
    marginBottom: 20,
  },
  // Time Section Styles
  timeSection: {
    marginVertical: 20,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },
  // Bottom Section
  bottomSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  confirmButton: {
    backgroundColor: "#FF8C42",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
  },
  confirmText: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "raleway-500Medium",
    color: "#FFFFFF",
  },
  // Selected Dates Display Styles
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
    fontFamily: "raleway-500Medium",
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
    fontFamily: "raleway-500Medium",
  },
  singleDayNote: {
    textAlign: "center",
    fontSize: 14,
    color: "#FF8C42",
    fontStyle: "italic",
    fontFamily: "raleway-400Regular",
    marginTop: 10,
  },
});
