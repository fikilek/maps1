// src/navigation/GuardedGate.js
import { Slot, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useSelector } from "react-redux";
import { authApi } from "../redux/authApi";

export default function GuardedGate() {
  const router = useRouter();

  const authState = useSelector(
    authApi.endpoints.getAuthState.select(undefined)
  )?.data;

  const ready = authState?.ready;
  const isAuthenticated = authState?.isAuthenticated;
  const onboardingStatus = authState?.profile?.onboarding?.status;
  const activeWorkbaseId = authState?.profile?.access?.activeWorkbase?.id;

  // ⏳ Auth not ready yet
  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  // ❌ Not authenticated
  if (!isAuthenticated) {
    router.replace("/(auth)/signin");
    return null;
  }

  // 🟡 Onboarding incomplete
  if (onboardingStatus && onboardingStatus !== "COMPLETED") {
    router.replace("/onboarding/pending-sp-confirmation");
    return null;
  }

  // ✅ Fully onboarded but no workbase (later)
  if (!activeWorkbaseId) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  // ✅ Everything OK → render app
  return <Slot />;
}
