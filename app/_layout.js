import { Slot, useRouter, useSegments } from "expo-router";
import { memo, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";

import { GeoProvider } from "../src/context/GeoContext";
import { MapProvider } from "../src/context/MapContext";
import { WarehouseProvider } from "../src/context/WarehouseContext";
import { auth } from "../src/firebase";
import { useAuth } from "../src/hooks/useAuth";
import AuthBootstrap from "../src/navigation/AuthBootstrap";
import { store } from "../src/redux/store";

// ... existing imports ...

const AuthGate = memo(function AuthGate() {
  const {
    user: reduxUser,
    status,
    isLoading: reduxLoading,
    isADM,
    isMNG,
    isSPU,
  } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const user = reduxUser || auth.currentUser;
  const isLoading = reduxLoading && !user;

  const [isLayoutReady, setIsLayoutReady] = useState(false);

  useEffect(() => {
    setIsLayoutReady(true);
  }, []);

  useEffect(() => {
    if (!isLayoutReady || isLoading) return;

    const rootSegment = segments[0];
    const isAtWelcome = segments.length === 0; // 🎯 This is our "/" (Welcome Screen)
    const inAuthGroup = rootSegment === "(auth)";
    const inOnboardingGroup = rootSegment === "onboarding";

    // 1. GUEST GATE: No session? Force to signin
    if (!user) {
      if (!inAuthGroup && !isAtWelcome) {
        router.replace("/signin");
      }
      return;
    }

    // 2. STATE MACHINE: Onboarding & Authorization Logic
    // 🛡️ THE STRATEGY: We only redirect if they are NOT at the Welcome Screen.
    if (isAtWelcome) return;

    switch (status) {
      case "AWAITING-MNG-CONFIRMATION":
      case "AWAITING-ADM-CONFIRMATION":
        if (isMNG || isADM) {
          // Managers/Admins go here if they leave the Welcome screen
          if (
            rootSegment !== "onboarding" ||
            segments[1] !== "confirm-appointment"
          ) {
            router.replace("/onboarding/confirm-appointment");
          }
        } else {
          // Operatives go here if they leave the Welcome screen
          if (
            rootSegment !== "onboarding" ||
            segments[1] !== "pending-sp-confirmation"
          ) {
            router.replace("/onboarding/awaiting-mng-confirmation");
          }
        }
        break;

      case "COMPLETE":
      case "COMPLETED":
        // Fully authorized users are cleared for the app
        if (inAuthGroup || inOnboardingGroup || isAtWelcome) {
          router.replace("/(tabs)/erfs");
        }
        break;

      default:
        break;
    }
  }, [user, status, isLoading, segments, isLayoutReady]);

  // useEffect(() => {
  //   if (!isLayoutReady || isLoading) return;

  //   const rootSegment = segments[0];
  //   const isAtWelcome = segments.length === 0;
  //   const inAuthGroup = rootSegment === "(auth)";
  //   const inOnboardingGroup = rootSegment === "onboarding";

  //   // 1. GUEST GATE: If no session, force to signin
  //   if (!user) {
  //     if (!inAuthGroup && !isAtWelcome) {
  //       router.replace("/signin");
  //     }
  //     return;
  //   }

  //   // 2. STATE MACHINE: Onboarding & Authorization Logic
  //   switch (status) {
  //     // 🚩 STRATEGIC GATE: Invited Roles (MNG/ADM) confirming their appointment
  //     case "AWAITING-MNG-CONFIRMATION":
  //     case "AWAITING-ADM-CONFIRMATION":
  //       // Logic: If it's the Manager/Admin themselves, show the "Confirm Receipt" screen
  //       if (isMNG || isADM) {
  //         if (
  //           rootSegment !== "onboarding" ||
  //           segments[1] !== "confirm-appointment"
  //         ) {
  //           router.replace("/onboarding/confirm-appointment");
  //         }
  //       }
  //       // Logic: If it's an SPV/FWR/GST, show the "Waiting for Authorization" screen
  //       else {
  //         if (
  //           rootSegment !== "onboarding" ||
  //           segments[1] !== "pending-authorization"
  //         ) {
  //           router.replace("/onboarding/pending-sp-confirmation");
  //         }
  //       }
  //       break;

  //     // 🚩 STRATEGIC GATE: SPU/MNG has authorized, but account is still DISABLED
  //     // (Safety check for the A06 to prevent data fetching before enable)
  //     case "COMPLETE":
  //     case "COMPLETED":
  //       if (inAuthGroup || inOnboardingGroup || isAtWelcome) {
  //         router.replace("/(tabs)/erfs");
  //       }
  //       break;

  //     default:
  //       // Syncing with Firestore... overlay remains up
  //       break;
  //   }
  // }, [user, status, isLoading, segments, isLayoutReady]);

  // 🛡️ UI OVERLAY: Blocks interaction while the "Gate" is deciding

  const showOverlay = !isLayoutReady || isLoading || (user && !status);

  if (!showOverlay) return null;

  return (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={styles.loadingText}>Synchronizing iREPS Registry...</Text>
      <Text style={styles.subLoadingText}>Verifying Garrison Credentials</Text>
    </View>
  );
});

// const AuthGate = memo(function AuthGate() {
//   // console.log(`AuthGate --mounting`);
//   const { user: reduxUser, status, isLoading: reduxLoading, isADM } = useAuth();
//   // console.log(`AuthGate --status`, status);
//   // console.log(`AuthGate --isADM`, isADM);

//   const segments = useSegments();
//   const router = useRouter();

//   const user = reduxUser || auth.currentUser;
//   const isLoading = reduxLoading && !user;

//   const [isLayoutReady, setIsLayoutReady] = useState(false);

//   useEffect(() => {
//     setIsLayoutReady(true);
//   }, []);

//   useEffect(() => {
//     // console.log(`AuthGate --useEffect ---onboarding`);

//     if (!isLayoutReady || isLoading) return;

//     const rootSegment = segments[0];
//     const isAtWelcome = segments.length === 0;
//     const inAuthGroup = rootSegment === "(auth)";
//     const inOnboardingGroup = rootSegment === "onboarding";

//     if (!user) {
//       if (!inAuthGroup && !isAtWelcome) {
//         router.replace("/signin");
//       }
//       return;
//     }

//     switch (status) {
//       case "AWAITING_INITIAL_SIGNUP":
//         if (isADM) {
//           // 🛡️ ADM TACTICAL STRIKE: Specialized Conformation
//           if (rootSegment !== "onboarding" || segments[1] !== "conform-admin") {
//             router.replace("/onboarding/confirm-admin");
//           }
//         } else {
//           // 📋 STANDARD MISSION: MNG/SPV/FWR Profile Completion
//           if (
//             rootSegment !== "onboarding" ||
//             segments[1] !== "complete-invited-profile"
//           ) {
//             router.replace("/onboarding/complete-invited-profile");
//           }
//         }
//         break;

//       case "COMPLETED":
//         if (inAuthGroup || inOnboardingGroup || isAtWelcome) {
//           router.replace("/(tabs)/erfs");
//         }
//         break;

//       default:
//         // Syncing...
//         break;
//     }

//     // console.log(`AuthGate --useEffect ---going to switch stmt`);
//     // switch (status) {
//     //   case "AWAITING_INITIAL_SIGNUP":
//     //     if (
//     //       rootSegment !== "onboarding" ||
//     //       segments[1] !== "complete-invited-profile"
//     //     ) {
//     //       // console.log(`AuthGate --/onboarding/AWAITING_INITIAL_SIGNUP`);
//     //       router.replace("/onboarding/complete-invited-profile");
//     //     }
//     //     break;

//     //   case "COMPLETED":
//     //     if (inAuthGroup || inOnboardingGroup || isAtWelcome) {
//     //       // console.log(`AuthGate --/onboarding/COMPLETED`);
//     //       router.replace("/(tabs)/erfs");
//     //     }
//     //     break;

//     //   default:
//     //     // console.log("AuthGate ---- Syncing profile data...");
//     //     break;
//     // }
//   }, [user, status, isLoading, segments, isLayoutReady]);

//   // 🛡️ THE UI FIX: If we are loading or redirecting, show the overlay
//   // If the user is logged in but status is still pending, we keep the overlay up
//   const showOverlay = !isLayoutReady || isLoading || (user && !status);

//   if (!showOverlay) return null;

//   return (
//     <View style={styles.loadingOverlay}>
//       <ActivityIndicator size="large" color="#2563eb" />
//       <Text style={styles.loadingText}>Synchronizing iREPS Registry...</Text>
//     </View>
//   );
// });

export default function RootLayout() {
  return (
    <Provider store={store}>
      <GeoProvider>
        <WarehouseProvider>
          <MapProvider>
            <PaperProvider>
              <SafeAreaProvider>
                {/* 1. Bootstrap the Firebase Listeners */}
                <AuthBootstrap />

                {/* 2. Place the Guard below the listeners */}
                <AuthGate />

                {/* 3. Render the Screens */}
                <Slot />
              </SafeAreaProvider>
            </PaperProvider>
          </MapProvider>
        </WarehouseProvider>
      </GeoProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    // 🎯 Use absoluteFill to cover the Signin screen completely
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000, // Ensure it sits above everything
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "600",
  },

  // ... styles ...
  // const styles = StyleSheet.create({
  //   loadingOverlay: {
  //     ...StyleSheet.absoluteFillObject,
  //     backgroundColor: "white",
  //     justifyContent: "center",
  //     alignItems: "center",
  //     zIndex: 2000,
  //   },
  //   loadingText: {
  //     marginTop: 15,
  //     fontSize: 16,
  //     color: "#1e293b",
  //     fontWeight: "900",
  //   },
  //   subLoadingText: {
  //     marginTop: 5,
  //     fontSize: 12,
  //     color: "#64748b",
  //     fontWeight: "500",
  //   },
  // });
});
