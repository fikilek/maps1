import { Stack } from "expo-router";

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#fff",
        },
        headerTintColor: "#333",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        // This ensures the header is visible but clean
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "Dropdown Management",
          // Optional: Add a close button if you want to jump back to Admin
          headerBackTitle: "Admin",
        }}
      />
    </Stack>
  );
}
