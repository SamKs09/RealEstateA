import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import {
  PrimaryButton,
  SecondaryButton,
  AuthLayout,
  FloatingLabelInput,
  FormSeparator,
  TabNavigation,
} from "../../components/Ui";
// FIX: Import Colors and Typography from GlobalStyles
import { Colors, Typography } from "../../components/styles/GlobalStyles";
import { useAuth } from "../../contexts/AuthContext";
import { usePopup } from "../../contexts/PopupContext";

const SignInScreen = () => {
  const router = useRouter();
  const { login, isLoading, clearError } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const { showError } = usePopup();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("login");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validateInputs = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = t("authentication.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t("authentication.emailInvalid");
    }

    if (!password) {
      newErrors.password = t("authentication.passwordRequired");
    } else if (password.length < 8) {
      newErrors.password = t("authentication.passwordMinLength");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (validateInputs()) {
      try {
        clearError();
        console.log("🔄 Starting login process...", { email });

        const result = await login(email, password);
        console.log("✅ Login successful, navigating to tabs...", result);

        // Navigation will be handled by authentication state change
        router.replace("../(tabs)/Explore"); // Navigate to main app
      } catch (err: any) {
        console.error("❌ Login error caught:", err);
        console.error("❌ Login error caught:", err);
        showError(err.message || "An error occurred during login");
      }
    }
  };

  const handleGoogleSignIn = () => {
    console.log("Google Sign In");
    // Add Google authentication logic here
  };

  const handleAppleSignIn = () => {
    console.log("Apple Sign In");
    // Add Apple authentication logic here
  };

  const tabOptions = [
    {
      key: "login",
      title: t("authentication.login"),
      onPress: () => setActiveTab("login"),
    },
    {
      key: "signup",
      title: t("authentication.signUp"),
      onPress: () => {
        setActiveTab("signup");
        router.push("./SignUp");
      },
    },
  ];

  // Re-render on language change
  const [langTick, setLangTick] = useState(0);
  useEffect(() => {
    setLangTick((tick) => tick + 1);
  }, [currentLanguage]);

  return (
    <AuthLayout compact style={styles.compactScreen}>
      {/* House Image - Smaller to fit everything */}
      <View style={styles.compactImageContainer}>
        <Image
          source={require("../../assets/images/Auth/Appartment.png")}
          style={styles.compactApartmentImage}
          resizeMode="contain"
        />
      </View>

      {/* Welcome Back Title - Compact */}
      <Text style={styles.compactWelcomeTitle}>
        {t("authentication.welcomeBack")}
      </Text>

      {/* Tab Navigation - Compact */}
      <TabNavigation tabs={tabOptions} activeTab={activeTab} compact />

      {/* Form Container - Compact */}
      <View style={styles.compactFormContainer}>
        {/* Email Input - Compact with Floating Label */}
        <FloatingLabelInput
          label={t("authentication.emailAddress")}
          value={email}
          onChangeText={setEmail}
          placeholder={t("authentication.enterEmail")}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
          important
          accessibilityLabel="Email Input"
        />

        {/* Password Input - Compact with Floating Label */}
        <FloatingLabelInput
          label={t("authentication.password")}
          value={password}
          onChangeText={setPassword}
          placeholder={t("authentication.passwordPlaceholder") || "••••••••••"}
          secureTextEntry
          showPasswordToggle
          passwordVisible={passwordVisible}
          onPasswordToggle={() => setPasswordVisible(!passwordVisible)}
          error={errors.password}
          important
          accessibilityLabel="Password Input"
        />

        {/* Forgot Password - Compact */}
        <TouchableOpacity
          onPress={() => router.push("./ForgotPassword")}
          style={styles.compactForgotPasswordContainer}
        >
          <Text style={styles.forgotPasswordText}>
            {t("authentication.forgotPassword")}
          </Text>
        </TouchableOpacity>

        {/* Login Button - Compact */}
        <PrimaryButton
          title={
            isLoading
              ? t("authentication.signingIn")
              : t("authentication.login")
          }
          onPress={handleSignIn}
          disabled={isLoading}
          style={styles.compactLoginButton}
          accessibilityLabel="Login Button"
        />

        {/* Or Separator - Compact */}
        <FormSeparator compact />

        {/* Social Login Buttons - Compact */}
        <SecondaryButton
          title={t("authentication.google")}
          onPress={handleGoogleSignIn}
          icon={require("../../assets/images/Auth/Google.png")}
          style={styles.compactSocialButton}
        />

        <SecondaryButton
          title={t("authentication.apple")}
          onPress={handleAppleSignIn}
          icon={require("../../assets/images/Auth/Apple_Logo.png")}
          style={styles.compactSocialButton}
        />
      </View>
    </AuthLayout>
  );
};

// Compact styles for single-view layout (no scrolling)
const styles = StyleSheet.create({
  compactScreen: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  compactImageContainer: {
    alignItems: "center",
    marginTop: -50,
    marginBottom: -40,
  },
  compactApartmentImage: {
    width: 300,
    height: 300,
  },
  compactWelcomeTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.primary,
    textAlign: "center",
    marginBottom: 25,
    fontFamily: Typography.fontFamily.medium,
  },
  compactFormContainer: {
    flex: 0,
  },
  compactForgotPasswordContainer: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "500",
    fontFamily: Typography.fontFamily.regular,
  },
  compactLoginButton: {
    marginBottom: 20,
  },
  compactSocialButton: {
    marginBottom: 10,
    borderRadius: 30,
  },
});

export default SignInScreen;
