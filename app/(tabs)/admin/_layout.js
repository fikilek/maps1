// /app/(tabs)/admin/_layout.js
import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "Admin", headerShown: true }}
      />
      <Stack.Screen
        name="reports/index"
        options={{ title: "Management Reports" }}
      />
      <Stack.Screen
        name="reports/lm-premise-report"
        options={{ title: "LM Premise Report" }}
      />
      <Stack.Screen
        name="service-providers"
        options={{ title: "Service Providers", headerShown: false }}
      />

      <Stack.Screen
        name="reports/workbases"
        options={{ title: "Workbases (LM) Stats" }}
      />
      <Stack.Screen
        name="reports/prepaid-revenue-report"
        options={{ title: "Revenue Audit (WIP)" }}
      />
      <Stack.Screen
        name="users"
        options={{ title: "Users", headerShown: true }}
      />
      <Stack.Screen
        name="user"
        options={{ title: "User", headerShown: true }}
        screenOptions={{
          headerShown: true, // Parent AppHeader handles the top bar
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="pendingUsers"
        options={{ title: "Pending Users", headerShown: true }}
      />
    </Stack>
  );
}
