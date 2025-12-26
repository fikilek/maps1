// app/onboarding/select-workbase.js
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSelector } from "react-redux";

import { authApi } from "../../src/redux/authApi";

export default function SelectWorkbase() {
  const router = useRouter();
  const [selected, setSelected] = useState(null);

  const authState = useSelector(authApi.endpoints.getAuthState.select())?.data;

  const workbases = authState?.profile?.access?.workbases ?? [];
  const uid = authState?.auth?.uid;

  const [selectActiveWorkbase, { isLoading }] =
    authApi.useSetActiveWorkbaseMutation();

  const handleContinue = async () => {
    if (!selected) return;

    await selectActiveWorkbase({
      uid,
      workbase: selected,
    });

    // guard will redirect automatically
  };

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>
        Select your active workbase
      </Text>

      <Text
        style={{
          fontSize: 14,
          color: "#666",
          marginVertical: 12,
          lineHeight: 20,
        }}
      >
        You’ve been assigned to multiple workbases.
        {"\n\n"}
        Please choose the one you’ll be working from today.
        {"\n"}
        You can change this later.
      </Text>

      <View style={{ marginTop: 16 }}>
        {workbases.map((wb) => {
          const isSelected = selected === wb.id;

          return (
            <Pressable
              key={wb.id}
              onPress={() => setSelected(wb)}
              style={{
                padding: 16,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isSelected ? "#000" : "#ddd",
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "500" }}>{wb.name}</Text>

              {wb.location && (
                <Text style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                  {wb.location}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: "auto" }}>
        <Pressable
          disabled={!selected || isLoading}
          onPress={handleContinue}
          style={{
            backgroundColor: !selected ? "#ccc" : "#000",
            padding: 16,
            borderRadius: 8,
            alignItems: "center",
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: "white", fontWeight: "600" }}>Continue</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
