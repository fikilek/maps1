// app/(tabs)/maps/_layout.js
import { Stack } from "expo-router";

export default function MapsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
