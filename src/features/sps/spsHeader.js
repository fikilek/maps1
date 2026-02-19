import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export const SpsHeader = ({ title, subtitle, showBack = true, actions }) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showBack && (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={28}
              color="#1e293b"
            />
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.rightSection}>{actions}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50, // Adjustment for status bar
    paddingBottom: 15,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  leftSection: { flexDirection: "row", alignItems: "center" },
  backBtn: { marginRight: 12, marginLeft: -4 },
  title: { fontSize: 20, fontWeight: "900", color: "#0f172a" },
  subtitle: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  rightSection: { flexDirection: "row", gap: 8 },
});
