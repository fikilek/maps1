import { Stack } from "expo-router";

export default function UsersLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Users",
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="create-admin"
        options={{
          title: "Create Admin User",
          presentation: "card",
        }}
      />
    </Stack>
  );
}
