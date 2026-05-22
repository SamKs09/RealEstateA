import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import {
  HeaderWithBackButton,
  FloatingLabelInput,
  PrimaryButton,
  TabNavigation,
} from "../../components/Ui";
import { Colors } from "../../components/styles";
import { useTranslation } from "../../hooks/useTranslation";

type RecoveryMethod = "email" | "phone";

export default function ForgotPassword() {
  const router = useRouter();
  const { t } = useTranslation();
  const [recoveryMethod, setRecoveryMethod] = useState<RecoveryMethod>("email");
  const [formData, setFormData] = useState({
    email: "",
    phoneNumber: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    phoneNumber: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      email: "",
      phoneNumber: "",
    };

    if (recoveryMethod === "email") {
      // Email validation
      if (!formData.email.trim()) {
        newErrors.email = t("authentication.emailRequired");
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = t("authentication.emailInvalid");
      }
    } else {
      // Phone validation
      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = t("validation.phoneNumberRequired");
      } else if (formData.phoneNumber.length < 8) {
        newErrors.phoneNumber = t("validation.phoneInvalid") || "Invalid phone number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).every(
      (key) => !newErrors[key as keyof typeof newErrors]
    );
  };

  const handleSendVerification = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const recoveryData =
        recoveryMethod === "email"
          ? { email: formData.email }
          : { phoneNumber: formData.phoneNumber };

      console.log("Sending recovery code via:", recoveryMethod, recoveryData);

      // Navigate to OTP verification
      const verificationData = {
        method: recoveryMethod,
        contact:
          recoveryMethod === "email" ? formData.email : formData.phoneNumber,
        isRecovery: "true",
      };

      router.push({
        pathname: "./OTPVerification",
        params: verificationData,
      });
    } catch (error) {
      console.error("Error sending verification:", error);
      Alert.alert(
        "Error",
        "Failed to send verification code. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const tabOptions = [
    {
      key: "email",
      title: "Email",
      onPress: () => setRecoveryMethod("email"),
    },
    {
      key: "phone",
      title: t("authentication.phoneNumber"),
      onPress: () => setRecoveryMethod("phone"),
    },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with Back Button */}
        <HeaderWithBackButton onBackPress={() => router.back()} />

        {/* House Image */}
        <View style={styles.imageContainer}>
          <Image
            source={require("../../assets/images/Auth/ForgetPasswordImg.jpg")}
            style={styles.houseImage}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>{t("authentication.forgetPasswordTitle")}</Text>
        <Text style={styles.subtitle}>
          {t("authentication.forgetPasswordSubtitle")}
        </Text>

        {/* Recovery Method Selection */}
        <View style={styles.tabContainer}>
          <TabNavigation tabs={tabOptions} activeTab={recoveryMethod} />
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          {recoveryMethod === "email" ? (
            <FloatingLabelInput
              label="Email Address"
              value={formData.email}
              onChangeText={(value) => updateFormData("email", value)}
              placeholder="abhishekpatelXXX@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              style={styles.inputStyle}
            />
          ) : (
            <FloatingLabelInput
              label={t("authentication.phoneNumber")}
              value={formData.phoneNumber}
              onChangeText={(value) => updateFormData("phoneNumber", value)}
              placeholder="99 999 999"
              keyboardType="phone-pad"
              error={errors.phoneNumber}
              style={styles.inputStyle}
            />
          )}
        </View>

        {/* Send Verification Button */}
        <PrimaryButton
          title={t("authentication.submit")}
          onPress={handleSendVerification}
          disabled={isLoading}
          style={styles.sendButton}
        />

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageContainer: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 20,
  },
  houseImage: {
    marginTop: -40,
    width: 280,
    height: 200,
    marginBottom: -20,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.primary,
    textAlign: "center",
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  tabContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  formContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  inputStyle: {
    marginBottom: 0,
  },
  sendButton: {
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
  },
  bottomSpacing: {
    height: 40,
  },
});
