import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "../../hooks/useTranslation";

interface CalendarPickerProps {
  selectedStartDate: number;
  selectedEndDate: number;
  currentMonth: number;
  currentYear: number;
  onDateSelect: (date: number) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  /** Return true to mark a day as unavailable (dimmed, non-selectable) */
  disabledDates?: (date: number) => boolean;
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({
  selectedStartDate,
  selectedEndDate,
  currentMonth,
  currentYear,
  onDateSelect,
  onPreviousMonth,
  onNextMonth,
  disabledDates,
}) => {
  const { t } = useTranslation();

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

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const totalCells = 42; // 6 rows × 7 days
    const cells = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      cells.push(
        <View key={`empty-${i}`} style={styles.dateCell}>
          <Text style={styles.inactiveDateText}></Text>
        </View>,
      );
    }

    // Add cells for actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isDisabled = disabledDates ? disabledDates(day) : false;
      const isStartDate = selectedStartDate === day;
      const isEndDate = selectedEndDate === day;
      const isInRange =
        selectedStartDate &&
        selectedEndDate &&
        selectedStartDate < selectedEndDate &&
        day > selectedStartDate &&
        day < selectedEndDate;
      const isSelected = isStartDate || isEndDate;

      let cellStyle: any = styles.dateCell;
      let textStyle: any = styles.dateText;

      if (isDisabled) {
        cellStyle = [styles.dateCell, styles.disabledDate];
        textStyle = [styles.dateText, styles.disabledDateText];
      } else if (isSelected) {
        cellStyle = [styles.dateCell, styles.selectedDate];
        textStyle = [styles.dateText, styles.selectedDateText];
      } else if (isInRange) {
        cellStyle = [styles.dateCell, styles.rangeDate];
        textStyle = [styles.dateText, styles.selectedDateText];
      }

      cells.push(
        <TouchableOpacity
          key={day}
          style={cellStyle}
          onPress={() => !isDisabled && onDateSelect(day)}
          disabled={isDisabled}
          activeOpacity={isDisabled ? 1 : 0.7}
        >
          <Text style={textStyle}>{day}</Text>
        </TouchableOpacity>,
      );
    }

    // Fill remaining cells to complete the grid
    const remainingCells = totalCells - cells.length;
    for (let i = 0; i < remainingCells; i++) {
      cells.push(
        <View key={`empty-end-${i}`} style={styles.dateCell}>
          <Text style={styles.inactiveDateText}></Text>
        </View>,
      );
    }

    return cells;
  };

  return (
    <View style={styles.container}>
      {/* Calendar Header */}
      <View style={styles.calendarHeader}>
        <TouchableOpacity style={styles.navButton} onPress={onPreviousMonth}>
          <Ionicons name="chevron-back" size={20} color="#666666" />
        </TouchableOpacity>
        <View style={styles.monthYearContainer}>
          <Text style={styles.monthText}>{months[currentMonth - 1]} </Text>
          <Text style={styles.yearText}>{currentYear}</Text>
        </View>
        <TouchableOpacity style={styles.navButton} onPress={onNextMonth}>
          <Ionicons name="chevron-forward" size={20} color="#666666" />
        </TouchableOpacity>
      </View>

      {/* Days of Week */}
      <View style={styles.daysOfWeek}>
        {[
          t("bookings.sun"),
          t("bookings.mon"),
          t("bookings.tue"),
          t("bookings.wed"),
          t("bookings.thu"),
          t("bookings.fri"),
          t("bookings.sat"),
        ].map((day) => (
          <Text key={day} style={styles.dayLabel}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>{renderCalendarGrid()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    marginVertical: 10,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F8F8F8",
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  monthYearContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  monthText: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "raleway-500Medium",
    color: "#333333",
  },
  yearText: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "raleway-700Bold",
    color: "#333333",
  },
  daysOfWeek: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "raleway-500Medium",
    color: "#666666",
    textAlign: "center",
    width: 40,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dateCell: {
    width: "14.28%", // 7 columns
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 2,
  },
  dateText: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "500",
    fontFamily: "raleway-500Medium",
  },
  selectedDate: {
    backgroundColor: "#FF8C42",
    borderRadius: 20,
  },
  startDate: {
    backgroundColor: "#FF8C42",
    borderRadius: 20,
  },
  endDate: {
    backgroundColor: "#FF8C42",
    borderRadius: 20,
  },
  rangeDate: {
    backgroundColor: "#FFE5D6",
    borderRadius: 0,
  },
  selectedDateText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontFamily: "raleway-700Bold",
  },
  inactiveDateText: {
    color: "#CCCCCC",
    fontFamily: "raleway-400Regular",
  },
  disabledDate: {
    opacity: 0.3,
  },
  disabledDateText: {
    color: "#999999",
    textDecorationLine: "line-through",
  },
});

export default CalendarPicker;
