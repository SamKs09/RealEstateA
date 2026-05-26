import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "../components/Ui";
import { useTranslation } from "../hooks/useTranslation";
import type { NotificationPreferences } from "../services/notificationService";

async function loadNotificationService() {
  const module = await import("../services/notificationService");
  return module.notificationService;
}

export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const notificationService = await loadNotificationService();
      const prefs = await notificationService.getPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleChannel = async (
    channel: "pushEnabled" | "emailEnabled" | "smsEnabled",
  ) => {
    if (!preferences) return;

    const newPrefs: NotificationPreferences = {
      ...preferences,
      [channel]: !preferences[channel],
    };

    setPreferences(newPrefs);
    setSaving(true);
    try {
      const notificationService = await loadNotificationService();
      await notificationService.updatePreferences(newPrefs);
    } catch (error) {
      console.error("Error updating preferences:", error);
      // Rollback on error
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF8C42" />
        </View>
      </ScreenWrapper>
    );
  }

  const channelOptions = [
    {
      key: "pushEnabled" as const,
      label: t("notifications.pushNotifications"),
      description: t("notifications.pushDesc"),
      icon: "notifications" as const,
    },
    {
      key: "emailEnabled" as const,
      label: t("notifications.emailNotifications"),
      description: t("notifications.emailDesc"),
      icon: "mail" as const,
    },
    {
      key: "smsEnabled" as const,
      label: t("notifications.smsNotifications"),
      description: t("notifications.smsDesc"),
      icon: "chatbox-ellipses" as const,
    },
  ];

  const commonDesc = t("notifications.settingsDesc");

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#8A8A8A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t("notifications.settingsTitle")}
          </Text>
        </View>

        <Text style={styles.mainDesc}>{commonDesc}</Text>

        {/* Notification Channels Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="radio" size={20} color="#FF8C42" />
            <Text style={styles.sectionTitle}>
              {t("notifications.notificationChannels")}
            </Text>
          </View>
          <Text style={styles.sectionDesc}>
            {t("notifications.channelsDesc")}
          </Text>

          <View style={styles.optionsList}>
            {channelOptions.map((option) => (
              <View key={option.key} style={styles.optionRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name={option.icon} size={24} color="#FF8C42" />
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Text style={styles.optionDesc}>{option.description}</Text>
                </View>
                <Switch
                  value={preferences?.[option.key]}
                  onValueChange={() => toggleChannel(option.key)}
                  trackColor={{ false: "#E8E8E8", true: "#FF8C42" }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E8E8E8"
                />
              </View>
            ))}
          </View>
        </View>

        {saving && (
          <View style={styles.savingOverlay}>
            <ActivityIndicator size="small" color="#FF8C42" />
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 30,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Raleway-Bold",
    color: "#333333",
  },
  mainDesc: {
    fontSize: 14,
    color: "#4A4A4A",
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 30,
    fontFamily: "raleway-400Regular",
  },
  sectionContainer: {
    marginBottom: 35,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 8,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    fontFamily: "raleway-700Bold",
  },
  sectionDesc: {
    fontSize: 13,
    color: "#6A6A6A",
    lineHeight: 18,
    paddingHorizontal: 20,
    marginBottom: 20,
    fontFamily: "raleway-400Regular",
  },
  optionsList: {
    paddingHorizontal: 20,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
    paddingVertical: 5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF5ED",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  optionInfo: {
    flex: 1,
    marginRight: 20,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
    fontFamily: "raleway-700Bold",
  },
  optionDesc: {
    fontSize: 12,
    color: "#4A4A4A",
    lineHeight: 18,
    fontFamily: "raleway-400Regular",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  savingOverlay: {
    marginTop: 20,
    alignItems: "center",
  },
});
