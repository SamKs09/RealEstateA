import React, {
  useMemo,
  useCallback,
  useEffect,
  useState,
  useRef,
} from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import {
  BottomSheetModal,
  BottomSheetFlatList,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  SearchBar,
  FilterChip,
  FilterPanel,
  PropertyCard,
  ScreenWrapper,
} from "../../components/Ui";
import { FilterState } from "../../components/Ui/FilterPanel";
import { LoadingOverlay } from "../../components/Ui/LoadingOverlay";
import { useTranslation } from "../../hooks/useTranslation";
import { useInterest } from "../../contexts/InterestContext";
import { useAppInitialization } from "../../hooks/useAppInitialization";
import { SCREEN_IMAGES } from "../../services/imagePreloader";
import { searchProperties, Property } from "../../services/propertyService";
import { getFullImageUrl } from "../../services/api";
import * as vehicleService from "../../services/vehicleService";

type ExploreCardItem = {
  id: string;
  image: any;
  price: string;
  address: string;
  area: string;
  bedrooms: number;
  bathrooms: number;
  distance: string;
  title?: string;
  isPromoted?: boolean;
  promotionExpiry?: string;
  views?: number;
};

type PromoStoryItem = {
  id: string;
  listingId: string;
  title: string;
  subtitle: string;
  image: any;
  isCar: boolean;
};

async function loadNotificationService() {
  const module = await import("../../services/notificationService");
  return module.notificationService;
}

// Maps English governorate names (as stored in the backend) to locale keys
const GOVERNORATE_KEY_MAP: Record<string, string> = {
  tunis: "tunis",
  ariana: "ariana",
  "ben arous": "ben_arous",
  manouba: "manouba",
  nabeul: "nabeul",
  zaghouan: "zaghouan",
  bizerte: "bizerte",
  béja: "beja",
  beja: "beja",
  jendouba: "jendouba",
  kef: "kef",
  siliana: "siliana",
  kairouan: "kairouan",
  kasserine: "kasserine",
  "sidi bouzid": "sidi_bouzid",
  sousse: "sousse",
  monastir: "monastir",
  mahdia: "mahdia",
  sfax: "sfax",
  gafsa: "gafsa",
  tozeur: "tozeur",
  kebili: "kebili",
  gabès: "gabes",
  gabes: "gabes",
  medenine: "medenine",
  tataouine: "tataouine",
};

export default function ExploreScreen() {
  const { t } = useTranslation();
  const { activeView, setActiveView, refreshPreferences } = useInterest();

  const translateCity = useCallback(
    (city: string): string => {
      if (!city) return city;
      const govKey = GOVERNORATE_KEY_MAP[city.toLowerCase()];
      return govKey ? t(`governorates.${govKey}`) : city;
    },
    [t],
  );
  const { isImagesPreloaded } = useAppInitialization();
  const router = useRouter();

  // State for backend properties
  const [backendProperties, setBackendProperties] = useState<Property[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const propertyFilters = useMemo(
    () => [
      t("explore.all"),
      t("explore.house"),
      t("explore.apartment"),
      t("explore.villa"),
      t("explore.hotel"),
      t("explore.land"),
      t("explore.commercial"),
      t("explore.office"),
    ],
    [t],
  );

  const carFilters = useMemo(
    () => [
      t("explore.all"),
      t("addCar.car"),
      t("addCar.motorcycle"),
      t("addCar.truck"),
      t("addCar.van"),
      t("addCar.bus"),
    ],
    [t],
  );

  const filters = activeView === "cars" ? carFilters : propertyFilters;

  const [activeFilter, setActiveFilter] = React.useState(() =>
    t("explore.all"),
  );
  const [selectedLocation, setSelectedLocation] = React.useState(() =>
    t("governorates.sousse"),
  );

  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    listingType: [],
    transmission: [],
    fuelType: [],
    propertyType: [],
    location: [],
    minPrice: 0,
    maxPrice: 500000,
  });

  const hasActiveFilters = useMemo(() => {
    return (
      activeFilters.listingType.length > 0 ||
      activeFilters.transmission.length > 0 ||
      activeFilters.fuelType.length > 0 ||
      activeFilters.propertyType.length > 0 ||
      activeFilters.location.length > 0 ||
      activeFilters.minPrice > 0 ||
      activeFilters.maxPrice < 500000
    );
  }, [activeFilters]);

  // Refresh preferences when screen gains focus (important after login)
  useEffect(() => {
    console.log("📍 Explore screen mounted - refreshing preferences");
    refreshPreferences();
    // fetchData is handled by the activeFilter effect
  }, [refreshPreferences]);

  // Handle active filter changes
  useEffect(() => {
    console.log(`🔍 Filter changed: ${activeFilter} (View: ${activeView})`);
    if (activeView === "cars") {
      fetchVehicles();
    } else {
      fetchProperties();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, activeView, activeFilters, selectedLocation]);

  // Fetch properties from backend
  const fetchProperties = useCallback(async () => {
    setIsLoadingProperties(true);
    try {
      // Use propertyType filter if available, otherwise use activeFilter
      const selectedType =
        activeFilters.propertyType.length > 0
          ? activeFilters.propertyType[0]
          : (() => {
              // If "All" is selected, don't filter by type
              if (activeFilter === t("explore.all")) {
                return undefined;
              }
              const typeMap: Record<string, string> = {
                [t("explore.house")]: "house",
                [t("explore.apartment")]: "apartment",
                [t("explore.villa")]: "villa",
                [t("explore.hotel")]: "hotel",
                [t("explore.land")]: "land",
                [t("explore.commercial")]: "commercial",
                [t("explore.office")]: "office",
              };
              return typeMap[activeFilter];
            })();

      // Handle location filter logic
      let searchLocation: string | undefined;
      if (activeFilters.location.includes("city")) {
        // If "City" is selected, use the selected city from dropdown
        searchLocation = selectedLocation;
      } else {
        // By default, don't filter by location to show all properties
        searchLocation = undefined;
      }

      console.log(
        `Fetching properties with type: ${selectedType || "all"}, location: ${searchLocation || "all cities"}...`,
      );

      const response = await searchProperties({
        status: "active",
        type: selectedType,
        listingType:
          activeFilters.listingType.length > 0
            ? activeFilters.listingType.join(",")
            : undefined,
        minPrice: activeFilters.minPrice,
        maxPrice: activeFilters.maxPrice,
        city: searchLocation || undefined,
        limit: 20,
      });

      const properties = (response.properties || []).sort((left, right) => {
        const leftPromoted = left.isPromoted ? 1 : 0;
        const rightPromoted = right.isPromoted ? 1 : 0;

        if (rightPromoted !== leftPromoted) {
          return rightPromoted - leftPromoted;
        }

        return (
          new Date(right.promotionExpiry || right.createdAt || 0).getTime() -
          new Date(left.promotionExpiry || left.createdAt || 0).getTime()
        );
      });
      setBackendProperties(properties);
    } catch (error) {
      console.error("❌ Error fetching properties:", error);
    } finally {
      setIsLoadingProperties(false);
    }
  }, [activeFilter, activeFilters, selectedLocation, t]);

  // State for backend vehicles
  const [backendVehicles, setBackendVehicles] = useState<any[]>([]);

  // Fetch vehicles from backend
  const fetchVehicles = useCallback(async () => {
    setIsLoadingProperties(true); // Reusing loading state for simplicity
    try {
      const typeMap: Record<string, string> = {
        [t("addCar.car")]: "car",
        [t("addCar.motorcycle")]: "motorcycle",
        [t("addCar.truck")]: "truck",
        [t("addCar.van")]: "van",
        [t("addCar.bus")]: "bus",
      };

      // List of car brands for filtering
      const carBrands = ["BMW", "Audi", "Mercedes", "Ford", "Honda"];

      let selectedType: string | undefined;
      let selectedMake: string | undefined;

      // If "All" is selected, don't filter by type or make
      if (activeFilter === t("explore.all")) {
        selectedType = undefined;
        selectedMake = undefined;
      } else if (carBrands.includes(activeFilter)) {
        // Filter by vehicle brand/make
        selectedType = undefined;
        selectedMake = activeFilter;
      } else {
        // Filter by vehicle type
        selectedType = typeMap[activeFilter];
        selectedMake = undefined;
      }

      // Handle location filter for vehicles
      let searchLocation: string | undefined;
      if (activeFilters.location.includes("city")) {
        // Only filter by location if user explicitly selected city filter
        searchLocation = selectedLocation;
      } else {
        // By default, don't filter by location to show all vehicles
        searchLocation = undefined;
      }

      console.log(
        `🚗 Fetching vehicles with type: ${selectedType || "all"}, make: ${selectedMake || "all"}, location: ${searchLocation || "all"}...`,
      );
      const response = await vehicleService.searchVehicles({
        status: "active",
        type: selectedType,
        make: selectedMake,
        listingType:
          activeFilters.listingType.length > 0
            ? activeFilters.listingType.join(",")
            : undefined,
        transmission:
          activeFilters.transmission.length > 0
            ? activeFilters.transmission.join(",")
            : undefined,
        fuelType:
          activeFilters.fuelType.length > 0
            ? activeFilters.fuelType.join(",")
            : undefined,
        minPrice: activeFilters.minPrice,
        maxPrice: activeFilters.maxPrice,
        location: searchLocation,
        limit: 20,
      });

      const vehicles = [...(response.data || [])].sort(
        (left: any, right: any) => {
          const leftPromoted = left.isPromoted ? 1 : 0;
          const rightPromoted = right.isPromoted ? 1 : 0;

          if (rightPromoted !== leftPromoted) {
            return rightPromoted - leftPromoted;
          }

          return (
            new Date(right.promotionExpiry || right.createdAt || 0).getTime() -
            new Date(left.promotionExpiry || left.createdAt || 0).getTime()
          );
        },
      );

      console.log(`✅ Fetched ${vehicles.length} vehicles`);
      console.log("📦 Vehicle data:", JSON.stringify(vehicles, null, 2));
      setBackendVehicles(vehicles);
    } catch (error) {
      console.error("❌ Error fetching vehicles:", error);
      setBackendVehicles([]);
    } finally {
      setIsLoadingProperties(false);
    }
  }, [activeFilter, activeFilters, selectedLocation, t]);

  // Handle pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeView === "cars") {
      await fetchVehicles();
    } else {
      await fetchProperties();
    }
    setRefreshing(false);
  }, [activeView, fetchVehicles, fetchProperties]);

  // Refetch data when screen comes into focus (e.g., after adding a new item)
  useFocusEffect(
    React.useCallback(() => {
      console.log("🔄 Explore screen focused, refetching data...");
      if (activeView === "cars") {
        fetchVehicles();
      } else {
        fetchProperties();
      }
    }, [activeView, fetchVehicles, fetchProperties]),
  );

  // Update active filter when active view changes
  useEffect(() => {
    console.log(`🎯 Active view changed to: ${activeView}`);
    setActiveFilter(t("explore.all")); // Default to All when switching views
  }, [activeView, t]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const notificationService = await loadNotificationService();
      const count = await notificationService.getUnreadCount();
      setUnreadNotifications(count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, []);

  // Load notification preferences
  const loadNotificationPreferences = useCallback(async () => {
    try {
      const notificationService = await loadNotificationService();
      await notificationService.getPreferences();
    } catch (error) {
      console.error("Error loading notification preferences:", error);
    }
  }, []);

  useEffect(() => {
    let notificationService: Awaited<
      ReturnType<typeof loadNotificationService>
    > | null = null;
    let isActive = true;
    const handleNewNotif = () => fetchUnreadCount();
    const handleAllRead = () => setUnreadNotifications(0);
    const handleCleared = () => setUnreadNotifications(0);
    const handleRead = () => fetchUnreadCount();

    fetchUnreadCount();
    loadNotificationPreferences();

    loadNotificationService()
      .then((service) => {
        if (!isActive) {
          return;
        }

        notificationService = service;
        notificationService.on("notification:received", handleNewNotif);
        notificationService.on("notification:all-read", handleAllRead);
        notificationService.on("notification:cleared", handleCleared);
        notificationService.on("notification:read", handleRead);
      })
      .catch(() => {});

    return () => {
      isActive = false;
      if (notificationService) {
        notificationService.off("notification:received", handleNewNotif);
        notificationService.off("notification:all-read", handleAllRead);
        notificationService.off("notification:cleared", handleCleared);
        notificationService.off("notification:read", handleRead);
      }
    };
  }, [fetchUnreadCount, loadNotificationPreferences]);

  const locationBottomSheetRef = useRef<BottomSheetModal>(null);
  const locationSnapPoints = useMemo(() => ["60%"], []);
  const renderLocationBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
    ),
    []
  );

  // All 24 Tunisian Governorates (translated)
  const tunisianStates = useMemo(
    () => [
      t("governorates.tunis"),
      t("governorates.ariana"),
      t("governorates.ben_arous"),
      t("governorates.manouba"),
      t("governorates.nabeul"),
      t("governorates.zaghouan"),
      t("governorates.bizerte"),
      t("governorates.beja"),
      t("governorates.jendouba"),
      t("governorates.kef"),
      t("governorates.siliana"),
      t("governorates.kairouan"),
      t("governorates.kasserine"),
      t("governorates.sidi_bouzid"),
      t("governorates.sousse"),
      t("governorates.monastir"),
      t("governorates.mahdia"),
      t("governorates.sfax"),
      t("governorates.gafsa"),
      t("governorates.tozeur"),
      t("governorates.kebili"),
      t("governorates.gabes"),
      t("governorates.medenine"),
      t("governorates.tataouine"),
    ],
    [t],
  );

  // Combine backend properties with mock data
  const properties = useMemo<ExploreCardItem[]>(() => {
    console.log(
      `🔄 Computing properties - activeView: ${activeView}, backendVehicles: ${backendVehicles.length}, backendProperties: ${backendProperties.length}`,
    );

    if (activeView === "cars") {
      // ONLY show vehicles - no properties
      const backendVehiclesFormatted = backendVehicles.map((vehicle: any) => {
        const images = vehicle.media?.images || [];
        const firstImage = images[0];
        const price =
          vehicle.pricing?.rentPrice || vehicle.pricing?.salePrice || 0;
        const rentPeriod = vehicle.pricing?.rentPeriod || "";

        console.log(`🚗 Formatting vehicle: ${vehicle.title}`, {
          id: vehicle._id || vehicle.id,
          make: vehicle.vehicleDetails?.make,
          model: vehicle.vehicleDetails?.model,
          firstImage,
        });

        return {
          id: `backend-car-${vehicle._id || vehicle.id}`,
          image: firstImage
            ? { uri: firstImage }
            : require("../../assets/images/Cars/Bmx6.webp"),
          price: `${price} DT${rentPeriod ? "/" + rentPeriod : ""}`,
          address: vehicle.title,
          area: `${vehicle.vehicleDetails?.make} ${vehicle.vehicleDetails?.model}`,
          bedrooms: vehicle.vehicleDetails?.year || 0,
          bathrooms: vehicle.vehicleDetails?.mileage || 0,
          distance: translateCity(vehicle.location?.city || "") || "Tunisia",
          title: vehicle.title,
          isPromoted: Boolean(vehicle.isPromoted),
          promotionExpiry: vehicle.promotionExpiry,
        };
      });

      console.log(
        `✅ Returning ${backendVehiclesFormatted.length} vehicles (NO mock data)`,
      );
      // Return ONLY backend vehicles, no mock cars
      return backendVehiclesFormatted;
    }

    // ONLY show properties - no vehicles
    const backendPropertiesFormatted = backendProperties
      .filter((prop: any) => prop && (prop._id || prop.id))
      .map((prop: any, index: number) => {
        const propertyId = prop._id || prop.id;
        const bedrooms = prop.propertyDetails?.bedrooms || 0;
        const bathrooms = prop.propertyDetails?.bathrooms || 0;
        const images = prop.media?.images || [];
        const firstImage = images[0];
        const price = prop.pricing?.rentPrice || prop.pricing?.salePrice || 0;
        const rentPeriod = prop.pricing?.rentPeriod || "month";

        return {
          id: `backend-${propertyId}`,
          image: firstImage
            ? { uri: firstImage }
            : require("../../assets/images/ScreensImages/House1.jpg"),
          price: `${price} DT/${rentPeriod}`,
          address: prop.location?.address || prop.title,
          area: translateCity(
            prop.location?.city || prop.location?.state || "",
          ),
          bedrooms: bedrooms,
          bathrooms: bathrooms,
          distance: t("explore.nearFromYou"),
          title: prop.title,
          isPromoted: Boolean(prop.isPromoted),
          promotionExpiry: prop.promotionExpiry,
          views: (prop as any).views || 0,
        };
      });

    // Return ONLY backend properties, no mock houses
    return backendPropertiesFormatted;
  }, [activeView, backendProperties, backendVehicles, t, translateCity]);

  const promotedProperties = useMemo(
    () => properties.filter((property) => property.isPromoted),
    [properties],
  );

  const swipeProperties = useMemo(() => {
    const base =
      promotedProperties.length > 0 ? promotedProperties : properties;
    return [...base]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 10);
  }, [promotedProperties, properties]);

  const bestProperties = useMemo(() => {
    const organicProperties = properties.filter(
      (property) => !property.isPromoted,
    );
    return (
      organicProperties.length > 0 ? organicProperties : properties
    ).slice(0, 6);
  }, [properties]);

  const promoStories = useMemo<PromoStoryItem[]>(() => {
    if (activeView === "cars") {
      return backendVehicles
        .filter((vehicle: any) => vehicle.isPromoted)
        .sort(
          (a: any, b: any) =>
            new Date(b.promotionExpiry || 0).getTime() -
            new Date(a.promotionExpiry || 0).getTime(),
        )
        .slice(0, 10)
        .map((vehicle: any) => ({
          id: `story-car-${vehicle._id || vehicle.id}`,
          listingId: vehicle._id || vehicle.id,
          title: vehicle.title || "Vehicle",
          subtitle:
            translateCity(vehicle.location?.city || "") ||
            `${vehicle.vehicleDetails?.make || ""} ${vehicle.vehicleDetails?.model || ""}`.trim(),
          image: vehicle.media?.images?.[0]
            ? { uri: vehicle.media.images[0] }
            : require("../../assets/images/Cars/Bmx6.webp"),
          isCar: true,
        }));
    }

    return backendProperties
      .filter((property) => property.isPromoted)
      .sort(
        (a, b) =>
          new Date(b.promotionExpiry || 0).getTime() -
          new Date(a.promotionExpiry || 0).getTime(),
      )
      .slice(0, 10)
      .map((property) => ({
        id: `story-property-${property._id || property.id}`,
        listingId: property._id || property.id || "",
        title: property.title || "Property",
        subtitle: translateCity(
          property.location?.city || property.location?.state || "",
        ),
        image: getFullImageUrl(property.media?.images?.[0])
          ? { uri: getFullImageUrl(property.media?.images?.[0]) }
          : SCREEN_IMAGES.house1,
        isCar: false,
      }));
  }, [activeView, backendProperties, backendVehicles, translateCity]);

  const handleLocationSelect = useCallback((location: string) => {
    setSelectedLocation(location);
    locationBottomSheetRef.current?.dismiss();
  }, []);

  const handlePropertyPress = useCallback(
    (property: any) => {
      // Go to property info page with property id (strip backend- prefix if present)
      let id = property.id;
      const isCar = typeof id === "string" && id.includes("-car-");

      if (typeof id === "string") {
        id = id.replace("backend-car-", "").replace("backend-", "");
      }

      if (isCar) {
        // We might need a car_info screen, but for now properties use property_info
        router.push({
          pathname: "/property_info",
          params: { id, type: "vehicle" },
        });
      } else {
        router.push({ pathname: "/property_info", params: { id } });
      }
    },
    [router],
  );

  const handleStoryPress = useCallback(
    (story: PromoStoryItem) => {
      router.push({
        pathname: "/property_info",
        params: story.isCar
          ? { id: story.listingId, type: "vehicle" }
          : { id: story.listingId },
      });
    },
    [router],
  );

  return (
    <ScreenWrapper>
      <LoadingOverlay
        visible={!isImagesPreloaded || isLoadingProperties}
        message={
          isLoadingProperties ? t("explore.loadingProperties") : t("loading")
        }
      />

      {/* FIXED HEADER - now outside ScrollView */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.locationLabel}>{t("explore.location")}</Text>
          <TouchableOpacity
            style={styles.locationSelector}
            onPress={() => locationBottomSheetRef.current?.present()}
          >
            <Ionicons name="location" size={18} color="#FF8C42" />
            <Text style={styles.locationText}>{selectedLocation}</Text>
            <Ionicons name="chevron-down" size={16} color="#8A8A8A" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerIcons}>
          {/* Compact view switch — visible for all users */}
          <View style={styles.viewSwitch}>
            <TouchableOpacity
              style={[
                styles.switchTab,
                activeView === "property" && styles.switchTabActive,
              ]}
              onPress={() => setActiveView("property")}
              accessibilityRole="button"
              accessibilityLabel={t("explore.switchProperties")}
            >
              <Ionicons
                name="home-outline"
                size={16}
                color={activeView === "property" ? "#fff" : "#8A8A8A"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.switchTab,
                activeView === "cars" && styles.switchTabActive,
              ]}
              onPress={() => setActiveView("cars")}
              accessibilityRole="button"
              accessibilityLabel={t("explore.switchCars")}
            >
              <Ionicons
                name="car-outline"
                size={16}
                color={activeView === "cars" ? "#fff" : "#8A8A8A"}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("/notifications")}
          >
            <View>
              <Ionicons
                name="notifications-outline"
                size={24}
                color="#333333"
              />
              {unreadNotifications > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ScrollView - no header inside anymore */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Search */}
        <View style={styles.searchSection}>
          <SearchBar
            placeholder={
              activeView === "cars"
                ? t("explore.searchNearYou")
                : t("explore.searchPlaceholder")
            }
            onFilterPress={() => setIsFilterVisible(true)}
            showActiveIndicator={hasActiveFilters}
          />
        </View>

        {/* Filters */}
        <View style={styles.filtersSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {activeView === "cars" ? (
              <View style={styles.carBrandsContainer}>
                {/* All button */}
                <TouchableOpacity
                  key="all"
                  style={[
                    styles.carBrandItem,
                    styles.allBrandItem,
                    activeFilter === t("explore.all") &&
                      styles.carBrandItemActive,
                  ]}
                  onPress={() => setActiveFilter(t("explore.all"))}
                >
                  <Text
                    style={[
                      styles.allBrandText,
                      activeFilter === t("explore.all") &&
                        styles.allBrandTextActive,
                    ]}
                  >
                    {t("explore.all")}
                  </Text>
                </TouchableOpacity>

                {/* Brand logos */}
                {[
                  {
                    name: "BMW",
                    logo: require("../../assets/logo/BMW.png"),
                  },
                  {
                    name: "Audi",
                    logo: require("../../assets/logo/AUDI.png"),
                  },
                  {
                    name: "Mercedes",
                    logo: require("../../assets/images/Auth/Car.png"),
                  },
                  {
                    name: "Ford",
                    logo: require("../../assets/logo/FORD.png"),
                  },
                  {
                    name: "Honda",
                    logo: require("../../assets/images/Auth/Car.png"),
                  },
                ].map((brand) => (
                  <TouchableOpacity
                    key={brand.name}
                    style={[
                      styles.carBrandItem,
                      activeFilter === brand.name && styles.carBrandItemActive,
                    ]}
                    onPress={() => setActiveFilter(brand.name)}
                  >
                    <Image source={brand.logo} style={styles.carBrandLogo} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.filtersContainer}>
                {filters.map((filter) => (
                  <FilterChip
                    key={filter}
                    title={filter}
                    isSelected={activeFilter === filter}
                    onPress={() => setActiveFilter(filter)}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        </View>

        {promoStories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {t("explore.boostedStories")}
              </Text>
              <Text style={styles.sectionCaption}>
                {t("explore.promotedBySellers")}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesContainer}
            >
              {promoStories.map((story) => (
                <TouchableOpacity
                  key={story.id}
                  style={styles.storyCard}
                  onPress={() => handleStoryPress(story)}
                  activeOpacity={0.85}
                >
                  <Image source={story.image} style={styles.storyCardImage} />
                  <BlurView
                    intensity={55}
                    tint="dark"
                    style={styles.storyGlassPanel}
                  >
                    <View style={styles.storyGlassPanelInner}>
                      <Text style={styles.storyTitle} numberOfLines={2}>
                        {story.title}
                      </Text>
                      <Text style={styles.storySubtitle} numberOfLines={1}>
                        {story.subtitle || t("explore.promotedFallback")}
                      </Text>
                    </View>
                  </BlurView>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Near from you section OR Empty State */}
        {properties.length === 0 && !isLoadingProperties ? (
          // Empty State
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateTitle}>
              {t("explore.noResultsFound")}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {t("explore.tryAdjustingFilters")}
            </Text>

            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                // Clear all filters
                setActiveFilters({
                  listingType: [],
                  transmission: [],
                  fuelType: [],
                  propertyType: [],
                  location: [],
                  minPrice: 0,
                  maxPrice: 500000,
                });
                setActiveFilter(t("explore.all"));
              }}
            >
              <Text style={styles.clearFiltersButtonText}>
                {t("explore.clearFilters")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.browseAllButton}
              onPress={() => {
                // Clear filters and show all
                setActiveFilters({
                  listingType: [],
                  transmission: [],
                  fuelType: [],
                  propertyType: [],
                  location: [],
                  minPrice: 0,
                  maxPrice: 500000,
                });
                if (activeView === "cars") {
                  fetchVehicles();
                } else {
                  fetchProperties();
                }
              }}
            >
              <Text style={styles.browseAllButtonText}>
                {t("explore.browseAll")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Boosted swipe section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {promotedProperties.length > 0
                    ? activeView === "cars"
                      ? t("explore.boostedVehicles")
                      : t("explore.boostedListings")
                    : activeView === "cars"
                      ? t("explore.nearFromYouCars")
                      : t("explore.nearFromYou")}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/all-properties",
                      params: { mode: activeView },
                    })
                  }
                >
                  <Text style={styles.seeMore}>{t("explore.seeMore")}</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.propertyList}>
                  {swipeProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      image={property.image}
                      price={property.price}
                      address={property.address}
                      area={property.area}
                      bedrooms={property.bedrooms}
                      bathrooms={property.bathrooms}
                      distance={property.distance}
                      mode={activeView}
                      onPress={() => handlePropertyPress(property)}
                    />
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Best for you section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {activeView === "cars"
                    ? t("explore.bestForYouCars")
                    : t("explore.bestForYou")}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/all-properties",
                      params: { mode: activeView },
                    })
                  }
                >
                  <Text style={styles.seeMore}>{t("explore.seeMore")}</Text>
                </TouchableOpacity>
              </View>
              {bestProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  image={property.image}
                  title={property.title}
                  price={property.price}
                  address={property.address}
                  area={property.area}
                  bedrooms={property.bedrooms}
                  bathrooms={property.bathrooms}
                  variant="best"
                  mode={activeView}
                  style={styles.bestPropertyCardMargin}
                  onPress={() => handlePropertyPress(property)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Location Selection Bottom Sheet */}
      <BottomSheetModal
        ref={locationBottomSheetRef}
        snapPoints={locationSnapPoints}
        enablePanDownToClose
        backdropComponent={renderLocationBackdrop}
        handleIndicatorStyle={styles.sheetIndicator}
        backgroundStyle={styles.sheetBackground}
      >
        <View style={styles.locationSheetHeader}>
          <Text style={styles.locationSheetTitle}>{t("explore.selectLocation")}</Text>
          <TouchableOpacity onPress={() => locationBottomSheetRef.current?.dismiss()}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <BottomSheetFlatList
          data={tunisianStates}
          keyExtractor={(item) => item}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.locationItem,
                selectedLocation === item && styles.selectedLocationItem,
              ]}
              onPress={() => handleLocationSelect(item)}
            >
              <Text
                style={[
                  styles.locationItemText,
                  selectedLocation === item && styles.selectedLocationText,
                ]}
              >
                {item}
              </Text>
              {selectedLocation === item && (
                <Ionicons name="checkmark" size={20} color="#FF8C42" />
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
        />
      </BottomSheetModal>

      {/* Advanced Filter Panel */}
      <FilterPanel
        isVisible={isFilterVisible}
        onClose={() => setIsFilterVisible(false)}
        onApply={(newFilters) => {
          setActiveFilters(newFilters);
          // fetch is triggered by useEffect on activeFilters
        }}
        initialFilters={activeFilters}
        interest={activeView === "cars" ? "cars" : "property"}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    backgroundColor: "#fff",
    // borderBottomWidth: 1,
    // borderBottomColor: "#eee",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    // ← REMOVED: position, top, left, right, zIndex
  },
  locationLabel: {
    fontSize: 12,
    color: "#8A8A8A",
    marginBottom: 4,
    fontFamily: "raleway-400Regular",
  },
  headerTitleContainer: {
    flex: 1,
  },
  locationSelector: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginLeft: 8,
    marginRight: 4,
    fontFamily: "raleway-500Medium",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginLeft: 15,
  },
  badge: {
    position: "absolute",
    right: -6,
    top: -6,
    backgroundColor: "#FF4444",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  toggleContainer: {
    width: 40,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF8C42",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleContainerInactive: {
    backgroundColor: "#CCCCCC",
  },
  toggleSwitch: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  storiesContainer: {
    paddingLeft: 20,
    paddingRight: 0,
    paddingVertical: 22,
  },
  storyCard: {
    width: 305,
    height: 200,
    marginRight: 12,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#FF8C42",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.35)",
    shadowColor: "#FF8C42",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 9,
  },
  storyCardImage: {
    position: "absolute",
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderRadius: 14,
  },
  storyGlassPanel: {
    position: "absolute",
    bottom: 5,
    left: 5,
    right: 5,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: "hidden",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.25)",
  },
  storyGlassPanelInner: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  storyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 18,
  },
  storySubtitle: {
    marginTop: 4,
    fontSize: 11,
    color: "rgba(255,255,255,0.88)",
  },
  sectionCaption: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  filtersSection: {
    marginBottom: 30,
  },
  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
  },
  carBrandsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 15,
  },
  carBrandItem: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#F8F8F8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  carBrandItemActive: {
    borderColor: "#FF8C42",
    backgroundColor: "#FFF0E6",
  },
  carBrandLogo: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  allBrandItem: {
    paddingHorizontal: 16,
    minWidth: 70,
  },
  allBrandText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    fontFamily: "raleway-600SemiBold",
  },
  allBrandTextActive: {
    color: "#FF8C42",
    fontWeight: "700",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    fontFamily: "raleway-500Medium",
  },
  seeMore: {
    fontSize: 14,
    color: "#858585",
    fontFamily: "raleway-400Regular",
  },
  propertyList: {
    flexDirection: "row",
    paddingHorizontal: 0,
  },
  bestPropertyCardMargin: {
    marginBottom: 15,
  },
  // View switch (shown for "both" users) — compact icon-only pill in header
  viewSwitch: {
    flexDirection: "row",
    backgroundColor: "#F2F2F2",
    borderRadius: 10,
    padding: 3,
    marginRight: 10,
  },
  switchTab: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  switchTabActive: {
    backgroundColor: "#FF8C42",
    shadowColor: "#FF8C42",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  switchIcon: {
    marginRight: 2,
  },
  switchTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8A8A8A",
    fontFamily: "raleway-500Medium",
  },
  switchTabTextActive: {
    color: "#FFFFFF",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    fontFamily: "raleway-500Medium",
  },
  closeButton: {
    padding: 5,
  },
  locationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F8F8",
  },
  selectedLocationItem: {
    backgroundColor: "#FFF0E6",
  },
  locationItemText: {
    fontSize: 16,
    color: "#333333",
    fontFamily: "raleway-400Regular",
  },
  selectedLocationText: {
    color: "#FF8C42",
    fontWeight: "600",
    fontFamily: "raleway-500Medium",
  },
  listContent: {
    paddingBottom: 20,
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
  locationSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  locationSheetTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333333",
    fontFamily: "raleway-500Medium",
  },
  // Empty State styles
  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 80,
    minHeight: 400,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 16,
    fontFamily: "raleway-700Bold",
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: "#999999",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
    fontFamily: "raleway-400Regular",
  },
  clearFiltersButton: {
    width: "100%",
    backgroundColor: "#FF8C42",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#FF8C42",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  clearFiltersButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "raleway-600SemiBold",
  },
  browseAllButton: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FF8C42",
  },
  browseAllButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FF8C42",
    fontFamily: "raleway-600SemiBold",
  },
});
