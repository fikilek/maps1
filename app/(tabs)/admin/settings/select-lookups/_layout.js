import { Stack } from "expo-router";

export default function SelectLookupsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleStyle: {
          fontWeight: "800",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Select Lookups",
        }}
      />

      <Stack.Screen
        name="create"
        options={{
          title: "Create Lookup",
        }}
      />

      <Stack.Screen
        name="[lookupKey]"
        options={{
          title: "Lookup Detail",
        }}
      />

      <Stack.Screen
        name="option"
        options={{
          title: "Lookup Option",
        }}
      />
    </Stack>
  );
}
