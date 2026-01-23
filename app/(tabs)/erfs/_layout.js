import { Stack, useRouter } from "expo-router";
import { Text, TouchableOpacity } from "react-native";

export default function ErfsLayout() {
  const router = useRouter();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 1. The List of all Erfs */}
      <Stack.Screen name="index" />

      {/* 2. The Detail view for a specific Erf (formerly in premises) */}
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: true,
          title: "ERF Details",
        }}
      />
      <Stack.Screen
        name="form"
        options={{
          title: "Capture Premise",
          presentation: "modal",
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Text
                style={{ color: "#DC3545", marginLeft: 10, fontWeight: "600" }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}
