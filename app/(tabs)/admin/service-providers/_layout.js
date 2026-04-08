// /app/(tabs)/admin/service-providers/_layout.js
import { Stack } from "expo-router";

export default function SpInternalLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="formCreateSp"
        options={{ title: "Create Service Provider" }}
      />
      <Stack.Screen name="[id]" options={{ title: "Refine Registry" }} />
    </Stack>
  );
}
