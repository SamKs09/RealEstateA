import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Colors, Spacing, Typography } from "../../components/styles";
import { useTranslation } from "../../hooks/useTranslation";

const HomePage = () => {
  const router = useRouter();
  const { t } = useTranslation();

  const handleSignIn = () => {
    router.push("/auth/SignIn");
  };

  const handleSignUp = () => {
    router.push("/auth/SignUp");
  };

  return (
    <View style={styles.container}>
      {/* Logo/Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t("authentication.appTitle")}</Text>
        <Text style={styles.subtitle}>{t("authentication.appSubtitle")}</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.welcomeText}>
          {t("authentication.welcomeText")}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleSignIn}
        >
          <Text style={styles.primaryButtonText}>
            {t("authentication.signIn")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.ghostButton]}
          onPress={handleSignUp}
        >
          <Text style={styles.ghostButtonText}>
            {t("authentication.signUp")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    paddingTop: 100,
  },
  header: {
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
    textAlign: "center",
    fontFamily: Typography.fontFamily.medium,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    textAlign: "center",
    fontFamily: Typography.fontFamily.regular,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
  },
  welcomeText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    textAlign: "center",
    lineHeight: 24,
    fontFamily: Typography.fontFamily.regular,
  },
  buttonContainer: {
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
  },
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    color: Colors.textWhite,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.medium,
  },
  secondaryButton: {
    backgroundColor: Colors.primaryLight,
  },
  secondaryButtonText: {
    color: Colors.textWhite,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.medium,
  },
  ghostButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  ghostButtonText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.medium,
  },
});

export default HomePage;
