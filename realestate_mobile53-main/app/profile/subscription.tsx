import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenWrapper, BackButton } from "../../components/Ui";
import { useAuth } from "../../contexts/AuthContext";
import { userService, PackType } from "../../services/userService";

const plans = [
  {
    id: "bronze",
    name: "Bronze",
    price: 1,
    listings: 3,
    boosts: 1,
    features: ["3 active listings", "Receive buyer offers", "1 listing boost"],
  },
  {
    id: "silver",
    name: "Silver",
    price: 1,
    listings: 10,
    boosts: 3,
    features: [
      "10 active listings",
      "Receive buyer offers",
      "3 listing boosts",
    ],
  },
  {
    id: "gold",
    name: "Gold",
    price: 1,
    listings: 15,
    boosts: 5,
    features: ["15 active listings", "Priority visibility", "5 listing boosts"],
  },
  {
    id: "platinum",
    name: "Platinum",
    price: 1,
    listings: 50,
    boosts: 10,
    features: [
      "50 active listings",
      "Priority visibility",
      "10 listing boosts",
    ],
  },
] as const satisfies readonly {
  id: PackType;
  name: string;
  price: number;
  listings: number;
  boosts: number;
  features: string[];
}[];

export default function SubscriptionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    paymentStatus?: string;
    transactionId?: string;
  }>();
  const { user, updateUser, refreshProfile } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<PackType | null>(null);
  const [confirmingTransactionId, setConfirmingTransactionId] = useState<
    string | null
  >(null);

  const currentPack = user?.pack || "freemium";
  const currentPlan = useMemo(
    () => plans.find((plan) => plan.id === currentPack) || null,
    [currentPack],
  );

  useEffect(() => {
    const paymentStatus = Array.isArray(params.paymentStatus)
      ? params.paymentStatus[0]
      : params.paymentStatus;
    const transactionId = Array.isArray(params.transactionId)
      ? params.transactionId[0]
      : params.transactionId;

    if (
      !paymentStatus ||
      !transactionId ||
      confirmingTransactionId === transactionId
    ) {
      return;
    }

    const finalizePayment = async () => {
      setConfirmingTransactionId(transactionId);

      try {
        if (paymentStatus !== "success") {
          Alert.alert(
            "Payment not completed",
            "Your pack purchase was not completed.",
          );
          return;
        }

        // Retry up to 5 times with 2-second delays to handle the brief window between
        // Flouci redirecting to the success URL and verify_payment returning SUCCESS.
        let transaction = null;
        const MAX_ATTEMPTS = 5;
        const RETRY_DELAY_MS = 2000;

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
          if (attempt > 0) {
            await new Promise<void>((resolve) =>
              setTimeout(resolve, RETRY_DELAY_MS),
            );
          }
          const response =
            await userService.getPaymentTransaction(transactionId);
          if (response.data?.status === "paid") {
            transaction = response.data;
            break;
          }
        }

        if (!transaction || transaction.status !== "paid") {
          throw new Error(
            "Payment confirmation is still pending. Please wait a moment and try again.",
          );
        }

        if (transaction.user) {
          await updateUser(transaction.user);
        } else {
          await refreshProfile();
        }

        Alert.alert("Pack updated", "Your subscription pack is now active.");
      } catch (error: any) {
        Alert.alert(
          "Payment verification failed",
          error.message || "We could not verify the payment yet.",
        );
      } finally {
        setConfirmingTransactionId(null);
        router.replace("/profile/subscription");
      }
    };

    finalizePayment();
  }, [
    confirmingTransactionId,
    params.paymentStatus,
    params.transactionId,
    refreshProfile,
    router,
    updateUser,
  ]);

  const handleSelect = async (planId: PackType) => {
    if (loadingPlan || planId === currentPack) {
      return;
    }

    if (planId === "freemium") {
      Alert.alert("Unavailable", "Freemium cannot be activated from checkout.");
      return;
    }

    setLoadingPlan(planId);

    try {
      const response = await userService.initiatePackPayment(planId);
      const transaction = response.data;

      if (
        !response.success ||
        !transaction?.checkoutUrl ||
        !transaction.transactionId
      ) {
        throw new Error(response.message || "Failed to start payment.");
      }

      router.push({
        pathname: "/profile/payment-webview",
        params: {
          paymentLink: transaction.checkoutUrl,
          transactionId: transaction.transactionId,
          returnPath: "/profile/subscription",
        },
      });
    } catch (error: any) {
      Alert.alert(
        "Pack payment failed",
        error.message || "Failed to start pack payment.",
      );
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Subscription Pack</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.trialBanner}>
          <Text style={styles.trialText}>7 day free trial</Text>
          <Text style={styles.trialSubtext}>
            1 listing and 1 boost included before you pick a paid pack
          </Text>
        </View>
        <View style={styles.currentPackCard}>
          <Text style={styles.currentPackLabel}>Current pack</Text>
          <Text style={styles.currentPackValue}>
            {currentPlan?.name || currentPack}
          </Text>
          <Text style={styles.currentPackMeta}>
            {user?.listingConfig?.number || 1} listings ·{" "}
            {user?.boost?.number || 0} boosts remaining
          </Text>
        </View>
        {plans.map((plan) => (
          <View key={plan.id} style={styles.planCard}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planPrice}>
              <Text style={{ fontWeight: "bold" }}>{plan.price} DT</Text> /
              month
            </Text>
            <Text style={styles.planMeta}>
              {plan.listings} listings · {plan.boosts} boosts
            </Text>
            {plan.features.map((feature, idx) => (
              <Text key={idx} style={styles.planFeature}>
                ✓ {feature}
              </Text>
            ))}
            <TouchableOpacity
              style={[
                styles.selectButton,
                plan.id === currentPack && styles.selectButtonActive,
                plan.id === "silver" && styles.selectButtonPro,
                (loadingPlan === plan.id || confirmingTransactionId !== null) &&
                  styles.selectButtonDisabled,
              ]}
              onPress={() => handleSelect(plan.id)}
              disabled={
                loadingPlan !== null || confirmingTransactionId !== null
              }
            >
              {loadingPlan === plan.id ? (
                <ActivityIndicator
                  color={plan.id === "silver" ? "#fff" : "#FF8C42"}
                />
              ) : (
                <Text
                  style={[
                    styles.selectButtonText,
                    plan.id === "silver" && styles.selectButtonTextPro,
                    plan.id === currentPack && styles.selectButtonTextActive,
                  ]}
                >
                  {plan.id === currentPack
                    ? `Current ${plan.name}`
                    : `Choose ${plan.name}`}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ))}
        {confirmingTransactionId ? (
          <View style={styles.pendingCard}>
            <ActivityIndicator color="#FF8C42" />
            <Text style={styles.pendingText}>Verifying your payment...</Text>
          </View>
        ) : null}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "#FF8C42",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: "hidden",
  },
  scrollContent: {
    padding: 20,
    alignItems: "center",
  },
  trialBanner: {
    backgroundColor: "#FFF5EC",
    borderColor: "#FF8C42",
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: "center",
    width: "100%",
  },
  trialText: {
    color: "#FF8C42",
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 4,
  },
  trialSubtext: {
    color: "#FF8C42",
    fontSize: 13,
    textAlign: "center",
  },
  currentPackCard: {
    width: "100%",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    backgroundColor: "#FFF9F5",
    borderWidth: 1,
    borderColor: "#FFD7BD",
  },
  currentPackLabel: {
    fontSize: 12,
    color: "#8A8A8A",
    marginBottom: 4,
  },
  currentPackValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  currentPackMeta: {
    marginTop: 6,
    fontSize: 14,
    color: "#666",
  },
  planCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF8C42",
  },
  planName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#333",
  },
  planPrice: {
    fontSize: 16,
    color: "#888",
    marginBottom: 10,
  },
  planMeta: {
    fontSize: 14,
    color: "#555",
    marginBottom: 10,
  },
  planFeature: {
    color: "#4CAF50",
    fontSize: 15,
    marginBottom: 2,
  },
  selectButton: {
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FF8C42",
    paddingVertical: 10,
    paddingHorizontal: 32,
    backgroundColor: "#fff",
  },
  selectButtonText: {
    color: "#FF8C42",
    fontWeight: "bold",
    fontSize: 16,
  },
  selectButtonActive: {
    backgroundColor: "#FFF0E6",
  },
  selectButtonTextActive: {
    color: "#C55D12",
  },
  selectButtonPro: {
    backgroundColor: "#FF8C42",
  },
  selectButtonDisabled: {
    opacity: 0.7,
  },
  selectButtonTextPro: {
    color: "#fff",
  },
  pendingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 8,
    marginBottom: 24,
    width: "100%",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#FFF5EC",
  },
  pendingText: {
    color: "#FF8C42",
    fontSize: 14,
    fontWeight: "600",
  },
});
