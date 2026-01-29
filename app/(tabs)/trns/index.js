import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { format } from "date-fns";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

// 🎯 Direct Hook Imports
import { useGeo } from "../../../src/context/GeoContext";
import { useGetTrnsByLmPcodeQuery } from "../../../src/redux/trnsApi";

const TrnItem = ({ item }) => {
  const isWater = item.meterType === "water";
  const hasAccess = item.accessData?.access?.hasAccess === "yes";
  const trnRef = item.id?.split("_").pop() || "N/A";

  return (
    <View style={styles.card}>
      <View
        style={[
          styles.accentBar,
          { backgroundColor: isWater ? "#3B82F6" : "#EAB308" },
        ]}
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.typeTag}>
            <MaterialCommunityIcons
              name={isWater ? "water" : "lightning-bolt"}
              size={14}
              color={isWater ? "#3B82F6" : "#EAB308"}
            />
            <Text style={styles.typeText}>{item.meterType?.toUpperCase()}</Text>
          </View>
          <Text style={styles.timeText}>
            {item.metadata?.created?.at
              ? format(new Date(item.metadata.created.at), "MMM dd, HH:mm")
              : "--:--"}
          </Text>
        </View>

        <Text style={styles.addressText} numberOfLines={1}>
          {item.accessData?.premise?.address || "Street Address N/A"}
        </Text>

        <View style={styles.footer}>
          <View style={styles.agentInfo}>
            <MaterialCommunityIcons
              name="account-search-outline"
              size={14}
              color="#64748B"
            />
            <Text style={styles.agentName}>
              {item.metadata?.created?.byUser || "Field Agent"}
            </Text>
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
  const { geoState } = useGeo();
  const lmPcode = geoState?.selectedLm?.id;

  // 🏛️ Direct RTK Query - Bypass Warehouse for safety
  const {
    data: trns,
    isLoading,
    isError,
  } = useGetTrnsByLmPcodeQuery({ lmPcode }, { skip: !lmPcode });
  console.log(`TrnsScreen ----trns`, trns);

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
        estimatedItemSize={110}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={() => (
          <View style={styles.center}>
            <Text style={styles.subtitle}>
              No transactions found for this area.
            </Text>
          </View>
        )}
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
  listHeader: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "900", color: "#1E293B" },
  subtitle: { fontSize: 14, color: "#64748B", fontWeight: "500" },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
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
    fontFamily: "monospace",
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: 9, fontWeight: "900" },
});
