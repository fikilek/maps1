import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { format, isValid } from "date-fns";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useRouter } from "expo-router";
import { useWarehouse } from "../../../src/context/WarehouseContext";

const TrnItem = ({ item }) => {
  const router = useRouter();

  const isWater = item.meterType === "water";

  const accessVal = item.accessData?.access?.hasAccess;

  const hasAccess =
    accessVal === true || accessVal === "yes" || accessVal === "true";

  const isNoAccess = !hasAccess;

  const iconName = isNoAccess
    ? "shield-alert-outline"
    : isWater
      ? "water"
      : "lightning-bolt";

  const boundaryColor = !hasAccess
    ? "#EF4444"
    : isWater
      ? "#3B82F6"
      : "#EAB308";

  const trnRef = item.id?.split("_").pop() || "N/A";

  const agentDisplayName =
    item.accessData?.metadata?.created?.byUser || "Field Agent";

  const meterNo = hasAccess
    ? item.ast?.astData?.astNo || "NO METER"
    : "NO METER NUMBER";

  const dateAt = item.accessData?.metadata?.updated?.at;

  const rawDate = dateAt?.__time__ || dateAt;

  const parsedDate = rawDate ? new Date(rawDate) : null;

  const timeLabel =
    parsedDate && isValid(parsedDate) ? format(parsedDate, "HH:mm") : "--:--";

  const dateLabel =
    parsedDate && isValid(parsedDate) ? format(parsedDate, "MMM dd") : "";

  const wardPcode = item.accessData?.parents?.wardPcode || "";

  const wardNo = wardPcode ? wardPcode.slice(-3).replace(/^0+/, "") : "?";

  return (
    <View
      style={[
        styles.card,
        { borderRightWidth: 6, borderRightColor: boundaryColor },
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.header, { alignItems: "center" }]}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              flex: 1,
            }}
          >
            <View
              style={[
                styles.typeTag,
                { backgroundColor: `${boundaryColor}10` },
              ]}
            >
              <MaterialCommunityIcons
                name={iconName}
                size={22}
                color={boundaryColor}
              />
            </View>

            <View style={styles.meterNumberContainer}>
              <Text style={styles.meterNumberText} numberOfLines={1}>
                {meterNo}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.timeText}>{timeLabel}</Text>
              <Text
                style={{ fontSize: 9, color: "#94A3B8", fontWeight: "800" }}
              >
                {dateLabel}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push(`/(tabs)/trns/${item.id}`)}
            >
              <MaterialCommunityIcons
                name="file-document-edit-outline"
                size={26}
                color="#2563eb"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: 5,
            justifyContent: "space-between",
          }}
        >
          {/* colLeft - Adr and prop type */}
          <View>
            <Text
              style={[styles.addressText, { marginTop: 8 }]}
              numberOfLines={1}
            >
              {item.accessData?.premise?.address || "Street Address N/A"}
            </Text>
            <Text
              style={[styles.propertyTypeText, { marginTop: 4 }]}
              numberOfLines={1}
            >
              {item.accessData?.premise?.propertyType || "Property Type N/A"}
            </Text>
          </View>
          {/* colRight - WardNo and erfNo   */}
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 12, color: "#a3b5ce", marginTop: 8 }}>
              Ward No: {wardNo || "No Ward number"}
            </Text>
            <Text style={{ fontSize: 12, color: "#a3b5ce", marginTop: 4 }}>
              Erf No: {item.accessData?.erfNo || "No ErfNo"}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.agentInfo}>
            <MaterialCommunityIcons
              name="account-search-outline"
              size={14}
              color="#64748B"
            />
            <Text style={styles.agentName}>{agentDisplayName}</Text>
            <Text style={styles.idBadge}>#{trnRef}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: hasAccess ? "#DCFCE7" : "#FEE2E2" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: hasAccess ? "#166534" : "#991B1B" },
              ]}
            >
              {hasAccess ? "SUCCESS" : "NO ACCESS"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default function TrnsScreen() {
  const { all, sync } = useWarehouse();

  const trns = all?.trns || [];
  const trnsSync = sync?.trns || {};
  const scopeSync = sync?.scope || {};

  const isLoading = trnsSync?.status === "syncing";
  const noWard = scopeSync?.status === "awaiting-ward";

  if (noWard) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loadingText}>
          Select a ward to view field transactions.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Syncing Audit Logs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={trns}
        renderItem={({ item }) => <TrnItem item={item} />}
        keyExtractor={(item) => item?.id}
        estimatedItemSize={120}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={[styles.center, { paddingTop: 40 }]}>
            <Text style={styles.loadingText}>
              No transactions in this ward.
            </Text>
          </View>
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: { marginTop: 10, color: "#64748B", fontWeight: "600" },
  subtitle: { fontSize: 14, color: "#64748B", fontWeight: "500", marginTop: 8 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    overflow: "hidden",
  },
  accentBar: { width: 5 },
  content: { flex: 1, padding: 12 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  typeTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "900",
    marginLeft: 4,
    color: "#475569",
  },
  timeText: { fontSize: 11, color: "#94A3B8", fontWeight: "800" },
  addressText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#334155",
  },
  propertyTypeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#8d99ab",
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
  },
  agentInfo: { flexDirection: "row", alignItems: "center", gap: 6 },
  agentName: { fontSize: 12, color: "#64748B", fontWeight: "600" },
  idBadge: {
    fontSize: 10,
    color: "#94A3B8",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: 9, fontWeight: "900" },

  meterNumberContainer: {
    backgroundColor: "#F1F5F9", // Subtle grey background
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  meterNumberText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A", // Darker navy for contrast
    letterSpacing: 0.5,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", // 🎯 Technical look
  },
});
