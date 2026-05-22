import React, { useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { chatService } from "../../services/chatService";
import { useAuth } from "../../contexts/AuthContext";
import { useInterest } from "../../contexts/InterestContext";
import { useTranslation } from "../../hooks/useTranslation";
import { ScreenWrapper } from "../../components/Ui";

export default function MessagesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { activeView } = useInterest();
  const [loading, setLoading] = React.useState(true);
  const [threads, setThreads] = React.useState<any[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const isInitialized = useRef(false);
  useAuth(); // Ensure auth context is available

  const loadThreads = async () => {
    try {
      // Get all user threads (backend + local)
      const userThreads = await chatService.getUserThreads();

      // Get support thread separately
      let supportThread;
      try {
        supportThread = await chatService.getOrCreateSupportThread();
      } catch (error) {
        console.warn("Could not load support thread:", error);
      }

      // Format user threads for display
      const formattedUserThreads = userThreads.map((thread) => {
        // Get the other participant's info
        const participant = thread.participants?.find(
          (p: any) => p.role === "owner" || p.role === "user",
        );
        const participantName =
          participant?.userId?.fullName ||
          participant?.userId?.firstName ||
          thread.recipientName ||
          "User";

        return {
          id: thread._id,
          name: participantName,
          message:
            thread.lastMessage?.content?.text ||
            thread.lastMessage?.content ||
            "No messages yet",
          time: thread.lastMessage?.createdAt
            ? new Date(thread.lastMessage.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : thread.updatedAt
              ? new Date(thread.updatedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "",
          unread: thread.unreadCount > 0,
          avatar:
            participant?.userId?.profilePicture ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(participantName)}&background=FF8C42&color=fff`,
          role: "user",
          category: thread.category || null,
        };
      });

      // Format support thread if available
      const formattedThreads = [...formattedUserThreads];
      if (supportThread) {
        formattedThreads.push({
          id: supportThread._id,
          name: "Customer Support",
          message:
            supportThread.lastMessage?.content?.text ||
            supportThread.lastMessage?.content ||
            "No messages yet",
          time: supportThread.lastMessage?.createdAt
            ? new Date(supportThread.lastMessage.createdAt).toLocaleTimeString(
                [],
                {
                  hour: "2-digit",
                  minute: "2-digit",
                },
              )
            : "",
          unread: supportThread.unreadCount > 0,
          avatar:
            "https://ui-avatars.com/api/?name=Support&background=FF8C42&color=fff",
          role: "support",
          category: null,
        });
      }

      // Deduplicate by id before setting state
      const seen = new Set<string>();
      const uniqueThreads = formattedThreads.filter((t) => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });

      setThreads(uniqueThreads);
    } catch (error) {
      console.error("Error loading threads:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle new message received - update thread preview in real-time
  const handleNewMessage = useCallback((data: any) => {
    console.log("📨 Messages screen received new message:", data);
    setThreads((prevThreads) =>
      prevThreads.map((thread) => {
        if (thread.id === data.threadId) {
          const messageContent =
            data.message?.content?.text ||
            data.message?.content ||
            "New message";
          return {
            ...thread,
            message: messageContent,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            unread: true,
          };
        }
        return thread;
      }),
    );
  }, []);

  // Initialize chat service (only once)
  React.useEffect(() => {
    const initChat = async () => {
      try {
        console.log("🔄 Initializing chat service...");
        await chatService.initialize();
        isInitialized.current = true;

        // Set up real-time listener
        chatService.on("message:new", handleNewMessage);

        await loadThreads();
        console.log("✅ Chat service initialized successfully");
      } catch (error: any) {
        console.error("❌ Error initializing chat:", error.message || error);
        setLoading(false);

        // Show user-friendly error message
        if (error.message === "No auth token found") {
          console.warn(
            "⚠️ User not authenticated. Please log in to access messages.",
          );
          // Optionally navigate to login or show auth screen
        }
      }
    };

    initChat();

    // Don't disconnect on unmount - keep socket alive for other screens
    return () => {
      chatService.off("message:new", handleNewMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isInitialized.current) {
        loadThreads();
      }
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadThreads();
  };

  const handleChatPress = (item: any) => {
    router.push({
      pathname: "/chat/[id]",
      params: {
        id: item.id,
        name: item.name,
        avatar: item.avatar,
      },
    });
  };

  const renderMessageItem = ({ item }: { item: any }) => {
    // Determine category icon for this thread
    const isPropertyThread = item.category === "property";
    const isVehicleThread = item.category === "vehicle";

    return (
      <TouchableOpacity
        style={styles.messageItem}
        onPress={() => handleChatPress(item)}
      >
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={styles.messageContent}>
          <View style={styles.messageHeader}>
            <View style={styles.nameRow}>
              <Text style={styles.senderName}>{item.name}</Text>
              {isPropertyThread && (
                <Ionicons
                  name="home-outline"
                  size={12}
                  color="#FF8C42"
                  style={styles.categoryIcon}
                />
              )}
              {isVehicleThread && (
                <Ionicons
                  name="car-outline"
                  size={12}
                  color="#FF8C42"
                  style={styles.categoryIcon}
                />
              )}
            </View>
            <Text style={styles.messageTime}>{item.time}</Text>
          </View>
          <Text
            style={[styles.messageText, item.unread && styles.unreadMessage]}
            numberOfLines={1}
          >
            {item.message}
          </Text>
        </View>
        {item.unread && <View style={styles.unreadBadge} />}
      </TouchableOpacity>
    );
  };

  const [unreadNotifications, setUnreadNotifications] = React.useState(0);

  // Fetch unread count for notifications
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { notificationService } =
        await import("../../services/notificationService");
      const count = await notificationService.getUnreadCount();
      setUnreadNotifications(count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    // Listen for new notifications to update badge
    const setupNotifs = async () => {
      try {
        const { notificationService } =
          await import("../../services/notificationService");
        const handleNewNotif = () => fetchUnreadCount();
        notificationService.on("notification:received", handleNewNotif);
        notificationService.on("notification:all-read", () =>
          setUnreadNotifications(0),
        );
        notificationService.on("notification:read", () => fetchUnreadCount());

        return () => {
          notificationService.off("notification:received", handleNewNotif);
          notificationService.off("notification:all-read", () =>
            setUnreadNotifications(0),
          );
          notificationService.off("notification:read", () =>
            fetchUnreadCount(),
          );
        };
      } catch (e) {
        console.error("Error setting up notifications in Messages:", e);
      }
    };

    setupNotifs();
  }, [fetchUnreadCount]);

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("navigation.messages")}</Text>
          <TouchableOpacity
            style={styles.notifButton}
            onPress={() => router.push("/notifications")}
          >
            <Ionicons name="notifications-outline" size={26} color="#333333" />
            {unreadNotifications > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Loading...</Text>
          </View>
        ) : (
          (() => {
            // Filter threads: always show support & uncategorised; filter categorised by activeView
            const visibleThreads = threads.filter((item) => {
              if (item.role === "support" || !item.category) return true;
              if (activeView === "cars") return item.category === "vehicle";
              return item.category === "property";
            });
            return visibleThreads.length > 0 ? (
              <FlatList
                data={visibleThreads}
                renderItem={renderMessageItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{
                  ...styles.listContainer,
                  paddingBottom: 120,
                }}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                  />
                }
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Image
                  source={require("../../assets/Icons/Message.png")}
                  style={styles.emptyIcon}
                />
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>
                  Your messages will appear here
                </Text>
              </View>
            );
          })()
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Raleway-Bold",
    color: "#FF8C42",
  },
  notifButton: {
    padding: 5,
    position: "relative",
  },
  badge: {
    position: "absolute",
    right: -2,
    top: -2,
    backgroundColor: "#FF4444",
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "bold",
  },
  listContainer: {
    padding: 20,
  },
  messageItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F4F8",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  senderName: {
    fontSize: 16,
    fontFamily: "Raleway-Bold",
    color: "#252B5C",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  categoryIcon: {
    marginLeft: 3,
  },
  messageTime: {
    fontSize: 12,
    fontFamily: "Raleway-Regular",
    color: "#A1A5C1",
  },
  messageText: {
    fontSize: 14,
    fontFamily: "Raleway-Regular",
    color: "#53587A",
  },
  unreadMessage: {
    fontFamily: "Raleway-SemiBold",
    color: "#252B5C",
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF6B35",
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    tintColor: "#FF8C42",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: "Raleway-Bold",
    color: "#252B5C",
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: "Raleway-Regular",
    color: "#A1A5C1",
    textAlign: "center",
  },
  startChatButton: {
    marginTop: 20,
    backgroundColor: "#FF8C42",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  startChatText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Raleway-Bold",
  },
});
