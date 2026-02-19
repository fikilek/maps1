import { Stack } from "expo-router";

export default function PendingUsersLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          // headerTitle: "Authorization Hub",
          headerStyle: { backgroundColor: "#f8fafc" },
          headerTitleStyle: { fontWeight: "900", color: "#1e293b" },
          headerShadowVisible: true,
          headerShown: true,
        }}
      />
    </Stack>
  );
}
