// app/onboarding/waiting-workbase.js
import { ActivityIndicator, Text, View } from "react-native";

export default function WaitingWorkbase() {
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
        Final setup in progress
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
        You’ve been successfully assigned to a service provider.
        {"\n\n"}
        The next step is assigning you to one or more workbases.
        {"\n\n"}
        Once this is done, you’ll be taken to the next step automatically.
      </Text>
    </View>
  );
}
