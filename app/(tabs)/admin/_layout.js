import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Admin" }} />
      <Stack.Screen
        name="service-providers/index"
        options={{ title: "Service Providers" }}
      />
      <Stack.Screen
        name="service-providers/create"
        options={{ title: "Create Service Provider" }}
      />
      <Stack.Screen
        name="service-providers/[spId]"
        options={{ title: "Service Provider" }}
      />
    </Stack>
  );
}
