import { Slot } from "expo-router";
import { useSelector } from "react-redux";
import { authApi } from "../../src/redux/authApi";

export default function AppLayout() {
  const authState = useSelector(
    authApi.endpoints.getAuthState.select(undefined)
  )?.data;

  if (!authState?.ready) return null;

  // 🔒 HARD BLOCK — do NOT redirect here
  if (!authState.isAuthenticated) return null;

  if (authState.profile?.onboarding?.status !== "COMPLETED") return null;

  if (!authState.profile?.access?.activeWorkbase?.id) return null;

  // ✅ Only here is app allowed to render
  return <Slot />;
}

// import { Redirect, Slot } from "expo-router";
// import { useSelector } from "react-redux";
// import { authApi } from "../../src/redux/authApi";

// export default function AppLayout() {
//   const authState = useSelector(
//     authApi.endpoints.getAuthState.select(undefined)
//   )?.data;

//   if (!authState?.ready) return null;

//   // ❌ Not authenticated
//   if (!authState.isAuthenticated) {
//     return <Redirect href="/" />;
//   }

//   // 🟡 Onboarding not complete
//   if (authState.profile?.onboarding?.status !== "COMPLETED") {
//     return <Redirect href="/" />;
//   }

//   // 🟡 No active workbase → DO NOT ENTER APP
//   if (!authState.profile?.access?.activeWorkbase?.id) {
//     return <Redirect href="/" />;
//   }

//   // ✅ Safe to enter app
//   return <Slot />;
// }

// // app/(app)/layout.js
// import { Slot } from "expo-router";

// export default function AppLayout() {
//   return <Slot />;
// }
