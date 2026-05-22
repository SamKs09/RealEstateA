import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { BackButton, MapPicker, SuccessModal } from "../components/Ui";
import {
  createPropertyWithMedia,
  type CreatePropertyData,
} from "../services/propertyService";
import { authService } from "../services/authService";
import { apiService } from "../services/api";
import { useTranslation } from "../hooks/useTranslation";
import i18n from "../services/i18n";

const PROPERTY_TYPES = [
  { label: "Apartment", value: "apartment" },
  { label: "House", value: "house" },
  { label: "Villa", value: "villa" },
  { label: "Hotel", value: "hotel" },
  { label: "Commercial", value: "commercial" },
  { label: "Land", value: "land" },
  { label: "Office", value: "office" },
];

const LISTING_TYPES = [
  { label: "For Sale", value: "sale" },
  { label: "For Rent", value: "rent" },
];

const AREA_UNITS = [
  { label: "Square Meters", value: "sqm" },
  { label: "Square Feet", value: "sqft" },
];

const FURNISHING_OPTIONS = [
  { label: "Furnished", value: "furnished" },
  { label: "Semi-Furnished", value: "semi-furnished" },
  { label: "Unfurnished", value: "unfurnished" },
];

const RENT_PERIODS = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

const COMMON_AMENITIES = [
  "Swimming Pool",
  "Gym",
  "Parking",
  "Security",
  "Garden",
  "Elevator",
  "Power Backup",
  "Wi-Fi",
  "AC",
  "Balcony",
];

const COMMON_FEATURES = [
  "Pet Friendly",
  "Gated Community",
  "Near Metro",
  "Corner Property",
  "Vastu Compliant",
  "Newly Constructed",
  "Green Building",
];

export default function AddHouseScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [locale, setLocale] = useState(i18n.locale);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [locationAddress, setLocationAddress] = useState<string>("");
  const previewMapRef = useRef<MapView>(null);

  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<ImagePicker.ImagePickerAsset[]>([]);

  // Listen for language changes
  useEffect(() => {
    const checkLocale = setInterval(() => {
      if (i18n.locale !== locale) {
        setLocale(i18n.locale);
      }
    }, 100);
    return () => clearInterval(checkLocale);
  }, [locale]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "house" as any,
    listingType: "rent" as "sale" | "rent",
    bedrooms: "",
    bathrooms: "",
    area: "",
    areaUnit: "sqm" as "sqft" | "sqm",
    parking: "",
    furnishing: "unfurnished" as any,
    amenities: [] as string[],
    age: "",
    location: null as { latitude: number; longitude: number } | null,
    salePrice: "",
    rentPrice: "",
    rentPeriod: "monthly" as any,
    deposit: "",
    maintenanceCharges: "",
    currency: "DT",
    priceNegotiable: true,
    features: [] as string[],
    rules: [] as string[],
    newRule: "",
  });

  const updateFormData = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: "amenities" | "features", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((item) => item !== value)
        : [...prev[key], value],
    }));
  };

  const addRule = () => {
    if (formData.newRule.trim()) {
      setFormData((prev) => ({
        ...prev,
        rules: [...prev.rules, prev.newRule.trim()],
        newRule: "",
      }));
    }
  };

  const removeRule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  const getAddressFromCoordinates = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyAqSchAEdRlw3Rsk17pfI7H4NaWnmiROi4`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        setLocationAddress(data.results[0].formatted_address);
      } else {
        setLocationAddress("Location selected");
      }
    } catch (error) {
      console.error("Error fetching address:", error);
      setLocationAddress("Location selected");
    }
  };

  const handleLocationSelect = async (location: { latitude: number; longitude: number }) => {
    setFormData((prev) => ({ ...prev, location }));
    await getAddressFromCoordinates(location.latitude, location.longitude);
  };

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("addProperty.permissionNeeded") || "Permission Required", "Please grant photo library access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 20,
    });

    if (!result.canceled) {
      const newImages = result.assets.filter(asset => asset.type === 'image');
      const newVideos = result.assets.filter(asset => asset.type === 'video');
      
      const remainingImageSlots = Math.max(0, 15 - selectedImages.length);
      const remainingVideoSlots = Math.max(0, 5 - selectedVideos.length);

      const cappedImages = newImages.slice(0, remainingImageSlots);
      const cappedVideos = newVideos.slice(0, remainingVideoSlots);

      if (cappedImages.length < newImages.length || cappedVideos.length < newVideos.length) {
        Alert.alert(t("addProperty.error"), t("addProperty.mediaLimitExceeded"));
      }
      
      setSelectedImages((prev) => [...prev, ...cappedImages]);
      setSelectedVideos((prev) => [...prev, ...cappedVideos]);
    }
  };

  const removeImage = (index: number) => setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  const removeVideo = (index: number) => setSelectedVideos((prev) => prev.filter((_, i) => i !== index));

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          Alert.alert(t("addProperty.error"), t("addProperty.enterPropertyTitle"));
          return false;
        }
        if (!formData.description.trim()) {
          Alert.alert(t("addProperty.error"), t("addCar.enterDescription"));
          return false;
        }
        return true;
      case 2:
        if (formData.bedrooms && isNaN(parseInt(formData.bedrooms))) return false;
        return true;
      case 3:
        if (!formData.location) {
          Alert.alert(t("addProperty.error"), t("addHouse.selectLocation") || "Please select a location");
          return false;
        }
        return true;
      case 4:
        if (selectedImages.length === 0 && selectedVideos.length === 0) {
          Alert.alert(t("addProperty.error"), t("addProperty.addAtLeastOneMedia"));
          return false;
        }
        return true;
      case 5:
        if (formData.listingType === "sale" && !formData.salePrice) {
          Alert.alert(t("addProperty.error"), t("addCar.enterValidSalePrice"));
          return false;
        }
        if (formData.listingType === "rent" && !formData.rentPrice) {
          Alert.alert(t("addProperty.error"), t("addCar.enterValidRentPrice"));
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;
    setIsSubmitting(true);

    try {
      const token = await authService.getStoredToken();
      if (!token) {
        Alert.alert(t("addHouse.authRequired"), t("addHouse.authRequiredMessage"), [
          { text: t("addHouse.ok"), onPress: () => router.push("/auth/SignIn") }
        ]);
        setIsSubmitting(false);
        return;
      }
      apiService.setAuthToken(token);

      const addressParts = locationAddress.split(",").map(p => p.trim());
      const city = addressParts[addressParts.length - 2] || "Unknown City";
      const state = addressParts[addressParts.length - 3] || "Unknown State";

      const propertyData: CreatePropertyData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        listingType: formData.listingType,
        propertyDetails: {
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
          bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
          area: formData.area ? parseFloat(formData.area) : undefined,
          areaUnit: formData.areaUnit,
          parking: formData.parking ? parseInt(formData.parking) : undefined,
          furnishing: formData.furnishing,
          amenities: formData.amenities.length > 0 ? formData.amenities : undefined,
          age: formData.age ? parseInt(formData.age) : undefined,
        },
        location: {
          address: locationAddress,
          city: city,
          state: state,
          country: "Tunisia",
          coordinates: {
            latitude: formData.location!.latitude,
            longitude: formData.location!.longitude,
          },
        },
        pricing: {
          salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
          rentPrice: formData.rentPrice ? parseFloat(formData.rentPrice) : undefined,
          rentPeriod: formData.listingType === "rent" ? formData.rentPeriod : undefined,
          deposit: formData.deposit ? parseFloat(formData.deposit) : undefined,
          maintenanceCharges: formData.maintenanceCharges ? parseFloat(formData.maintenanceCharges) : undefined,
          currency: formData.currency,
          priceNegotiable: formData.priceNegotiable,
        },
        features: formData.features.length > 0 ? formData.features : undefined,
        rules: formData.rules.length > 0 ? formData.rules : undefined,
      };

      const mediaFiles = {
        images: selectedImages.map((img, i) => ({ uri: img.uri, type: "image/jpeg", name: `img_${Date.now()}_${i}.jpg` })),
        videos: selectedVideos.map((vid, i) => ({ uri: vid.uri, type: "video/mp4", name: `vid_${Date.now()}_${i}.mp4` })),
      };

      await createPropertyWithMedia(propertyData, mediaFiles);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Error creating property:", error);
      Alert.alert(t("addHouse.error"), error.message || t("addHouse.failedToCreate"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4, 5, 6].map((step) => (
        <View key={step} style={styles.stepContainer}>
          <View style={[styles.stepCircle, currentStep >= step && styles.stepCircleActive]}>
            <Text style={[styles.stepNumber, currentStep >= step && styles.stepNumberActive]}>{step}</Text>
          </View>
          {step < 6 && <View style={[styles.stepLine, currentStep > step && styles.stepLineActive]} />}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeader}>{t("addProperty.step1")}</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t("addProperty.title")} *</Text>
        <TextInput
          style={styles.input}
          placeholder={t("addProperty.titlePlaceholder")}
          value={formData.title}
          onChangeText={(text) => updateFormData("title", text)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t("addProperty.description")} *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={t("addProperty.descriptionPlaceholder")}
          value={formData.description}
          onChangeText={(text) => updateFormData("description", text)}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t("addHouse.propertyType")}</Text>
        <View style={styles.chipContainer}>
          {PROPERTY_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[styles.chip, formData.type === type.value && styles.chipSelected]}
              onPress={() => updateFormData("type", type.value)}
            >
              <Text style={[styles.chipText, formData.type === type.value && styles.chipTextSelected]}>
                {t(`explore.${type.value}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t("addProperty.listingType")}</Text>
        <View style={styles.chipContainer}>
          {LISTING_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[styles.chip, formData.listingType === type.value && styles.chipSelected]}
              onPress={() => updateFormData("listingType", type.value)}
            >
              <Text style={[styles.chipText, formData.listingType === type.value && styles.chipTextSelected]}>
                {t(`addProperty.${type.value === "sale" ? "forSale" : "forRent"}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeader}>{t("addProperty.step2")}</Text>
      
      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>{t("addProperty.bedrooms")}</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            value={formData.bedrooms}
            onChangeText={(text) => updateFormData("bedrooms", text)}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>{t("addProperty.bathrooms")}</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            value={formData.bathrooms}
            onChangeText={(text) => updateFormData("bathrooms", text)}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>{t("addProperty.area")}</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            value={formData.area}
            onChangeText={(text) => updateFormData("area", text)}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>{t("addProperty.unit")}</Text>
          <View style={styles.chipContainer}>
            {AREA_UNITS.map((unit) => (
              <TouchableOpacity
                key={unit.value}
                style={[styles.chipSmall, formData.areaUnit === unit.value && styles.chipSelected]}
                onPress={() => updateFormData("areaUnit", unit.value)}
              >
                <Text style={[styles.chipTextSmall, formData.areaUnit === unit.value && styles.chipTextSelected]}>
                  {t(`addProperty.${unit.value}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t("addProperty.furnishing")}</Text>
        <View style={styles.chipContainer}>
          {FURNISHING_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.chip, formData.furnishing === option.value && styles.chipSelected]}
              onPress={() => updateFormData("furnishing", option.value)}
            >
              <Text style={[styles.chipText, formData.furnishing === option.value && styles.chipTextSelected]}>
                {t(`addProperty.${option.value === "semi-furnished" ? "semiFurnished" : option.value}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t("addProperty.amenities")}</Text>
        <View style={styles.chipContainer}>
          {COMMON_AMENITIES.map((amenity) => (
            <TouchableOpacity
              key={amenity}
              style={[styles.chip, formData.amenities.includes(amenity) && styles.chipSelected]}
              onPress={() => toggleArrayItem("amenities", amenity)}
            >
              <Text style={[styles.chipText, formData.amenities.includes(amenity) && styles.chipTextSelected]}>
                {amenity}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeader}>{t("addProperty.step3")}</Text>
      
      <TouchableOpacity
        style={[styles.locationButton, formData.location && styles.locationButtonWithMap]}
        onPress={() => setShowMapPicker(true)}
      >
        {formData.location ? (
          <View style={styles.mapPreviewContainer}>
            <MapView
              ref={previewMapRef}
              style={styles.mapPreview}
              provider={PROVIDER_GOOGLE}
              region={{
                latitude: formData.location.latitude,
                longitude: formData.location.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pointerEvents="none"
            >
              <Marker coordinate={formData.location} />
            </MapView>
            <View style={styles.mapOverlay}>
              <Ionicons name="location" size={16} color="#FF6B35" />
              <Text style={styles.mapOverlayText} numberOfLines={2}>
                {locationAddress || t("addHouse.loadingAddress")}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.locationPlaceholder}>
            <Ionicons name="map-outline" size={32} color="#FF6B35" />
            <Text style={styles.locationPlaceholderText}>{t("addHouse.selectLocationOnMap")}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeader}>{t("addProperty.step4")}</Text>
      
      <TouchableOpacity style={styles.uploadButton} onPress={pickMedia}>
        <Ionicons name="images-outline" size={48} color="#FF6B35" />
        <Text style={styles.uploadText}>{t("addProperty.selectMedia")}</Text>
        <Text style={styles.imageCount}>
          {selectedImages.length}/15 {t("addProperty.images")} & {selectedVideos.length}/5 {t("addProperty.videos")}
        </Text>
      </TouchableOpacity>

      <View style={styles.imageGrid}>
        {selectedImages.map((img, i) => (
          <View key={`img-${i}`} style={styles.imageItem}>
            <Image source={{ uri: img.uri }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeIcon} onPress={() => removeImage(i)}>
              <Ionicons name="close-circle" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ))}
        {selectedVideos.map((vid, i) => (
          <View key={`vid-${i}`} style={styles.imageItem}>
            <View style={[styles.imagePreview, styles.videoPlaceholder]}>
              <Ionicons name="play-circle" size={40} color="white" />
            </View>
            <TouchableOpacity style={styles.removeIcon} onPress={() => removeVideo(i)}>
              <Ionicons name="close-circle" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeader}>{t("addProperty.step5")}</Text>
      
      {formData.listingType === "sale" ? (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t("addProperty.salePrice")} (DT) *</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            value={formData.salePrice}
            onChangeText={(text) => updateFormData("salePrice", text)}
            keyboardType="numeric"
          />
        </View>
      ) : (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t("addProperty.rentPrice")} (DT) *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={formData.rentPrice}
              onChangeText={(text) => updateFormData("rentPrice", text)}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t("addProperty.rentPeriod")}</Text>
            <View style={styles.chipContainer}>
              {RENT_PERIODS.map((period) => (
                <TouchableOpacity
                  key={period.value}
                  style={[styles.chip, formData.rentPeriod === period.value && styles.chipSelected]}
                  onPress={() => updateFormData("rentPeriod", period.value)}
                >
                  <Text style={[styles.chipText, formData.rentPeriod === period.value && styles.chipTextSelected]}>
                    {t(`addProperty.${period.value}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>{t("addProperty.deposit")}</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            value={formData.deposit}
            onChangeText={(text) => updateFormData("deposit", text)}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>{t("addProperty.maintenanceCharges")}</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            value={formData.maintenanceCharges}
            onChangeText={(text) => updateFormData("maintenanceCharges", text)}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>{t("addProperty.negotiable")}</Text>
        <Switch
          value={formData.priceNegotiable}
          onValueChange={(val) => updateFormData("priceNegotiable", val)}
          trackColor={{ false: "#E0E0E0", true: "#FF6B35" }}
        />
      </View>
    </View>
  );

  const renderStep6 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeader}>{t("addProperty.step6")}</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t("addProperty.additionalFeatures")}</Text>
        <View style={styles.chipContainer}>
          {COMMON_FEATURES.map((feature) => (
            <TouchableOpacity
              key={feature}
              style={[styles.chip, formData.features.includes(feature) && styles.chipSelected]}
              onPress={() => toggleArrayItem("features", feature)}
            >
              <Text style={[styles.chipText, formData.features.includes(feature) && styles.chipTextSelected]}>
                {feature}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t("addProperty.rules")}</Text>
        <View style={styles.ruleInputRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Add a rule..."
            value={formData.newRule}
            onChangeText={(text) => updateFormData("newRule", text)}
          />
          <TouchableOpacity style={styles.addRuleButton} onPress={addRule}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.rulesList}>
          {formData.rules.map((rule, i) => (
            <View key={i} style={styles.ruleItem}>
              <Ionicons name="checkmark-circle" size={20} color="#FF6B35" />
              <Text style={styles.ruleText}>{rule}</Text>
              <TouchableOpacity onPress={() => removeRule(i)}>
                <Ionicons name="close-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => currentStep > 1 ? setCurrentStep(s => s - 1) : router.back()} color="#FF6B35" />
        <Text style={styles.headerTitle}>{t("addHouse.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      {renderStepIndicator()}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
        {currentStep === 6 && renderStep6()}

        <View style={styles.footer}>
          {currentStep < 6 ? (
            <TouchableOpacity style={styles.button} onPress={() => validateStep(currentStep) && setCurrentStep(s => s + 1)}>
              <Text style={styles.buttonText}>{t("addProperty.next") || "Next"}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>{t("addHouse.addItem")}</Text>}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <MapPicker
        visible={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={formData.location || undefined}
      />

      <SuccessModal
        visible={showSuccessModal}
        title={t("addHouse.successTitle")}
        message={t("addHouse.successMessage")}
        buttonText={t("addHouse.viewProperties")}
        onClose={() => {
          setShowSuccessModal(false);
          router.replace("/(tabs)/Explore");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 22, fontFamily: "Raleway-Bold", color: "#FF6B35" },
  stepIndicator: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  stepContainer: { flexDirection: "row", alignItems: "center" },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  stepCircleActive: { backgroundColor: "#FF6B35" },
  stepNumber: { fontSize: 14, color: "#999", fontFamily: "Raleway-Bold" },
  stepNumberActive: { color: "#FFF" },
  stepLine: { width: 30, height: 2, backgroundColor: "#F0F0F0", marginHorizontal: 4 },
  stepLineActive: { backgroundColor: "#FF6B35" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  stepContent: { flex: 1 },
  stepHeader: { fontSize: 20, fontFamily: "Raleway-Bold", color: "#333", marginBottom: 20 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontFamily: "Raleway-SemiBold", color: "#FF6B35", marginBottom: 8 },
  input: {
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Raleway",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    color: "#333",
  },
  textArea: { height: 100, textAlignVertical: "top" },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 20 },
  halfWidth: { flex: 1 },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  chipSelected: { backgroundColor: "#FF6B35", borderColor: "#FF6B35" },
  chipText: { fontSize: 12, fontFamily: "Raleway-Medium", color: "#666" },
  chipTextSelected: { color: "#FFF" },
  chipSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  chipTextSmall: { fontSize: 10, fontFamily: "Raleway-Medium", color: "#666" },
  locationButton: {
    minHeight: 200,
    backgroundColor: "#F9F9F9",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  locationButtonWithMap: { padding: 0 },
  mapPreviewContainer: { width: "100%", height: 300, position: "relative" },
  mapPreview: { width: "100%", height: "100%" },
  mapOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mapOverlayText: { fontSize: 12, color: "#333", flex: 1, fontFamily: "Raleway-Medium" },
  locationPlaceholder: { alignItems: "center", gap: 10 },
  locationPlaceholderText: { color: "#999", fontFamily: "Raleway" },
  uploadButton: {
    padding: 40,
    backgroundColor: "#F9F9F9",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
    borderStyle: "dashed",
  },
  uploadText: { fontSize: 16, fontFamily: "Raleway-SemiBold", color: "#FF6B35", marginTop: 12 },
  imageCount: { fontSize: 12, color: "#666", marginTop: 4 },
  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 20 },
  imageItem: { width: "31%", aspectRatio: 1, position: "relative" },
  imagePreview: { width: "100%", height: "100%", borderRadius: 8 },
  videoPlaceholder: { backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  removeIcon: { position: "absolute", top: -8, right: -8 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  ruleInputRow: { flexDirection: "row", gap: 10 },
  addRuleButton: { width: 48, height: 48, backgroundColor: "#FF6B35", borderRadius: 12, justifyContent: "center", alignItems: "center" },
  rulesList: { marginTop: 16, gap: 8 },
  ruleItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#F9F9F9", padding: 12, borderRadius: 10, gap: 10 },
  ruleText: { flex: 1, fontSize: 14, color: "#333", fontFamily: "Raleway" },
  footer: { marginTop: 40 },
  button: {
    backgroundColor: "#FF6B35",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  buttonDisabled: { backgroundColor: "#FFB399", elevation: 0 },
  buttonText: { fontSize: 18, color: "#FFF", fontFamily: "Raleway-Bold" },
});
