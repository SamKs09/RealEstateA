import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { CalendarPicker } from "../../components/Ui";
import {
  getAvailability,
  setListingAvailability,
  AvailabilityData,
} from "../../services/bookingService";
import { useTranslation } from "../../hooks/useTranslation";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface BlockedRange {
  startDate: string;
  endDate: string;
  reason?: string;
}

// ─────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────

export default function ManageAvailabilityScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const params = useLocalSearchParams();
  const listingId = params.listingId as string;
  const listingType = params.listingType as "property" | "vehicle";
  const listingTitle = params.listingTitle as string;

  // Availability settings state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [defaultAvailable, setDefaultAvailable] = useState(true);
  const [minRentalDays, setMinRentalDays] = useState("");
  const [maxRentalDays, setMaxRentalDays] = useState("");
  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([]);

  // Calendar state for adding a new blocked range
  const [addingRange, setAddingRange] = useState(false);
  const [rangeStartDay, setRangeStartDay] = useState(0);
  const [rangeEndDay, setRangeEndDay] = useState(0);
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  // Preview calendar state (read-only overview)
  const [previewMonth, setPreviewMonth] = useState(new Date().getMonth() + 1);
  const [previewYear, setPreviewYear] = useState(new Date().getFullYear());

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(
      i18n.language === "ar"
        ? "ar-TN"
        : i18n.language === "fr"
          ? "fr-FR"
          : "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      },
    );

  const dayToISO = (day: number, month: number, year: number) =>
    new Date(year, month - 1, day).toISOString();

  // Load existing availability on mount
  useEffect(() => {
    if (!listingId || !listingType) {
      setLoading(false);
      return;
    }
    loadAvailability();
  }, [listingId, listingType]);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const data: AvailabilityData = await getAvailability(
        listingId,
        listingType,
      );
      setDefaultAvailable(data.defaultAvailable);
      setMinRentalDays(
        data.minRentalDays != null ? String(data.minRentalDays) : "",
      );
      setMaxRentalDays(
        data.maxRentalDays != null ? String(data.maxRentalDays) : "",
      );
      setBlockedRanges(
        data.blockedRanges.map((r) => ({
          startDate: r.startDate,
          endDate: r.endDate,
          reason: r.reason,
        })),
      );
    } catch (e: any) {
      console.error("Error loading availability:", e);
      Alert.alert(t("error"), t("bookings.availability.couldNotLoad"));
    } finally {
      setLoading(false);
    }
  };

  // ── Calendar interactions ──

  const handlePrevMonth = () => {
    if (calMonth === 1) {
      setCalMonth(12);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
    resetCalSelection();
  };

  const handleNextMonth = () => {
    if (calMonth === 12) {
      setCalMonth(1);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
    resetCalSelection();
  };

  const resetCalSelection = () => {
    setRangeStartDay(0);
    setRangeEndDay(0);
  };

  const handleDateSelect = (day: number) => {
    const selected = new Date(calYear, calMonth - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selected < today) {
      Alert.alert(
        t("bookings.availability.invalidDate"),
        t("bookings.availability.cannotBlockPast"),
      );
      return;
    }

    if (!rangeStartDay || (rangeStartDay && rangeEndDay)) {
      // First tap — set start
      setRangeStartDay(day);
      setRangeEndDay(0);
    } else {
      // Second tap — set end
      if (day > rangeStartDay) {
        setRangeEndDay(day);
      } else if (day < rangeStartDay) {
        // Swap: treat tapped day as new start
        setRangeStartDay(day);
        setRangeEndDay(0);
      } else {
        // Same day — single-day block
        setRangeEndDay(day);
      }
    }
  };

  const handleAddRange = () => {
    if (!rangeStartDay) {
      Alert.alert(
        t("bookings.availability.selectDates"),
        t("bookings.availability.selectStartFirst"),
      );
      return;
    }
    const endDay = rangeEndDay || rangeStartDay;
    const newRange: BlockedRange = {
      startDate: dayToISO(rangeStartDay, calMonth, calYear),
      endDate: dayToISO(endDay, calMonth, calYear),
    };
    setBlockedRanges((prev) => [...prev, newRange]);
    setAddingRange(false);
    resetCalSelection();
  };

  const handleRemoveRange = (index: number) => {
    setBlockedRanges((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Preview calendar helpers ──

  const isDateDisabledForPreview = (day: number): boolean => {
    const checkDateStr = new Date(previewYear, previewMonth - 1, day)
      .toISOString()
      .split("T")[0];

    // All dates disabled when listing is closed by default
    if (!defaultAvailable) return true;

    // Check blocked ranges
    for (const range of blockedRanges) {
      const start = new Date(range.startDate).toISOString().split("T")[0];
      const end = new Date(range.endDate).toISOString().split("T")[0];
      if (checkDateStr >= start && checkDateStr <= end) return true;
    }

    return false;
  };

  const handlePreviewPrevMonth = () => {
    if (previewMonth === 1) {
      setPreviewMonth(12);
      setPreviewYear(previewYear - 1);
    } else {
      setPreviewMonth(previewMonth - 1);
    }
  };

  const handlePreviewNextMonth = () => {
    if (previewMonth === 12) {
      setPreviewMonth(1);
      setPreviewYear(previewYear + 1);
    } else {
      setPreviewMonth(previewMonth + 1);
    }
  };

  // ── Save ──

  const handleSave = async () => {
    // Validate min/max
    const min = minRentalDays ? parseInt(minRentalDays, 10) : undefined;
    const max = maxRentalDays ? parseInt(maxRentalDays, 10) : undefined;

    if (min !== undefined && isNaN(min)) {
      Alert.alert(
        t("bookings.availability.invalidInput"),
        t("bookings.availability.minDaysNumberError"),
      );
      return;
    }
    if (max !== undefined && isNaN(max)) {
      Alert.alert(
        t("bookings.availability.invalidInput"),
        t("bookings.availability.maxDaysNumberError"),
      );
      return;
    }
    if (min !== undefined && max !== undefined && min > max) {
      Alert.alert(
        t("bookings.availability.invalidInput"),
        t("bookings.availability.minExceedsMaxError"),
      );
      return;
    }

    setSaving(true);
    try {
      await setListingAvailability(listingId, {
        listingType,
        defaultAvailable,
        blockedRanges,
        minRentalDays: min,
        maxRentalDays: max,
      });
      Alert.alert(
        t("bookings.availability.saved"),
        t("bookings.availability.successMessage"),
        [{ text: t("ok"), onPress: () => router.back() }],
      );
    } catch (e: any) {
      Alert.alert(
        t("error"),
        e.message || t("bookings.availability.couldNotLoad"),
      );
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF8C42" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {t("bookings.availability.title")}
          </Text>
          {listingTitle ? (
            <Text style={styles.headerSub} numberOfLines={1}>
              {listingTitle}
            </Text>
          ) : null}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Default availability ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {t("bookings.availability.defaultAvailability")}
          </Text>
          <View style={styles.switchRow}>
            <View style={styles.switchLabelWrap}>
              <Ionicons
                name={defaultAvailable ? "checkmark-circle" : "close-circle"}
                size={20}
                color={defaultAvailable ? "#27AE60" : "#E74C3C"}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.switchLabel}>
                {defaultAvailable
                  ? t("bookings.availability.openByDefault")
                  : t("bookings.availability.closedByDefault")}
              </Text>
            </View>
            <Switch
              value={defaultAvailable}
              onValueChange={setDefaultAvailable}
              trackColor={{ false: "#E0E0E0", true: "#A8E6C0" }}
              thumbColor={defaultAvailable ? "#27AE60" : "#bbb"}
            />
          </View>
          <Text style={styles.cardHint}>
            {defaultAvailable
              ? t("bookings.availability.openByDefaultDesc")
              : t("bookings.availability.closedByDefaultDesc")}
          </Text>
        </View>

        {/* ── Rental duration ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {t("bookings.availability.rentalDuration")}
          </Text>
          <View style={styles.durationRow}>
            <View style={styles.durationField}>
              <Text style={styles.durationLabel}>
                {t("bookings.availability.minDays")}
              </Text>
              <TextInput
                style={styles.durationInput}
                value={minRentalDays}
                onChangeText={setMinRentalDays}
                keyboardType="number-pad"
                placeholder={t("bookings.availability.minDaysPlaceholder")}
                placeholderTextColor="#CCC"
                maxLength={3}
              />
            </View>
            <View style={styles.durationSep} />
            <View style={styles.durationField}>
              <Text style={styles.durationLabel}>
                {t("bookings.availability.maxDays")}
              </Text>
              <TextInput
                style={styles.durationInput}
                value={maxRentalDays}
                onChangeText={setMaxRentalDays}
                keyboardType="number-pad"
                placeholder={t("bookings.availability.maxDaysPlaceholder")}
                placeholderTextColor="#CCC"
                maxLength={3}
              />
            </View>
          </View>
        </View>

        {/* ── Blocked dates ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>
              {t("bookings.availability.blockedDates")}
            </Text>
            {!addingRange && (
              <TouchableOpacity
                style={styles.addRangeBtn}
                onPress={() => setAddingRange(true)}
              >
                <Ionicons name="add-circle-outline" size={18} color="#FF8C42" />
                <Text style={styles.addRangeBtnText}>
                  {t("bookings.availability.addRange")}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {blockedRanges.length === 0 && !addingRange ? (
            <Text style={styles.noRangesText}>
              {t("bookings.availability.noBlockedRanges")}
            </Text>
          ) : (
            blockedRanges.map((range, index) => (
              <View key={index} style={styles.rangeRow}>
                <Ionicons name="calendar-outline" size={16} color="#888" />
                <Text style={styles.rangeText}>
                  {formatDate(range.startDate)}
                  {range.startDate !== range.endDate
                    ? "  →  " + formatDate(range.endDate)
                    : ""}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemoveRange(index)}
                  style={styles.removeBtn}
                >
                  <Ionicons name="trash-outline" size={18} color="#E74C3C" />
                </TouchableOpacity>
              </View>
            ))
          )}

          {/* Inline calendar for adding a range */}
          {addingRange && (
            <View style={styles.calendarWrap}>
              <Text style={styles.calHint}>
                {!rangeStartDay
                  ? t("bookings.availability.tapToSelectStart")
                  : !rangeEndDay
                    ? t("bookings.availability.tapToSelectEnd")
                    : t("bookings.availability.rangeSelectedConfirm")}
              </Text>
              <CalendarPicker
                selectedStartDate={rangeStartDay}
                selectedEndDate={rangeEndDay}
                currentMonth={calMonth}
                currentYear={calYear}
                onDateSelect={handleDateSelect}
                onPreviousMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
              />
              <View style={styles.calActions}>
                <TouchableOpacity
                  style={styles.calCancelBtn}
                  onPress={() => {
                    setAddingRange(false);
                    resetCalSelection();
                  }}
                >
                  <Text style={styles.calCancelText}>
                    {t("bookings.availability.calendarCancel")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.calAddBtn,
                    !rangeStartDay && styles.calAddBtnDisabled,
                  ]}
                  onPress={handleAddRange}
                  disabled={!rangeStartDay}
                >
                  <Text style={styles.calAddText}>
                    {t("bookings.availability.addRange")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ── Availability preview ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>
              {t("bookings.availability.availabilityPreview")}
            </Text>
            <View style={styles.previewBadge}>
              <Text style={styles.previewBadgeText}>
                {t("bookings.availability.readOnly")}
              </Text>
            </View>
          </View>
          <Text style={styles.cardHint}>
            {t("bookings.availability.previewDesc")}
          </Text>
          <CalendarPicker
            selectedStartDate={0}
            selectedEndDate={0}
            currentMonth={previewMonth}
            currentYear={previewYear}
            onDateSelect={() => {}}
            onPreviousMonth={handlePreviewPrevMonth}
            onNextMonth={handlePreviewNextMonth}
            disabledDates={isDateDisabledForPreview}
          />
          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, styles.legendAvailable]} />
              <Text style={styles.legendText}>
                {t("bookings.availability.available")}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, styles.legendUnavailable]} />
              <Text style={styles.legendText}>
                {t("bookings.availability.unavailable")}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Save button ── */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#fff"
              />
              <Text style={styles.saveBtnText}>
                {t("bookings.availability.saveChanges")}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8F9FA" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 56 : 24,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 20, fontFamily: "Raleway-Bold", color: "#333333" },
  headerSub: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
    maxWidth: 200,
    fontFamily: "raleway-400Regular",
  },

  // Scroll
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
    gap: 16,
  },

  // Cards
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 14,
    fontFamily: "raleway-700Bold",
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cardHint: {
    fontSize: 12,
    color: "#999",
    marginTop: 10,
    lineHeight: 17,
    fontFamily: "raleway-400Regular",
  },

  // Switch row
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchLabelWrap: { flexDirection: "row", alignItems: "center" },
  switchLabel: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
    fontFamily: "raleway-500Medium",
  },

  // Duration
  durationRow: { flexDirection: "row", alignItems: "center" },
  durationField: { flex: 1 },
  durationSep: { width: 16 },
  durationLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 6,
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 0.5,
    fontFamily: "raleway-600SemiBold",
  },
  durationInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1A1A1A",
    textAlign: "center",
    fontWeight: "600",
    fontFamily: "raleway-600SemiBold",
  },

  // Blocked ranges list
  addRangeBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  addRangeBtnText: {
    color: "#FF8C42",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "raleway-600SemiBold",
  },
  noRangesText: {
    fontSize: 13,
    color: "#BBB",
    textAlign: "center",
    paddingVertical: 8,
    fontFamily: "raleway-400Regular",
  },
  rangeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    gap: 8,
  },
  rangeText: {
    flex: 1,
    fontSize: 13,
    color: "#444",
    fontFamily: "raleway-400Regular",
  },
  removeBtn: { padding: 4 },

  // Calendar section
  calendarWrap: { marginTop: 12 },
  calHint: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    marginBottom: 8,
    fontStyle: "italic",
    fontFamily: "raleway-400Regular",
  },
  calActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  calCancelBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#DDD",
  },
  calCancelText: {
    color: "#888",
    fontWeight: "600",
    fontSize: 14,
    fontFamily: "raleway-600SemiBold",
  },
  calAddBtn: {
    flex: 1,
    backgroundColor: "#FF8C42",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  calAddBtnDisabled: { backgroundColor: "#FFD4B5" },
  calAddText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    fontFamily: "raleway-700Bold",
  },

  // Save button
  saveBtn: {
    backgroundColor: "#FF8C42",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  saveBtnDisabled: { backgroundColor: "#FFD4B5" },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "raleway-700Bold",
  },

  // Preview legend
  legendRow: {
    flexDirection: "row",
    gap: 24,
    marginTop: 10,
    justifyContent: "center",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendSwatch: { width: 14, height: 14, borderRadius: 7 },
  legendAvailable: { backgroundColor: "#333333" },
  legendUnavailable: { backgroundColor: "#999999", opacity: 0.35 },
  legendText: { fontSize: 12, color: "#666", fontFamily: "raleway-400Regular" },

  // Preview badge
  previewBadge: {
    backgroundColor: "#F0F0F0",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  previewBadgeText: {
    fontSize: 11,
    color: "#999",
    fontWeight: "600",
    fontFamily: "raleway-600SemiBold",
  },
});
