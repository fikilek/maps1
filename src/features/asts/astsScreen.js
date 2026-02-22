import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

// 🎯 THE SOVEREIGN IMPORTS
import { useAuth } from "../../../src/hooks/useAuth"; // ⬅️ Added for stability
import { useGetAstsByLmPcodeQuery } from "../../../src/redux/astsApi";
import AstItem from "./astItem";

export default function AstsScreen() {
  // 🛡️ THE FIX: Use activeWorkbase so the list is NEVER blank
  const { activeWorkbase } = useAuth();
  const lmPcode = activeWorkbase?.id;

  const {
    data: asts,
    isLoading,
    isError,
  } = useGetAstsByLmPcodeQuery({ lmPcode }, { skip: !lmPcode });

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Synchronizing Assets...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, styles.center]}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={48}
          color="#EF4444"
        />
        <Text style={styles.errorText}>Registry Link Failure</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={asts}
        renderItem={({ item }) => <AstItem item={item} />}
        estimatedItemSize={120}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={() => (
          <View style={styles.center}>
            <MaterialCommunityIcons
              name="database-off-outline"
              size={48}
              color="#CBD5E1"
            />
            <Text style={styles.subtitle}>
              No assets found in {activeWorkbase?.name || "this area"}.
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "600",
  },
  subtitle: { fontSize: 14, color: "#64748B", marginTop: 8 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },
  iconContainer: { marginRight: 16 },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  details: { flex: 1 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  meterNo: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  typeBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  typeBadgeText: { fontSize: 9, fontWeight: "900" },
  addressRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  addressText: {
    marginLeft: 4,
    color: "#1E293B",
    fontWeight: "600",
    fontSize: 13,
  },
  subDetail: { fontSize: 13, color: "#64748B", marginBottom: 8 },
  statusRow: { flexDirection: "row", alignItems: "center" },
  statusInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  statusLabel: { fontSize: 12, fontWeight: "700", marginLeft: 4 },
  mapButton: { padding: 8, backgroundColor: "#F1F5F9", borderRadius: 8 },
});
