import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Surface, Text } from "react-native-paper";

const getStatusColor = (status) => {
  if (status === "PENDING") return "#f59e0b";
  if (status === "SYNCING") return "#2563eb";
  if (status === "SUCCESS") return "#16a34a";
  if (status === "FAILED") return "#dc2626";
  return "#64748b";
};

export default function QueueItemCard({ item, busy = false, onRemove }) {
  const statusColor = getStatusColor(item?.status);

  return (
    <Surface style={styles.card} elevation={1}>
      {/* TOP ROW */}
      <View style={styles.topRow}>
        <View style={styles.leftBlock}>
          <Text style={styles.title}>{item?.formType || "NAv"}</Text>
          <Text style={styles.queueId} numberOfLines={1}>
            {item?.id || "NAv"}
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{item?.status || "NAv"}</Text>
        </View>
      </View>

      {/* MIDDLE ROW */}
      <View style={styles.infoGrid}>
        <View style={styles.infoCell}>
          <Text style={styles.label}>Meter</Text>
          <Text style={styles.value} numberOfLines={1}>
            {item?.context?.meterNo || "NAv"}
          </Text>
        </View>

        <View style={styles.infoCell}>
          <Text style={styles.label}>Type</Text>
          <Text style={styles.value} numberOfLines={1}>
            {item?.context?.meterType || "NAv"}
          </Text>
        </View>

        <View style={styles.infoCell}>
          <Text style={styles.label}>ERF</Text>
          <Text style={styles.value} numberOfLines={1}>
            {item?.context?.erfNo || "NAv"}
          </Text>
        </View>

        <View style={styles.infoCell}>
          <Text style={styles.label}>Attempts</Text>
          <Text style={styles.value}>{item?.sync?.attempts ?? 0}</Text>
        </View>
      </View>

      {/* BOTTOM ROW */}
      <View style={styles.bottomRow}>
        <View style={styles.resultBlock}>
          <Text style={styles.resultCode} numberOfLines={1}>
            {item?.result?.code || "NAv"}
          </Text>
          <Text style={styles.resultMessage} numberOfLines={2}>
            {item?.result?.message || "NAv"}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.removeBtn, { opacity: busy ? 0.6 : 1 }]}
          onPress={() => onRemove?.(item?.id)}
          disabled={busy}
        >
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={16}
            color="#fff"
          />
          <Text style={styles.removeBtnText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 10,
  },
  leftBlock: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 4,
  },
  queueId: {
    fontSize: 11,
    color: "#64748b",
  },

  statusBadge: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
  },

  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
    columnGap: 12,
    marginBottom: 12,
  },
  infoCell: {
    width: "47%",
  },
  label: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  value: {
    fontSize: 13,
    color: "#0f172a",
    fontWeight: "700",
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  resultBlock: {
    flex: 1,
  },
  resultCode: {
    fontSize: 11,
    fontWeight: "900",
    color: "#334155",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  resultMessage: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 16,
  },

  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#dc2626",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  removeBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
});
