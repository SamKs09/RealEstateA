import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "../../hooks/useTranslation";
import { imagePreloader } from "../../services/imagePreloader";

interface PropertyCardProps {
  image: any;
  title?: string; // Property title/name or Car model
  price: string;
  address: string;
  area: string;
  bedrooms: number; // For property: bedrooms, For cars: seats
  bathrooms: number; // For property: bathrooms, For cars: doors or km value
  distance?: string; // Optional distance indicator
  onPress?: () => void;
  style?: any;
  variant?: "default" | "best";
  mode?: "property" | "cars"; // New prop to determine display mode
}

export const PropertyCard: React.FC<PropertyCardProps> = memo(
  ({
    image,
    title,
    price,
    address,
    area,
    bedrooms,
    bathrooms,
    distance,
    onPress,
    style,
    variant = "default",
    mode = "property",
  }) => {
    const { t } = useTranslation();
    
    if (variant === "best") {
      return (
        <TouchableOpacity
          style={[styles.bestPropertyCard, style]}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Image
            {...imagePreloader.getOptimizedImageProps(image)}
            style={styles.bestPropertyImage}
          />
          <View style={styles.bestPropertyInfo}>
            <Text
              style={styles.bestPropertyTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
            <Text style={styles.bestPropertyPrice}>{price}</Text>
            <View style={styles.bestPropertyFeatures}>
              {mode === "cars" ? (
                <>
                  <View style={styles.bestFeature}>
                    <Image
                      {...imagePreloader.getOptimizedIconProps(
                        require("../../assets/Icons/Car.png"),
                      )}
                      style={styles.featureIcon}
                    />
                    <Text style={styles.bestFeatureText}>
                      <Text style={styles.numberText}>{bedrooms}</Text> kW
                    </Text>
                  </View>
                  <View style={styles.bestFeature}>
                    <Image
                      {...imagePreloader.getOptimizedIconProps(
                        require("../../assets/Icons/Speed.png"),
                      )}
                      style={styles.featureIcon}
                    />
                    <Text style={styles.bestFeatureText}>
                      <Text style={styles.numberText}>{bathrooms}</Text> km/h
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.bestFeature}>
                    <Image
                      {...imagePreloader.getOptimizedIconProps(
                        require("../../assets/Icons/IC_Bed.png"),
                      )}
                      style={styles.featureIcon}
                    />
                    <Text
                      style={styles.bestFeatureText}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      <Text style={styles.numberText}>{bedrooms}</Text>{" "}
                      {bedrooms === 1
                        ? t("property.bedroom")
                        : t("property.bedrooms")}
                    </Text>
                  </View>
                  <View style={styles.bestFeature}>
                    <Image
                      {...imagePreloader.getOptimizedIconProps(
                        require("../../assets/Icons/IC_Bath.png"),
                      )}
                      style={styles.featureIcon}
                    />
                    <Text
                      style={styles.bestFeatureText}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      <Text style={styles.numberText}>{bathrooms}</Text>{" "}
                      {bathrooms === 1
                        ? t("property.bathroom")
                        : t("property.bathrooms")}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.propertyCard, style]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.propertyImageContainer}>
          <Image
            {...imagePreloader.getOptimizedImageProps(image)}
            style={styles.propertyImage}
          />

          {/* Distance indicator in top-right corner */}
          {distance && (
            <View style={styles.distanceIndicator}>
              <Text style={styles.distanceText}>{distance}</Text>
            </View>
          )}

          {/* Overlay information on bottom half of image */}
          <View style={styles.propertyInfoOverlay}>
            {/* Shadow image as background */}
            <Image
              source={require("../../assets/images/Effet/Shadow.png")}
              style={styles.shadowImage}
            />
            <View style={styles.overlayContent}>
              <Text style={styles.overlayAddress}>{address}</Text>
              <Text style={styles.overlayArea}>{area}</Text>
              <View style={styles.overlayFeatures}>
                {mode === "cars" ? (
                  <>
                    <View style={styles.overlayFeature}>
                      <Image
                        {...imagePreloader.getOptimizedIconProps(
                          require("../../assets/Icons/Car.png"),
                        )}
                        style={{ width: 14, height: 14, tintColor: "#FFFFFF" }}
                      />
                      <Text style={styles.overlayFeatureText}>
                        {bedrooms} kW
                      </Text>
                    </View>
                    <View style={[styles.overlayFeature, { marginLeft: 8 }]}>
                      <Image
                        {...imagePreloader.getOptimizedIconProps(
                          require("../../assets/Icons/Speed.png"),
                        )}
                        style={{ width: 14, height: 14, tintColor: "#FFFFFF" }}
                      />
                      <Text style={styles.overlayFeatureText}>
                        {bathrooms} km/h
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.overlayFeature}>
                      <Image
                        {...imagePreloader.getOptimizedIconProps(
                          require("../../assets/Icons/IC_Bed.png"),
                        )}
                        style={{ width: 14, height: 14, tintColor: "#FFFFFF" }}
                      />
                      <Text style={styles.overlayFeatureText}>{bedrooms}</Text>
                    </View>
                    <View style={[styles.overlayFeature, { marginLeft: 8 }]}>
                      <Image
                        {...imagePreloader.getOptimizedIconProps(
                          require("../../assets/Icons/IC_Bath.png"),
                        )}
                        style={{ width: 14, height: 14, tintColor: "#FFFFFF" }}
                      />
                      <Text style={styles.overlayFeatureText}>{bathrooms}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

PropertyCard.displayName = "PropertyCard";

export default PropertyCard;

const styles = StyleSheet.create({
  propertyCard: {
    marginRight: 15,
    width: 180, // Reduced width from 220 to 180
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  propertyImageContainer: {
    position: "relative",
    marginBottom: 10,
  },
  propertyImage: {
    width: 180, // Reduced width from 220 to 180
    height: 200, // Increased height from 160 to 200
    borderRadius: 16,
  },
  // Distance indicator in top-right corner
  distanceIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "500",
    fontFamily: "raleway-500Medium",
  },
  // Overlay styles for property info on image
  propertyInfoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80, // Fixed height for the overlay area
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: "hidden",
  },
  shadowImage: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 180,
    height: 80,
    resizeMode: "stretch",
  },
  overlayContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    zIndex: 1,
  },
  overlayPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 3,
  },
  overlayAddress: {
    fontSize: 12,
    color: "#FFFFFF",
    fontFamily: "raleway-400Regular",
    marginBottom: 2,
  },
  overlayArea: {
    fontSize: 10,
    color: "#E0E0E0",
    fontFamily: "raleway-400Regular",
    marginBottom: 6,
  },
  overlayFeatures: {
    flexDirection: "row",
    gap: 12,
  },
  overlayFeature: {
    flexDirection: "row",
    alignItems: "center",
  },
  overlayFeatureText: {
    marginLeft: 3,
    fontSize: 10,
    color: "#FFFFFF",
    fontFamily: "raleway-400Regular",
  },
  // Old styles kept for backward compatibility (unused now for default variant)
  propertyInfo: {
    paddingHorizontal: 5,
  },
  propertyPrice: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "raleway-700Bold",
    color: "#333333",
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 14,
    color: "#8A8A8A",
    fontFamily: "raleway-400Regular",
    marginBottom: 2,
  },
  propertyArea: {
    fontSize: 12,
    color: "#B0B0B0",
    fontFamily: "raleway-400Regular",
    marginBottom: 8,
  },
  propertyFeatures: {
    flexDirection: "row",
    gap: 15,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#8A8A8A",
    fontFamily: "raleway-400Regular",
  },
  bestPropertyCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    borderRadius: 18,
    marginBottom: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  bestPropertyImage: {
    width: 100,
    height: 100,
    borderRadius: 14,
    marginLeft: -15,
    marginRight: 15,
  },
  bestPropertyInfo: {
    flex: 1,
    justifyContent: "space-between",
    marginBottom: 10,
  },
  bestPropertyTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "raleway-500Medium",
    color: "#333333",
    marginBottom: 8,
    flexShrink: 1,
  },
  bestPropertyPrice: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "raleway-600SemiBold",
    color: "#FF8C42",
    marginBottom: 12,
  },
  bestPropertyFeatures: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  bestFeature: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  bestFeatureText: {
    marginLeft: 6,
    fontSize: 13,
    color: "#8A8A8A",
    fontWeight: "400",
    fontFamily: "raleway-400Regular",
    flexShrink: 1,
    numberOfLines: 1,
  },
  featureIcon: {
    width: 24,
    height: 24,
    tintColor: "#8A8A8A",
  },
  numberText: {
    fontFamily: "raleway-500Medium",
  },
  carIconWrapper: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 15,
  },
  carIconText: {
    fontSize: 18,
  },
});
