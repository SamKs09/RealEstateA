import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, MapType } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

interface MapPickerProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: { latitude: number; longitude: number }) => void;
  initialLocation?: { latitude: number; longitude: number };
  readOnly?: boolean;
}

const { width, height } = Dimensions.get("window");

// Default location (Center of Tunisia - Balanced view)
const DEFAULT_LOCATION = {
  latitude: 34.825,
  longitude: 9.875,
  latitudeDelta: 3.0,
  longitudeDelta: 3.0,
};

export const MapPicker: React.FC<MapPickerProps> = ({
  visible,
  onClose,
  onLocationSelect,
  initialLocation,
  readOnly = false,
}) => {
  const mapRef = useRef<MapView>(null);
  const [selectedLocation, setSelectedLocation] = useState(
    initialLocation || {
      latitude: DEFAULT_LOCATION.latitude,
      longitude: DEFAULT_LOCATION.longitude,
    }
  );
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [mapType, setMapType] = useState<MapType>("standard");
  const [showMapTypes, setShowMapTypes] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Get user's current location when modal opens
  useEffect(() => {
    if (visible) {
      getCurrentLocation();
    }
  }, [visible]);

  const getCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);

      // Check if location services are enabled on the device
      const isEnabled = await Location.hasServicesEnabledAsync();

      if (!isEnabled) {
        Alert.alert(
          "Location Services Disabled",
          "Please enable location services in your device settings to use this feature.",
          [
            { text: "OK", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                if (Platform.OS === "ios") {
                  Linking.openURL("app-settings:");
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        return;
      }

      // Check current permission status first
      const { status: existingStatus } =
        await Location.getForegroundPermissionsAsync();

      let finalStatus = existingStatus;

      // If not granted, request permission
      if (existingStatus !== "granted") {
        console.log("📍 Requesting location permission...");
        const { status } = await Location.requestForegroundPermissionsAsync();
        finalStatus = status;
        console.log("📍 Permission status:", status);
      }

      if (finalStatus !== "granted") {
        Alert.alert(
          "Permission Required",
          "Location permission is needed to show your current location. Please enable location access in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                // For iOS, this will open app settings
                if (Platform.OS === "ios") {
                  Linking.openURL("app-settings:");
                } else {
                  // For Android, open app settings
                  Linking.openSettings();
                }
              },
            },
          ]
        );
        return;
      }

      console.log("✅ Location permission granted, fetching location...");

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const userLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(userLocation);
      setSelectedLocation(userLocation);

      // Animate map to user's location
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          1000
        );
      }

      console.log("✅ Got user location:", userLocation);
    } catch (error) {
      console.error("❌ Error getting location:", error);
      Alert.alert(
        "Location Error",
        "Could not get your current location. Please ensure location services are enabled on your device and try again."
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const mapTypes: { type: MapType; label: string; icon: string }[] = [
    { type: "standard", label: "Standard", icon: "map-outline" },
    { type: "satellite", label: "Satellite", icon: "planet-outline" },
    { type: "hybrid", label: "Hybrid", icon: "layers-outline" },
  ];

  const handleMapPress = (event: any) => {
    if (readOnly) return;
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
  };

  const handleConfirm = () => {
    onLocationSelect(selectedLocation);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {readOnly ? "Location" : "Select Location"}
          </Text>
          {!readOnly ? (
            <TouchableOpacity
              onPress={handleConfirm}
              style={styles.confirmButton}
            >
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>

        {/* Map */}
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          mapType={mapType}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          showsScale={true}
          showsBuildings={true}
          showsTraffic={false}
          scrollEnabled={true}
          zoomEnabled={true}
          minZoomLevel={5}
          maxZoomLevel={18}
          initialRegion={{
            latitude:
              currentLocation?.latitude ||
              initialLocation?.latitude ||
              DEFAULT_LOCATION.latitude,
            longitude:
              currentLocation?.longitude ||
              initialLocation?.longitude ||
              DEFAULT_LOCATION.longitude,
            latitudeDelta: DEFAULT_LOCATION.latitudeDelta,
            longitudeDelta: DEFAULT_LOCATION.longitudeDelta,
          }}
          onMapReady={() => {
            if (mapRef.current) {
              mapRef.current.setMapBoundaries(
                { latitude: 37.4, longitude: 11.75 }, // Northeast
                { latitude: 32.25, longitude: 8.0 }   // Southwest
              );
            }
          }}
          onPress={handleMapPress}
        >
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              title="Selected Location"
              description={`Lat: ${selectedLocation.latitude.toFixed(
                4
              )}, Long: ${selectedLocation.longitude.toFixed(4)}`}
            />
          )}
        </MapView>

        {/* Loading Indicator */}
        {isLoadingLocation && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
          </View>
        )}

        {/* Map Type Selector Button */}
        <TouchableOpacity
          style={styles.mapTypeButton}
          onPress={() => setShowMapTypes(!showMapTypes)}
        >
          <Ionicons name="layers" size={24} color="#FF6B35" />
        </TouchableOpacity>

        {/* My Location Button */}
        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={getCurrentLocation}
          disabled={isLoadingLocation}
        >
          <Ionicons
            name="locate"
            size={24}
            color={isLoadingLocation ? "#999" : "#007AFF"}
          />
        </TouchableOpacity>

        {/* Map Type Options */}
        {showMapTypes && (
          <View style={styles.mapTypeContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {mapTypes.map((item) => (
                <TouchableOpacity
                  key={item.type}
                  style={[
                    styles.mapTypeOption,
                    mapType === item.type && styles.mapTypeOptionActive,
                  ]}
                  onPress={() => {
                    setMapType(item.type);
                    setShowMapTypes(false);
                  }}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={mapType === item.type ? "#FFFFFF" : "#FF6B35"}
                  />
                  <Text
                    style={[
                      styles.mapTypeText,
                      mapType === item.type && styles.mapTypeTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Location Info */}
        <View style={styles.locationInfo}>
          <Text style={styles.locationText}>
            Latitude: {selectedLocation.latitude.toFixed(6)}
          </Text>
          <Text style={styles.locationText}>
            Longitude: {selectedLocation.longitude.toFixed(6)}
          </Text>
          {!readOnly && (
            <Text style={styles.helpText}>
              Tap on the map to select a location
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

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
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Raleway-Bold",
    color: "#333333",
  },
  confirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FF6B35",
    borderRadius: 20,
  },
  confirmText: {
    fontSize: 16,
    fontFamily: "Raleway-SemiBold",
    color: "#FFFFFF",
  },
  map: {
    width: width,
    height: height - 250,
  },
  locationInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  locationText: {
    fontSize: 14,
    fontFamily: "Raleway-Medium",
    color: "#333333",
    marginBottom: 5,
  },
  helpText: {
    fontSize: 12,
    fontFamily: "Raleway",
    color: "#999999",
    marginTop: 10,
    textAlign: "center",
  },
  mapTypeButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 120 : 100,
    right: 20,
    backgroundColor: "#FFFFFF",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  myLocationButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 180 : 160,
    right: 20,
    backgroundColor: "#FFFFFF",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  mapTypeContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 120 : 100,
    right: 80,
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  mapTypeOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: "#F8F8F8",
    gap: 6,
  },
  mapTypeOptionActive: {
    backgroundColor: "#FF6B35",
  },
  mapTypeText: {
    fontSize: 14,
    fontFamily: "Raleway-SemiBold",
    color: "#FF6B35",
  },
  mapTypeTextActive: {
    color: "#FFFFFF",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Raleway-Medium",
    color: "#333333",
  },
});
