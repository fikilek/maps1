// /components/SyncDataCard.js

import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SyncDataCard({
  visible = false,
  status = "NAv",
  lastSyncLabel = "Last sync: NAv",
  activeLmPcode = "NAv",
  isSyncBusy = false,
  isStartingSync = false,
  jobError = "",
  rowsError = "",
  onSyncPress,
  onClose,
}) {
  if (!visible) return null;

  return (
    <View style={styles.statusCard}>
      <View style={styles.actions}>
        <View
          style={{ backgroundColor: "#e2e8f0", padding: 4, borderRadius: 4 }}
        >
          <AntDesign name="close" size={24} color="black" onPress={onClose} />
        </View>

        <View
          style={{ backgroundColor: "#e2e8f0", padding: 4, borderRadius: 4 }}
        >
          <TouchableOpacity
            onPress={onSyncPress}
            disabled={isSyncBusy}
            style={isSyncBusy ? styles.syncBtnDisabled : null}
          >
            <MaterialCommunityIcons
              name={isSyncBusy ? "progress-clock" : "sync"}
              size={24}
              color={isSyncBusy ? "#94a3b8" : "#2563eb"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text style={styles.statusValue}>{status || "NAv"}</Text>
        </View>

        <Text style={styles.statusText}>{lastSyncLabel}</Text>

        <Text style={styles.statusText}>
          Active LM: {activeLmPcode || "NAv"}
        </Text>

        {isSyncBusy && (
          <View style={styles.spinnerRow}>
            <ActivityIndicator size="small" />
            <Text style={styles.spinnerText}>
              {isStartingSync
                ? "Sync request received. Please wait..."
                : "Backend sync running."}
            </Text>
          </View>
        )}

        {jobError ? <Text style={styles.errorText}>{jobError}</Text> : null}
        {rowsError ? <Text style={styles.errorText}>{rowsError}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statusCard: {
    // marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    // justifyContent: "space-between",
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },

  statusLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0f172a",
    marginRight: 6,
  },

  statusValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563eb",
  },

  statusText: {
    fontSize: 12,
    color: "#475569",
    marginTop: 2,
  },

  spinnerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  spinnerText: {
    marginLeft: 8,
    fontSize: 12,
    color: "#334155",
  },

  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: "#dc2626",
    fontWeight: "700",
  },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    // alignItems: "center",
    marginBottom: 8,
  },

  syncBtnDisabled: {
    opacity: 0.55,
  },
});
