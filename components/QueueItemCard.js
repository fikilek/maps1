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

const formatDateTime = (value) => {
  if (!value || value === "NAv") return "NAv";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "NAv";

  const pad = (num) => String(num).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function QueueItemCard({
  item,
  busy = false,
  onRemove,
  onEdit,
  onOpenMap,
}) {
  console.log(`QueueItemCard --item`, item);
  const statusColor = getStatusColor(item?.status);

  const premiseId = item?.context?.premiseId || "NAv";
  const canEdit = item?.status === "PENDING" || item?.status === "FAILED";

  const premiseAddress =
    item?.payload?.accessData?.premise?.address ||
    item?.payload?.accessData?.premise?.premiseAddress ||
    item?.payload?.accessData?.premise?.location?.address ||
    "NAv";

  const updatedAtText = formatDateTime(
    item?.metadata?.updatedAt || item?.metadata?.createdAt || "NAv",
  );

  const displayResult = (() => {
    if (item?.status === "PENDING") {
      return {
        code: "PENDING",
        message: "Draft saved locally. Waiting to sync.",
      };
    }

    if (item?.status === "SYNCING") {
      return {
        code: "SYNCING",
        message: "Submission is currently being synced.",
      };
    }

    if (item?.status === "FAILED") {
      return {
        code: item?.result?.code || "FAILED",
        message: item?.result?.message || "Submission sync failed.",
      };
    }

    if (item?.status === "SUCCESS") {
      return {
        code: item?.result?.code || "SUCCESS",
        message: item?.result?.message || "TRN created successfully.",
      };
    }

    return {
      code: item?.result?.code || "NAv",
      message: item?.result?.message || "NAv",
    };
  })();

  const meterGps = item?.payload?.ast?.location?.gps;
  const canOpenMap =
    typeof meterGps?.lat === "number" && typeof meterGps?.lng === "number";

  return (
    <Surface style={styles.card} elevation={1}>
      {/* TOP ROW */}
      <View style={styles.topRow}>
        <View style={styles.leftBlock}>
          <Text style={styles.title}>{item?.formType || "NAv"}</Text>

          <Text style={styles.queueId} numberOfLines={1}>
            {item?.id || "NAv"}
          </Text>

          <Text style={styles.updatedAt} numberOfLines={1}>
            Updated: {updatedAtText}
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{item?.status || "NAv"}</Text>
        </View>
      </View>

      {/* MIDDLE ROW */}
      <View style={styles.infoGrid}>
        <View style={styles.infoRow}>
          <View style={styles.leftCol}>
            <Text style={styles.label}>Meter</Text>
            <Text style={styles.value} numberOfLines={1}>
              {item?.context?.meterNo || "NAv"}
            </Text>
          </View>

          <View style={styles.rightCol}>
            <Text style={styles.label}>ERF</Text>
            <Text style={styles.value} numberOfLines={1}>
              {item?.context?.erfNo || "NAv"}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <TouchableOpacity
            style={[styles.leftCol, { opacity: canOpenMap ? 1 : 0.6 }]}
            onPress={() => onOpenMap?.(item)}
            disabled={!canOpenMap}
            activeOpacity={0.7}
          >
            <Text style={styles.label}>Premise Address</Text>

            <View style={styles.addressRow}>
              <Text style={styles.addressValue} numberOfLines={3}>
                {premiseAddress}
              </Text>

              {/* <MaterialCommunityIcons
                name="map-marker-radius-outline"
                size={20}
                color={canOpenMap ? "#2563eb" : "#94a3b8"}
              /> */}
            </View>

            {/* <Text style={styles.mapHint} numberOfLines={1}>
              {canOpenMap
                ? "Tap to view draft meter on map"
                : "No GPS available"}
            </Text> */}
          </TouchableOpacity>

          <View style={styles.rightCol}>
            <Text style={styles.label}>Type</Text>
            <Text style={styles.value} numberOfLines={1}>
              {item?.context?.meterType || "NAv"}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.leftCol}>
            <Text style={styles.label}>Premise ID</Text>
            <Text style={styles.value} numberOfLines={1}>
              {premiseId}
            </Text>
          </View>

          <View style={styles.rightCol}>
            <Text style={styles.label}>Attempts</Text>
            <Text style={styles.value}>{item?.sync?.attempts ?? 0}</Text>
          </View>
        </View>
      </View>

      {/* BOTTOM ROW */}
      <View style={styles.bottomRow}>
        <View style={styles.resultBlock}>
          <Text style={styles.resultCode} numberOfLines={1}>
            {displayResult.code}
          </Text>
          <Text style={styles.resultMessage} numberOfLines={2}>
            {displayResult.message}
          </Text>
        </View>

        <View style={styles.actionsRight}>
          <TouchableOpacity
            style={[styles.editBtn, { opacity: busy || !canEdit ? 0.5 : 1 }]}
            onPress={() => onEdit?.(item)}
            disabled={busy || !canEdit}
          >
            <MaterialCommunityIcons
              name="pencil-outline"
              size={16}
              color="#fff"
            />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>

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

  updatedAt: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 4,
    fontWeight: "700",
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
    gap: 10,
    marginBottom: 12,
  },

  infoRow: {
    flexDirection: "row",
    gap: 10,
  },

  leftCol: {
    flex: 7,
    minWidth: 0,
  },

  rightCol: {
    flex: 3,
    minWidth: 0,
    alignItems: "flex-end",
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

  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },

  addressValue: {
    flex: 1,
    fontSize: 13,
    color: "#0f172a",
    fontWeight: "700",
    lineHeight: 18,
  },

  mapHint: {
    marginTop: 4,
    fontSize: 11,
    color: "#2563eb",
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

  actionsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },

  editBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
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
