import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  FloatingLabelInput,
  FormSeparator,
  PrimaryButton,
  SecondaryButton,
  TabNavigation,
} from "../../components/Ui";
import { Colors } from "../../components/styles";
import { useInterest } from "../../contexts/InterestContext";
import { useTranslation } from "../../hooks/useTranslation";

const PENDING_SELLER_SIGNUP_KEY = "pending_seller_signup_kyc";

interface FormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  city: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
  city?: string;
}

const SellerSignUpScreen = () => {
  const router = useRouter();
  const { interest } = useLocalSearchParams<{ interest: string }>();
  const { setUserPreferences } = useInterest();
  const { t } = useTranslation();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("signup");
  const [isPreparingKyc, setIsPreparingKyc] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    city: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = t("validation.fullNameRequired");
    }

    if (!formData.email.trim()) {
      newErrors.email = t("validation.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t("validation.emailInvalid");
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = t("validation.phoneRequired");
    }

    if (!formData.password) {
      newErrors.password = t("validation.passwordRequired");
    } else if (formData.password.length < 8) {
      newErrors.password = t("validation.passwordTooShort");
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t("validation.confirmPasswordRequired");
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = t("validation.passwordsNotMatch");
    }

    if (!formData.city.trim()) {
      newErrors.city = t("validation.cityRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsPreparingKyc(true);

      const userInterest = (interest || "property") as "property" | "cars";
      await setUserPreferences(userInterest, "seller");

      const nameParts = formData.fullName.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || "";

      await AsyncStorage.setItem(
        PENDING_SELLER_SIGNUP_KEY,
        JSON.stringify({
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          firstName,
          lastName,
          city: formData.city,
          userType: "seller",
          interest: userInterest,
        })
      );

      router.push("./KycVerification");
    } catch (err: any) {
      Alert.alert(
        "Unable to Continue",
        err.message || "We couldn't open the verification step. Please try again."
      );
    } finally {
      setIsPreparingKyc(false);
    }
  };

  const tabOptions = [
    {
      key: "login",
      title: t("authentication.login"),
      onPress: () => router.back(),
    },
    {
      key: "signup",
      title: t("authentication.signUp"),
      onPress: () => setActiveTab("signup"),
    },
  ];

  const renderInterestImage = () => {
    if (interest === "cars") {
      return (
        <View style={styles.imageContainer}>
          <Image
            source={require("../../assets/images/Auth/Car.png")}
            style={styles.interestImage}
            resizeMode="contain"
          />
        </View>
      );
    }

    if (interest === "property") {
      return (
        <View style={styles.imageContainer}>
          <Image
            source={require("../../assets/images/Auth/Appartment.png")}
            style={styles.interestImage}
            resizeMode="contain"
          />
        </View>
      );
    }

    return (
      <View style={styles.imageContainer}>
        <Image
          source={require("../../assets/images/Auth/Car.png")}
          style={styles.interestImage}
          resizeMode="contain"
        />
      </View>
    );
  };

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
        {renderInterestImage()}

        <Text style={styles.title}>{t("authentication.sellerSignUpTitle")}</Text>

        <TabNavigation
          tabs={tabOptions}
          activeTab={activeTab}
          compact
          style={styles.tabNavigation}
        />

        <View style={styles.formContainer}>
          <FloatingLabelInput
            label={t("authentication.fullName")}
            value={formData.fullName}
            onChangeText={(value) => updateFormData("fullName", value)}
            placeholder={t("authentication.enterFullName")}
            error={errors.fullName}
            style={styles.inputStyle}
            important
            accessibilityLabel="Full Name Input"
          />

          <FloatingLabelInput
            label={t("authentication.emailAddress")}
            value={formData.email}
            onChangeText={(value) => updateFormData("email", value)}
            placeholder={t("authentication.enterEmail")}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            style={styles.inputStyle}
            important
            accessibilityLabel="Email Input"
          />

          <FloatingLabelInput
            label={t("authentication.phoneNumber")}
            value={formData.phoneNumber}
            onChangeText={(value) => updateFormData("phoneNumber", value)}
            placeholder={t("authentication.enterPhoneNumber")}
            keyboardType="phone-pad"
            error={errors.phoneNumber}
            style={styles.inputStyle}
            important
            accessibilityLabel="Phone Number Input"
          />

          <FloatingLabelInput
            label={t("authentication.password")}
            value={formData.password}
            onChangeText={(value) => updateFormData("password", value)}
            placeholder={t("authentication.enterPassword")}
            secureTextEntry
            showPasswordToggle
            passwordVisible={passwordVisible}
            onPasswordToggle={() => setPasswordVisible(!passwordVisible)}
            error={errors.password}
            style={styles.inputStyle}
            important
            accessibilityLabel="Password Input"
          />

          <FloatingLabelInput
            label={t("authentication.confirmPassword")}
            value={formData.confirmPassword}
            onChangeText={(value) => updateFormData("confirmPassword", value)}
            placeholder={t("authentication.confirmYourPassword")}
            secureTextEntry
            error={errors.confirmPassword}
            style={styles.inputStyle}
            important
            accessibilityLabel="Confirm Password Input"
          />

          <FloatingLabelInput
            label={t("authentication.city")}
            value={formData.city}
            onChangeText={(value) => updateFormData("city", value)}
            placeholder={t("authentication.enterCity")}
            error={errors.city}
            style={styles.inputStyle}
            important
            accessibilityLabel="City Input"
          />
        </View>

        <PrimaryButton
          title={isPreparingKyc ? t("authentication.loading") : "Continue to verification"}
          onPress={handleSignUp}
          disabled={isPreparingKyc}
          style={styles.createAccountButton}
        />

        <FormSeparator text={t("authentication.or")} style={styles.separator} />

        <SecondaryButton
          title={t("authentication.google")}
          onPress={() => console.log("Google Sign Up for Seller")}
          icon={require("../../assets/images/Auth/Google.png")}
          style={styles.disabledSocialButton}
          disabled={true}
        />

        <SecondaryButton
          title={t("authentication.apple")}
          onPress={() => console.log("Apple Sign Up for Seller")}
          icon={require("../../assets/images/Auth/Apple_Logo.png")}
          style={styles.disabledSocialButton}
          disabled={true}
        />

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {},
  imageContainer: {
    alignItems: "center",
  },
  interestImage: {
    width: 300,
    height: 300,
    marginBottom: -60,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.primary,
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  tabNavigation: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  formContainer: {
    marginHorizontal: 20,
  },
  inputStyle: {
    marginBottom: 16,
  },
  createAccountButton: {
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
  },
  separator: {
    marginHorizontal: 20,
    marginVertical: 20,
  },
  socialButton: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  disabledSocialButton: {
    marginHorizontal: 20,
    marginBottom: 16,
    opacity: 0.6,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default SellerSignUpScreen;
