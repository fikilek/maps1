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
        name="operations"
        options={{ title: "Operations", headerShown: true }}
      />
      <Stack.Screen
        name="pendingUsers"
        options={{ title: "Pending Users", headerShown: true }}
      />
      <Stack.Screen
        name="reports"
        options={{ title: "Reports", headerShown: true }}
      />
      <Stack.Screen
        name="service-providers"
        options={{ title: "Service Providers", headerShown: false }}
      />
      <Stack.Screen
        name="settings"
        options={{ title: "Settings", headerShown: false }}
      />
      <Stack.Screen
        name="user"
        options={{ title: "User", headerShown: true }}
        screenOptions={{
          headerShown: true,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="users"
        options={{ title: "Users", headerShown: true }}
      />

      {/* <Stack.Screen
        name="reports/index"
        options={{ title: "Management Reports" }}
      /> */}
      {/* <Stack.Screen
        name="reports/lm-premise-report"
        options={{ title: "LM Premise Report" }}
      /> */}
      {/* <Stack.Screen
        name="reports/workbase-registry"
        options={{ title: "Workbases (LM) Stats" }}
      /> */}
      {/* <Stack.Screen
        name="reports/prepaid-revenue-report"
        options={{ title: "Revenue Report" }}
      /> */}

      {/* <Stack.Screen
        name="reports/prepaid-revenue-dashboard"
        options={{ title: "Revenue Dashboard" }}
      /> */}
      {/* <Stack.Screen
        name="reports/normalisation-report"
        options={{ title: "Normalisation Report", headerShown: true }}
      /> */}
      {/* <Stack.Screen
        name="reports/anomaly-report"
        options={{ title: "Anomaly Report", headerShown: true }}
      /> */}
    </Stack>
  );
}
