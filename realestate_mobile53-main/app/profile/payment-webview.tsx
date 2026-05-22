import React, { useRef } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  View,
  Text,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function PaymentWebView() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    paymentLink: string;
    transactionId?: string;
    returnPath?: string;
    returnParams?: string;
  }>();
  const paymentLink = params.paymentLink;

  const navigateToReturnPath = (paymentStatus: "success" | "failure") => {
    const transactionId = Array.isArray(params.transactionId)
      ? params.transactionId[0]
      : params.transactionId;
    const returnPath = Array.isArray(params.returnPath)
      ? params.returnPath[0]
      : params.returnPath;
    const rawReturnParams = Array.isArray(params.returnParams)
      ? params.returnParams[0]
      : params.returnParams;

    if (!returnPath) {
      router.back();
      return;
    }

    let parsedReturnParams: Record<string, string> = {};

    if (rawReturnParams) {
      try {
        parsedReturnParams = JSON.parse(rawReturnParams);
      } catch (error) {
        console.warn("Failed to parse payment return params", error);
      }
    }

    router.replace({
      pathname: returnPath as any,
      params: {
        ...parsedReturnParams,
        paymentStatus,
        transactionId,
      },
    });
  };

  console.log("🌐 Opening Payment WebView with link:", paymentLink);

  const hasNavigated = useRef(false);

  const handleNavStateChange = (navState: {
    url: string;
    loading: boolean;
  }) => {
    if (hasNavigated.current) return;

    const url = navState.url;

    if (url.includes("/api/payments/return/success")) {
      console.log("✅ Payment success URL detected, returning immediately");
      hasNavigated.current = true;
      navigateToReturnPath("success");
    } else if (url.includes("/api/payments/return/failure")) {
      console.log("❌ Payment failure URL detected, returning immediately");
      hasNavigated.current = true;
      navigateToReturnPath("failure");
    }
  };

  const handleWebViewError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.warn("WebView error:", nativeEvent);

    if (!hasNavigated.current) {
      const errorUrl: string = nativeEvent?.url || "";
      if (errorUrl.includes("/api/payments/return/")) {
        const isSuccess = errorUrl.includes("/return/success");
        console.log(
          `⚠️ Return URL timed out, navigating with ${isSuccess ? "success" : "failure"}`,
        );
        hasNavigated.current = true;
        navigateToReturnPath(isSuccess ? "success" : "failure");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Secure Payment</Text>
        </View>
        <View style={{ width: 48 }} />
      </View>
      <WebView
        source={{ uri: paymentLink }}
        style={styles.webview}
        startInLoadingState={true}
        scalesPageToFit={true}
        onNavigationStateChange={handleNavStateChange}
        onError={handleWebViewError}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  webview: {
    flex: 1,
  },
  backButton: {
    padding: 10,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    fontFamily: "raleway-700Bold",
  },
});
