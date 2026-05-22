import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Colors } from "../styles";
import { BackButton } from "./BackButton";

import { Text } from "react-native";

interface HeaderWithBackButtonProps {
  onBackPress?: () => void;
  style?: any;
  title?: string;
}

export const HeaderWithBackButton: React.FC<HeaderWithBackButtonProps> = ({
  onBackPress,
  style,
  title,
}) => {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.content}>
        <BackButton onPress={onBackPress} color={Colors.textPrimary} />
        {title && <Text style={styles.title}>{title}</Text>}
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "white",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  title: {
    fontSize: 20,
    fontFamily: "Raleway-Bold",
    color: Colors.textPrimary,
  },
});
