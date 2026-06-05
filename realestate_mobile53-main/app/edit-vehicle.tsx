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
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { HeaderWithBackButton } from "@/components/Ui/HeaderWithBackButton";
import { MapPicker, SuccessModal } from "@/components/Ui";
import {
  getVehicle,
  updateVehicle,
  uploadVehicleImages,
  type Vehicle,
  type CreateVehicleData,
} from "@/services/vehicleService";
import { useTranslation } from "@/hooks/useTranslation";

const VEHICLE_TYPES = [
  { label: "Car", value: "car" },
  { label: "Motorcycle", value: "motorcycle" },
  { label: "Truck", value: "truck" },
  { label: "Van", value: "van" },
  { label: "Bus", value: "bus" },
];

const LISTING_TYPES = [
  { label: "For Sale", value: "sale" },
  { label: "For Rent", value: "rent" },
];

const FUEL_TYPES = [
  { label: "Petrol", value: "petrol" },
  { label: "Diesel", value: "diesel" },
  { label: "Electric", value: "electric" },
  { label: "Hybrid", value: "hybrid" },
];

const TRANSMISSION_TYPES = [
  { label: "Manual", value: "manual" },
  { label: "Automatic", value: "automatic" },
];

const CONDITION_TYPES = [
  { label: "New", value: "new" },
  { label: "Used", value: "used" },
  { label: "Certified", value: "certified" },
];

const RENT_PERIODS = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

const COMMON_FEATURES = [
  "Air Conditioning",
  "Bluetooth",
  "Backup Camera",
  "Sunroof",
  "Leather Seats",
  "Navigation System",
  "Parking Sensors",
  "Cruise Control",
];

const ADDITIONAL_FEATURES = [
  "Pet Friendly",
  "Smoking Allowed",
  "Long Term Rental",
  "Airport Pickup",
  "Insurance Included",
];

export default function EditVehicleScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const vehicleId = params.id as string;
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [locationAddress, setLocationAddress] = useState<string>("");
  const previewMapRef = useRef<MapView>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "car" as any,
    listingType: "rent" as "sale" | "rent",
    make: "",
    model: "",
    year: "",
    color: "",
    mileage: "",
    fuelType: "petrol" as any,
    transmission: "automatic" as any,
    condition: "used" as any,
    features: [] as string[],
    location: null as { latitude: number; longitude: number } | null,
    salePrice: "",
    rentPrice: "",
    rentPeriod: "daily" as any,
    deposit: "",
    currency: "DT",
    priceNegotiable: true,
    rules: [] as string[],
    newRule: "",
    existingImages: [] as string[],
    newImages: [] as { uri: string; name: string; type: string }[],
  });

  useEffect(() => {
    if (!vehicleId) {
      Alert.alert("Error", "Vehicle ID is required");
      router.back();
      return;
    }

    const loadVehicleData = async () => {
      try {
        const response = await getVehicle(vehicleId);
        const vehicle = response.data;

        // Map vehicle data to form data
        setFormData({
          title: vehicle.title || "",
          description: vehicle.description || "",
          type: vehicle.type || "car",
          listingType: vehicle.listingType || "rent",
          make: vehicle.vehicleDetails?.make || "",
          model: vehicle.vehicleDetails?.model || "",
          year: vehicle.vehicleDetails?.year?.toString() || "",
          color: vehicle.vehicleDetails?.color || "",
          mileage: vehicle.vehicleDetails?.mileage?.toString() || "",
          fuelType: vehicle.vehicleDetails?.fuelType || "petrol",
          transmission: vehicle.vehicleDetails?.transmission || "automatic",
          condition: vehicle.vehicleDetails?.condition || "used",
          features: vehicle.vehicleDetails?.features || [],
          location: vehicle.location?.coordinates
            ? {
                latitude: vehicle.location.coordinates.latitude,
                longitude: vehicle.location.coordinates.longitude,
              }
            : null,
          salePrice: vehicle.pricing?.salePrice?.toString() || "",
          rentPrice: vehicle.pricing?.rentPrice?.toString() || "",
          rentPeriod: vehicle.pricing?.rentPeriod || "daily",
          deposit: vehicle.pricing?.deposit?.toString() || "",
          currency: vehicle.pricing?.currency || "DT",
          priceNegotiable: vehicle.pricing?.negotiable ?? true,
          rules: [],
          newRule: "",
          existingImages: vehicle.media?.images || [],
          newImages: [],
        });

        if (vehicle.location?.address) {
          setLocationAddress(vehicle.location.address);
        } else if (vehicle.location?.coordinates) {
          getAddressFromCoordinates(
            vehicle.location.coordinates.latitude,
            vehicle.location.coordinates.longitude,
          );
        }

        setIsLoading(false);
      } catch (error: any) {
        console.error("Error loading vehicle:", error);
        Alert.alert("Error", "Failed to load vehicle details", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    };

    loadVehicleData();
  }, [vehicleId]);

  const updateFormData = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: "features", value: string) => {
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

  const handleAddImages = async () => {
    try {
      const totalImages =
        formData.existingImages.length + formData.newImages.length;
      if (totalImages >= 10) {
        Alert.alert("Limit Reached", "You can only have up to 10 images");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const remainingSlots = 10 - totalImages;
        const newImages = result.assets
          .slice(0, remainingSlots)
          .map((asset, index) => ({
            uri: asset.uri,
            name: `vehicle_image_${Date.now()}_${index}.jpg`,
            type: "image/jpeg",
          }));

        setFormData((prev) => ({
          ...prev,
          newImages: [...prev.newImages, ...newImages],
        }));
      }
    } catch (error) {
      console.error("Error picking images:", error);
      Alert.alert("Error", "Failed to select images");
    }
  };

  const handleRemoveImage = (index: number, isNew: boolean) => {
    if (isNew) {
      setFormData((prev) => ({
        ...prev,
        newImages: prev.newImages.filter((_, i) => i !== index),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        existingImages: prev.existingImages.filter((_, i) => i !== index),
      }));
    }
  };

  const getAddressFromCoordinates = async (
    latitude: number,
    longitude: number,
  ) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyAqSchAEdRlw3Rsk17pfI7H4NaWnmiROi4`,
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

  const handleLocationSelect = async (location: {
    latitude: number;
    longitude: number;
  }) => {
    setFormData((prev) => ({ ...prev, location }));
    await getAddressFromCoordinates(location.latitude, location.longitude);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          Alert.alert(t("addProperty.error"), "Please enter a vehicle title");
          return false;
        }
        if (!formData.description.trim()) {
          Alert.alert(t("addProperty.error"), t("addCar.enterDescription"));
          return false;
        }
        return true;
      case 3:
        if (!formData.location) {
          Alert.alert(t("addProperty.error"), "Please select a location");
          return false;
        }
        return true;
      case 4:
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
    if (!validateStep(4)) return;
    setIsSubmitting(true);

    try {
      const addressParts = locationAddress.split(",").map((p) => p.trim());
      const city = addressParts[addressParts.length - 2] || "Unknown City";
      const state = addressParts[addressParts.length - 3] || "Unknown State";

      // Helper function to convert full URL back to relative path
      const toRelativePath = (url: string) => {
        if (!url) return url;
        if (url.startsWith("http")) {
          try {
            const urlObj = new URL(url);
            return urlObj.pathname; // Returns just /uploads/vehicles/images/filename.jpg
          } catch (e) {
            return url;
          }
        }
        return url; // Already a relative path
      };

      const vehicleData: Partial<CreateVehicleData> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        listingType: formData.listingType,
        vehicleDetails: {
          make: formData.make,
          model: formData.model,
          year: formData.year ? parseInt(formData.year) : 0,
          color: formData.color,
          mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
          fuelType: formData.fuelType,
          transmission: formData.transmission,
          condition: formData.condition,
          features: formData.features,
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
          salePrice: formData.salePrice
            ? parseFloat(formData.salePrice)
            : undefined,
          rentPrice: formData.rentPrice
            ? parseFloat(formData.rentPrice)
            : undefined,
          rentPeriod:
            formData.listingType === "rent" ? formData.rentPeriod : undefined,
          deposit: formData.deposit ? parseFloat(formData.deposit) : undefined,
          currency: formData.currency,
          negotiable: formData.priceNegotiable,
        },
        // IMPORTANT: Convert full URLs back to relative paths for database storage
        media: {
          images: formData.existingImages.map(toRelativePath),
          videos: [],
          documents: [],
        },
      };

      console.log("📤 Updating vehicle with data:", vehicleData);
      console.log("📷 Existing images to keep:", formData.existingImages);
      console.log("📷 Relative paths:", vehicleData.media.images);
      console.log("🆕 New images to upload:", formData.newImages.length);

      // Step 1: Update vehicle data and replace images array with only the existing images
      await updateVehicle(vehicleId, vehicleData);

      // Step 2: Upload new images (they will be appended to the existing images)
      if (formData.newImages.length > 0) {
        try {
          console.log("📤 Uploading new images...");
          await uploadVehicleImages(vehicleId, formData.newImages);
          console.log("✅ New images uploaded successfully");
        } catch (imageError) {
          console.error("❌ Error uploading images:", imageError);
          Alert.alert(
            "Warning",
            "Vehicle updated but some images failed to upload",
          );
        }
      }

      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Error updating vehicle:", error);
      Alert.alert(
        t("addHouse.error"),
        error.message || "Failed to update vehicle",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4, 5].map((step, index) => (
        <View key={step} style={styles.stepContainer}>
          <View
            style={[
              styles.stepCircle,
              currentStep >= step && styles.stepCircleActive,
            ]}
          >
            <Text
              style={[
                styles.stepNumber,
                currentStep >= step && styles.stepNumberActive,
              ]}
            >
              {index + 1}
            </Text>
          </View>
          {index < 4 && (
            <View
              style={[
                styles.stepLine,
                currentStep > step && styles.stepLineActive,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <HeaderWithBackButton onBackPress={() => router.back()} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading vehicle data...</Text>
        </View>
      </View>
    );
  }

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeader}>Basic Information</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t("addProperty.title")} *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter vehicle title"
          value={formData.title}
          onChangeText={(text) => updateFormData("title", text)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t("addProperty.description")} *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter vehicle description"
          value={formData.description}
          onChangeText={(text) => updateFormData("description", text)}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Vehicle Type</Text>
        <View style={styles.chipContainer}>
          {VEHICLE_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.chip,
                formData.type === type.value && styles.chipSelected,
              ]}
              onPress={() => updateFormData("type", type.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  formData.type === type.value && styles.chipTextSelected,
                ]}
              >
                {type.label}
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
              style={[
                styles.chip,
                formData.listingType === type.value && styles.chipSelected,
              ]}
              onPress={() => updateFormData("listingType", type.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  formData.listingType === type.value &&
                    styles.chipTextSelected,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeader}>Vehicle Details</Text>

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Make</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Toyota"
            value={formData.make}
            onChangeText={(text) => updateFormData("make", text)}
          />
        </View>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Model</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Camry"
            value={formData.model}
            onChangeText={(text) => updateFormData("model", text)}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Year</Text>
          <TextInput
            style={styles.input}
            placeholder="2023"
            value={formData.year}
            onChangeText={(text) => updateFormData("year", text)}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>Color</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Black"
            value={formData.color}
            onChangeText={(text) => updateFormData("color", text)}
          />
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Mileage (km)</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          value={formData.mileage}
          onChangeText={(text) => updateFormData("mileage", text)}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Fuel Type</Text>
        <View style={styles.chipContainer}>
          {FUEL_TYPES.map((fuel) => (
            <TouchableOpacity
              key={fuel.value}
              style={[
                styles.chip,
                formData.fuelType === fuel.value && styles.chipSelected,
              ]}
              onPress={() => updateFormData("fuelType", fuel.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  formData.fuelType === fuel.value && styles.chipTextSelected,
                ]}
              >
                {fuel.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Transmission</Text>
        <View style={styles.chipContainer}>
          {TRANSMISSION_TYPES.map((trans) => (
            <TouchableOpacity
              key={trans.value}
              style={[
                styles.chip,
                formData.transmission === trans.value && styles.chipSelected,
              ]}
              onPress={() => updateFormData("transmission", trans.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  formData.transmission === trans.value &&
                    styles.chipTextSelected,
                ]}
              >
                {trans.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Condition</Text>
        <View style={styles.chipContainer}>
          {CONDITION_TYPES.map((cond) => (
            <TouchableOpacity
              key={cond.value}
              style={[
                styles.chip,
                formData.condition === cond.value && styles.chipSelected,
              ]}
              onPress={() => updateFormData("condition", cond.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  formData.condition === cond.value && styles.chipTextSelected,
                ]}
              >
                {cond.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Features</Text>
        <View style={styles.chipContainer}>
          {COMMON_FEATURES.map((feature) => (
            <TouchableOpacity
              key={feature}
              style={[
                styles.chip,
                formData.features.includes(feature) && styles.chipSelected,
              ]}
              onPress={() => toggleArrayItem("features", feature)}
            >
              <Text
                style={[
                  styles.chipText,
                  formData.features.includes(feature) &&
                    styles.chipTextSelected,
                ]}
              >
                {feature}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>
          Images ({formData.existingImages.length + formData.newImages.length}
          /10)
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.imageGallery}
        >
          {formData.existingImages.map((uri, index) => (
            <View key={`existing-${index}`} style={styles.imageContainer}>
              <Image
                source={{ uri }}
                style={styles.imagePreview}
                contentFit="cover"
              />
              <TouchableOpacity
                style={styles.imageDeleteButton}
                onPress={() => handleRemoveImage(index, false)}
              >
                <Ionicons name="close-circle" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
          {formData.newImages.map((image, index) => (
            <View key={`new-${index}`} style={styles.imageContainer}>
              <Image
                source={{ uri: image.uri }}
                style={styles.imagePreview}
                contentFit="cover"
              />
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
              <TouchableOpacity
                style={styles.imageDeleteButton}
                onPress={() => handleRemoveImage(index, true)}
              >
                <Ionicons name="close-circle" size={24} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
          {formData.existingImages.length + formData.newImages.length < 10 && (
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={handleAddImages}
            >
              <Ionicons name="add" size={32} color="#FF6B35" />
              <Text style={styles.addImageText}>Add Images</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeader}>Location</Text>

      <TouchableOpacity
        style={[
          styles.locationButton,
          formData.location && styles.locationButtonWithMap,
        ]}
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
                {locationAddress || "Loading address..."}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.locationPlaceholder}>
            <Ionicons name="map-outline" size={32} color="#FF6B35" />
            <Text style={styles.locationPlaceholderText}>
              Select Location on Map
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeader}>Pricing</Text>

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
            <Text style={styles.label}>
              {t("addProperty.rentPrice")} (DT) *
            </Text>
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
                  style={[
                    styles.chip,
                    formData.rentPeriod === period.value && styles.chipSelected,
                  ]}
                  onPress={() => updateFormData("rentPeriod", period.value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      formData.rentPeriod === period.value &&
                        styles.chipTextSelected,
                    ]}
                  >
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t("addProperty.deposit")}</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              value={formData.deposit}
              onChangeText={(text) => updateFormData("deposit", text)}
              keyboardType="numeric"
            />
          </View>
        </>
      )}

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

  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepHeader}>Additional Features & Rules</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Additional Features</Text>
        <View style={styles.chipContainer}>
          {ADDITIONAL_FEATURES.map((feature) => (
            <TouchableOpacity
              key={feature}
              style={[
                styles.chip,
                formData.features.includes(feature) && styles.chipSelected,
              ]}
              onPress={() => toggleArrayItem("features", feature)}
            >
              <Text
                style={[
                  styles.chipText,
                  formData.features.includes(feature) &&
                    styles.chipTextSelected,
                ]}
              >
                {feature}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Rental Rules</Text>
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
        <HeaderWithBackButton
          onBackPress={() =>
            currentStep > 1 ? setCurrentStep((s) => s - 1) : router.back()
          }
        />
        <Text style={styles.headerTitle}>Edit Vehicle</Text>
        <View style={{ width: 40 }} />
      </View>

      {renderStepIndicator()}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}

        <View style={styles.footer}>
          {currentStep < 5 ? (
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                if (validateStep(currentStep)) {
                  setCurrentStep((s) => s + 1);
                }
              }}
            >
              <Text style={styles.buttonText}>
                {t("addProperty.next") || "Next"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <MapPicker
        visible={showMapPicker}
        initialLocation={formData.location || undefined}
        onLocationSelect={handleLocationSelect}
        onClose={() => setShowMapPicker(false)}
      />

      <SuccessModal
        visible={showSuccessModal}
        title="Changes Saved!"
        message="Your vehicle information has been updated successfully."
        buttonText="Back to Profile"
        onClose={() => {
          setShowSuccessModal(false);
          router.replace("/(tabs)/profile");
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
  headerTitle: {
    fontSize: 20,
    fontFamily: "Raleway-Bold",
    color: "#333333",
    marginTop: -10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Raleway",
    color: "#666",
  },
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
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: "#F0F0F0",
    marginHorizontal: 4,
  },
  stepLineActive: { backgroundColor: "#FF6B35" },
  scrollContent: { padding: 20, paddingBottom: 300 },
  stepContent: { flex: 1 },
  stepHeader: {
    fontSize: 20,
    fontFamily: "Raleway-Bold",
    color: "#333",
    marginBottom: 20,
  },
  inputContainer: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontFamily: "Raleway-SemiBold",
    color: "#FF6B35",
    marginBottom: 8,
  },
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
  },
  halfWidth: { flex: 1 },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
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
  imageGallery: { marginTop: 8 },
  imageContainer: {
    width: 120,
    height: 120,
    marginRight: 12,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  imagePreview: { width: "100%", height: "100%", borderRadius: 12 },
  imageDeleteButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
  },
  newBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: "#FF8C42",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newBadgeText: { fontSize: 10, fontFamily: "Raleway-Bold", color: "#FFF" },
  addImageButton: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
  },
  addImageText: {
    fontSize: 12,
    fontFamily: "Raleway-Medium",
    color: "#FF6B35",
    marginTop: 4,
  },
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
  mapOverlayText: {
    fontSize: 12,
    color: "#333",
    flex: 1,
    fontFamily: "Raleway-Medium",
  },
  locationPlaceholder: { alignItems: "center", gap: 10 },
  locationPlaceholderText: { color: "#999", fontFamily: "Raleway" },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  ruleInputRow: { flexDirection: "row", gap: 10 },
  addRuleButton: {
    width: 48,
    height: 48,
    backgroundColor: "#FF6B35",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  rulesList: { marginTop: 16, gap: 8 },
  ruleItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
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
