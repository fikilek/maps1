// /app/(tabs)/admin/service-providers/_layout.js
import { Stack } from "expo-router";

export default function SpInternalLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="createSp" options={{ title: "Mobilize SP" }} />
      <Stack.Screen name="[id]" options={{ title: "Refine Registry" }} />
    </Stack>
  );
}
