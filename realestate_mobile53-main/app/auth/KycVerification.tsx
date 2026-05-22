import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BackButton, PrimaryButton } from "../../components/Ui";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "../../components/styles/GlobalStyles";
import { authService } from "../../services/authService";

const PENDING_SELLER_SIGNUP_KEY = "pending_seller_signup_kyc";

type DocumentType = "cin" | "passport";

type PendingSellerSignup = {
  phoneNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  city: string;
  userType: "seller";
  interest: "property" | "cars";
};

type SelectedAsset = {
  uri: string;
  name: string;
  mimeType: string;
};

const KycVerificationScreen = () => {
  const router = useRouter();
  const [draft, setDraft] = useState<PendingSellerSignup | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>("cin");
  const [frontDocument, setFrontDocument] = useState<SelectedAsset | null>(null);
  const [backDocument, setBackDocument] = useState<SelectedAsset | null>(null);
  const [faceVideo, setFaceVideo] = useState<SelectedAsset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadDraft = async () => {
      const rawDraft = await AsyncStorage.getItem(PENDING_SELLER_SIGNUP_KEY);
      if (!rawDraft) {
        Alert.alert("Verification Step Unavailable", "Please complete the seller signup form first.", [
          { text: "OK", onPress: () => router.replace("/auth/SignUp") },
        ]);
        return;
      }

      setDraft(JSON.parse(rawDraft));
    };

    loadDraft().catch((error) => {
      Alert.alert("Verification Step Unavailable", error.message || "Unable to load the seller signup details.");
      router.back();
    });
  }, [router]);

  const requestMediaPermissions = async (needsCamera = false) => {
    const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!libraryPermission.granted) {
      Alert.alert("Permission Required", "Please allow access to your media library to continue.");
      return false;
    }

    if (needsCamera) {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermission.granted) {
        Alert.alert("Camera Permission Required", "Please allow camera access to record your live verification video.");
        return false;
      }
    }

    return true;
  };

  const selectDocument = async (setter: (asset: SelectedAsset | null) => void) => {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets.length) {
      return;
    }

    const asset = result.assets[0];
    setter({
      uri: asset.uri,
      name: asset.fileName || `kyc-image-${Date.now()}.jpg`,
      mimeType: asset.mimeType || "image/jpeg",
    });
  };

  const recordFaceVideo = async () => {
    const hasPermission = await requestMediaPermissions(true);
    if (!hasPermission) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.7,
      videoMaxDuration: 12,
      cameraType: ImagePicker.CameraType.front,
    });

    if (result.canceled || !result.assets.length) {
      return;
    }

    const asset = result.assets[0];
    setFaceVideo({
      uri: asset.uri,
      name: asset.fileName || `kyc-video-${Date.now()}.mp4`,
      mimeType: asset.mimeType || "video/mp4",
    });
  };

  const buildFilePart = (asset: SelectedAsset) => ({
    uri: asset.uri,
    name: asset.name,
    type: asset.mimeType,
  }) as any;

  const handleSubmit = async () => {
    if (!draft || !frontDocument || !backDocument || !faceVideo) {
      Alert.alert("Verification Incomplete", "Upload the front and back of your document, then record a live face video.");
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("phoneNumber", draft.phoneNumber);
      formData.append("email", draft.email);
      formData.append("password", draft.password);
      formData.append("confirmPassword", draft.confirmPassword);
      formData.append("firstName", draft.firstName || "");
      formData.append("lastName", draft.lastName || "");
      formData.append("userType", draft.userType);
      formData.append("interest", draft.interest);
      formData.append("city", draft.city);
      formData.append("documentType", documentType);
      formData.append("identityFront", buildFilePart(frontDocument));
      formData.append("identityBack", buildFilePart(backDocument));
      formData.append("faceVideo", buildFilePart(faceVideo));

      await authService.registerSellerPhoneWithKyc(formData);
      await AsyncStorage.removeItem(PENDING_SELLER_SIGNUP_KEY);

      Alert.alert(
        "Registration Submitted",
        `A verification link has been sent to ${draft.email}. Your identity files were saved for admin review.`,
        [{ text: "OK", onPress: () => router.replace("/auth/SignIn") }]
      );
    } catch (error: any) {
      Alert.alert(
        "Verification Failed",
        error.message || "We couldn't submit your verification right now. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPickerCard = (
    title: string,
    description: string,
    asset: SelectedAsset | null,
    onPress: () => void,
    iconName: keyof typeof Ionicons.glyphMap,
    isVideo = false
  ) => (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardHeader}>
        <View style={styles.iconWrap}>
          <Ionicons name={iconName} size={20} color={Colors.primary} />
        </View>
        <View style={styles.cardTextWrap}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
      </View>

      {asset ? (
        <View style={styles.previewWrap}>
          {isVideo ? (
            <View style={styles.videoPreview}>
              <Ionicons name="videocam" size={28} color={Colors.primary} />
              <Text style={styles.videoLabel}>{asset.name}</Text>
            </View>
          ) : (
            <Image source={{ uri: asset.uri }} style={styles.previewImage} />
          )}
          <Text style={styles.replaceLabel}>Tap to replace</Text>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="cloud-upload-outline" size={26} color={Colors.textSecondary} />
          <Text style={styles.emptyStateText}>Tap to upload</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const isReady = !!draft && !!frontDocument && !!backDocument && !!faceVideo;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <BackButton color={Colors.textPrimary} />
          <Text style={styles.progressLabel}>Step 2 of 2</Text>
        </View>

        <View style={styles.heroPanel}>
          <Text style={styles.eyebrow}>Seller verification</Text>
          <Text style={styles.title}>Verify your identity before listing items for sale</Text>
          <Text style={styles.subtitle}>
            Upload your identity document and record a short live face video so the admin can review your seller account.
          </Text>
        </View>

        <View style={styles.documentTypeRow}>
          {(["cin", "passport"] as DocumentType[]).map((type) => {
            const active = documentType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.documentTypeChip, active && styles.documentTypeChipActive]}
                onPress={() => setDocumentType(type)}
              >
                <Text style={[styles.documentTypeText, active && styles.documentTypeTextActive]}>
                  {type === "cin" ? "CIN" : "Passport"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {renderPickerCard(
          documentType === "cin" ? "CIN front side" : "Passport photo page",
          "Use a clear image with all text visible.",
          frontDocument,
          () => selectDocument(setFrontDocument),
          "id-card-outline"
        )}

        {renderPickerCard(
          documentType === "cin" ? "CIN back side" : "Passport back page",
          "Make sure the full document is in frame.",
          backDocument,
          () => selectDocument(setBackDocument),
          "albums-outline"
        )}

        {renderPickerCard(
          "Live face video",
          "Record a short selfie video while looking at the camera.",
          faceVideo,
          recordFaceVideo,
          "videocam-outline",
          true
        )}

        <View style={styles.noteBox}>
          <Ionicons name="shield-checkmark-outline" size={18} color={Colors.primary} />
          <Text style={styles.noteText}>
            Your uploaded files are kept for account verification only and can be reviewed later by the admin team.
          </Text>
        </View>

        <PrimaryButton
          title={isSubmitting ? "Submitting verification..." : "Create seller account"}
          onPress={handleSubmit}
          disabled={!isReady || isSubmitting}
          style={styles.submitButton}
        />

        <Text style={styles.footerText}>
          {draft ? `Verification email will be sent to ${draft.email}` : "Loading seller details..."}
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === "ios" ? Spacing['5xl'] : Spacing['4xl'],
    paddingBottom: Spacing['5xl'],
    gap: Spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressLabel: {
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
  },
  heroPanel: {
    backgroundColor: "#FFF3EB",
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
  },
  eyebrow: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.fontSize.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  title: {
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize['2xl'],
    lineHeight: 30,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.base,
    lineHeight: 22,
  },
  documentTypeRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  documentTypeChip: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  documentTypeChipActive: {
    borderColor: Colors.primary,
    backgroundColor: "#FFF3EB",
  },
  documentTypeText: {
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.fontSize.base,
  },
  documentTypeTextActive: {
    color: Colors.primary,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "center",
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    backgroundColor: "#FFF3EB",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.fontSize.lg,
    marginBottom: 4,
  },
  cardDescription: {
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
  },
  previewWrap: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundLight,
  },
  videoPreview: {
    height: 120,
    borderRadius: BorderRadius.lg,
    backgroundColor: "#FFF3EB",
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  videoLabel: {
    marginTop: Spacing.sm,
    color: Colors.textPrimary,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    textAlign: "center",
  },
  replaceLabel: {
    color: Colors.primary,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
  },
  emptyState: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.border,
    paddingVertical: Spacing['3xl'],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.backgroundLight,
    gap: Spacing.sm,
  },
  emptyStateText: {
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.base,
  },
  noteBox: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "flex-start",
    backgroundColor: "#FFF8F3",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  noteText: {
    flex: 1,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
  footerText: {
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    textAlign: "center",
  },
});

export default KycVerificationScreen;