import { Stack } from "expo-router";

export default function UserLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true, // Parent AppHeader handles the top bar
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="user-stats" />
      <Stack.Screen name="user-settings" />
    </Stack>
  );
}
