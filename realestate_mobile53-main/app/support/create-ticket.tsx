import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { useTranslation } from "../../hooks/useTranslation";
import { BackButton } from "../../components/Ui";
import { apiService } from "../../services/api";

export default function CreateTicketScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const compressImage = async (uri: string): Promise<string> => {
    try {
      const manipResult = await manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }], // Resize to max width of 1024px
        { compress: 0.7, format: SaveFormat.JPEG },
      );
      return manipResult.uri;
    } catch (error) {
      console.error("Error compressing image:", error);
      return uri; // Return original if compression fails
    }
  };

  const handlePickImage = async () => {
    if (attachments.length >= 5) {
      Alert.alert(t("support.maxAttachments"), t("support.maxAttachmentsDesc"));
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("support.permissionNeeded"), t("support.permissionDesc"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: false,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5 - attachments.length,
    });

    if (!result.canceled) {
      // Compress all images before adding them
      const compressedUris = await Promise.all(
        result.assets.map((asset) => compressImage(asset.uri)),
      );
      setAttachments([...attachments, ...compressedUris]);
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert(t("support.error"), t("support.messageRequired"));
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("content", message.trim());

      attachments.forEach((uri, index) => {
        const filename = uri.split("/").pop() || `image_${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append("attachments", {
          uri,
          name: filename,
          type,
        } as any);
      });

      console.log(
        "📤 Uploading support ticket with",
        attachments.length,
        "attachments",
      );

      // Use longer timeout for file uploads (30 seconds)
      apiService.setCustomTimeout(30000);
      await apiService.post("/support", formData);
      apiService.setCustomTimeout(10000); // Reset to default

      Alert.alert(t("support.success"), t("support.messageSent"), [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error("Error sending support message:", error);
      Alert.alert(t("support.error"), error.message || t("support.sendError"));
    } finally {
      setLoading(false);
      // Ensure timeout is reset even if error occurs
      apiService.setCustomTimeout(10000);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton style={styles.backButtonMargin} />
        <Text style={styles.headerTitle}>{t("support.contactSupport")}</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>{t("support.messageLabel")}</Text>
          <TextInput
            style={styles.input}
            multiline
            numberOfLines={6}
            placeholder={t("support.messagePlaceholder")}
            placeholderTextColor="#999"
            value={message}
            onChangeText={setMessage}
            textAlignVertical="top"
          />

          <Text style={styles.label}>{t("support.attachmentsLabel")}</Text>
          <View style={styles.attachmentsContainer}>
            {attachments.map((uri, index) => (
              <View key={index} style={styles.attachmentItem}>
                <Image source={{ uri }} style={styles.attachmentImage} />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeAttachment(index)}
                >
                  <Ionicons name="close-circle" size={20} color="#FF4444" />
                </TouchableOpacity>
              </View>
            ))}
            {attachments.length < 5 && (
              <TouchableOpacity
                style={styles.addAttachmentButton}
                onPress={handlePickImage}
              >
                <Ionicons name="add" size={30} color="#FF8C42" />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>{t("support.send")}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButtonMargin: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Raleway-Bold",
    color: "#333333",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: "Raleway-SemiBold",
    color: "#333333",
    marginBottom: 10,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    fontFamily: "Raleway-Regular",
    color: "#333333",
    minHeight: 150,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  attachmentsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 5,
  },
  attachmentItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  attachmentImage: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 10,
  },
  addAttachmentButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  submitButton: {
    backgroundColor: "#FF8C42",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#FFCCAA",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Raleway-Bold",
  },
});
