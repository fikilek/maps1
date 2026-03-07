import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable } from "react-native";

export default function DashboardBtn({ onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        // height: 46,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: pressed ? "#EEF2FF" : "#F9FAFB",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
      })}
    >
      <MaterialCommunityIcons name="chart-line" size={28} color="#111827" />
    </Pressable>
  );
}
//
