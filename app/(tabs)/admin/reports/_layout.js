// app/(tabs)/admin/reports/_layout.js
import { Stack } from "expo-router";

export default function ReportsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "Reports", headerShown: true }}
      />
      <Stack.Screen
        name="anomaly-report"
        options={{ title: "Anomaly Report", headerShown: true }}
      />
      <Stack.Screen
        name="create-trns-confirm"
        options={{ title: "Create TRNs", headerShown: true }}
      />
      <Stack.Screen
        name="erf-registry"
        options={{ title: "ERF Registry", headerShown: true }}
      />
      <Stack.Screen
        name="meter-registry"
        options={{ title: "Meter Registry", headerShown: true }}
      />
      <Stack.Screen
        name="no-access-report"
        options={{ title: "No Access Report", headerShown: true }}
      />
      <Stack.Screen
        name="normalisation-report"
        options={{ title: "Normalisation Report", headerShown: true }}
      />
      <Stack.Screen
        name="premise-registry"
        options={{ title: "Premise Registry", headerShown: true }}
      />
      <Stack.Screen
        name="prepaid-revenue-dashboard"
        options={{ title: "Prepaid Revenue Dashboard", headerShown: true }}
      />
      <Stack.Screen
        name="prepaid-revenue-report"
        options={{ title: "Prepaid Revenue Report", headerShown: true }}
      />
      <Stack.Screen
        name="service-provider-registry"
        options={{ title: "Service Provider Registry", headerShown: true }}
      />
      <Stack.Screen
        name="user-registry"
        options={{ title: "User Registry", headerShown: true }}
      />
      <Stack.Screen
        name="users-activity-report"
        options={{ title: "Users Activity Report", headerShown: true }}
      />
      <Stack.Screen
        name="ward-registry"
        options={{ title: "Ward Registry", headerShown: true }}
      />
      <Stack.Screen
        name="workbase-registry"
        options={{ title: "Workbase Registry", headerShown: true }}
      />
    </Stack>
  );
}
