// app/_layout.js
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Provider } from "react-redux";

import { Slot } from "expo-router";
import AuthBootstrap from "../src/navigation/AuthBootstrap";
import GuardedStack from "../src/navigation/GuardedStack";
import { store } from "../src/redux/store";

const MainLayout = () => {
  console.log(" ");
  console.log(" ");
  console.log(`MainLayout ----STRRT START`);
  console.log(`MainLayout ----STRRT START`);

  console.log(`MainLayout ----END END END running`);
  console.log(`MainLayout ----END END END running`);
  console.log(" ");
  console.log(" ");

  return <Slot />;
};

export default function RootLayout() {
  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <Provider store={store}>
          {/* 🔑 GLOBAL AUTH LISTENER (never unmounts) */}
          <AuthBootstrap />
          <GuardedStack />
          <Slot />
        </Provider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// import { Stack, useRouter, useSegments } from "expo-router";
// import { useEffect } from "react";
// import { ActivityIndicator, View } from "react-native";
// import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
// import { Provider, useSelector } from "react-redux";

// import { getOnboardingRoute } from "../src/navigation/onboardingGuard";
// import AuthBootstrap from "../src/redux/AuthBootstrap";
// import { authApi } from "../src/redux/authApi";
// import { store } from "../src/redux/store";

// function GuardedStack() {
//   console.log(" ");
//   console.log(" ");
//   console.log("GuardedStack ----START START");
//   console.log("GuardedStack ----START START");

//   const router = useRouter();
//   console.log("GuardedStack ----router", router);

//   const segments = useSegments();
//   console.log("GuardedStack ----segments", segments);

//   const allQueries = useSelector((state) => state.authApi.queries);
//   console.log("GuardedStack ----allQueries", allQueries);

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
//     if (!authState || !authState?.ready) return;

//     const { isAuthenticated, profile } = authState;
//     console.log("GuardedStack ----isAuthenticated", isAuthenticated);

//     const currentGroup = segments[0]; // auth | onboarding | (app)
//     console.log("GuardedStack ----currentGroup", currentGroup);

//     // 🔴 Not authenticated
//     if (!isAuthenticated) {
//       console.log(
//         "GuardedStack ----isAuthenticated ----route to 'auth/signin' ",
//         isAuthenticated
//       );
//       router.replace("/signin");
//       return;
//     }
//     // 🟡 Authenticated but onboarding incomplete
//     const onboardingRoute = getOnboardingRoute(profile);
//     console.log("GuardedStack ----onboardingRoute", onboardingRoute);

//     if (onboardingRoute) {
//       if (currentGroup !== "onboarding") {
//         router.replace(onboardingRoute);
//       }
//       return;
//     }

//     // 🟢 Fully authenticated + onboarded
//     if (currentGroup !== "(app)") {
//       router.replace("/(app)");
//     }
//   }, [authState, segments]);

//   // Splash / loading while resolving auth state
//   if (!authState || !authState.ready) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <ActivityIndicator size="large" />
//       </View>
//     );
//   }

//   return <Stack screenOptions={{ headerShown: false }} />;
// }

// export default function RootLayout() {
//   return (
//     <SafeAreaProvider style={{ flex: 1 }}>
//       <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
//         <Provider store={store}>
//           {/* 🔑 AUTH MUST START IMMEDIATELY */}
//           <AuthBootstrap />

//           {/* 🟡 Persist only UI / cached reducers */}
//           {/* <PersistGate loading={null} persistor={persistor}> */}
//           <GuardedStack />
//           {/* </PersistGate> */}
//         </Provider>
//       </SafeAreaView>
//     </SafeAreaProvider>
//   );
// }
