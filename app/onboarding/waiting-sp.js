// app/onboarding/waiting-sp.js
import { ActivityIndicator, Text, View } from "react-native";

export default function WaitingServiceProvider() {
  return (
    <View
      style={{
        flex: 1,
        padding: 24,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator size="large" />

      <Text
        style={{
          fontSize: 18,
          fontWeight: "600",
          marginTop: 24,
          textAlign: "center",
        }}
      >
        Account setup in progress
      </Text>

      <Text
        style={{
          fontSize: 14,
          color: "#666",
          marginTop: 12,
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        Your account was created successfully.
        {"\n\n"}
        Before you can continue, a system administrator needs to assign you to a
        service provider.
        {"\n\n"}
        This usually takes a short while. You’ll be taken to the next step
        automatically once it’s done.
      </Text>
    </View>
  );
}
