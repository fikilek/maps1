// src/navigation/GuardedStack.js
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { authApi } from "../redux/authApi";

export default function GuardedStack() {
  const router = useRouter();

  const authState = useSelector(
    authApi.endpoints.getAuthState.select(undefined)
  )?.data;

  const ready = authState?.ready;
  const isAuthenticated = authState?.isAuthenticated;
  const onboardingStatus = authState?.profile?.onboarding?.status;
  const activeWorkbaseId = authState?.profile?.access?.activeWorkbase?.id;

  useEffect(() => {
    if (!ready) return;

    // ❌ Not authenticated
    if (!isAuthenticated) {
      console.log(
        `GuardedStack ---useEffect ----isAuthenticated`,
        isAuthenticated
      );
      console.log(
        `GuardedStack ---useEffect ----routing to ["/(auth)/signin"]`
      );
      router.replace("/(auth)/signin");
      return;
    }

    // 🟡 Onboarding NOT complete → route to onboarding
    if (onboardingStatus && onboardingStatus !== "COMPLETED") {
      console.log(
        `GuardedStack ---useEffect ----onboardingStatus`,
        onboardingStatus
      );
      console.log(
        `GuardedStack ---useEffect ----routing to ["/onboarding/pending-sp-confirmation"]`
      );
      router.replace("/onboarding/pending-sp-confirmation");
      return;
    }

    // ✅ Fully onboarded but no workbase (later)
    if (!activeWorkbaseId) {
      console.log(
        `GuardedStack ---useEffect ----activeWorkbaseId ----return`,
        activeWorkbaseId
      );
      return;
    }
  }, [ready, isAuthenticated, onboardingStatus, activeWorkbaseId, router]);

  return null;
}
