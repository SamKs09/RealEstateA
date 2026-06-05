import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { chatService, Message, Thread, API_URL } from "@/services/chatService";
import * as ImagePicker from "expo-image-picker";
import { formatDistanceToNow } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SupportChatScreen() {
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    initializeChat();

    return () => {
      if (thread) {
        chatService.leaveThread(thread._id);
      }
      chatService.disconnect();
    };
  }, []);

  const initializeChat = async () => {
    try {
      // Get current user ID
      const userDataStr = await AsyncStorage.getItem("user_data");
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setCurrentUserId(userData._id);
      }

      // Initialize chat service
      await chatService.initialize();

      // Get or create support thread
      const supportThread = await chatService.getOrCreateSupportThread();
      setThread(supportThread);

      // Join thread room
      chatService.joinThread(supportThread._id);

      // Load messages
      const threadMessages = await chatService.getMessages(supportThread._id);
      setMessages(threadMessages.reverse());

      // Mark as read
      chatService.markAsRead(supportThread._id);

      // Listen for new messages
      chatService.on("message:new", handleNewMessage);
      chatService.on("typing:user", handleTypingUser);

      setLoading(false);
      scrollToBottom();
    } catch (error) {
      console.error("Failed to initialize chat:", error);
      Alert.alert("Error", "Failed to load chat. Please try again.");
      setLoading(false);
    }
  };

  const handleNewMessage = (data: any) => {
    setMessages((prev) => [...prev, data.message]);
    scrollToBottom();
    if (thread) {
      chatService.markAsRead(thread._id);
    }
  };

  const handleTypingUser = (data: any) => {
    // Show typing indicator if it's not the current user
    if (data.userId !== currentUserId) {
      setIsTyping(data.isTyping);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !thread || sending) return;

    const text = messageText.trim();
    setMessageText("");
    setSending(true);
    stopTyping();

    try {
      await chatService.sendMessage(thread._id, text);
    } catch (error) {
      console.error("Failed to send message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
      setMessageText(text);
    } finally {
      setSending(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please grant permission to access photos",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0] && thread) {
      setSending(true);
      try {
        await chatService.sendImage(thread._id, result.assets[0].uri);
      } catch (error) {
        console.error("Failed to send image:", error);
        Alert.alert("Error", "Failed to send image. Please try again.");
      } finally {
        setSending(false);
      }
    }
  };

  const handleTyping = (text: string) => {
    setMessageText(text);

    if (!thread) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Start typing indicator
    if (text.length > 0) {
      chatService.startTyping(thread._id);

      // Stop typing after 3 seconds of no activity
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 3000);
    } else {
      stopTyping();
    }
  };

  const stopTyping = () => {
    if (thread) {
      chatService.stopTyping(thread._id);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const senderId =
      typeof item.sender.userId === "object"
        ? item.sender.userId._id
        : item.sender.userId;
    const senderName =
      typeof item.sender.userId === "object"
        ? item.sender.userId.fullName
        : "Support";
    const isMyMessage = senderId === currentUserId;

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.theirMessage,
        ]}
      >
        {!isMyMessage && <Text style={styles.senderName}>{senderName}</Text>}

        {item.type === "image" && item.content.mediaUrl ? (
          <View>
            <Image
              source={{ uri: `${API_URL}${item.content.mediaUrl}` }}
              style={styles.messageImage}
              resizeMode="cover"
            />
            {item.content.text && (
              <Text
                style={[
                  styles.messageText,
                  isMyMessage ? styles.myMessageText : styles.theirMessageText,
                ]}
              >
                {item.content.text}
              </Text>
            )}
          </View>
        ) : (
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.theirMessageText,
            ]}
          >
            {item.content.text}
          </Text>
        )}

        <View style={styles.messageFooter}>
          <Text
            style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.theirMessageTime,
            ]}
          >
            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
          </Text>
          {isMyMessage && (
            <Ionicons
              name={item.status === "read" ? "checkmark-done" : "checkmark"}
              size={14}
              color={isMyMessage ? "#fff" : "#666"}
              style={styles.readIcon}
            />
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8C42" />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Ionicons name="headset" size={24} color="#FF8C42" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Customer Support</Text>
            <Text style={styles.headerSubtitle}>
              {isTyping ? "Typing..." : "We're here to help"}
            </Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.messagesContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handlePickImage}
            disabled={sending}
          >
            <Ionicons
              name="image"
              size={24}
              color={sending ? "#ccc" : "#FF8C42"}
            />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={messageText}
            onChangeText={handleTyping}
            placeholder="Type your message..."
            placeholderTextColor="#999"
            multiline
            maxLength={1000}
            editable={!sending}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF5EC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Raleway-Bold",
    color: "#333333",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: "75%",
    marginBottom: 16,
    padding: 12,
    borderRadius: 16,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#FF8C42",
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: "#fff",
  },
  theirMessageText: {
    color: "#333",
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  myMessageTime: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  theirMessageTime: {
    color: "#999",
  },
  readIcon: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  iconButton: {
    padding: 8,
    marginRight: 8,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    fontSize: 15,
    color: "#333",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF8C42",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
});
