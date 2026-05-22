import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, FormStyles } from "../styles";
import { Typography } from "../styles/GlobalStyles";

interface FloatingLabelInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  onPasswordToggle?: () => void;
  passwordVisible?: boolean;
  error?: string;
  style?: ViewStyle;
  placeholderTextColor?: string;
  important?: boolean;
  accessibilityLabel?: string;
}

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  autoCapitalize = "sentences",
  secureTextEntry = false,
  showPasswordToggle = false,
  onPasswordToggle,
  passwordVisible = false,
  error,
  style,
  placeholderTextColor = Colors.textLight,
  important = false,
  accessibilityLabel,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View
        style={[styles.floatingLabelContainer, error && FormStyles.inputError]}
      >
        <Text
          style={[
            styles.floatingLabel,
            { fontFamily: Typography.fontFamily.medium },
          ]}
        >
          {label}
          {important && <Text style={{ color: "red" }}> *</Text>}
        </Text>
        {showPasswordToggle ? (
          <View style={styles.passwordInputRow}>
            <TextInput
              style={[
                styles.floatingPasswordInput,
                { fontFamily: Typography.fontFamily.regular },
              ]}
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
              secureTextEntry={secureTextEntry && !passwordVisible}
              placeholderTextColor={placeholderTextColor}
              accessibilityLabel={accessibilityLabel}
            />
            <TouchableOpacity
              onPress={onPasswordToggle}
              style={styles.eyeIconContainer}
            >
              <Ionicons
                name={passwordVisible ? "eye" : "eye-off"}
                size={22}
                color={Colors.textLight}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <TextInput
            style={[
              styles.floatingTextInput,
              { fontFamily: Typography.fontFamily.regular },
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            secureTextEntry={secureTextEntry}
            placeholderTextColor={placeholderTextColor}
            accessibilityLabel={accessibilityLabel}
          />
        )}
      </View>
      {error && (
        <Text
          style={[
            FormStyles.errorText,
            { fontFamily: Typography.fontFamily.regular },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  floatingLabelContainer: {
    position: "relative",
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 40,
    backgroundColor: Colors.background,
  },
  floatingLabel: {
    position: "absolute",
    top: -8,
    left: 12,
    backgroundColor: Colors.background,
    paddingHorizontal: 4,
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
    zIndex: 1,
  },
  floatingTextInput: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: "transparent",
  },
  passwordInputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
  },
  floatingPasswordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: "transparent",
  },
  eyeIconContainer: {
    paddingHorizontal: 8,
  },
});

export default FloatingLabelInput;
