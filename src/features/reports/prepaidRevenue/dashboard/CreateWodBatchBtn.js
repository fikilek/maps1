import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";

export default function CreateWodBatchBtn({
  onPress,
  label = "Create WOD Batch",
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        height: 48,
        borderRadius: 14,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        backgroundColor: pressed ? "#111827" : "#1F2937",
      })}
    >
      <MaterialCommunityIcons
        name="clipboard-check-outline"
        size={18}
        color="#fff"
      />
      <Text style={{ color: "#fff", fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}
