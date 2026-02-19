import { Stack } from "expo-router";

export default function OperationsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: "slide_from_bottom",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Operations Center" }} />
      <Stack.Screen name="teams" options={{ title: "Operational Teams" }} />
      <Stack.Screen name="geo-fences" options={{ title: "Geo-Fencing" }} />
      <Stack.Screen name="workorders" options={{ title: "Workorders" }} />
      <Stack.Screen
        name="field-analytics"
        options={{ title: "Field Analytics" }}
      />
      {/* 🛡️ THE QA GATEWAY */}
      <Stack.Screen
        name="quality-assurance"
        options={{ title: "Quality Assurance" }}
      />
    </Stack>
  );
}
