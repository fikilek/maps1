import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Surface } from "react-native-paper";

export default function UserTrnsReportHeader({
  totalValue,
  type = "USERS",
  activeView,
  onChangeView, // ✅ new API
  onToggleView, // ✅ legacy API
  onShowGraphs, // ✅ legacy API
  onDownload,
  onOpenDateFilter,
  selectedDateLabel = "ALL TIME",
}) {
  const isSegmentedMode = typeof onChangeView === "function";
  const normalizedView = String(activeView || "").toUpperCase();

  return (
    <Surface style={styles.headerContainer} elevation={2}>
      {/* ROW 1 : TOTAL + TOOLS */}
      <View style={styles.topRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>TOTAL {type}</Text>
          <Text style={styles.statValue}>{totalValue}</Text>
        </View>

        <View style={styles.actionRow}>
          {/* LEGACY VIEW BUTTONS */}
          {!isSegmentedMode ? (
            <>
              <TouchableOpacity style={styles.iconBtn} onPress={onToggleView}>
                <MaterialCommunityIcons
                  name={activeView === "table" ? "view-list" : "table-large"}
                  size={24}
                  color="#2563eb"
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconBtn} onPress={onShowGraphs}>
                <MaterialCommunityIcons
                  name="chart-box-outline"
                  size={24}
                  color="#2563eb"
                />
              </TouchableOpacity>
            </>
          ) : null}

          {/* DOWNLOAD */}
          <TouchableOpacity style={styles.iconBtn} onPress={onDownload}>
            <MaterialCommunityIcons
              name="cloud-download-outline"
              size={24}
              color="#16a34a"
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* DATE FILTER */}
          <TouchableOpacity
            style={styles.dateFilter}
            onPress={onOpenDateFilter}
          >
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
      </View>

      {/* ROW 2 : NEW SEGMENTED VIEWS */}
      {isSegmentedMode ? (
        <View style={styles.segmentWrap}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              normalizedView === "DAILY" && styles.segmentBtnActive,
            ]}
            onPress={() => onChangeView("DAILY")}
          >
            <Text
              style={[
                styles.segmentText,
                normalizedView === "DAILY" && styles.segmentTextActive,
              ]}
            >
              DAILY
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              normalizedView === "SUMMARY" && styles.segmentBtnActive,
            ]}
            onPress={() => onChangeView("SUMMARY")}
          >
            <Text
              style={[
                styles.segmentText,
                normalizedView === "SUMMARY" && styles.segmentTextActive,
              ]}
            >
              SUMMARY
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              normalizedView === "GRAPHS" && styles.segmentBtnActive,
            ]}
            onPress={() => onChangeView("GRAPHS")}
          >
            <Text
              style={[
                styles.segmentText,
                normalizedView === "GRAPHS" && styles.segmentTextActive,
              ]}
            >
              GRAPHS
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </Surface>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  statBlock: {
    borderLeftWidth: 4,
    borderLeftColor: "#2563eb",
    paddingLeft: 10,
    flexShrink: 1,
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
    gap: 10,
    marginLeft: 12,
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
    marginHorizontal: 2,
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
    maxWidth: 150,
  },

  dateInfo: {
    marginRight: 8,
    flexShrink: 1,
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

  segmentWrap: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderRadius: 12,
    marginTop: 12,
    overflow: "hidden",
  },

  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  segmentBtnActive: {
    backgroundColor: "#0f172a",
  },

  segmentText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#475569",
    letterSpacing: 0.5,
  },

  segmentTextActive: {
    color: "#ffffff",
  },
});
