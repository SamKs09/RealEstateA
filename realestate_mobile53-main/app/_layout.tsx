import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { AuthProvider } from "../contexts/AuthContext";
import { LanguageProvider } from "../contexts/LanguageContext";
import { InterestProvider } from "../contexts/InterestContext";
import { PopupProvider } from "../contexts/PopupContext";
import {
  useFonts,
  Raleway_300Light,
  Raleway_400Regular,
  Raleway_500Medium,
  Raleway_600SemiBold,
  Raleway_700Bold,
  Raleway_800ExtraBold,
} from "@expo-google-fonts/raleway";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Raleway: Raleway_400Regular,
    "Raleway-Light": Raleway_300Light,
    "Raleway-Regular": Raleway_400Regular,
    "Raleway-Medium": Raleway_500Medium,
    "Raleway-SemiBold": Raleway_600SemiBold,
    "Raleway-Bold": Raleway_700Bold,
    "Raleway-ExtraBold": Raleway_800ExtraBold,
    "raleway-300Light": Raleway_300Light,
    "raleway-400Regular": Raleway_400Regular,
    "raleway-500Medium": Raleway_500Medium,
    "raleway-600SemiBold": Raleway_600SemiBold,
    "raleway-700Bold": Raleway_700Bold,
    "raleway-800ExtraBold": Raleway_800ExtraBold,
    // Map old Comfortaa references to Raleway
    "comfortaa-400Regular": Raleway_400Regular,
    "comfortaa-500Medium": Raleway_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <LanguageProvider>
            <AuthProvider>
              <InterestProvider>
                <PopupProvider>
                  <StatusBar
                    style="dark"
                    backgroundColor="#FFFFFF"
                    translucent={true}
                  />
                  <Stack
                    screenOptions={{
                      headerShown: false, // Hide header for all screens globally
                    }}
                  >
                    <Stack.Screen name="index" />
                    <Stack.Screen
                      name="(tabs)"
                      options={{
                        headerShown: false,
                      }}
                    />
                    <Stack.Screen name="saved-listings" />
                    <Stack.Screen name="auth/SignIn" />
                    <Stack.Screen name="auth/SignUp" />
                    <Stack.Screen name="auth/KycVerification" />
                    <Stack.Screen name="auth/ForgotPassword" />
                    <Stack.Screen name="auth/ResetPassword" />
                    <Stack.Screen name="auth/VerifyPassword" />
                  </Stack>
                </PopupProvider>
              </InterestProvider>
            </AuthProvider>
          </LanguageProvider>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
