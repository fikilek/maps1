import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ReportsHeader({
  total,
  activeTab,
  onTabChange,
  onOpenFilters,
  onDownloadCsv,
  onEmailCsv,
  showStats = true,
  showExports = true,
  showFilters = true,
  setShowSyncData,
  isSyncRunning,
  syncData = false,
}) {
  return (
    <View style={styles.header}>
      {/* LEFT */}
      <View style={styles.left}>
        <View style={styles.badge}>
          <Text style={styles.totalText}>{total}</Text>
        </View>

        <View style={{ marginRight: 5 }}>
          {syncData && (
            <AntDesign
              name="file-sync"
              size={20}
              color={isSyncRunning ? "#16a34a" : "#2563eb"}
              onPress={() => setShowSyncData(true)}
            />
          )}
        </View>

        <TouchableOpacity onPress={() => onTabChange?.("LIST")}>
          <MaterialCommunityIcons
            name="format-list-bulleted"
            size={24}
            color={activeTab === "LIST" ? "#2563eb" : "#64748b"}
          />
        </TouchableOpacity>

        {showStats && (
          <TouchableOpacity onPress={() => onTabChange?.("STATS")}>
            <MaterialCommunityIcons
              name="chart-bar"
              size={24}
              color={activeTab === "STATS" ? "#2563eb" : "#64748b"}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* CENTER */}
      <View style={styles.center}>
        {showExports && (
          <>
            <TouchableOpacity style={styles.iconBtn} onPress={onDownloadCsv}>
              <MaterialCommunityIcons
                name="download"
                size={20}
                color="#1e293b"
              />
              <Text style={styles.btnText}>CSV</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn} onPress={onEmailCsv}>
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color="#1e293b"
              />
              <Text style={styles.btnText}>Email</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* RIGHT */}
      <View style={styles.right}>
        {showFilters && (
          <TouchableOpacity onPress={onOpenFilters}>
            <MaterialCommunityIcons
              name="filter-variant"
              size={24}
              color="#2563eb"
            />
          </TouchableOpacity>
        )}
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

  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  center: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },

  right: {
    flex: 1,
    alignItems: "flex-end",
  },

  badge: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 12,
  },

  totalText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
  },

  iconBtn: {
    alignItems: "center",
    marginHorizontal: 8,
  },

  btnText: {
    fontSize: 8,
    fontWeight: "800",
    marginTop: 2,
  },
});
