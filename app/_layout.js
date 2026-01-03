import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Provider } from "react-redux";

import { useAuth } from "../src/hooks/useAuth";
import AuthBootstrap from "../src/navigation/AuthBootstrap";
import { store } from "../src/redux/store";

function AuthGate() {
  const { user, status, isLoading } = useAuth();
  console.log(`AuthGate ----user`, user);
  console.log(`AuthGate ----status`, status);

  const segments = useSegments();
  const router = useRouter();

  // 1. We track if the layout has mounted to prevent early navigation
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  useEffect(() => {
    // Set ready on first mount
    setIsLayoutReady(true);
  }, []);

  useEffect(() => {
    if (!isLayoutReady || isLoading) return;

    const rootSegment = segments[0];
    console.log(`AuthGate ----rootSegment`, rootSegment);

    const isAtWelcome = segments.length === 0; // The '/' route (index.js)
    console.log(`AuthGate ----isAtWelcome`, isAtWelcome);

    const inAuthGroup = rootSegment === "(auth)";
    console.log(`AuthGate ----inAuthGroup`, inAuthGroup);

    const inOnboardingGroup = rootSegment === "onboarding";
    console.log(`AuthGate ----inOnboardingGroup`, inOnboardingGroup);

    // 1. If user is NOT logged in
    if (!user) {
      // Only redirect to signin if they try to access protected areas
      // Let them stay on the Welcome page (index.js)
      if (!inAuthGroup && !isAtWelcome) {
        router.replace("/signin");
      }
      return;
    }

    // 2. If user IS logged in, handle onboarding states
    switch (status) {
      case "AWAITING_SP_CONFIRMATION":
        // If they are on the Welcome page, don't force them away yet.
        // But if they try to go to the App, send them to Pending.
        if (!isAtWelcome && segments[1] !== "pending-sp-confirmation") {
          router.replace("/onboarding/pending-sp-confirmation");
        }
        break;

      case "SELECT_WORKBASE":
        if (!isAtWelcome && segments[1] !== "select-workbase") {
          router.replace("/onboarding/select-workbase");
        }
        break;

      case "COMPLETED":
        // If they are logged in and finished, they can go to the App
        if (inAuthGroup || inOnboardingGroup) {
          router.replace("/(tabs)");
        }
        break;
    }
  }, [user, status, isLoading, segments, isLayoutReady]);

  return (
    <View style={{ flex: 1 }}>
      {/* Slot is always present */}
      <Slot />

      {/* Overlay covers everything while loading or navigating */}
      {(!isLayoutReady || isLoading) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Synchronizing iREPS Data...</Text>
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PaperProvider>
        <SafeAreaProvider>
          <SafeAreaView style={{ flex: 1 }}>
            <AuthBootstrap />
            <AuthGate />
          </SafeAreaView>
        </SafeAreaProvider>
      </PaperProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
});
