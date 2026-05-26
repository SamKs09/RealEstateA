import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetFlatList,
  BottomSheetBackdrop,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Image } from "expo-image";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTranslation } from "../hooks/useTranslation";
import { BackButton, SuccessModal, MapPicker } from "../components/Ui";
import { vehicleService } from "../services";

const CAR_BRANDS_MODELS: Record<string, string[]> = {
  BMW: ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "6 Series", "7 Series", "X1", "X3", "X5", "X6", "M3", "M5"],
  "Mercedes-Benz": ["A-Class", "B-Class", "C-Class", "E-Class", "S-Class", "CLA", "GLA", "GLB", "GLC", "GLE", "GLS", "Sprinter"],
  Volkswagen: ["Golf", "Polo", "Passat", "Tiguan", "Touareg", "Jetta", "T-Roc", "T-Cross", "Caddy"],
  Renault: ["Clio", "Logan", "Sandero", "Duster", "Megane", "Koleos", "Kadjar", "Symbol", "Captur", "Kangoo", "Scenic"],
  Peugeot: ["108", "206", "207", "208", "2008", "301", "308", "3008", "408", "5008", "Partner"],
  "Citroën": ["C1", "C3", "C4", "C5", "C3 Aircross", "C5 Aircross", "Berlingo", "Xsara", "Jumpy"],
  Fiat: ["500", "Punto", "Tipo", "Bravo", "Doblo", "Stilo", "Uno", "Panda", "Ducato"],
  Toyota: ["Yaris", "Corolla", "Camry", "Avensis", "RAV4", "Land Cruiser", "Hilux", "C-HR", "Prius", "Fortuner"],
  Hyundai: ["i10", "i20", "i30", "Accent", "Elantra", "Tucson", "Santa Fe", "Creta", "Kona"],
  Kia: ["Picanto", "Rio", "Cerato", "Sportage", "Sorento", "Stonic", "Soul", "Carnival"],
  Dacia: ["Logan", "Sandero", "Duster", "Spring", "Jogger", "Lodgy"],
  Audi: ["A1", "A3", "A4", "A5", "A6", "A7", "Q2", "Q3", "Q5", "Q7", "TT"],
  Seat: ["Ibiza", "Leon", "Arona", "Ateca", "Tarraco", "Toledo"],
  Skoda: ["Fabia", "Octavia", "Superb", "Karoq", "Kodiaq", "Rapid"],
  Opel: ["Corsa", "Astra", "Insignia", "Mokka", "Crossland", "Grandland", "Zafira"],
  Ford: ["Fiesta", "Focus", "Mondeo", "Kuga", "Puma", "EcoSport", "Ranger", "Transit"],
  Suzuki: ["Swift", "Celerio", "Baleno", "Vitara", "S-Cross", "Jimny", "Ignis"],
  Nissan: ["Micra", "Juke", "Qashqai", "X-Trail", "Navara", "Patrol", "Leaf", "Note"],
  Honda: ["Jazz", "Civic", "Accord", "HR-V", "CR-V", "City"],
  Mazda: ["Mazda2", "Mazda3", "Mazda6", "CX-3", "CX-30", "CX-5"],
  Mitsubishi: ["Lancer", "Outlander", "Pajero", "Eclipse Cross", "ASX", "L200"],
  Chevrolet: ["Aveo", "Cruze", "Trax", "Captiva", "Spark", "Malibu"],
  Jeep: ["Renegade", "Compass", "Cherokee", "Grand Cherokee", "Wrangler"],
  "Alfa Romeo": ["MiTo", "Giulietta", "Giulia", "Stelvio", "Tonale"],
  Volvo: ["XC40", "XC60", "XC90", "S60", "S90", "V60", "V90"],
  "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Range Rover", "Range Rover Sport", "Range Rover Evoque"],
  Porsche: ["Cayenne", "Macan", "Panamera", "Taycan", "911", "Boxster"],
  Subaru: ["Impreza", "Legacy", "Outback", "Forester", "XV"],
  Chery: ["Tiggo 4", "Tiggo 7", "Tiggo 8", "Arrizo 5", "Arrizo 6"],
  MG: ["MG3", "MG5", "MG6", "ZS", "HS", "RX5"],
  "Great Wall": ["Haval H2", "Haval H6", "Haval Jolion", "Poer"],
  Other: ["Other"],
};

const BRAND_NAMES = Object.keys(CAR_BRANDS_MODELS).sort();

export default function AddCarNewScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const [vehicleType, setVehicleType] = useState<"car" | "motorcycle">("car");
  const brandSheetRef = useRef<BottomSheetModal>(null);
  const modelSheetRef = useRef<BottomSheetModal>(null);
  const [brandSearch, setBrandSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const snapPoints = useMemo(() => ["65%"], []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
    ),
    []
  );

  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    powertrain: "",
    transmission: "",
    power: "",
    maximumSpeed: "",
    batteryCapacity: "",
    firstRegistration: new Date(),
    // Motorcycle specific fields
    engineCC: "",
    year: new Date().getFullYear().toString(),
    mileage: "",
    powerHP: "",
    // Common fields
    fuelType: "gasoline",
    price: "",
    description: "",
    city: "",
    country: "Tunisia",
    latitude: 0,
    longitude: 0,
  });

  // Get user's current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setFormData((prev) => ({
          ...prev,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }));
      }
    } catch (error) {
      console.log("Location permission not granted or error:", error);
    }
  };

  const updateFormData = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(t("permissionRequired"), t("photoLibraryPermission"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });

    if (!result.canceled) {
      setSelectedImages((prev) => [...prev, ...result.assets]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLocationSelect = (location: { latitude: number; longitude: number }) => {
    setFormData((prev) => ({
      ...prev,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
    setShowMapPicker(false);
  };

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      updateFormData("firstRegistration", selectedDate);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.brand.trim()) {
      Alert.alert(t("addCar.error"), "Please enter the vehicle brand");
      return;
    }

    if (!formData.model.trim()) {
      Alert.alert(t("addCar.error"), "Please enter the vehicle model");
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert(t("addCar.error"), "Please enter a valid price");
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert(t("addCar.error"), "Please enter a description");
      return;
    }

    if (selectedImages.length === 0) {
      Alert.alert(t("addCar.error"), t("addCar.addAtLeastOneImage"));
      return;
    }

    try {
      setLoading(true);

      // Prepare vehicle data based on type
      let vehicleData: any = {
        title: `${formData.brand} ${formData.model}`.trim(),
        description: formData.description.trim(),
        type: vehicleType,
        listingType: "sale" as "sale" | "rent",
        location: {
          city: formData.city.trim() || "Tunisia",
          country: formData.country.trim(),
          ...(formData.latitude &&
            formData.longitude && {
              coordinates: {
                latitude: formData.latitude,
                longitude: formData.longitude,
              },
            }),
        },
        pricing: {
          salePrice: parseFloat(formData.price),
          currency: "USD",
          negotiable: true,
        },
      };

      if (vehicleType === "motorcycle") {
        // Motorcycle-specific data
        vehicleData.vehicleDetails = {
          make: formData.brand.trim(),
          model: formData.model.trim(),
          year: parseInt(formData.year) || new Date().getFullYear(),
          fuelType: formData.fuelType as "petrol" | "diesel" | "electric" | "hybrid",
          condition: "used" as "new" | "used" | "certified",
          ...(formData.engineCC && { engineCapacity: parseInt(formData.engineCC) }),
          ...(formData.mileage && { mileage: parseInt(formData.mileage) }),
          ...(formData.powerHP && { 
            features: [`${formData.powerHP} HP`] 
          }),
        };
      } else {
        // Car-specific data
        const powerValue = formData.power ? parseInt(formData.power.replace(/[^0-9]/g, "")) : undefined;
        
        let transmissionValue: "manual" | "automatic" | undefined;
        if (formData.transmission.trim()) {
          const trans = formData.transmission.toLowerCase().trim();
          if (trans.includes("manual")) {
            transmissionValue = "manual";
          } else if (trans.includes("auto")) {
            transmissionValue = "automatic";
          } else {
            transmissionValue = "automatic";
          }
        }

        vehicleData.vehicleDetails = {
          make: formData.brand.trim(),
          model: formData.model.trim(),
          year: formData.firstRegistration.getFullYear(),
          fuelType: formData.fuelType as "petrol" | "diesel" | "electric" | "hybrid",
          ...(transmissionValue && { transmission: transmissionValue }),
          condition: "used" as "new" | "used" | "certified",
          ...(powerValue && { engineCapacity: powerValue }),
          ...(formData.powertrain && { features: [formData.powertrain] }),
        };
      }

      console.log("📤 Submitting vehicle data:", vehicleData);

      // Create vehicle
      const response = await vehicleService.createVehicle(vehicleData);

      console.log("✅ Vehicle created:", response);

      // Upload images if vehicle was created
      if (response.success && (response.data._id || response.data.id)) {
        const vehicleId = (response.data._id || response.data.id) as string;
        if (vehicleId) {
          const images = selectedImages.map((image, index) => ({
            uri: image.uri,
            name: `vehicle_${Date.now()}_${index}.jpg`,
            type: "image/jpeg",
          }));

          await vehicleService.uploadVehicleImages(vehicleId, images);
        }
      }

      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("❌ Error creating vehicle:", error);
      const errorMessage =
        error?.message || error?.errors?.[0] || t("addCar.failedToCreate");
      Alert.alert(t("addCar.error"), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheetModalProvider>
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} color="#FF8C42" />
        <Text style={styles.headerTitle}>
          {vehicleType === "motorcycle" ? "Add new Motorcycle" : "Add new Car"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Vehicle Type Selector */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Vehicle Type</Text>
          <View style={styles.fuelTypeContainer}>
            <TouchableOpacity
              style={[
                styles.fuelTypeButton,
                vehicleType === "car" && styles.fuelTypeButtonActive,
              ]}
              onPress={() => setVehicleType("car")}
            >
              <Text
                style={[
                  styles.fuelTypeText,
                  vehicleType === "car" && styles.fuelTypeTextActive,
                ]}
              >
                Car
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.fuelTypeButton,
                vehicleType === "motorcycle" && styles.fuelTypeButtonActive,
              ]}
              onPress={() => setVehicleType("motorcycle")}
            >
              <Text
                style={[
                  styles.fuelTypeText,
                  vehicleType === "motorcycle" && styles.fuelTypeTextActive,
                ]}
              >
                Motorcycle
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Brand */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Brand</Text>
          <TouchableOpacity
            style={styles.pickerTrigger}
            onPress={() => brandSheetRef.current?.present()}
          >
            <Text style={formData.brand ? styles.pickerTriggerText : styles.pickerTriggerPlaceholder}>
              {formData.brand || "Select brand"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#CCCCCC" />
          </TouchableOpacity>
        </View>

        {/* Model */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Model</Text>
          <TouchableOpacity
            style={[styles.pickerTrigger, !formData.brand && styles.pickerTriggerDisabled]}
            onPress={() => formData.brand && modelSheetRef.current?.present()}
            activeOpacity={formData.brand ? 0.7 : 1}
          >
            <Text style={formData.model ? styles.pickerTriggerText : styles.pickerTriggerPlaceholder}>
              {formData.model || (formData.brand ? "Select model" : "Select a brand first")}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#CCCCCC" />
          </TouchableOpacity>
        </View>

        {/* Conditional Fields Based on Vehicle Type */}
        {vehicleType === "motorcycle" ? (
          <>
            {/* Engine (cc) - Motorcycle */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Engine (cc)</Text>
              <TextInput
                style={styles.input}
                placeholder="689"
                placeholderTextColor="#CCCCCC"
                value={formData.engineCC}
                onChangeText={(text) => updateFormData("engineCC", text)}
                keyboardType="numeric"
              />
            </View>

            {/* Year - Motorcycle */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Year</Text>
              <TextInput
                style={styles.input}
                placeholder="2024"
                placeholderTextColor="#CCCCCC"
                value={formData.year}
                onChangeText={(text) => updateFormData("year", text)}
                keyboardType="numeric"
              />
            </View>

            {/* Mileage (km) - Motorcycle */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mileage (km)</Text>
              <TextInput
                style={styles.input}
                placeholder="15000"
                placeholderTextColor="#CCCCCC"
                value={formData.mileage}
                onChangeText={(text) => updateFormData("mileage", text)}
                keyboardType="numeric"
              />
            </View>

            {/* Power (hp) - Motorcycle */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Power (hp)</Text>
              <TextInput
                style={styles.input}
                placeholder="95"
                placeholderTextColor="#CCCCCC"
                value={formData.powerHP}
                onChangeText={(text) => updateFormData("powerHP", text)}
                keyboardType="numeric"
              />
            </View>
          </>
        ) : (
          <>
            {/* Car-specific fields */}
            {/* Powertrain */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Powertrain</Text>
              <TextInput
                style={styles.input}
                placeholder="Electric"
                placeholderTextColor="#CCCCCC"
                value={formData.powertrain}
                onChangeText={(text) => updateFormData("powertrain", text)}
              />
            </View>

            {/* Transmission */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Transmission</Text>
              <TextInput
                style={styles.input}
                placeholder="automatic or manual"
                placeholderTextColor="#CCCCCC"
                value={formData.transmission}
                onChangeText={(text) => updateFormData("transmission", text)}
              />
            </View>

            {/* Power */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Power</Text>
              <TextInput
                style={styles.input}
                placeholder="250 kw"
                placeholderTextColor="#CCCCCC"
                value={formData.power}
                onChangeText={(text) => updateFormData("power", text)}
              />
            </View>

            {/* Maximum speed */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Maximum speed</Text>
              <TextInput
                style={styles.input}
                placeholder="193K/H"
                placeholderTextColor="#CCCCCC"
                value={formData.maximumSpeed}
                onChangeText={(text) => updateFormData("maximumSpeed", text)}
              />
            </View>

            {/* Battery capacity */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Battery capacity</Text>
              <TextInput
                style={styles.input}
                placeholder="83/81 KWH"
                placeholderTextColor="#CCCCCC"
                value={formData.batteryCapacity}
                onChangeText={(text) => updateFormData("batteryCapacity", text)}
              />
            </View>

            {/* First registration */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First registration</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.inputText}>
                  {formatDate(formData.firstRegistration)}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={formData.firstRegistration}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </>
        )}

        {/* Fuel Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fuel Type</Text>
          <View style={styles.fuelTypeContainer}>
            {[
              { label: "Gasoline", value: "petrol" },
              { label: "Diesel", value: "diesel" },
              { label: "Electric", value: "electric" },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.fuelTypeButton,
                  formData.fuelType === option.value && styles.fuelTypeButtonActive,
                ]}
                onPress={() => updateFormData("fuelType", option.value)}
              >
                <Text
                  style={[
                    styles.fuelTypeText,
                    formData.fuelType === option.value && styles.fuelTypeTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price</Text>
          <TextInput
            style={styles.input}
            placeholder="35,000"
            placeholderTextColor="#CCCCCC"
            value={formData.price}
            onChangeText={(text) => updateFormData("price", text)}
            keyboardType="numeric"
          />
        </View>

        {/* City (hidden but required for backend) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter city"
            placeholderTextColor="#CCCCCC"
            value={formData.city}
            onChangeText={(text) => updateFormData("city", text)}
          />
        </View>

        {/* Location Picker */}
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => setShowMapPicker(true)}
        >
          <Ionicons name="location-outline" size={20} color="#FF8C42" />
          <Text style={styles.locationButtonText}>
            {formData.latitude && formData.longitude
              ? "Location selected"
              : "Select location on map"}
          </Text>
        </TouchableOpacity>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="The BMW i5 is an all-electric sedan known for its sustainable luxury and advanced technology. Key features."
            placeholderTextColor="#CCCCCC"
            value={formData.description}
            onChangeText={(text) => updateFormData("description", text)}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Upload image */}
        <TouchableOpacity style={styles.uploadButton} onPress={pickImages}>
          <Ionicons name="add" size={32} color="#FF8C42" />
          <Text style={styles.uploadText}>Upload image</Text>
          {selectedImages.length > 0 && (
            <Text style={styles.imageCount}>
              {selectedImages.length} image{selectedImages.length > 1 ? "s" : ""} selected
            </Text>
          )}
        </TouchableOpacity>

        {/* Display selected images */}
        {selectedImages.length > 0 && (
          <View style={styles.imageGrid}>
            {selectedImages.map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: image.uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Add item button */}
        <TouchableOpacity
          style={[styles.addButton, loading && styles.addButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.addButtonText}>Add item</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Brand Bottom Sheet */}
      <BottomSheetModal
        ref={brandSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.sheetIndicator}
        backgroundStyle={styles.sheetBackground}
        keyboardBehavior="interactive"
        android_keyboardInputMode="adjustResize"
      >
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Select Brand</Text>
          <TouchableOpacity onPress={() => { brandSheetRef.current?.dismiss(); setBrandSearch(""); }}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <View style={styles.sheetSearch}>
          <Ionicons name="search" size={16} color="#8A8A8A" />
          <BottomSheetTextInput
            style={styles.sheetSearchInput}
            placeholder="Search brand..."
            placeholderTextColor="#CCCCCC"
            value={brandSearch}
            onChangeText={setBrandSearch}
          />
        </View>
        <BottomSheetFlatList
          data={BRAND_NAMES.filter((b) =>
            b.toLowerCase().includes(brandSearch.toLowerCase())
          )}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.sheetItem,
                formData.brand === item && styles.sheetItemActive,
              ]}
              onPress={() => {
                updateFormData("brand", item);
                updateFormData("model", "");
                brandSheetRef.current?.dismiss();
                setBrandSearch("");
              }}
            >
              <Text style={[
                styles.sheetItemText,
                formData.brand === item && styles.sheetItemTextActive,
              ]}>
                {item}
              </Text>
              {formData.brand === item && (
                <Ionicons name="checkmark" size={18} color="#FF8C42" />
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      </BottomSheetModal>

      {/* Model Bottom Sheet */}
      <BottomSheetModal
        ref={modelSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.sheetIndicator}
        backgroundStyle={styles.sheetBackground}
        keyboardBehavior="interactive"
        android_keyboardInputMode="adjustResize"
      >
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Select Model</Text>
          <TouchableOpacity onPress={() => { modelSheetRef.current?.dismiss(); setModelSearch(""); }}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <View style={styles.sheetSearch}>
          <Ionicons name="search" size={16} color="#8A8A8A" />
          <BottomSheetTextInput
            style={styles.sheetSearchInput}
            placeholder="Search model..."
            placeholderTextColor="#CCCCCC"
            value={modelSearch}
            onChangeText={setModelSearch}
          />
        </View>
        <BottomSheetFlatList
          data={(CAR_BRANDS_MODELS[formData.brand] || []).filter((m) =>
            m.toLowerCase().includes(modelSearch.toLowerCase())
          )}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.sheetItem,
                formData.model === item && styles.sheetItemActive,
              ]}
              onPress={() => {
                updateFormData("model", item);
                modelSheetRef.current?.dismiss();
                setModelSearch("");
              }}
            >
              <Text style={[
                styles.sheetItemText,
                formData.model === item && styles.sheetItemTextActive,
              ]}>
                {item}
              </Text>
              {formData.model === item && (
                <Ionicons name="checkmark" size={18} color="#FF8C42" />
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      </BottomSheetModal>

      {/* Map Picker Modal */}
      <MapPicker
        visible={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={
          formData.latitude && formData.longitude
            ? {
                latitude: formData.latitude,
                longitude: formData.longitude,
              }
            : undefined
        }
      />

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        title={t("addCar.success")}
        message={t("addCar.vehicleCreatedSuccessfully")}
        buttonText={t("addCar.viewListings")}
        onClose={() => {
          setShowSuccessModal(false);
          router.back();
        }}
      />
    </View>
    </BottomSheetModalProvider>
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Raleway-Bold",
    color: "#333333",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#FF8C42",
    marginBottom: 8,
    fontFamily: "raleway-400Regular",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "raleway-400Regular",
    borderWidth: 1,
    borderColor: "#E8E8E8",
    color: "#333333",
  },
  inputText: {
    fontSize: 15,
    fontFamily: "raleway-400Regular",
    color: "#333333",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  fuelTypeContainer: {
    flexDirection: "row",
    gap: 10,
  },
  fuelTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  fuelTypeButtonActive: {
    borderColor: "#FF8C42",
    backgroundColor: "#FFF5F0",
  },
  fuelTypeText: {
    fontSize: 14,
    fontFamily: "raleway-400Regular",
    color: "#999999",
  },
  fuelTypeTextActive: {
    color: "#FF8C42",
    fontWeight: "500",
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    backgroundColor: "#FFFFFF",
    marginBottom: 20,
  },
  locationButtonText: {
    fontSize: 14,
    fontFamily: "raleway-400Regular",
    color: "#FF8C42",
    marginLeft: 8,
  },
  uploadButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E8E8E8",
    marginBottom: 20,
  },
  uploadText: {
    fontSize: 16,
    fontFamily: "raleway-500Medium",
    color: "#FF8C42",
    marginTop: 8,
  },
  imageCount: {
    fontSize: 13,
    fontFamily: "raleway-400Regular",
    color: "#999999",
    marginTop: 4,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  imageContainer: {
    width: "31%",
    aspectRatio: 1,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "white",
    borderRadius: 12,
  },
  addButton: {
    backgroundColor: "#FF8C42",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "raleway-500Medium",
  },
  pickerTrigger: {
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerTriggerDisabled: {
    backgroundColor: "#FAFAFA",
  },
  pickerTriggerText: {
    fontSize: 15,
    fontFamily: "raleway-400Regular",
    color: "#333333",
  },
  pickerTriggerPlaceholder: {
    fontSize: 15,
    fontFamily: "raleway-400Regular",
    color: "#CCCCCC",
  },
  sheetBackground: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#FFFFFF",
  },
  sheetIndicator: {
    backgroundColor: "#E0E0E0",
    width: 40,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333333",
    fontFamily: "raleway-500Medium",
  },
  sheetSearch: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#F8F8F8",
    borderRadius: 14,
    gap: 8,
  },
  sheetSearchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "raleway-400Regular",
    color: "#333333",
  },
  sheetItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  sheetItemActive: {
    backgroundColor: "#FFF5F0",
  },
  sheetItemText: {
    fontSize: 15,
    fontFamily: "raleway-400Regular",
    color: "#333333",
  },
  sheetItemTextActive: {
    color: "#FF8C42",
    fontFamily: "raleway-500Medium",
  },
});
