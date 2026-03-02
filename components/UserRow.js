// /app/(tabs)/admin/reports/components/UserRow.js
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export default function UserRow({ user }) {
  const spName = user.employment?.serviceProvider?.name || "Independent";
  const role = user.employment?.role || "USER";
  const status = user.onboarding?.status || "PENDING";

  return (
    <View style={styles.row}>
      {/* Profile Column */}
      <View style={{ flex: 2 }}>
        <Text style={styles.name}>
          {user.profile?.displayName || "Anonymous"}
        </Text>
        <Text style={styles.email}>{user.profile?.email}</Text>
      </View>

      {/* Role Column */}
      <View style={{ flex: 0.8 }}>
        <View style={[styles.roleBadge, role === "SPU" && styles.spuBadge]}>
          <Text style={styles.roleText}>{role}</Text>
        </View>
      </View>

      {/* SP Column */}
      <View style={{ flex: 1.5 }}>
        <Text style={styles.spText}>{spName}</Text>
      </View>

      {/* Status Column */}
      <View style={{ flex: 1, alignItems: "flex-end" }}>
        <MaterialCommunityIcons
          name={status === "COMPLETED" ? "check-decagram" : "clock-outline"}
          size={18}
          color={status === "COMPLETED" ? "#059669" : "#f59e0b"}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: "center",
  },
  name: { fontSize: 13, fontWeight: "800", color: "#1e293b" },
  email: { fontSize: 10, color: "#94a3b8" },
  spText: { fontSize: 11, color: "#475569", fontWeight: "600" },
  roleBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  spuBadge: { backgroundColor: "#dcfce7" },
  roleText: { fontSize: 9, fontWeight: "900", color: "#475569" },
});
