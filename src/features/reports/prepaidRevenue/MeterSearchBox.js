// src/features/reports/prepaidRevenue/MeterSearchBox.js
import { TextInput, View } from "react-native";

export default function MeterSearchBox({
  value,
  onChangeText,
  width = 140,
  placeholder = "Meter…",
}) {
  return (
    <View
      style={{
        width,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#E5E7EB",
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        autoCorrect={false}
        autoCapitalize="none"
        keyboardType="number-pad"
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: "#111827",
          padding: 0,
        }}
        returnKeyType="search"
      />
    </View>
  );
}
