import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenWrapper, BackButton } from "../components/Ui";
import { useTranslation } from "../hooks/useTranslation";
import type {
  AppNotification,
  NotificationType,
} from "../services/notificationService";

async function loadNotificationService() {
  const module = await import("../services/notificationService");
  return module.notificationService;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const notificationService = await loadNotificationService();
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let notificationService: Awaited<
      ReturnType<typeof loadNotificationService>
    > | null = null;
    fetchNotifications();

    // Listen for new notifications while on this screen
    const handleNewNotif = () => fetchNotifications();
    loadNotificationService()
      .then((service) => {
        notificationService = service;
        notificationService.on("notification:received", handleNewNotif);
      })
      .catch(() => {});

    return () => {
      notificationService?.off("notification:received", handleNewNotif);
    };
  }, [fetchNotifications]);

  const handleNotificationPress = async (item: AppNotification) => {
    if (!item.read) {
      const notificationService = await loadNotificationService();
      await notificationService.markAsRead(item._id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === item._id ? { ...n, read: true } : n)),
      );
    }

    const relatedId = item.data?.relatedId;
    const deepLink: string | undefined = item.data?.deepLink;

    // Explicit deepLink from backend takes highest priority
    if (deepLink) {
      // @ts-ignore
      router.push(deepLink);
      return;
    }

    // Polymorphic routing by notification type
    switch (item.type) {
      case "message":
      case "support_reply":
        if (relatedId) {
          router.push({ pathname: "/chat/[id]", params: { id: relatedId } });
        } else {
          router.push("/(tabs)/Messages");
        }
        break;

      case "booking":
        // No dedicated booking detail screen – navigate to the Bookings tab
        router.push("/(tabs)/Bookings");
        break;

      case "property_update":
        if (relatedId) {
          router.push({
            pathname: "/property_info",
            params: { id: relatedId },
          });
        } else {
          router.push("/(tabs)/Explore");
        }
        break;

      case "follow":
        if (relatedId) {
          router.push({
            pathname: "/seller-profile/[id]",
            params: { id: relatedId },
          });
        }
        break;

      case "question_update":
        if (relatedId) {
          router.push({ pathname: "/chat/[id]", params: { id: relatedId } });
        } else {
          router.push("/(tabs)/Messages");
        }
        break;

      default:
        // system / unknown — stay on this screen
        break;
    }
  };

  const markAllAsRead = async () => {
    const notificationService = await loadNotificationService();
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    Alert.alert(
      t("notifications.clearAllTitle") || "Clear All",
      t("notifications.clearAllMessage") ||
        "Are you sure you want to delete all notifications?",
      [
        { text: t("common.cancel") || "Cancel", style: "cancel" },
        {
          text: t("common.clear") || "Clear",
          style: "destructive",
          onPress: async () => {
            const notificationService = await loadNotificationService();
            await notificationService.deleteAll();
            setNotifications([]);
          },
        },
      ],
    );
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "message":
        return "chatbubble-ellipses";
      case "follow":
        return "people";
      case "support_reply":
        return "headset";
      case "question_update":
        return "help-circle";
      case "booking":
        return "calendar";
      case "property_update":
        return "business";
      default:
        return "notifications";
    }
  };

  const getIconColor = (type: NotificationType) => {
    switch (type) {
      case "message":
        return "#FF8C42"; // changed from blue to orange
      case "follow":
        return "#7ED321";
      case "support_reply":
        return "#F5A623";
      case "question_update":
        return "#F5A623";
      case "booking":
        return "#FF8C42";
      case "property_update":
        return "#9013FE";
      default:
        return "#8A8A8A";
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMins < 1) return t("notifications.justNow");
    if (diffInMins < 60) return `${diffInMins}m ${t("notifications.ago")}`;
    if (diffInHours < 24) return `${diffInHours}h ${t("notifications.ago")}`;
    return `${diffInDays}d ${t("notifications.ago")}`;
  };

  const renderItem = ({ item }: { item: AppNotification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${getIconColor(item.type)}20` },
        ]}
      >
        <Ionicons
          name={getIcon(item.type)}
          size={24}
          color={getIconColor(item.type)}
        />
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.itemHeader}>
          <Text style={[styles.title, !item.read && styles.unreadText]}>
            {item.title}
          </Text>
          <Text style={styles.time}>{getTimeAgo(item.createdAt)}</Text>
        </View>
        <Text style={styles.body} numberOfLines={2}>
          {item.body}
        </Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>{t("notifications.title")}</Text>
        <View style={styles.headerActions}>
          {notifications.some((n) => !n.read) && (
            <TouchableOpacity onPress={markAllAsRead} style={styles.headerBtn}>
              <Text style={styles.markReadText}>
                {t("notifications.markAllRead")}
              </Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} style={styles.headerBtn}>
              <Ionicons name="trash-outline" size={20} color="#E53935" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF8C42" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons
            name="notifications-off-outline"
            size={80}
            color="#E0E0E0"
          />
          <Text style={styles.emptyTitle}>{t("notifications.emptyTitle")}</Text>
          <Text style={styles.emptySubtitle}>
            {t("notifications.emptySubtitle")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchNotifications(true)}
            />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Raleway-Bold",
    color: "#333333",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerBtn: {
    padding: 4,
  },
  markReadText: {
    fontSize: 14,
    color: "#8A8A8A", // grey
    fontFamily: "raleway-500Medium",
  },
  listContainer: {
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    alignItems: "center",
  },
  unreadItem: {
    backgroundColor: "#FFF9F5",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  contentContainer: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  title: {
    fontSize: 16,
    color: "#333333",
    fontFamily: "raleway-500Medium",
  },
  unreadText: {
    fontWeight: "bold",
    fontFamily: "raleway-700Bold",
  },
  time: {
    fontSize: 12,
    color: "#8A8A8A",
    fontFamily: "raleway-400Regular",
  },
  body: {
    fontSize: 14,
    color: "#666666",
    fontFamily: "raleway-400Regular",
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF8C42",
    marginLeft: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginTop: 20,
    fontFamily: "raleway-700Bold",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#8A8A8A",
    textAlign: "center",
    marginTop: 10,
    fontFamily: "raleway-400Regular",
  },
});
