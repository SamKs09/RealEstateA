import React, { forwardRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetModalMethods } from "./BottomSheet";

interface TimePickerModalProps {
  title: string;
  selectedTime: string;
  timeSlots: string[];
  onTimeSelect: (time: string) => void;
}

export type TimePickerModalRef = BottomSheetModalMethods;

const TimePickerModal = forwardRef<TimePickerModalRef, TimePickerModalProps>(
  ({ title, selectedTime, timeSlots, onTimeSelect }, ref) => {
    return (
      <BottomSheet ref={ref} title={title} snapPoints={["60%"]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeOption,
                  selectedTime === time && styles.selectedTimeOption,
                ]}
                onPress={() => onTimeSelect(time)}
              >
                <Text
                  style={[
                    styles.timeText,
                    selectedTime === time && styles.selectedTimeText,
                  ]}
                >
                  {time}
                </Text>
                {selectedTime === time && (
                  <Ionicons name="checkmark" size={20} color="#FF8C42" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </BottomSheet>
    );
  }
);

export default TimePickerModal;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  timeOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  selectedTimeOption: {
    backgroundColor: "#FFF5F0",
    borderColor: "#FF8C42",
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 2,
    paddingHorizontal: 15,
  },
  timeText: {
    fontSize: 14,
    color: "#333333",
    fontFamily: "raleway-400Regular",
  },
  selectedTimeText: {
    color: "#FF8C42",
    fontWeight: "bold",
    fontFamily: "raleway-700Bold",
  },
});
