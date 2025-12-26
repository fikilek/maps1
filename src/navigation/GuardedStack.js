// src/navigation/GuardedStack.js
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Button, Text, View } from "react-native";
import { useSelector } from "react-redux";
import { authApi } from "../redux/authApi";

export default function GuardedStack() {
  console.log(" ");
  console.log("GuardedStack ----START START");
  console.log(" ");

  const router = useRouter();

  const authState = useSelector(
    authApi.endpoints.getAuthState.select(undefined)
  )?.data;
  console.log("GuardedStack ----authState", authState);

  const ready = authState?.ready;
  console.log("GuardedStack ----ready", ready);

  const isAuthenticated = authState?.isAuthenticated;
  console.log("GuardedStack ----isAuthenticated", isAuthenticated);

  const activeWorkbaseId = authState?.profile?.access?.activeWorkbase?.id;
  console.log("GuardedStack ----activeWorkbaseId", activeWorkbaseId);

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

  // 🚫 Authenticated but no workbase selected
  if (ready && isAuthenticated && !activeWorkbaseId) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Text style={{ fontSize: 16, textAlign: "center", marginBottom: 16 }}>
          No active workbase is selected for your account.
        </Text>

        <Text style={{ fontSize: 14, textAlign: "center", marginBottom: 24 }}>
          Please contact your supervisor or complete onboarding.
        </Text>

        {/* TEMP helper for development */}
        <Button title="Reload" onPress={() => router.replace("/(app)")} />
      </View>
    );
  }

  console.log(" ");
  console.log("GuardedStack ----END END");
  console.log(" ");

  return null;
}
