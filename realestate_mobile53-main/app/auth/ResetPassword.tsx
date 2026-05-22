import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SuccessModal } from "../../components/Ui";
import { authService } from "../../services/authService";
import { useTranslation } from "../../hooks/useTranslation";
import { Colors } from "../../components/styles";

export default function ResetPassword() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    contact: string;
    otp: string;
    method: string;
    verified: string;
  }>();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  });

  // Validate password requirements
  const validatePassword = (password: string) => {
    const requirements = {
      minLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    return {
      valid: Object.values(requirements).every(Boolean),
      requirements,
    };
  };

  const getStrengthStyle = (strength: number) => {
    switch (strength) {
      case 1:
        return styles.strength1;
      case 2:
        return styles.strength2;
      case 3:
        return styles.strength3;
      case 4:
        return styles.strength4;
      default:
        return {};
    }
  };

  const handleResetPassword = async () => {
    Keyboard.dismiss();
    setIsLoading(true);
    setErrors({ password: "", confirmPassword: "" });

    try {
      // Check if coming from verified flow
      if (params.verified !== "true") {
        throw new Error("Verification required before password reset");
      }

      // Validate passwords
      const { valid } = validatePassword(newPassword);

      if (!valid) {
        setErrors((prev) => ({
          ...prev,
          password:
            "Password must contain: 8+ characters, 1 number, 1 special character",
        }));
        return;
      }

      if (newPassword !== confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: t("validation.passwordsDoNotMatch"),
        }));
        return;
      }

      let result;
      if (params.method === "email") {
        result = await authService.resetPasswordEmail({
          email: params.contact,
          otp: params.otp,
          newPassword: newPassword,
          confirmPassword: confirmPassword,
        });
      } else {
        result = await authService.resetPasswordPhone({
          phoneNumber: params.contact,
          code: params.otp,
          newPassword: newPassword,
          confirmPassword: confirmPassword,
        });
      }

      if (result.success) {
        setShowSuccessModal(true);
      } else {
        throw new Error(result.message || "Failed to reset password");
      }
    } catch (error: any) {
      Alert.alert(
        "Reset Failed",
        error.message || "Failed to reset password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("authentication.createNewPassword")}</Text>
      <Text style={styles.subtitle}>
        {t("authentication.passwordDifferentSubtitle")}
      </Text>

      {/* New Password Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.password && styles.errorInput]}
          placeholder="New Password"
          placeholderTextColor="#999"
          secureTextEntry={!passwordVisible}
          value={newPassword}
          onChangeText={setNewPassword}
          editable={!isLoading}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.visibilityToggle}
          onPress={() => setPasswordVisible(!passwordVisible)}
        >
          <Text style={styles.visibilityText}>
            {passwordVisible ? "Hide" : "Show"}
          </Text>
        </TouchableOpacity>
      </View>
      {errors.password ? (
        <Text style={styles.errorText}>{errors.password}</Text>
      ) : (
        <Text style={styles.helperText}>
          {t("authentication.passwordMinLength")}
        </Text>
      )}

      {/* Confirm Password Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, errors.confirmPassword && styles.errorInput]}
          placeholder="Confirm Password"
          placeholderTextColor="#999"
          secureTextEntry={!passwordVisible}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          editable={!isLoading}
          autoCapitalize="none"
        />
      </View>
      {errors.confirmPassword && (
        <Text style={styles.errorText}>{errors.confirmPassword}</Text>
      )}

      {/* Password Strength Indicator */}
      <View style={styles.strengthMeter}>
        {["Weak", "Fair", "Good", "Strong"].map((level, index) => {
          const strength = Math.min(
            Math.floor(newPassword.length / 2),
            (validatePassword(newPassword).requirements.minLength ? 1 : 0) +
              (validatePassword(newPassword).requirements.hasNumber ? 1 : 0) +
              (validatePassword(newPassword).requirements.hasSpecialChar
                ? 1
                : 0)
          );
          const strengthLevel = index === 0 ? "weak" : index === 1 ? "fair" : index === 2 ? "good" : "strong";
          return (
            <View
              key={level}
              style={[
                styles.strengthBar,
                index < strength && getStrengthStyle(strength),
              ]}
            />
          );
        })}
      </View>
      <Text style={styles.strengthText}>
        {newPassword.length === 0
          ? ""
          : validatePassword(newPassword).valid
          ? t("authentication.strongPassword")
          : t("authentication.passwordStrength")}
      </Text>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.button,
          (isLoading || !newPassword || !confirmPassword) &&
            styles.disabledButton,
        ]}
        onPress={handleResetPassword}
        disabled={isLoading || !newPassword || !confirmPassword}
      >
        <Text style={styles.buttonText}>
          {isLoading ? t("authentication.updating") : t("authentication.confirm")}
        </Text>
      </TouchableOpacity>

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        title={t("authentication.success")}
        message={t("authentication.passwordResetSuccess") || "Your password has been successfully updated"}
        buttonText={t("authentication.continueToLogin")}
        onClose={() => {
          setShowSuccessModal(false);
          router.replace("./SignIn");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: "#333",
  },
  errorInput: {
    borderColor: "#ff4444",
  },
  visibilityToggle: {
    position: "absolute",
    right: 16,
  },
  visibilityText: {
    color: Colors.primary,
    fontWeight: "600",
  },
  helperText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: "#ff4444",
    marginBottom: 16,
  },
  strengthMeter: {
    flexDirection: "row",
    height: 4,
    marginBottom: 8,
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    backgroundColor: "#eee",
    borderRadius: 2,
  },
  strength1: {
    backgroundColor: "#ff4444",
  },
  strength2: {
    backgroundColor: "#ffbb33",
  },
  strength3: {
    backgroundColor: "#00C851",
  },
  strength4: {
    backgroundColor: "#007E33",
  },
  strengthText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
