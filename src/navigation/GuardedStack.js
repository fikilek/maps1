// src/navigation/GuardedStack.js
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSelector } from "react-redux";
import { authApi } from "../redux/authApi";

export default function GuardedStack() {
  console.log(" ");
  console.log(" ");
  console.log("GuardedStack ----START START");
  console.log("GuardedStack ----START START");

  const router = useRouter();

  const authState = useSelector(
    authApi.endpoints.getAuthState.select(undefined)
  )?.data;

  const ready = authState?.ready;
  const isAuthenticated = authState?.isAuthenticated;
  const activeWorkbaseId = authState?.profile?.access?.activeWorkbase?.id;

  // const authState = useSelector(
  //   authApi.endpoints.getAuthState.select(undefined)
  // )?.data;
  console.log("GuardedStack ----authState", authState);
  // console.log(`GuardedStack ----authState`, JSON.stringify(authState, null, 2));

  console.log("GuardedStack ----authState.ready", authState?.ready);
  console.log(
    "GuardedStack ----authState.profile?.access?.activeWorkbase?.id",
    authState?.profile?.access?.activeWorkbase?.id
  );
  console.log(
    "GuardedStack ----authState.isAuthenticated",
    authState?.isAuthenticated
  );

  /* =========================
     SIDE EFFECTS (NAVIGATION)
  ========================= */
  useEffect(() => {
    // ⛔ CRITICAL: wait until auth is resolved
    if (!ready) {
      console.log("GuardedStack ----ready - return", ready);
      return;
    }

    if (!isAuthenticated) {
      console.log("GuardedStack ----isAuthenticated - return", isAuthenticated);
      router.replace("/(auth)/signin");
      return;
    }

    if (!activeWorkbaseId) {
      console.log(
        "GuardedStack ----activeWorkbaseId - return",
        activeWorkbaseId
      );
      return;
    }

    // ✅ all good → let Slot render
  }, [ready, isAuthenticated, activeWorkbaseId, router]);

  if (!authState || !authState?.ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // ✅ Let Slot render normally
  console.log("GuardedStack ----Let Slot render normally ");
  return null;
}
