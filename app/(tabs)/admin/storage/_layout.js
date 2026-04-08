import { Stack } from "expo-router";

export default function StorageLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="forms-submission-queue" />
      <Stack.Screen name="ward-erfs-sync" />
    </Stack>
  );
}
