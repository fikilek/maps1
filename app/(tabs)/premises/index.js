import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { memo, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Modal,
  Portal,
  Surface,
} from "react-native-paper";
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
  onNaPress, // 🛰️ New prop for the Step 3 Modal trigger
}) {
  const addressStr =
    `${item?.address?.strNo || ""} ${item?.address?.strName || ""} ${item?.address?.strType || ""}`.trim();
  const propertyTypeStr = `${item?.propertyType?.type || "Residential"}`;
  const erfIdStr = `${item?.erfId || item?.erfNo || "N/A"}`;

  // 🎯 Forensic Logic: Count the failures
  const naCount = Array.isArray(item?.metadata?.naCount)
    ? item.metadata.naCount.length
    : 0;

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
            {addressStr || "No Address Found"}
          </Text>
          <Text style={styles.propertyTypeText}>
            {`${propertyTypeStr}${item?.propertyType?.name ? ` • ${item?.propertyType.name}` : ""}`}
          </Text>
        </View>

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

      {/* 🎯 ROW 2: INFRASTRUCTURE ANCHOR (ERF + METERS + NA) */}
      <View style={styles.anchorRow}>
        <View style={styles.leftMeta}>
          {/* <View style={styles.erfBadge}>
            <MaterialCommunityIcons
              name="layers-outline"
              size={14}
              color="#64748b"
            />
            <Text style={styles.erfLabel}>{`ERF ${erfIdStr}`}</Text>
          </View> */}

          {/* 🛡️ THE NO ACCESS BADGE: Only appears if friction exists */}
          {naCount > 0 && (
            <TouchableOpacity
              style={styles.naBadge}
              onPress={() => onNaPress?.(item)}
            >
              <MaterialCommunityIcons
                name="shield-alert-outline"
                size={14}
                color="#EA580C"
              />
              <Text style={styles.naCountText}>{naCount} NA</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.meterStats}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons
              name="lightning-bolt"
              size={16}
              color="#EAB308"
            />
            <Text style={styles.statCount}>
              {Array.isArray(item?.services?.electricityMeters)
                ? item.services.electricityMeters.length
                : 0}
            </Text>
          </View>

          <View style={[styles.statItem, { marginLeft: 12 }]}>
            <MaterialCommunityIcons name="water" size={16} color="#3B82F6" />
            <Text style={styles.statCount}>
              {Array.isArray(item?.services?.waterMeters)
                ? item.services.waterMeters.length
                : 0}
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

// const PremiseItem = memo(function PremiseItem({
//   item,
//   onMapPress,
//   onDiscover,
//   onInstall,
//   onDetailPress,
// }) {
//   const addressStr =
//     `${item?.address?.strNo || ""} ${item?.address?.strName || ""} ${item?.address?.strType || ""}`.trim();
//   const propertyTypeStr = `${item?.propertyType?.type || "Residential"}`;
//   const erfIdStr = `${item?.erfId || item?.erfNo || "N/A"}`;

//   return (
//     <TouchableOpacity
//       style={styles.card}
//       onPress={() => onDetailPress(item)}
//       activeOpacity={0.9}
//     >
//       {/* 🎯 ROW 1: ADDRESS & MAP PORTAL */}
//       <View style={styles.cardHeader}>
//         <View style={styles.addressSection}>
//           <Text style={styles.addressText} numberOfLines={1}>
//             {addressStr || "No Address Found"}
//           </Text>
//           <Text style={styles.propertyTypeText}>
//             {`${propertyTypeStr}${item?.propertyType?.name ? ` • ${item?.propertyType.name}` : ""}`}
//           </Text>
//         </View>

//         {/* 🗺️ Standardized Map Icon (Matches ErfItem) */}
//         <TouchableOpacity
//           style={styles.mapAction}
//           onPress={() => onMapPress(item)}
//         >
//           <View style={styles.iconCircle}>
//             <MaterialCommunityIcons
//               name="map-search"
//               size={22}
//               color="#00BFFF"
//             />
//           </View>
//           <Text style={styles.mapLabel}>MAP</Text>
//         </TouchableOpacity>
//       </View>

//       {/* 🎯 ROW 2: INFRASTRUCTURE ANCHOR (ERF + METERS) */}
//       <View style={styles.anchorRow}>
//         <View style={styles.erfBadge}>
//           <MaterialCommunityIcons
//             name="layers-outline"
//             size={14}
//             color="#64748b"
//           />
//           {/* <Text style={styles.erfLabel}>ERF {item?.erfId || "N/A"}</Text> */}
//           <Text style={styles.erfLabel}>{`ERF ${erfIdStr}`}</Text>
//         </View>

//         <View style={styles.meterStats}>
//           {/* ⚡ Electricity Count */}
//           <View style={styles.statItem}>
//             <MaterialCommunityIcons
//               name="lightning-bolt"
//               size={16}
//               color="#EAB308"
//             />
//             <Text style={styles.statCount}>
//               {/* 🎯 Count the IDs in the array, default to 0 if empty/missing */}
//               {Array.isArray(item?.services?.electricityMeters)
//                 ? item?.services?.electricityMeters?.length
//                 : 0}
//             </Text>
//           </View>

//           {/* 💧 Water Count */}
//           <View style={[styles.statItem, { marginLeft: 12 }]}>
//             <MaterialCommunityIcons name="water" size={16} color="#3B82F6" />
//             <Text style={styles.statCount}>
//               {/* 🎯 Count the IDs in the array, default to 0 if empty/missing */}
//               {Array.isArray(item?.services?.waterMeters)
//                 ? item?.services?.waterMeters?.length
//                 : 0}
//             </Text>
//           </View>
//         </View>
//       </View>

//       {/* 🎯 ROW 3: METER WORKFLOW BUTTONS */}
//       <View style={styles.actionRow}>
//         <TouchableOpacity
//           style={[styles.btn, styles.btnDiscover]}
//           onPress={() => onDiscover(item)}
//         >
//           <MaterialCommunityIcons
//             name="magnify-scan"
//             size={18}
//             color="#1E293B"
//           />
//           <Text style={styles.btnText}>Discover</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.btn, styles.btnInstall]}
//           onPress={() => onInstall(item)}
//         >
//           <MaterialCommunityIcons
//             name="plus-circle-outline"
//             size={18}
//             color="#FFF"
//           />
//           <Text style={[styles.btnText, { color: "#FFF" }]}>Install</Text>
//         </TouchableOpacity>
//       </View>
//     </TouchableOpacity>
//   );
// });

PremiseItem.displayName = "PremiseItem";

export default function PremisesScreen() {
  console.log(`PremisesScreen ---mounted`);
  const router = useRouter();
  const { all, filtered, loading } = useWarehouse();
  // console.log(`GeoProvider ----filtered`, filtered);

  const { geoState, setGeoState } = useGeo();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPremise, setSelectedPremise] = useState(null);

  // Local state for the "Pre-Flight" decisions
  const [hasAccess, setHasAccess] = useState(true);
  const [meterType, setMeterType] = useState("");

  const handleOpenDiscovery = (p) => {
    setSelectedPremise(p);
    setIsModalVisible(true);
  };

  // 3. The Modal's confirm button "reads" from the state
  const handleConfirmMission = () => {
    if (!selectedPremise) return; // Safety check

    setIsModalVisible(false);

    // 🎯 Use the data we stored in 'selectedPremise'
    router.push({
      pathname: "/(tabs)/premises/form",
      params: {
        premiseId: selectedPremise?.id,
        address:
          `${selectedPremise?.address?.strNo || ""} ${selectedPremise?.address?.strName || ""}  ${selectedPremise?.address?.strType || ""}`?.trim(),
        erfNo: selectedPremise?.erfNo,
        // Pass our toggles
        action: JSON.stringify({
          access: hasAccess ? "yes" : "no",
          meterType: meterType,
        }),
      },
    });
  };

  const sortedPremises = useMemo(() => {
    return [...(filtered?.prems || [])].sort((a, b) => {
      const dateA = new Date(a.metadata?.updatedAt?.timestamp || 0).getTime();
      const dateB = new Date(b.metadata?.updatedAt?.timestamp || 0).getTime();
      return dateB - dateA;
    });
  }, [filtered?.prems]);
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
        keyExtractor={(item) => item?.id}
        estimatedItemSize={180}
        contentContainerStyle={{ padding: 12 }}
        ListHeaderComponent={() => (
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              {geoState?.selectedErf
                ? `ERF ${geoState?.selectedErf?.erfNo}`
                : "All Premises"}
            </Text>
            <Text style={styles.headerSubtitle}>
              {geoState?.selectedWard || "All Wards"} • {sortedPremises?.length}{" "}
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
            onDetailPress={(p) => router.push(`/erfs/${p?.erfId}`)}
            onMapPress={(p) => {
              // 🏛️ 1. ACCESS THE WAREHOUSE:
              // We need the full Erf data (Geo + Meta) for the map to work.
              const fullErf = all?.metaEntries?.find((e) => e.id === p?.erfId);

              // 🛡️ 2. THE SOVEREIGN UPDATE
              setGeoState((prev) => ({
                ...prev,
                selectedErf: fullErf || { id: p?.erfId, erfNo: p?.erfNo }, // Fallback to basic info
                selectedPremise: p, // 🎯 Highlight this specific premise on the map
              }));

              // 🚀 3. THE JUMP
              router.push("/(tabs)/maps");
            }}
            onDiscover={(p) => handleOpenDiscovery(p)}
            onInstall={(p) => console.log("Installing meter for:", p?.id)}
            onNaPress={(premise) => {
              console.log(
                `📡 Pilot: Diverting to No Access Ledger for Premise: ${premise.id}`,
              );

              // 🚀 NAVIGATE: We pass the ID so NaScreen can fetch the relevant stream
              router.push({
                pathname: "/premises/NaScreen", // 🎯 Path to your new file
                params: { premiseId: premise.id },
              });
            }}
          />
        )}
      />

      <Portal>
        <Modal
          visible={isModalVisible}
          onDismiss={() => setIsModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Mission Discovery
          </Text>
          <Text variant="bodyMedium" style={styles.modalSubtitle}>
            Select the current situation:
          </Text>

          {/* 🎯 1. ACCESS TOGGLE */}
          <Surface style={styles.modalCard} elevation={1}>
            <Text variant="labelLarge">Access Status</Text>
            <View style={styles.toggleRow}>
              <Button
                mode={hasAccess ? "contained" : "outlined"}
                onPress={() => setHasAccess(true)}
                style={styles.toggleButton}
              >
                ACCESS
              </Button>
              <Button
                mode={!hasAccess ? "contained" : "outlined"}
                onPress={() => setHasAccess(false)}
                style={styles.toggleButton}
                buttonColor={!hasAccess ? "#B22222" : null} // Red for No Access
              >
                NO ACCESS
              </Button>
            </View>
          </Surface>

          {/* 🎯 2. METER TYPE TOGGLE (Only show if Access is YES) */}
          {hasAccess && (
            <Surface style={styles.modalCard} elevation={1}>
              <Text variant="labelLarge">Resource Type</Text>
              <View style={styles.toggleRow}>
                <Button
                  mode={meterType === "water" ? "contained" : "outlined"}
                  onPress={() => setMeterType("water")}
                  style={styles.toggleButton}
                >
                  WATER
                </Button>
                <Button
                  mode={meterType === "electricity" ? "contained" : "outlined"}
                  onPress={() => setMeterType("electricity")}
                  style={styles.toggleButton}
                >
                  ELECTRICITY
                </Button>
              </View>
            </Surface>
          )}

          <Button
            mode="contained"
            onPress={handleConfirmMission}
            style={styles.confirmButton}
            contentStyle={{ height: 50 }}
          >
            START DISCOVERY
          </Button>
        </Modal>
      </Portal>
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

  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  modalTitle: {
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 5,
  },
  modalSubtitle: {
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  modalCard: {
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  toggleButton: {
    flex: 0.48,
  },
  confirmButton: {
    marginTop: 10,
    borderRadius: 8,
  },

  leftMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  naBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEDD5", // Light Orange
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FED7AA",
    marginLeft: 8,
  },
  naCountText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#EA580C", // Deep Warning Orange
    marginLeft: 4,
  },
});
