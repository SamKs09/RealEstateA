import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "../../components/Ui";
import { useInterest } from "../../contexts/InterestContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  getGuestBookings,
  getOwnerBookings,
  acceptBooking,
  declineBooking,
  BookingData,
} from "../../services/bookingService";
import { getMyListings } from "../../services/propertyService";
import { getUserVehicles } from "../../services/vehicleService";
import { getFullImageUrl } from "../../services/api";
import { chatService } from "../../services/chatService";
import { useTranslation } from "../../hooks/useTranslation";
import { usePopup } from "../../contexts/PopupContext";

// -------------------------------------------------
// Helpers
// -------------------------------------------------

const getStatusMeta = (t: any) => ({
  pending: {
    label: t("bookings.pending"),
    color: "#E67E22",
    bg: "#FEF5ED",
    icon: "time-outline",
  },
  accepted: {
    label: t("bookings.approved"),
    color: "#27AE60",
    bg: "#EAFAF1",
    icon: "checkmark-circle-outline",
  },
  declined: {
    label: t("bookings.declined"),
    color: "#E74C3C",
    bg: "#FDEDEC",
    icon: "close-circle-outline",
  },
  cancelled: {
    label: t("bookings.cancelled"),
    color: "#7F8C8D",
    bg: "#F4F6F7",
    icon: "ban-outline",
  },
  completed: {
    label: t("bookings.completed"),
    color: "#2980B9",
    bg: "#EBF5FB",
    icon: "flag-outline",
  },
});

const getDisplayStatus = (booking: BookingData) => {
  if (booking.status === "accepted" && new Date(booking.endDate) < new Date()) {
    return "completed";
  }
  return booking.status || "pending";
};

// ─────────────────────────────────────────────────
// SELLER VIEW
// ─────────────────────────────────────────────────

function SellerView({
  user,
  activeView,
  router,
}: {
  user: any;
  activeView: string;
  router: ReturnType<typeof useRouter>;
}) {
  const { t, currentLanguage } = useTranslation();
  const { showConfirm, showError, showSuccess } = usePopup();
  const [sellerTab, setSellerTab] = useState<"requests" | "availability">(
    "requests",
  );

  const [ownerBookings, setOwnerBookings] = useState<BookingData[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [refreshingBookings, setRefreshingBookings] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState<string | null>(null);

  const STATUS_META = getStatusMeta(t);

  const fetchOwnerBookings = useCallback(
    async (quiet = false) => {
      if (!user?._id) return;
      if (!quiet) setLoadingBookings(true);
      try {
        const data = await getOwnerBookings(user._id);
        setOwnerBookings(data || []);
      } catch (e) {
        console.error("Error fetching owner bookings:", e);
      } finally {
        setLoadingBookings(false);
        setRefreshingBookings(false);
      }
    },
    [user?._id],
  );

  const [listings, setListings] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);

  const fetchListings = useCallback(async () => {
    setLoadingListings(true);
    try {
      if (activeView === "cars") {
        const res = await getUserVehicles();
        setListings(res.data || []);
      } else {
        const data = await getMyListings();
        setListings(data || []);
      }
    } catch (e) {
      console.error("Error fetching listings:", e);
      setListings([]);
    } finally {
      setLoadingListings(false);
    }
  }, [activeView]);

  useEffect(() => {
    fetchOwnerBookings();
    fetchListings();
  }, [fetchOwnerBookings, fetchListings]);

  const filteredBookings = ownerBookings.filter((b) =>
    activeView === "cars"
      ? b.listingType === "vehicle"
      : b.listingType === "property",
  );
  const pendingBookings = filteredBookings.filter(
    (b) => b.status === "pending",
  );
  const otherBookings = filteredBookings.filter((b) => b.status !== "pending");

  const handleAccept = (bookingId: string) => {
    showConfirm(
      t("bookings.acceptBookingTitle"),
      t("bookings.acceptBookingMsg"),
      {
        secondaryAction: { text: t("cancel"), style: "cancel" },
        primaryAction: {
          text: t("bookings.accept"),
          onPress: async () => {
            setActionLoading(bookingId);
            try {
              await acceptBooking(bookingId);
              await fetchOwnerBookings(true);
              showSuccess(
                t("bookings.acceptedMessage") || "Accepted",
                t("bookings.accepted"),
              );
            } catch (e: any) {
              showError(e.message || t("bookings.failedAccept"), t("error"));
            } finally {
              setActionLoading(null);
            }
          },
        },
      },
    );
  };

  const handleDecline = (bookingId: string) => {
    showConfirm(
      t("bookings.declineBookingTitle"),
      t("bookings.declineBookingMsg"),
      {
        secondaryAction: { text: t("cancel"), style: "cancel" },
        primaryAction: {
          text: t("bookings.decline"),
          style: "destructive",
          onPress: async () => {
            setActionLoading(bookingId);
            try {
              await declineBooking(bookingId);
              await fetchOwnerBookings(true);
              showSuccess(
                t("bookings.declinedMessage") || "Declined",
                t("bookings.decline"),
              );
            } catch (e: any) {
              showError(e.message || t("bookings.failedDecline"), t("error"));
            } finally {
              setActionLoading(null);
            }
          },
        },
      },
    );
  };

  const openChat = async (booking: BookingData, guestName: string) => {
    const threadId = booking.chatThreadId as string | undefined;
    if (threadId) {
      router.push({
        pathname: "/chat/[id]" as any,
        params: { id: threadId, name: guestName },
      });
      return;
    }
    const guestId = (booking.guest as any)?._id as string;
    if (!guestId) return;
    setChatLoading(booking._id);
    try {
      const thread = await chatService.getOrCreateThread(guestId, guestName);
      if (thread) {
        router.push({
          pathname: "/chat/[id]" as any,
          params: { id: thread._id, name: guestName },
        });
      }
    } catch (e) {
      console.error("openChat error:", e);
    } finally {
      setChatLoading(null);
    }
  };

  const getListingInfo = (booking: BookingData) => {
    const listing =
      booking.listingType === "vehicle" ? booking.vehicle : booking.property;
    return {
      title:
        listing?.title ||
        (booking.listingType === "vehicle"
          ? t("bookings.vehicle")
          : t("bookings.property")),
      image: getFullImageUrl(listing?.media?.images?.[0]),
    };
  };

  const formatDateRange = (start: string, end: string) => {
    const locale =
      currentLanguage === "ar"
        ? "ar-TN"
        : currentLanguage === "fr"
          ? "fr-FR"
          : "en-US";
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    return fmt(start) + " - " + fmt(end);
  };

  const statusColor = (status: string) => {
    return STATUS_META[status as keyof typeof STATUS_META]?.color || "#FF8C42";
  };

  const getListingCard = (item: any) => {
    const id = item._id || item.id;
    const type = activeView === "cars" ? "vehicle" : "property";
    const title =
      item.title ||
      (type === "vehicle" ? t("bookings.vehicle") : t("bookings.property"));
    const img = getFullImageUrl(item.media?.images?.[0]);
    return { id, type, title, img };
  };

  return (
    <View style={s.flex1}>
      {/* Sub-tabs: Requests vs Availability */}
      <View style={s.subTabBar}>
        <TouchableOpacity
          style={[s.subTab, sellerTab === "requests" && s.subTabActive]}
          onPress={() => setSellerTab("requests")}
        >
          <Ionicons
            name="list"
            size={18}
            color={sellerTab === "requests" ? "#FF8C42" : "#999"}
          />
          <Text
            style={[
              s.subTabText,
              sellerTab === "requests" && s.subTabTextActive,
            ]}
          >
            {t("bookings.requestsTab")}
          </Text>
          {pendingBookings.length > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{pendingBookings.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.subTab, sellerTab === "availability" && s.subTabActive]}
          onPress={() => setSellerTab("availability")}
        >
          <Ionicons
            name="calendar"
            size={18}
            color={sellerTab === "availability" ? "#FF8C42" : "#999"}
          />
          <Text
            style={[
              s.subTabText,
              sellerTab === "availability" && s.subTabTextActive,
            ]}
          >
            {t("bookings.availabilityTab")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* REQUESTS TAB */}
      {sellerTab === "requests" && (
        <ScrollView
          style={s.scrollContent}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshingBookings}
              onRefresh={() => fetchOwnerBookings()}
              colors={["#FF8C42"]}
            />
          }
        >
          {loadingBookings ? (
            <ActivityIndicator
              style={{ marginTop: 60 }}
              size="large"
              color="#FF8C42"
            />
          ) : (
            <>
              {pendingBookings.length > 0 && (
                <>
                  <Text style={s.sectionLabel}>
                    {t("bookings.actionRequired")}
                  </Text>
                  {(() => {
                    const groups: Record<string, BookingData[]> = {};
                    pendingBookings.forEach((b) => {
                      const key =
                        (b.listingType === "vehicle"
                          ? b.vehicle?._id
                          : b.property?._id) || "unknown";
                      if (!groups[key]) groups[key] = [];
                      groups[key].push(b);
                    });
                    return Object.entries(groups).map(([key, bookings]) => {
                      const { title, image } = getListingInfo(bookings[0]);
                      return (
                        <View key={key} style={s.listingGroupCard}>
                          <View style={s.listingGroupHeader}>
                            <Image
                              source={
                                image
                                  ? { uri: image }
                                  : require("../../assets/images/Auth/Appartment.png")
                              }
                              style={s.listingGroupImg}
                            />
                            <View style={s.listingGroupInfo}>
                              <Text
                                style={s.listingGroupTitle}
                                numberOfLines={1}
                              >
                                {title}
                              </Text>
                            </View>
                            <View style={s.pendingBadge}>
                              <Text style={s.pendingBadgeText}>
                                {t("bookings.pendingOfferBadge", {
                                  count: bookings.length,
                                })}
                              </Text>
                            </View>
                          </View>
                          {bookings.map((booking) => {
                            const guestName = booking.guest
                              ? booking.guest.firstName +
                                " " +
                                booking.guest.lastName
                              : t("bookings.guest");
                            const guestImg = booking.guest?.profileImage
                              ? getFullImageUrl(booking.guest.profileImage)
                              : null;
                            return (
                              <View key={booking._id} style={s.requestCard}>
                                <TouchableOpacity
                                  style={s.msgBtn}
                                  onPress={() => openChat(booking, guestName)}
                                  disabled={chatLoading === booking._id}
                                >
                                  {chatLoading === booking._id ? (
                                    <ActivityIndicator
                                      size="small"
                                      color="#FF8C42"
                                    />
                                  ) : (
                                    <Ionicons
                                      name="chatbubble-ellipses-outline"
                                      size={20}
                                      color="#FF8C42"
                                    />
                                  )}
                                </TouchableOpacity>
                                <View style={s.requestTop}>
                                  <Image
                                    source={
                                      guestImg
                                        ? { uri: guestImg }
                                        : require("../../assets/images/Auth/Appartment.png")
                                    }
                                    style={s.guestAvatar}
                                  />
                                  <View style={s.requestInfo}>
                                    <Text
                                      style={s.requestTitle}
                                      numberOfLines={1}
                                    >
                                      {guestName}
                                    </Text>
                                    <Text style={s.requestSub}>
                                      {t("bookings.readyToNegotiate")}
                                    </Text>
                                  </View>
                                </View>
                                {actionLoading === booking._id ? (
                                  <ActivityIndicator
                                    color="#FF8C42"
                                    style={{ marginTop: 12 }}
                                  />
                                ) : (
                                  <View style={s.actionRow}>
                                    <TouchableOpacity
                                      style={s.acceptBtn}
                                      onPress={() => handleAccept(booking._id)}
                                    >
                                      <Text style={s.acceptBtnText}>
                                        {t("bookings.accept")}
                                      </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={s.declineBtn}
                                      onPress={() => handleDecline(booking._id)}
                                    >
                                      <Text style={s.declineBtnText}>
                                        {t("bookings.decline")}
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      );
                    });
                  })()}
                </>
              )}
              {otherBookings.length > 0 && (
                <>
                  <Text style={s.sectionLabel}>
                    {t("bookings.historySection")}
                  </Text>
                  {otherBookings.map((booking) => {
                    const { title, image } = getListingInfo(booking);
                    const guestName = booking.guest
                      ? booking.guest.firstName + " " + booking.guest.lastName
                      : t("bookings.guest");
                    const status = getDisplayStatus(booking);
                    return (
                      <View key={booking._id} style={s.historyCard}>
                        <Image
                          source={
                            image
                              ? { uri: image }
                              : require("../../assets/images/Auth/Appartment.png")
                          }
                          style={s.requestImg}
                        />
                        <View style={s.requestInfo}>
                          <Text style={s.requestTitle} numberOfLines={1}>
                            {title}
                          </Text>
                          <Text style={s.requestSub} numberOfLines={1}>
                            {guestName}
                          </Text>
                          <Text style={s.requestDates}>
                            {formatDateRange(
                              booking.startDate,
                              booking.endDate,
                            )}
                          </Text>
                          <View
                            style={[
                              s.statusBadge,
                              { backgroundColor: statusColor(status) },
                            ]}
                          >
                            <Text style={s.statusBadgeText}>
                              {STATUS_META[status as keyof typeof STATUS_META]
                                ?.label || status}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </>
              )}
              {filteredBookings.length === 0 && (
                <View style={s.emptyState}>
                  <Ionicons name="calendar-outline" size={64} color="#ccc" />
                  <Text style={s.emptyText}>{t("bookings.noRequests")}</Text>
                  <Text style={s.emptySubText}>
                    {t("bookings.noRequestsSubtitle")}
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* AVAILABILITY TAB */}
      {sellerTab === "availability" && (
        <ScrollView
          style={s.scrollContent}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {loadingListings ? (
            <ActivityIndicator
              style={{ marginTop: 60 }}
              size="large"
              color="#FF8C42"
            />
          ) : listings.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="home-outline" size={64} color="#ccc" />
              <Text style={s.emptyText}>{t("bookings.noListings")}</Text>
              <Text style={s.emptySubText}>
                {t("bookings.noListingsSubtitle")}
              </Text>
            </View>
          ) : (
            <>
              <Text style={s.availHint}>{t("bookings.availabilityHint")}</Text>
              {listings.map((item) => {
                const { id, type, title, img } = getListingCard(item);
                return (
                  <View key={id} style={s.listingCard}>
                    <Image
                      source={
                        img
                          ? { uri: img }
                          : require("../../assets/images/Auth/Appartment.png")
                      }
                      style={s.listingImg}
                    />
                    <View style={s.listingInfo}>
                      <Text style={s.listingTitle} numberOfLines={2}>
                        {title}
                      </Text>
                      <Text style={s.listingType}>
                        {type === "vehicle"
                          ? t("bookings.vehicle")
                          : t("bookings.property")}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={s.manageBtn}
                      onPress={() =>
                        router.push({
                          pathname: "/booking/manage-availability" as any,
                          params: {
                            listingId: id,
                            listingType: type,
                            listingTitle: title,
                          },
                        })
                      }
                    >
                      <Text style={s.manageBtnText}>
                        {t("bookings.manage")}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#FF8C42"
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

async function loadNotificationService() {
  const module = await import("../../services/notificationService");
  return module.notificationService;
}

// -------------------------------------------------
// Main screen
// -------------------------------------------------

export default function BookingsScreen() {
  const router = useRouter();
  const { t, currentLanguage } = useTranslation();
  const { user } = useAuth();
  const { activeView, isBuyer } = useInterest();
  const [allBookings, setAllBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const STATUS_META = getStatusMeta(t);

  const fetchBookings = useCallback(async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const data = await getGuestBookings(user._id);
      setAllBookings(data || []);
    } catch (e) {
      console.error("Fetch bookings error:", e);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    if (isBuyer) fetchBookings();
  }, [fetchBookings, isBuyer]);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const service = await loadNotificationService();
        const count = await service.getUnreadCount();
        setUnreadNotifications(count);
      } catch {
        /* ignore */
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings().finally(() => setRefreshing(false));
  }, [fetchBookings]);

  const getListingTitle = (booking: BookingData) => {
    const listing =
      booking.listingType === "vehicle" ? booking.vehicle : booking.property;
    return (
      listing?.title ||
      (booking.listingType === "vehicle"
        ? t("bookings.vehicle")
        : t("bookings.property"))
    );
  };

  const getListingLocation = (booking: BookingData) => {
    const listing =
      booking.listingType === "vehicle" ? booking.vehicle : booking.property;
    return listing?.location?.city || listing?.location?.address || "";
  };

  const getListingImage = (booking: BookingData) => {
    const listing =
      booking.listingType === "vehicle" ? booking.vehicle : booking.property;
    const imageUrl = getFullImageUrl(listing?.media?.images?.[0]);
    return imageUrl
      ? { uri: imageUrl }
      : require("../../assets/images/Auth/Appartment.png");
  };

  const filteredBookings = allBookings.filter((b) => {
    // Filter by active mode
    if (activeView === "cars" && b.listingType !== "vehicle") return false;
    if (activeView === "property" && b.listingType !== "property") return false;

    const ds = getDisplayStatus(b);
    if (statusFilter && ds !== statusFilter) return false;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    const title = getListingTitle(b).toLowerCase();
    const location = getListingLocation(b).toLowerCase();
    return title.includes(q) || location.includes(q);
  });

  const formatDateShort = (d: string) => {
    const locale =
      currentLanguage === "ar"
        ? "ar-TN"
        : currentLanguage === "fr"
          ? "fr-FR"
          : "en-US";
    return new Date(d).toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleBookingPress = (booking: BookingData) => {
    const listing =
      booking.listingType === "vehicle" ? booking.vehicle : booking.property;
    if (!listing) return;

    const id =
      (listing as any)._id ??
      (typeof listing === "string" ? listing : undefined);
    if (!id) return;

    if (booking.listingType === "vehicle") {
      router.push({ pathname: "/car_info", params: { id } } as any);
    } else if (booking.listingType === "property") {
      router.push({ pathname: "/property_info", params: { id } } as any);
    }
  };

  if (isBuyer) {
    return (
      <ScreenWrapper style={styles.container}>
        <View style={styles.flex1}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t("bookings.title")}</Text>
            <TouchableOpacity
              style={styles.notifButton}
              onPress={() => router.push("/notifications")}
            >
              <Ionicons name="notifications-outline" size={26} color="#333" />
              {unreadNotifications > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <View style={styles.searchBar}>
              <Ionicons
                name="search-outline"
                size={18}
                color="#888"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder={t("bookings.searchPlaceholder")}
                placeholderTextColor="#BBBBBB"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {(
                [
                  "pending",
                  "accepted",
                  "declined",
                  "cancelled",
                  "completed",
                ] as const
              ).map((status) => {
                const meta = STATUS_META[status];
                const active = statusFilter === status;
                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.chip,
                      active && {
                        backgroundColor: "#FF8C42",
                        borderColor: "#FF8C42",
                      },
                    ]}
                    onPress={() => setStatusFilter(active ? null : status)}
                  >
                    <Text
                      style={[styles.chipText, active && { color: "#FFF" }]}
                    >
                      {meta.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={{ paddingBottom: 120 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#FF8C42"]}
              />
            }
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF8C42" />
              </View>
            ) : filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => {
                const ds = getDisplayStatus(booking);
                const meta =
                  STATUS_META[ds as keyof typeof STATUS_META] ||
                  STATUS_META["pending"];
                const img = getListingImage(booking);
                return (
                  <TouchableOpacity
                    key={booking._id}
                    style={styles.buyerCard}
                    onPress={() => handleBookingPress(booking)}
                  >
                    <Image
                      source={img}
                      style={styles.buyerCardImage}
                      resizeMode="cover"
                    />
                    <View style={styles.buyerCardBody}>
                      <View style={styles.buyerCardTop}>
                        <Text style={styles.buyerCardTitle} numberOfLines={1}>
                          {getListingTitle(booking)}
                        </Text>
                        <View
                          style={[
                            styles.buyerStatusBadge,
                            { backgroundColor: meta.bg },
                          ]}
                        >
                          <Ionicons
                            name={meta.icon as any}
                            size={12}
                            color={meta.color}
                          />
                          <Text
                            style={[
                              styles.buyerStatusText,
                              { color: meta.color },
                            ]}
                          >
                            {meta.label}
                          </Text>
                        </View>
                      </View>
                      {!!getListingLocation(booking) && (
                        <View style={styles.buyerCardRow}>
                          <Ionicons
                            name="location-outline"
                            size={13}
                            color="#999"
                          />
                          <Text style={styles.buyerCardSub} numberOfLines={1}>
                            {getListingLocation(booking)}
                          </Text>
                        </View>
                      )}
                      <View style={styles.buyerCardRow}>
                        <Ionicons
                          name="calendar-outline"
                          size={13}
                          color="#999"
                        />
                        <Text style={styles.buyerCardSub}>
                          {formatDateShort(booking.startDate)} →{" "}
                          {formatDateShort(booking.endDate)}
                        </Text>
                      </View>
                      <View style={styles.buyerCardBottom}>
                        <Text style={styles.buyerCardPrice}>
                          {booking.proposedPrice} {booking.currency}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color="#CCC"
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="file-tray-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>
                  {searchQuery.trim()
                    ? t("bookings.noResultsFor", { query: searchQuery.trim() })
                    : t("bookings.noBookings") || "No bookings found"}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.flex1}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {t("bookings.bookingManagement")}
          </Text>
          <TouchableOpacity
            style={styles.notifButton}
            onPress={() => router.push("/notifications")}
          >
            <Ionicons name="notifications-outline" size={26} color="#333" />
            {unreadNotifications > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <SellerView user={user} activeView={activeView} router={router} />
      </View>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  flex1: { flex: 1 },
  scrollContent: { flex: 1, paddingHorizontal: 20 },
  subTabBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 4,
  },
  subTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  subTabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  subTabText: { fontSize: 14, color: "#999", fontWeight: "500" },
  subTabTextActive: { color: "#FF8C42", fontWeight: "700" },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#E74C3C",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#AAA",
    marginBottom: 10,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  listingGroupCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  listingGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  listingGroupImg: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  listingGroupInfo: { flex: 1, marginLeft: 12 },
  listingGroupTitle: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  pendingBadge: {
    backgroundColor: "#FDEBD0",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pendingBadgeText: { fontSize: 11, color: "#E67E22", fontWeight: "700" },
  requestCard: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    position: "relative",
  },
  msgBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 6,
    backgroundColor: "#FFF5EE",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFD8B0",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 32,
    minHeight: 32,
  },
  requestTop: { flexDirection: "row", alignItems: "center", paddingRight: 44 },
  guestAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#eee",
  },
  requestImg: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  requestInfo: { flex: 1, marginLeft: 12 },
  requestTitle: { fontSize: 14, fontWeight: "700", color: "#1A1A1A" },
  requestSub: { fontSize: 13, color: "#888", marginTop: 2 },
  requestDates: { fontSize: 12, color: "#888", marginTop: 3 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  acceptBtn: {
    flex: 1,
    backgroundColor: "#FF8C42",
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: "center",
  },
  acceptBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  declineBtn: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FF8C42",
  },
  declineBtnText: { color: "#FF8C42", fontWeight: "700", fontSize: 14 },
  historyCard: {
    flexDirection: "row",
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  statusBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  availHint: {
    fontSize: 13,
    color: "#888",
    marginBottom: 16,
    marginTop: 4,
    lineHeight: 19,
  },
  listingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  listingImg: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  listingInfo: { flex: 1, marginHorizontal: 12 },
  listingTitle: { fontSize: 14, fontWeight: "700", color: "#1A1A1A" },
  listingType: { fontSize: 12, color: "#999", marginTop: 3 },
  manageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingLeft: 8,
  },
  manageBtnText: { color: "#FF8C42", fontWeight: "700", fontSize: 13 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyText: { fontSize: 16, color: "#888", fontWeight: "600", marginTop: 16 },
  emptySubText: {
    fontSize: 13,
    color: "#BBB",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 19,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  flex1: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "Raleway-Bold",
    color: "#FF8C42",
  },
  notifButton: {
    padding: 5,
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
  content: { flex: 1, paddingHorizontal: 20 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
  },
  emptyText: { marginTop: 12, fontSize: 16, color: "#999999" },
  filterSection: {
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  chipsRow: {
    paddingHorizontal: 16,
    paddingTop: 2,
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    marginRight: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1A1A1A",
    padding: 0,
    fontFamily: "Raleway-Medium",
  },
  buyerCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  buyerCardImage: {
    width: 90,
    height: "100%",
    minHeight: 110,
    backgroundColor: "#EEE",
  },
  buyerCardBody: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  buyerCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  buyerCardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  buyerStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  buyerStatusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  buyerCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  buyerCardSub: {
    fontSize: 12,
    color: "#888",
    flex: 1,
  },
  buyerCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  buyerCardPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FF8C42",
  },
});
