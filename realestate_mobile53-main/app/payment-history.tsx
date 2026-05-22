import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { BorderRadius, Colors, Spacing, Typography } from "../components/styles";
import { PaymentTransactionSummary, userService } from "../services/userService";

const kindLabels: Record<PaymentTransactionSummary["kind"], string> = {
  pack_purchase: "Package payment",
  property_boost: "Property boost",
  vehicle_boost: "Vehicle boost",
};

const statusColors: Record<PaymentTransactionSummary["status"], string> = {
  paid: "#1F9D55",
  pending: "#E69B00",
  failed: "#D14343",
  cancelled: "#6B7280",
  expired: "#6B7280",
};

const boostPlanLabels: Record<NonNullable<PaymentTransactionSummary["boostPlan"]>, string> = {
  "1day": "1 day boost",
  "3day": "3 day boost",
  "7day": "7 day boost",
};

const packLabels: Record<string, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

const formatStatus = (status: PaymentTransactionSummary["status"]) => (
  status.charAt(0).toUpperCase() + status.slice(1)
);

const formatDate = (value?: string | null) => {
  if (!value) {
    return "Date unavailable";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Date unavailable";
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getTransactionTitle = (transaction: PaymentTransactionSummary) => {
  if (transaction.kind === "pack_purchase") {
    return `${packLabels[transaction.pack || ""] || "Subscription"} package`;
  }

  if (transaction.kind === "property_boost") {
    return boostPlanLabels[transaction.boostPlan || "1day"] || "Property boost";
  }

  return boostPlanLabels[transaction.boostPlan || "1day"] || "Vehicle boost";
};

const getTransactionSubtitle = (transaction: PaymentTransactionSummary) => {
  if (transaction.kind === "pack_purchase") {
    return "Subscription pack purchase";
  }

  if (transaction.kind === "property_boost") {
    return transaction.property?.title || transaction.description || "Property listing boost";
  }

  return transaction.vehicle?.title || transaction.description || "Vehicle listing boost";
};

export default function PaymentHistoryScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<PaymentTransactionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await userService.getPaymentHistory();
      setTransactions(response.data || []);
      setError(null);
    } catch (loadError: any) {
      setError(loadError?.message || "Failed to load payment history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const renderTransaction = ({ item }: { item: PaymentTransactionSummary }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconWrap}>
          <Ionicons
            name={item.kind === "pack_purchase" ? "card-outline" : "flash-outline"}
            size={20}
            color={Colors.accent}
          />
        </View>
        <View style={styles.cardTitleWrap}>
          <Text style={styles.cardTitle}>{getTransactionTitle(item)}</Text>
          <Text style={styles.cardSubtitle}>{getTransactionSubtitle(item)}</Text>
        </View>
        <Text style={styles.amount}>{item.amount} {item.currency}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{kindLabels[item.kind]}</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColors[item.status]}1A` }]}>
          <Text style={[styles.statusText, { color: statusColors[item.status] }]}>{formatStatus(item.status)}</Text>
        </View>
      </View>
      <Text style={styles.dateText}>{formatDate(item.paidAt || item.processedAt || item.createdAt)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment History</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.stateText}>Loading your payments...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={44} color="#D14343" />
          <Text style={styles.stateTitle}>Could not load payment history</Text>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadHistory()}>
            <Text style={styles.retryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.transactionId}
          renderItem={renderTransaction}
          contentContainerStyle={transactions.length ? styles.listContent : styles.emptyContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadHistory(true)}
              tintColor={Colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Ionicons name="receipt-outline" size={44} color={Colors.textSecondary} />
              <Text style={styles.stateTitle}>No payments yet</Text>
              <Text style={styles.stateText}>Package purchases and boost payments will appear here once they are created.</Text>
            </View>
          }
        />
      )}
    </View>
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing["5xl"],
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F7F7",
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  listContent: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emptyContent: {
    flexGrow: 1,
    padding: Spacing.xl,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF3EA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  cardTitleWrap: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  amount: {
    fontSize: Typography.fontSize.base,
    fontWeight: "700",
    color: Colors.accent,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.md,
    marginBottom: 8,
  },
  metaText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "700",
  },
  dateText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  stateTitle: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  stateText: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  retryButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.accent,
    borderRadius: 999,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: Typography.fontSize.sm,
    fontWeight: "700",
  },
});