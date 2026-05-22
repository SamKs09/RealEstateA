import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../hooks/useTranslation";
import i18n from "../services/i18n";
import userService from "../services/userService";
import { getFullImageUrl } from "../services/api";

export default function EditInfoScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();

  const initialName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : (user as any)?.name || "";
    
  const [fullName, setFullName] = useState(initialName);
  const [email, setEmail] = useState(user?.email || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || (user as any)?.phone || "");
  const [city, setCity] = useState((user as any)?.location?.city || (user as any)?.city || "");
  const [country, setCountry] = useState((user as any)?.location?.country || (user as any)?.country || "");
  
  // Password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [avatar, setAvatar] = useState((user as any)?.avatar || (user as any)?.profileImage || null);
  const [loading, setLoading] = useState(false);

  const handleEditPhoto = async () => {
    Alert.alert(
      t("editInfo.updatePhoto"),
      t("editInfo.selectFromGallery"),
      [
        {
          text: t("editInfo.takePhoto"),
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(t("error"), t("editInfo.permissionNeeded"));
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });
            if (!result.canceled) {
              setAvatar(result.assets[0].uri);
            }
          }
        },
        {
          text: t("editInfo.selectFromGallery"),
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(t("error"), t("editInfo.permissionNeeded"));
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });
            if (!result.canceled) {
              setAvatar(result.assets[0].uri);
            }
          }
        },
        {
          text: t("cancel"),
          style: "cancel"
        }
      ]
    );
  };

  const handleSave = async () => {
    try {
      console.log("💾 Starting profile save...");
      setLoading(true);
      
      // 1. Validate Password if filling
      if (newPassword || currentPassword || confirmPassword) {
        if (!currentPassword) {
          throw new Error(t("settings.currentPasswordRequired") || "Current password is required");
        }
        if (newPassword.length < 8) {
          throw new Error(t("settings.passwordTooShort") || "Password must be at least 8 characters");
        }
        if (newPassword !== confirmPassword) {
          throw new Error(t("settings.passwordsDoNotMatch") || "Passwords do not match");
        }
      }

      // 2. Prepare Profile Update
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

      const updateData: any = {
        firstName,
        lastName,
        email,
        phoneNumber,
        location: { city, country },
      };

      let finalPayload: any = updateData;
      const hasNewImage = avatar && avatar.startsWith("file://");

      if (hasNewImage) {
        console.log("📷 Image changed, using FormData payload");
        const formData = new FormData();
        formData.append("firstName", firstName);
        formData.append("lastName", lastName);
        formData.append("email", email);
        formData.append("phoneNumber", phoneNumber);
        formData.append("location", JSON.stringify({ city, country }));

        const fileName = avatar.split("/").pop();
        const match = /\.(\w+)$/.exec(fileName || "");
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        const imagePayload = {
          uri: avatar,
          name: fileName || "profile.jpg",
          type,
        } as any;
        
        formData.append("avatar", imagePayload);
        finalPayload = formData;
      }

      // 3. Update Password if requested
      if (newPassword) {
        console.log("🔐 Changing password...");
        const pwdResponse = await userService.changePassword({
          currentPassword,
          newPassword,
          confirmPassword
        });
        if (!pwdResponse.success) {
          throw new Error(pwdResponse.message || "Failed to change password");
        }
      }

      // 4. Send Profile Update Request
      const response = await userService.updateProfile(finalPayload);
      console.log("📡 Profile update response:", response);

      // 5. Refresh Auth User Data
      const profileResponse = await userService.getUserProfile();
      if (profileResponse.success && profileResponse.data) {
        await updateUser(profileResponse.data);
      }

      Alert.alert(t("editInfo.successTitle"), t("editInfo.successMessage"), [
        {
          text: t("ok"),
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error("❌ Save error:", error);
      Alert.alert(t("error"), error.message || t("editInfo.failedToSave"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#252B5C" />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text style={styles.title}>{t("editInfo.title")}</Text>

      {/* Profile Photo */}
      <View style={styles.photoSection}>
        <View style={styles.photoContainer}>
            {avatar ? (
              <Image
                key={avatar} // Force re-render when avatar URI changes
                source={{ uri: avatar.startsWith("file://") ? avatar : getFullImageUrl(avatar) }}
                style={styles.photo}
                contentFit="cover"
                cachePolicy={avatar.startsWith("file://") ? "disk" : "none"} // Don't cache remote avatar to avoid seeing old one
              />
          ) : (
            <Image
              source={require("../assets/sam b.png")}
              style={styles.photo}
              contentFit="cover"
            />
          )}
          <TouchableOpacity 
            style={styles.editPhotoButton}
            onPress={handleEditPhoto}
          >
            <Image
              source={require("../assets/Icons/Edit.png")}
              style={styles.editIcon}
              contentFit="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={20} color="#FF8C42" />
          <Text style={styles.sectionTitle}>{t("editInfo.personalInfo") || "Personal Information"}</Text>
        </View>

        {/* Full Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t("editInfo.fullName")}</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder={t("editInfo.fullNamePlaceholder")}
              placeholderTextColor="#A1A5C1"
            />
          </View>
        </View>

        {/* Email Address */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t("editInfo.emailAddress")}</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={t("editInfo.emailPlaceholder")}
              placeholderTextColor="#A1A5C1"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Phone Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t("editInfo.phoneNumber")}</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder={t("editInfo.phonePlaceholder")}
              placeholderTextColor="#A1A5C1"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* City & Country Row */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>{t("editInfo.city")}</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder={t("editInfo.cityPlaceholder")}
                placeholderTextColor="#A1A5C1"
              />
            </View>
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>{t("editInfo.country")}</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={country}
                onChangeText={setCountry}
                placeholder={t("editInfo.countryPlaceholder")}
                placeholderTextColor="#A1A5C1"
              />
            </View>
          </View>
        </View>

        <View style={[styles.sectionHeader, { marginTop: 20 }]}>
          <Ionicons name="lock-closed-outline" size={20} color="#FF8C42" />
          <Text style={styles.sectionTitle}>{t("editInfo.security") || "Security"}</Text>
        </View>

        {/* Current Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t("settings.currentPassword") || "Current Password"}</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••••"
              placeholderTextColor="#A1A5C1"
              secureTextEntry
            />
          </View>
        </View>

        {/* New Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t("settings.newPassword") || "New Password"}</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="••••••••"
              placeholderTextColor="#A1A5C1"
              secureTextEntry
            />
          </View>
        </View>

        {/* Confirm Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t("settings.confirmPassword") || "Confirm Password"}</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              placeholderTextColor="#A1A5C1"
              secureTextEntry
            />
          </View>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity 
        style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>{t("editInfo.save")}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FE",
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontFamily: "raleway-700Bold",
    color: "#252B5C",
    textAlign: "center",
    marginBottom: 10,
  },
  photoSection: {
    alignItems: "center",
    marginVertical: 30,
  },
  photoContainer: {
    position: "relative",
  },
  photo: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  editPhotoButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FF8C42",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    shadowColor: "#FF8C42",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  editIcon: {
    width: 18,
    height: 18,
    tintColor: "#FFFFFF",
  },
  form: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "raleway-700Bold",
    color: "#252B5C",
    marginLeft: 10,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 13,
    fontFamily: "raleway-600SemiBold",
    color: "#53587A",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "raleway-500Medium",
    color: "#252B5C",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#FF8C42",
    marginHorizontal: 20,
    marginVertical: 30,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#FF8C42",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 18,
    fontFamily: "raleway-700Bold",
    color: "#FFFFFF",
  },
});
