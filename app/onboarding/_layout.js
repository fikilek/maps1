import { Stack } from "expo-router";
import { IconButton } from "react-native-paper";
import { auth } from "../../src/firebase";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleStyle: {
          fontWeight: "900",
          color: "#1e293b",
        },
        // 🎯 THE FIX: Manually provide an escape route
        headerLeft: () => (
          <IconButton icon="arrow-left" onPress={() => auth.signOut()} />
        ),
      }}
    >
      <Stack.Screen
        name="complete-invited-profile"
        options={{ title: "COMPLETE SIGNUP" }}
      />

      <Stack.Screen
        name="awaiting-mng-confirmation"
        options={{ title: "PENDING APPROVAL" }}
      />

      <Stack.Screen
        name="select-workbase"
        options={{ title: "SELECT JURISDICTION" }}
      />

      <Stack.Screen name="waiting-sp" options={{ title: "AWAITING SP" }} />

      <Stack.Screen
        name="waiting-workbase"
        options={{ title: "AWAITING WORKBASE" }}
      />
    </Stack>
  );
}
