import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface TimeSelectorProps {
  label: string;
  selectedTime: string;
  onPress: () => void;
  icon?: string;
}

const TimeSelector: React.FC<TimeSelectorProps> = ({
  label,
  selectedTime,
  onPress,
  icon = "time-outline",
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.selector} onPress={onPress}>
        <Ionicons name={icon as any} size={20} color="#8A8A8A" />
        <Text style={styles.value}>{selectedTime}</Text>
        <Ionicons name="chevron-down" size={16} color="#8A8A8A" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 10,
    fontFamily: "raleway-500Medium",
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderRadius: 10,
    padding: 15,
    justifyContent: "space-between",
  },
  value: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "500",
    flex: 1,
    marginLeft: 10,
    fontFamily: "raleway-500Medium",
  },
});

export default TimeSelector;
