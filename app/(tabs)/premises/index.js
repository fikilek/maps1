import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { memo, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { useGeo } from "../../../src/context/GeoContext";
import { useWarehouse } from "../../../src/context/WarehouseContext";

// 🏛️ CONTEXTS

// 🎯 THE NEW STANDARDIZED PREMISE CARD
const PremiseItem = memo(function PremiseItem({
  item,
  onMapPress,
  onDiscover,
  onInstall,
  onDetailPress,
}) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onDetailPress(item)}
      activeOpacity={0.9}
    >
      {/* 🎯 ROW 1: ADDRESS & MAP PORTAL */}
      <View style={styles.cardHeader}>
        <View style={styles.addressSection}>
          <Text style={styles.addressText} numberOfLines={1}>
            {item.address?.strNo} {item.address?.strName}{" "}
            {item.address?.strType}
          </Text>
          <Text style={styles.propertyTypeText}>
            {item.propertyType?.type || "Residential"}{" "}
            {item.propertyType?.name ? `• ${item.propertyType.name}` : ""}
          </Text>
        </View>

        {/* 🗺️ Standardized Map Icon (Matches ErfItem) */}
        <TouchableOpacity
          style={styles.mapAction}
          onPress={() => onMapPress(item)}
        >
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="map-search"
              size={22}
              color="#00BFFF"
            />
          </View>
          <Text style={styles.mapLabel}>MAP</Text>
        </TouchableOpacity>
      </View>

      {/* 🎯 ROW 2: INFRASTRUCTURE ANCHOR (ERF + METERS) */}
      <View style={styles.anchorRow}>
        <View style={styles.erfBadge}>
          <MaterialCommunityIcons
            name="layers-outline"
            size={14}
            color="#64748b"
          />
          <Text style={styles.erfLabel}>ERF {item.erfId || "N/A"}</Text>
        </View>

        <View style={styles.meterStats}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="lightning-bolt"
              size={16}
              color="#EAB308"
            />
            <Text style={styles.statCount}>
              {item.services?.electricityMeter || 0}
            </Text>
          </View>
          <View style={[styles.statItem, { marginLeft: 12 }]}>
            <MaterialCommunityIcons name="water" size={16} color="#3B82F6" />
            <Text style={styles.statCount}>
              {item.services?.waterMeter || 0}
            </Text>
          </View>
        </View>
      </View>

      {/* 🎯 ROW 3: METER WORKFLOW BUTTONS */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.btn, styles.btnDiscover]}
          onPress={() => onDiscover(item)}
        >
          <MaterialCommunityIcons
            name="magnify-scan"
            size={18}
            color="#1E293B"
          />
          <Text style={styles.btnText}>Discover</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnInstall]}
          onPress={() => onInstall(item)}
        >
          <MaterialCommunityIcons
            name="plus-circle-outline"
            size={18}
            color="#FFF"
          />
          <Text style={[styles.btnText, { color: "#FFF" }]}>Install</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

PremiseItem.displayName = "PremiseItem";

export default function PremisesScreen() {
  const router = useRouter();
  const { filtered, loading } = useWarehouse();
  const { geoState, updateGeo } = useGeo();

  const sortedPremises = useMemo(() => {
    return [...(filtered?.prems || [])].sort((a, b) => {
      const dateA = new Date(a.metadata?.updatedAt?.timestamp || 0).getTime();
      const dateB = new Date(b.metadata?.updatedAt?.timestamp || 0).getTime();
      return dateB - dateA;
    });
  }, [filtered.prems]);
  // console.log(`PremisesScreen ----sortedPremises`, sortedPremises);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={sortedPremises}
        keyExtractor={(item) => item.id}
        estimatedItemSize={180}
        contentContainerStyle={{ padding: 12 }}
        ListHeaderComponent={() => (
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              {geoState.selectedErf
                ? `ERF ${geoState.selectedErf.erfNo}`
                : "All Premises"}
            </Text>
            <Text style={styles.headerSubtitle}>
              {geoState.selectedWard || "All Wards"} • {sortedPremises.length}{" "}
              Units Found
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="office-building-marker-outline"
              size={64}
              color="#CBD5E1"
            />
            <Text style={styles.emptyText}>
              No premises found in this selection.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <PremiseItem
            item={item}
            onDetailPress={(p) => router.push(`/erfs/${p.erfId}`)}
            onMapPress={(p) => {
              updateGeo({ selectedErf: { id: p.erfId, erfNo: p.erfId } });
              router.push("/(tabs)/maps");
            }}
            onDiscover={(p) => {
              // console.log(`PremisesScreen ----p`, p);
              router.push({
                pathname: "/(tabs)/premises/form", // Points to app/(tabs)/premises/form.js
                params: {
                  premiseId: p.id,
                  address:
                    `${p.address?.strNo || ""} ${p.address?.strName || ""} ${p.address?.strType || ""}`.trim(),
                  erfNo: p?.erfNo,
                },
              });
            }}
            onInstall={(p) => console.log("Installing meter for:", p.id)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerInfo: { marginBottom: 16, paddingHorizontal: 4 },
  headerTitle: { fontSize: 22, fontWeight: "900", color: "#1E293B" },
  headerSubtitle: { fontSize: 13, color: "#64748B", fontWeight: "600" },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  addressSection: { flex: 1 },
  addressText: { fontSize: 17, fontWeight: "800", color: "#1E293B" },
  propertyTypeText: { fontSize: 13, color: "#64748B", marginTop: 2 },

  mapAction: { alignItems: "center", marginLeft: 12 },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F0FAFF",
    justifyContent: "center",
    alignItems: "center",
  },
  mapLabel: { fontSize: 10, fontWeight: "900", color: "#00BFFF", marginTop: 2 },

  anchorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  erfBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  erfLabel: { fontSize: 12, fontWeight: "600", color: "#94A3B8" },
  meterStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 2,
  },
  statCount: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
  },

  actionRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 10,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    height: 42,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  btnDiscover: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  btnInstall: { backgroundColor: "#007AFF" },
  btnText: { fontSize: 13, fontWeight: "800", color: "#1E293B" },

  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: { color: "#94A3B8", marginTop: 12, fontWeight: "600" },
});
