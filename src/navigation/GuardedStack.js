// src/navigation/GuardedStack.js
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSelector } from "react-redux";
import { authApi } from "../redux/authApi";

export default function GuardedStack() {
  const router = useRouter();

  const authState = useSelector(
    authApi.endpoints.getAuthState.select(undefined)
  )?.data;

  const ready = authState?.ready;
  const isAuthenticated = authState?.isAuthenticated;
  const activeWorkbaseId = authState?.profile?.access?.activeWorkbase?.id;

  useEffect(() => {
    if (!ready) return;

    if (!isAuthenticated) {
      router.replace("/(auth)/signin");
      return;
    }

    if (!activeWorkbaseId) {
      // onboarding later
      return;
    }
  }, [ready, isAuthenticated, activeWorkbaseId, router]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null;
}
