import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from "../components/styles/GlobalStyles";
import { useTranslation } from "../hooks/useTranslation";
import { useAuth } from "../contexts/AuthContext";
import { BackButton } from "../components/Ui/BackButton";
import apiService from "../services/api";

const FreeTrialScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleStartTrial = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const res: any = await apiService.post<any>("/user/start-trial", {});
      if (res.success) {
        // Update user context with new trial info and pack
        if (user) {
          updateUser({
            ...user,
            pack: res.user.pack,
            trial: res.user.trial,
          });
        }

        Alert.alert(t("freeTrial.success"), t("freeTrial.success"), [
          { text: "OK", onPress: () => router.push("/(tabs)/profile") },
        ]);
      } else {
        Alert.alert(t("freeTrial.error"), res.message || t("freeTrial.error"));
      }
    } catch (err: any) {
      Alert.alert(t("freeTrial.error"), err.message || t("freeTrial.error"));
    } finally {
      setLoading(false);
    }
  };

  const features = [
    t("freeTrial.feature1"),
    t("freeTrial.feature2"),
    t("freeTrial.feature3"),
    t("freeTrial.feature4"),
    t("freeTrial.feature5"),
    t("freeTrial.feature6"),
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton
          onPress={() => router.push("/(tabs)/Explore")}
          color={Colors.textPrimary}
        />
        <Text style={styles.headerTitle}>{t("freeTrial.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topSection}>
          <View style={styles.giftIconContainer}>
            <Text style={{ fontSize: 60 }}>🎁</Text>
          </View>
          <Text style={styles.daysFree}>{t("freeTrial.daysFree")}</Text>
          <Text style={styles.proAccess}>{t("freeTrial.proAccess")}</Text>
          <Text style={styles.noCard}>{t("freeTrial.noCard")}</Text>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.whatsIncluded}>
            {t("freeTrial.whatsIncluded")}
          </Text>
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark" size={20} color={Colors.success} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.footerText}>{t("freeTrial.footerText")}</Text>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.startButton, loading && { opacity: 0.7 }]}
          onPress={handleStartTrial}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.textWhite} />
          ) : (
            <Text style={styles.startButtonText}>
              {t("freeTrial.startButton")}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.viewPlansButton}
          onPress={() => router.push("/(tabs)/Explore")}
        >
          <Text style={styles.viewPlansButtonText}>
            {t("freeTrial.viewPlans")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ marginTop: 20, alignSelf: "center" }}
          onPress={() => router.push("/(tabs)/Explore")}
        >
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 16,
              fontFamily: Typography.fontFamily.medium,
            }}
          >
            {t("cancel")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: Platform.OS === "android" ? 40 : 15,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Raleway-Bold",
    color: "#333333",
  },
  scrollContent: {
    paddingHorizontal: 30,
    paddingBottom: 20,
    alignItems: "center",
  },
  topSection: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  giftIconContainer: {
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  daysFree: {
    fontSize: 32,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 5,
  },
  proAccess: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 5,
  },
  noCard: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textLight,
  },
  featuresSection: {
    width: "100%",
    marginBottom: 30,
  },
  whatsIncluded: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textSecondary,
    marginBottom: 15,
  },
  featuresContainer: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    borderRadius: BorderRadius.lg,
    padding: 20,
    backgroundColor: "rgba(248, 91, 0, 0.02)",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  featureText: {
    fontSize: 15,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    marginLeft: 15,
    flex: 1,
  },
  footerText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textLight,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    paddingHorizontal: 30,
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
    paddingTop: 10,
  },
  startButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 15,
    ...Shadows.primary,
  },
  startButtonText: {
    color: Colors.textWhite,
    fontSize: 18,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: "bold",
  },
  viewPlansButton: {
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
  },
  viewPlansButtonText: {
    color: Colors.primary,
    fontSize: 18,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: "bold",
  },
});

export default FreeTrialScreen;
