import { Stack, useRouter } from "expo-router";
import { Text, TouchableOpacity } from "react-native";

export default function PremisesLayout() {
  const router = useRouter();
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
          title: "Meter Discovery",
          presentation: "modal",
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity
              style={{ margin: 5 }}
              onPress={() => router.back()}
            >
              <Text
                style={{ color: "#DC3545", marginLeft: 10, fontWeight: "600" }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          ),
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
