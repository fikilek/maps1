// /app/(tabs)/admin/reports/components/UserTrnsReportHeader.js
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Surface } from "react-native-paper";

export default function UserTrnsReportHeader({
  totalUsers,
  activeView,
  onToggleView,
  onShowGraphs,
  onDownload,
  onOpenDateFilter,
  selectedDateLabel = "ALL TIME",
}) {
  return (
    <Surface style={styles.headerContainer} elevation={2}>
      {/* COL 1: TOTAL USERS */}
      <View style={styles.statBlock}>
        <Text style={styles.statLabel}>TOTAL USERS</Text>
        <Text style={styles.statValue}>{totalUsers}</Text>
      </View>

      <View style={styles.actionRow}>
        {/* COL 2: TABLE/LIST TOGGLE */}
        <TouchableOpacity style={styles.iconBtn} onPress={onToggleView}>
          <MaterialCommunityIcons
            name={activeView === "table" ? "view-list" : "table-large"}
            size={24}
            color="#2563eb"
          />
        </TouchableOpacity>

        {/* COL 3: GRAPHS */}
        <TouchableOpacity style={styles.iconBtn} onPress={onShowGraphs}>
          <MaterialCommunityIcons
            name="chart-box-outline"
            size={24}
            color="#2563eb"
          />
        </TouchableOpacity>

        {/* COL 4: DOWNLOAD */}
        <TouchableOpacity style={styles.iconBtn} onPress={onDownload}>
          <MaterialCommunityIcons
            name="cloud-download-outline"
            size={24}
            color="#16a34a"
          />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* COL 5: DATE FILTER */}
        <TouchableOpacity style={styles.dateFilter} onPress={onOpenDateFilter}>
          <View style={styles.dateInfo}>
            <Text style={styles.dateLabel}>FILTERED BY</Text>
            <Text style={styles.dateValue}>{selectedDateLabel}</Text>
          </View>
          <MaterialCommunityIcons
            name="calendar-month"
            size={20}
            color="#64748b"
          />
        </TouchableOpacity>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    padding: 15,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  statBlock: {
    borderLeftWidth: 4,
    borderLeftColor: "#2563eb",
    paddingLeft: 10,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: "#64748b",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1e293b",
    lineHeight: 24,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 4,
  },
  dateFilter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  dateInfo: {
    marginRight: 8,
  },
  dateLabel: {
    fontSize: 7,
    fontWeight: "800",
    color: "#94a3b8",
  },
  dateValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#475569",
  },
});
