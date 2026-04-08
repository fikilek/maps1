import { Stack } from "expo-router";

export default function AstReportLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#F8FAFC" },
        headerTitleStyle: {
          fontWeight: "900",
          color: "#0F172A",
        },
        headerShadowVisible: true,
        headerTitleAlign: "center",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Meter Reports",
        }}
      />

      <Stack.Screen
        name="timeline"
        options={{
          title: "Timeline",
        }}
      />

      <Stack.Screen
        name="calendar"
        options={{
          title: "Calendar",
        }}
      />

      <Stack.Screen
        name="monthly-revenue"
        options={{
          title: "Monthly Revenue",
        }}
      />

      <Stack.Screen
        name="stats"
        options={{
          title: "Stats",
        }}
      />

      <Stack.Screen
        name="inspect-prep"
        options={{
          title: "Inspection Handoff",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
