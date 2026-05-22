import React, { useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { Redirect, useRouter } from "expo-router";
import { OnboardingFlow } from "./onboarding/screens/OnboardingFlow";
import { Colors } from "../components/styles";

export default function Index() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState<boolean>(true); // Always show onboarding first

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Navigate to HomePage after onboarding
    router.replace("/onboarding/HomePage");
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Always show onboarding first on app refresh/restart
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // User has completed onboarding, proceed with normal auth flow
  if (isAuthenticated) {
    // Auto-redirect to free trial if user hasn't used it and is on freemium pack
    if (user && (!user.trial || !user.trial.isUsed) && user.pack === 'freemium') {
      return <Redirect href="/free-trial" />;
    }
    return <Redirect href="../(tabs)/Explore" />;
  }

  return <Redirect href="/onboarding/HomePage" />;
}
