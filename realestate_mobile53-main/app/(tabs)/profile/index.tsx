import React from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

export default function ProfileScreen() {
  const router = useRouter();

  // Automatically redirect to full-profile when this tab is accessed
  useFocusEffect(
    React.useCallback(() => {
      router.replace("/(tabs)/profile/full-profile");
    }, [router]),
  );

  // Return null since we're immediately redirecting
  return null;
}
