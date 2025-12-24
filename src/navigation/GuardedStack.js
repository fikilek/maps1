// src/navigation/GuardedStack.js
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSelector } from "react-redux";
import { authApi } from "../redux/authApi";
import { getOnboardingRoute } from "./onboardingGuard";

export default function GuardedStack() {
  const router = useRouter();

  const authState = useSelector(
    authApi.endpoints.getAuthState.select(undefined)
  )?.data;

  console.log("GuardedStack ----authState", authState);

  useEffect(() => {
    if (!authState || !authState.ready) return;

    if (!authState.isAuthenticated) {
      console.log("Redirect → /(auth)/signin");
      router.replace("/(auth)/signin");
      return;
    }

    const onboardingRoute = getOnboardingRoute(authState.profile);
    if (onboardingRoute) {
      console.log("Redirect →", onboardingRoute);
      router.replace(onboardingRoute);
      return;
    }

    console.log("Redirect → /(app)");
    router.replace("/(app)");
  }, [authState, router]);

  if (!authState || !authState.ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // return <Slot />;
}

// // src/navigation/GuardedStack.js
// import { Stack, useRouter } from "expo-router";
// import { useEffect } from "react";
// import { ActivityIndicator, View } from "react-native";
// import { useSelector } from "react-redux";
// import { authApi } from "../redux/authApi";
// import { getOnboardingRoute } from "./onboardingGuard";

// export default function GuardedStack() {
//   const router = useRouter();

//   const authState = useSelector(
//     authApi.endpoints.getAuthState.select(undefined)
//   )?.data;
//   console.log("GuardedStack ----authState", authState);

//   useEffect(() => {
//     console.log("GuardedStack ----useEffect ----authState", authState);
//     console.log(
//       "GuardedStack ----useEffect ----authState.ready",
//       authState?.ready
//     );
//     if (!authState || !authState.ready) return;

//     if (!authState.isAuthenticated) {
//       console.log(
//         "GuardedStack ----useEffect ----authState.isAuthenticated",
//         authState.isAuthenticated
//       );
//       console.log(
//         `GuardedStack ----useEffect ---- Redirecting to /(auth)/signin`
//       );
//       // router.replace("/signin");
//       router.replace("/(auth)/signin");
//       return;
//     }

//     const onboardingRoute = getOnboardingRoute(authState.profile);
//     if (onboardingRoute) {
//       router.replace(onboardingRoute);
//       return;
//     }

//     router.replace("/(app)");
//   }, [authState, router]);

//   if (!authState || !authState.ready) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <ActivityIndicator size="large" />
//       </View>
//     );
//   }

//   return <Stack screenOptions={{ headerShown: false }} />;
// }

// // src/navigation/GuardedStack.js
// import { Stack, useRouter } from "expo-router";
// import { useEffect } from "react";

// import { authApi, useGetAuthStateQuery } from "../redux/authApi";
// import { getOnboardingRoute } from "./onboardingGuard";

// const GuardedStack = () => {
//   console.log(" ");
//   console.log(" ");
//   console.log("GuardedStack ----START START");
//   console.log("GuardedStack ----START START");

//   console.log("GUARD authApi.reducerPath =", authApi.reducerPath);

//   const router = useRouter();

//   const {
//     data: authState,
//     isLoading,
//     isUninitialized,
//   } = useGetAuthStateQuery();

//   console.log("GuardedStack ----authState", authState);
//   console.log("GuardedStack ----isLoading", isLoading);
//   console.log("GuardedStack ----isUninitialized", isUninitialized);
//   console.log("GuardedStack ----GuardedStack ----authState", authState);

//   useEffect(() => {
//     console.log("GuardedStack ----useEffect ----authState", authState);
//     console.log(
//       "GuardedStack ----useEffect ----authState.ready",
//       authState?.ready
//     );
//     if (isUninitialized || isLoading) return;

//     if (!authState) return;

//     if (!authState || !authState.ready) return;

//     if (!authState.isAuthenticated) {
//       console.log(
//         "GuardedStack ----useEffect ----authState.isAuthenticated - return",
//         authState.isAuthenticated
//       );

//       router.replace("/signin"); // /(auth)/signin.js
//       return;
//     }

//     const onboardingRoute = getOnboardingRoute(authState.profile);
//     if (onboardingRoute) {
//       console.log(
//         "GuardedStack ----useEffect ----aonboardingRoute - return",
//         onboardingRoute
//       );
//       router.replace(onboardingRoute);
//       return;
//     }

//     router.replace("/(app)");
//   }, [authState, isLoading, isUninitialized, router]);

//   return <Stack screenOptions={{ headerShown: false }} />;
// };

// export default GuardedStack;
// //
