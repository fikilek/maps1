// /app/(tabs)/admin/reports/components/LmPremiseReportHeader.js
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function LmPremiseReportHeader({
  total,
  activeTab,
  onTabChange,
}) {
  return (
    <View style={styles.header}>
      {/* 🎯 LEFT: Total & View Toggle */}
      <View style={styles.left}>
        <View style={styles.badge}>
          <Text style={styles.totalText}>{total}</Text>
        </View>
        <TouchableOpacity onPress={() => onTabChange("LIST")}>
          <MaterialCommunityIcons
            name="format-list-bulleted"
            size={24}
            color={activeTab === "LIST" ? "#2563eb" : "#64748b"}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onTabChange("STATS")}>
          <MaterialCommunityIcons
            name="chart-bar"
            size={24}
            color={activeTab === "STATS" ? "#2563eb" : "#64748b"}
          />
        </TouchableOpacity>
      </View>

      {/* 🎯 CENTER: Exports */}
      <View style={styles.center}>
        <TouchableOpacity style={styles.iconBtn}>
          <MaterialCommunityIcons name="download" size={20} color="#1e293b" />
          <Text style={styles.btnText}>CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
          <MaterialCommunityIcons
            name="email-outline"
            size={20}
            color="#1e293b"
          />
          <Text style={styles.btnText}>Email</Text>
        </TouchableOpacity>
      </View>

      {/* 🎯 RIGHT: Filters */}
      <View style={styles.right}>
        <TouchableOpacity>
          <MaterialCommunityIcons
            name="calendar-range"
            size={26}
            color="#2563eb"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  center: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
    justifyContent: "center",
  },
  right: { flex: 1, alignItems: "flex-end" },
  badge: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  totalText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  iconBtn: { alignItems: "center" },
  btnText: { fontSize: 8, fontWeight: "800", marginTop: 2 },
});
