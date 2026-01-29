import { Stack } from "expo-router";

export default function PremisesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#ffecec" },
        headerTitleStyle: { fontWeight: "800", color: "#2569d6" },
        headerTintColor: "#007AFF",
        headerShown: true, // 🎯 Enable it globally for this sub-stack
      }}
    >
      {/* 1. The List View - We hide it HERE because the Tab Bar usually has its own header */}
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />

      {/* 2. The Meter Discovery Form */}
      <Stack.Screen
        name="form"
        options={{
          title: "",
          presentation: "modal",
          headerShown: true,
        }}
      />

      {/* 3. Premise Details */}
      <Stack.Screen
        name="[id]"
        options={{
          title: "Premise Details",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
