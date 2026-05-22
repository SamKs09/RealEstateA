import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../styles";

interface NumericKeypadProps {
  onNumberPress: (number: string) => void;
  onBackspace: () => void;
  style?: any;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onNumberPress,
  onBackspace,
  style,
}) => {
  const keypadData = [
    [
      { number: "1", letters: "" },
      { number: "2", letters: "ABC" },
      { number: "3", letters: "DEF" },
    ],
    [
      { number: "4", letters: "GHI" },
      { number: "5", letters: "JKL" },
      { number: "6", letters: "MNO" },
    ],
    [
      { number: "7", letters: "PQRS" },
      { number: "8", letters: "TUV" },
      { number: "9", letters: "WXYZ" },
    ],
  ];

  return (
    <View style={[styles.keypad, style]}>
      {keypadData.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.keypadRow}>
          {row.map((key) => (
            <TouchableOpacity
              key={key.number}
              style={styles.keypadButton}
              onPress={() => onNumberPress(key.number)}
            >
              <Text style={styles.keypadNumber}>{key.number}</Text>
              <Text style={styles.keypadLetters}>{key.letters}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {/* Bottom row with 0 and backspace */}
      <View style={styles.keypadRow}>
        <View style={styles.keypadButton} />
        <TouchableOpacity
          style={styles.keypadButton}
          onPress={() => onNumberPress("0")}
        >
          <Text style={styles.keypadNumber}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.keypadButton} onPress={onBackspace}>
          <Ionicons
            name="backspace-outline"
            size={24}
            color={Colors.textPrimary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  keypad: {
    backgroundColor: Colors.backgroundLight,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  keypadRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  keypadButton: {
    width: 80,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  keypadNumber: {
    fontSize: 24,
    fontWeight: "300",
    color: Colors.textPrimary,
    fontFamily: "raleway-300Light",
  },
  keypadLetters: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontFamily: "raleway-400Regular",
    marginTop: 2,
  },
});
