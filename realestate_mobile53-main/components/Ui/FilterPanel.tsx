import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Pressable,
  TextInput,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "../../hooks/useTranslation";
import { PriceRangeSlider } from "./PriceRangeSlider";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const PANEL_WIDTH = SCREEN_WIDTH > 600 ? 400 : SCREEN_WIDTH * 0.85;

export interface FilterState {
  listingType: string[];
  transmission: string[];
  fuelType: string[];
  propertyType: string[];
  location: string[];
  minPrice: number;
  maxPrice: number;
}

interface FilterPanelProps {
  isVisible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters: FilterState;
  interest: "property" | "cars";
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  isVisible,
  onClose,
  onApply,
  initialFilters,
  interest,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const translateX = useSharedValue(-PANEL_WIDTH);
  const opacity = useSharedValue(0);

  const [filters, setFilters] = React.useState<FilterState>(initialFilters);

  useEffect(() => {
    if (isVisible) {
      translateX.value = withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.exp),
      });
      opacity.value = withTiming(1, { duration: 300 });
      setFilters(initialFilters);
    } else {
      translateX.value = withTiming(-PANEL_WIDTH, {
        duration: 300,
        easing: Easing.in(Easing.exp),
      });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isVisible, initialFilters]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: isVisible ? "auto" : "none",
  }));

  const toggleFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const current = prev[key] as string[];
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter((v) => v !== value) };
      } else {
        return { ...prev, [key]: [...current, value] };
      }
    });
  };

  const handleClear = () => {
    setFilters({
      listingType: [],
      transmission: [],
      fuelType: [],
      propertyType: [],
      location: [],
      minPrice: 0,
      maxPrice: 500000,
    });
  };

  const CheckboxItem = ({
    label,
    selected,
    onPress,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={styles.checkboxItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
      <Text style={[styles.checkboxLabel, selected && styles.labelSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.panel,
          animatedStyle,
          { height: SCREEN_HEIGHT - insets.bottom },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("explore.filters")}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Transaction Type */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>
                {t("explore.transactionType")}
              </Text>
            </View>
            <View style={styles.checkboxGroup}>
              <CheckboxItem
                label={t("addCar.forSale")}
                selected={filters.listingType.includes("sale")}
                onPress={() => toggleFilter("listingType", "sale")}
              />
              <CheckboxItem
                label={t("addCar.forRent")}
                selected={filters.listingType.includes("rent")}
                onPress={() => toggleFilter("listingType", "rent")}
              />
            </View>
          </View>

          {/* Location - For Properties */}
          {interest === "property" && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>
                  {t("explore.location")}
                </Text>
              </View>
              <View style={styles.checkboxGroup}>
                <CheckboxItem
                  label="City"
                  selected={filters.location.includes("city")}
                  onPress={() => toggleFilter("location", "city")}
                />
                <CheckboxItem
                  label="Open Map"
                  selected={filters.location.includes("map")}
                  onPress={() => toggleFilter("location", "map")}
                />
              </View>
            </View>
          )}

          {/* Property Type - For Properties */}
          {interest === "property" && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>
                  {t("explore.propertyType")}
                </Text>
              </View>
              <View style={styles.checkboxGroup}>
                <CheckboxItem
                  label={t("explore.house")}
                  selected={filters.propertyType.includes("house")}
                  onPress={() => toggleFilter("propertyType", "house")}
                />
                <CheckboxItem
                  label={t("explore.apartment")}
                  selected={filters.propertyType.includes("apartment")}
                  onPress={() => toggleFilter("propertyType", "apartment")}
                />
                <CheckboxItem
                  label={t("explore.villa")}
                  selected={filters.propertyType.includes("villa")}
                  onPress={() => toggleFilter("propertyType", "villa")}
                />
                <CheckboxItem
                  label={t("explore.land")}
                  selected={filters.propertyType.includes("land")}
                  onPress={() => toggleFilter("propertyType", "land")}
                />
                <CheckboxItem
                  label={t("explore.commercial")}
                  selected={filters.propertyType.includes("commercial")}
                  onPress={() => toggleFilter("propertyType", "commercial")}
                />
              </View>
            </View>
          )}

          {interest === "cars" && (
            <>
              {/* Transmission */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>
                    {t("explore.transmission")}
                  </Text>
                </View>
                <View style={styles.checkboxGroup}>
                  <CheckboxItem
                    label={t("addCar.manual")}
                    selected={filters.transmission.includes("manual")}
                    onPress={() => toggleFilter("transmission", "manual")}
                  />
                  <CheckboxItem
                    label={t("addCar.automatic")}
                    selected={filters.transmission.includes("automatic")}
                    onPress={() => toggleFilter("transmission", "automatic")}
                  />
                </View>
              </View>

              {/* Fuel Type */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>
                    {t("explore.fuelType")}
                  </Text>
                </View>
                <View style={styles.checkboxGroup}>
                  <CheckboxItem
                    label={t("addCar.petrol")}
                    selected={filters.fuelType.includes("petrol")}
                    onPress={() => toggleFilter("fuelType", "petrol")}
                  />
                  <CheckboxItem
                    label={t("addCar.diesel")}
                    selected={filters.fuelType.includes("diesel")}
                    onPress={() => toggleFilter("fuelType", "diesel")}
                  />
                  <CheckboxItem
                    label={t("addCar.electric")}
                    selected={filters.fuelType.includes("electric")}
                    onPress={() => toggleFilter("fuelType", "electric")}
                  />
                </View>
              </View>
            </>
          )}

          {/* Price Range */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>
                {t("explore.priceRange")}
              </Text>
            </View>
            <View style={styles.sliderSection}>
              <PriceRangeSlider
                minPrice={filters.minPrice}
                maxPrice={filters.maxPrice}
                onMinPriceChange={(price) =>
                  setFilters((f) => ({ ...f, minPrice: price }))
                }
                onMaxPriceChange={(price) =>
                  setFilters((f) => ({ ...f, maxPrice: price }))
                }
                minValue={0}
                maxValue={500000}
                step={5000}
              />
              <View style={styles.priceInputsRow}>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.priceInputLabel}>Min</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={
                      filters.minPrice === 0 ? "" : String(filters.minPrice)
                    }
                    onChangeText={(val) => {
                      const num = val.replace(/[^0-9]/g, "");
                      setFilters((f) => ({ ...f, minPrice: Number(num) || 0 }));
                    }}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                  />
                </View>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.priceInputLabel}>Max</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={
                      filters.maxPrice === 0 ? "" : String(filters.maxPrice)
                    }
                    onChangeText={(val) => {
                      const num = val.replace(/[^0-9]/g, "");
                      setFilters((f) => ({ ...f, maxPrice: Number(num) || 0 }));
                    }}
                    keyboardType="numeric"
                    placeholder="100,000+"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.premiumClearButton}
            onPress={handleClear}
          >
            <Text style={styles.premiumClearText}>{t("explore.clearAll")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.premiumApplyButton}
            onPress={() => {
              onApply(filters);
              onClose();
            }}
          >
            <Text style={styles.premiumApplyText}>
              {t("explore.showResults")}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  panel: {
    width: PANEL_WIDTH,
    height: "100%",
    backgroundColor: "#FFB385", // Peach background
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingTop: 65,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "raleway-700Bold",
    color: "#fff",
  },
  closeButton: {
    padding: 5,
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    backgroundColor: "#FF5C00", // Deep orange bubble
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 18,
    alignSelf: "flex-start",
    shadowColor: "#FF5C00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  sectionHeaderText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "raleway-700Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  checkboxGroup: {
    marginLeft: 5,
  },
  checkboxItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#fff",
    marginRight: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#FF5C00",
    borderColor: "#FF5C00",
  },
  checkboxLabel: {
    fontSize: 17,
    color: "#fff",
    fontFamily: "raleway-600SemiBold",
  },
  labelSelected: {
    fontFamily: "raleway-700Bold",
  },
  locationContainer: {
    gap: 12,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationCardText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontFamily: "raleway-700Bold",
    marginLeft: 12,
  },
  dropdownIcon: {
    marginLeft: 5,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  mapButtonText: {
    fontSize: 14,
    color: "#fff",
    fontFamily: "raleway-600SemiBold",
    marginLeft: 8,
    textDecorationLine: "underline",
  },
  priceInputsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
    marginBottom: 20,
  },
  priceInputWrapper: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  priceInputLabel: {
    fontSize: 12,
    color: "#fff",
    fontFamily: "raleway-600SemiBold",
    marginBottom: 4,
    opacity: 0.8,
  },
  priceInput: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "raleway-700Bold",
    padding: 0,
  },
  sliderSection: {
    paddingHorizontal: 5,
  },
  priceLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  priceLabelValue: {
    fontSize: 18,
    color: "#fff",
    fontFamily: "raleway-700Bold",
  },
  premiumSlider: {
    height: 30,
    justifyContent: "center",
    position: "relative",
  },
  premiumSliderTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 3,
  },
  premiumSliderFill: {
    position: "absolute",
    height: 6,
    backgroundColor: "#fff",
    borderRadius: 3,
    left: "0%",
    right: "0%",
  },
  premiumThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF5C00",
    position: "absolute",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 80,
    backgroundColor: "#FFB385",
    gap: 15,
  },
  premiumClearButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  premiumClearText: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "raleway-700Bold",
  },
  premiumApplyButton: {
    flex: 2,
    backgroundColor: "#fff",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  premiumApplyText: {
    fontSize: 16,
    color: "#FF5C00",
    fontFamily: "raleway-800ExtraBold",
  },
});
