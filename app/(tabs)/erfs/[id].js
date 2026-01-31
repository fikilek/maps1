import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Badge, Surface } from "react-native-paper";
import { useGeo } from "../../../src/context/GeoContext";
import { useGetPremisesByLmPcodeQuery } from "../../../src/redux/premisesApi";

// 🎨 Derive color based on occupancy status
const getStatusColor = (status) => {
  const colors = {
    OCCUPIED: "#28A745", // Green
    VANDALISED: "#DC3545", // Red
    VACANT: "#FFC107", // Amber
    UNOCCUPIED: "#6C757D", // Gray
  };
  return colors[status] || "#6C757D";
};

const PremiseCard = ({ premise, isSubUnit, onEdit }) => {
  const router = useRouter();
  // Logic to build the identity string
  const propertyIdentity = [
    premise?.propertyType?.type,
    premise?.propertyType?.name,
    premise?.propertyType?.unitNo && premise?.propertyType?.unitNo?.length > 0
      ? `Unit ${premise?.propertyType?.unitNo}`
      : null,
  ]
    .filter(Boolean)
    .join(" | "); // Filters out empty values and joins with a pipe

  return (
    <Surface style={[styles.card, isSubUnit && styles.subUnitCard]}>
      {/* 🏆 THE NEW CARD HEADER: Property Identity */}
      <View style={styles.propertyHeader}>
        <MaterialCommunityIcons
          name="office-building-marker"
          size={23}
          color="#1e293b"
        />
        <Text
          style={styles.identityText}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {propertyIdentity}
        </Text>
      </View>

      <View style={styles.cardTop}>
        <View style={styles.addressSection}>
          {/* <View style={styles.badgeWrapper}>
            <Text style={styles.unitBadge}>
              {premise.isSectionalTitle
                ? `UNIT ${premise.propertyType.unitNo}`
                : "MAIN"}
            </Text>
          </View> */}
          <Text style={styles?.streetLabel}>
            {premise?.address?.strNo} {premise?.address?.strName}{" "}
            {premise?.address?.strType}
          </Text>
        </View>
        <Badge
          style={{
            backgroundColor: getStatusColor(premise?.occupancy?.status),
            color: "white",
            fontWeight: "bold",
          }}
        >
          {premise?.occupancy?.status}
        </Badge>
      </View>

      {/* 🎯 The 2x2 Service Grid */}
      {/* <View style={styles.meterGrid}>
        <View style={styles.gridCell}>
          <MaterialCommunityIcons
            name="lightning-bolt-circle"
            size={22}
            color="#EAB308"
          />
          <View>
            <Text style={styles.meterCount}>
              {premise?.services?.electricityMeter}
            </Text>
            <Text style={styles.meterSub}>Elec Meters</Text>
          </View>
        </View>
        <View
          style={[
            styles.gridCell,
            { borderLeftWidth: 1, borderLeftColor: "#f1f5f9" },
          ]}
        >
          <MaterialCommunityIcons
            name="water-circle"
            size={22}
            color="#3B82F6"
          />
          <View>
            <Text style={styles.meterCount}>
              {premise?.services?.waterMeter}
            </Text>
            <Text style={styles.meterSub}>Water Meters</Text>
          </View>
        </View>
      </View> */}

      <View style={styles.cardActionsRow}>
        {/* ✏️ EDIT BUTTON */}
        {/* <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onEdit(premise)}
        >
          <MaterialCommunityIcons
            name="square-edit-outline"
            size={18}
            color="#64748B"
          />
          <Text style={styles.actionBtnText}>Edit Details</Text>
        </TouchableOpacity> */}

        <View style={styles.verticalDivider} />

        {/* 📍 MAP BUTTON */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            console.log("Navigating to Map for Premise:", premise.id);
            // Logic to navigate to map and center on premise.geometry.centroid
            router.push({
              pathname: "/(tabs)/maps",
              params: {
                focusErf: premise?.erfId,
                focusPremise: premise?.id,
                lat: premise?.geometry?.centroid[1],
                lng: premise?.geometry?.centroid[0],
              },
            });
          }}
        >
          <MaterialCommunityIcons
            name="map-marker-radius"
            size={18}
            color="#007AFF"
          />
          <Text style={[styles.actionBtnText, { color: "#007AFF" }]}>
            View Map
          </Text>
        </TouchableOpacity>
      </View>
    </Surface>
  );
};

export default function ErfDetailScreen() {
  console.log(` `);
  console.log(`PremiseDetailScreen ----mounted`);

  const { id } = useLocalSearchParams(); //erfId
  // console.log(`PremiseDetailScreen ----(erfId) id`, id);

  const router = useRouter();

  const { geoState } = useGeo();

  // console.log(
  //   `PremiseDetailScreen ----geoState?.selectedErf`,
  //   geoState?.selectedErf,
  // );

  // const { premises, isRestockingPremises } = useWarehouse();
  // 🎯 Pull from Vault immediately on mount/render

  // const premises = useMemo(() => {
  //   const activeErfId = id || geoState?.selectedErf?.id;
  //   const lmPcode = geoState?.selectedLm?.id;

  //   if (!activeErfId || !lmPcode) return [];

  //   const localVault = premiseMemory.getLmList(lmPcode) || [];

  //   // 🎯 THE FIX: Cloud items are IDs (strings). We only need the full objects from the vault.
  //   // In your architecture, the 'localVault' is the "Master Truth" because
  //   // RTK Query/MMKV ensures every cloud item is also saved locally.
  //   const objectMap = new Map();

  //   // 1. Process the Vault (which contains both synced and unsynced items)
  //   localVault.forEach((item) => {
  //     // 🛡️ Forensic Check: Ensure the item belongs to THIS Erf
  //     if (item && item.erfId === activeErfId) {
  //       objectMap.set(item.id, item);
  //     }
  //   });

  //   // 2. Convert to Array and Sort using the correct "Frozen" paths
  //   return Array.from(objectMap.values()).sort((a, b) => {
  //     // 🏛️ Path Correction: a.metadata.updated.at (ISO String)
  //     const timeA = new Date(
  //       a.metadata?.updated?.at || a.metadata?.created?.at || 0,
  //     ).getTime();

  //     const timeB = new Date(
  //       b.metadata?.updated?.at || b.metadata?.created?.at || 0,
  //     ).getTime();

  //     // Latest mission first
  //     return timeB - timeA;
  //   });
  // }, [id, geoState?.selectedErf?.premises, geoState?.selectedLm]);

  // const premises = useMemo(() => {
  //   const activeErfId = id || geoState?.selectedErf?.id;
  //   const lmPcode = geoState?.selectedLm?.id;

  //   if (!activeErfId || !lmPcode) return [];

  //   const localVault = premiseMemory.getLmList(lmPcode) || [];
  //   console.log(
  //     `PremiseDetailScreen ----localVault?.length`,
  //     localVault?.length,
  //   );

  //   const objectMap = new Map();

  //   const cloudItems = geoState?.selectedErf?.premises || [];
  //   console.log(
  //     `PremiseDetailScreen ----cloudItems?.length`,
  //     cloudItems?.length,
  //   );

  //   // 1. Merge Cloud and Local (Standard: Objects only)
  //   [...cloudItems, ...localVault].forEach((item) => {
  //     if (item && typeof item === "object" && item.erfId === activeErfId) {
  //       objectMap.set(item.id, item);
  //     }
  //   });

  //   console.log(`PremiseDetailScreen ----objectMap`, objectMap);
  //   // 2. Convert to Array and Sort by updatedAt.timestamp
  //   return Array.from(objectMap.values()).sort((a, b) => {
  //     // Use updatedAt if available, fallback to createdAt, fallback to 0
  //     const dateA = new Date(
  //       a.metadata?.updatedAt?.timestamp ||
  //         a.metadata?.createdAt?.timestamp ||
  //         0,
  //     ).getTime();

  //     const dateB = new Date(
  //       b.metadata?.updatedAt?.timestamp ||
  //         b.metadata?.createdAt?.timestamp ||
  //         0,
  //     ).getTime();

  //     // Descending order (Latest timestamp at index 0)
  //     return dateB - dateA;
  //   });
  // }, [id, geoState?.selectedErf, geoState?.selectedLm]);

  // 🛰️ 1. Call the Sovereign Query (Ensure this is in your component)

  const { data: premisesData } = useGetPremisesByLmPcodeQuery({
    lmPcode: geoState?.selectedLm?.id,
  });
  // console.log(`PremiseDetailScreen ----premisesData`, premisesData);
  // console.log(
  //   `PremiseDetailScreen ----premisesData?.length`,
  //   premisesData?.length,
  // );

  // 🏛️ 2. The Filtered Resolver
  const premises = useMemo(() => {
    const activeErfId = id || geoState?.selectedErf?.id;

    // If the query hasn't returned data yet, return empty
    if (!premisesData || !activeErfId) return [];

    // 🎯 THE DIRECT HIT: Filter the RTK Cache directly
    // We look for any premise where erfId matches our current target
    return premisesData
      .filter((p) => p.erfId === activeErfId)
      .sort((a, b) => {
        // 🏛️ Path Correction for the new Sovereign timestamps
        const dateA = new Date(a.metadata?.updated?.at || 0).getTime();
        const dateB = new Date(b.metadata?.updated?.at || 0).getTime();
        return dateB - dateA; // Latest first
      });
  }, [id, premisesData, geoState?.selectedErf?.id]);

  // console.log(`PremiseDetailScreen ----premises?.length`, premises?.length);
  // console.log(`PremiseDetailScreen ----premises`, premises);

  // 🎯 Filter to only show premises for this specific Erf Anchor
  // const erfPremises = (premises || []).filter((p) => p.erfId === id);

  // 💡 Helper to group by Block Name or 'General'
  const grouped = premises.reduce((acc, p) => {
    const groupName = p?.propertyType?.name || "Main Structure";
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(p);
    return acc;
  }, {});

  // If no premises exists yet
  if (premises.length === 0) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: `Erf ${geoState?.selectedErf?.erfNo || "Detail"}`,
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.replace("/(tabs)/erfs")}
                style={{ marginLeft: 10 }}
              >
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
            ),
          }}
        />

        <View style={styles.emptyStateContainer}>
          <MaterialCommunityIcons
            name="office-building-plus"
            size={80}
            color="#cbd5e1"
          />
          <Text style={styles.emptyTitle}>No Structure Captured</Text>
          <Text style={styles.emptySubText}>
            This Erf currently has no premises recorded. Begin by adding the
            main structure or back-rooms.
          </Text>

          <TouchableOpacity
            style={styles.firstPrimiseBtn}
            onPress={() => router.push(`/erfs/form?id=${id}`)}
          >
            <Text style={styles.initializeBtnText}>ADD FIRST PREMISE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryBtnText}>GO BACK TO ERF</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Stack.Screen
        options={{
          title: `Erf ${geoState?.selectedErf?.erfNo || "Detail"}`,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.replace("/(tabs)/erfs")}
              style={{ marginLeft: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          ),
        }}
      />

      {Object.keys(grouped).map((groupName) => (
        <View key={groupName} style={styles.groupContainer}>
          {/* The Group Header (e.g., 'Block A' or 'Main House') */}
          <View style={styles.groupHeader}>
            <MaterialCommunityIcons
              name="layers-triple-outline"
              size={18}
              color="#059669"
            />
            <Text style={styles.groupHeaderText}>
              {groupName.toUpperCase()}
            </Text>
          </View>

          {/* The Individual Premise Cards */}
          {grouped[groupName].map((p) => (
            <PremiseCard
              key={p.id}
              premise={p}
              isSubUnit={groupName !== "Main Structure"}
              onEdit={(item) =>
                router.push(`/premises/form?id=${id}&premiseId=${item.id}`)
              }
            />
          ))}
        </View>
      ))}

      {/* Tactical Button to Add More Premises to this Erf */}
      <TouchableOpacity
        style={[
          styles.initializeBtn,
          { marginHorizontal: 16, marginTop: 20, backgroundColor: "#059669" },
        ]} // Changed to green for 'Success/Add'
        onPress={() => {
          // 🎯 Grab address from the first existing premise to auto-fill the form
          const template = premises[0];

          router.push({
            pathname: "/erfs/form",
            params: {
              id: id, // The Erf ID
              strNo: template?.address?.strNo || "",
              strName: template?.address?.strName || "",
              strType: template?.address?.strType || "",
            },
          });
        }}
      >
        <MaterialCommunityIcons
          name="plus-circle-outline"
          size={22}
          color="#FFF"
        />
        <Text style={styles.initializeBtnText}> ADD ANOTHER PREMISE</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  groupContainer: { marginBottom: 20 },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#e2e8f0",
    gap: 8,
  },
  groupHeaderText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#334155",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "#FFF",
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  subUnitCard: {
    marginLeft: 30, // Visual indentation for units within a group
    borderLeftWidth: 3,
    borderLeftColor: "#059669",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  addressSection: { flex: 1 },
  unitBadge: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  streetLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  meterGrid: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  gridCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
  },
  meterCount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  meterSub: {
    fontSize: 10,
    color: "#64748b",
    textTransform: "uppercase",
  },
  editAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  editText: {
    color: "#64748B",
    fontWeight: "700",
    fontSize: 12,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#475569",
    marginTop: 20,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 15,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
    marginBottom: 40,
  },
  initializeBtn: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  initializeBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  secondaryBtn: {
    marginTop: 15,
    padding: 10,
  },
  secondaryBtnText: {
    color: "#64748b",
    fontWeight: "600",
  },
  propertyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    backgroundColor: "lightgrey",
    padding: 5,
    borderRadius: 10,
  },
  cardActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
  },
  actionBtnText: {
    color: "#64748B",
    fontWeight: "700",
    fontSize: 12,
  },
  verticalDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#e2e8f0",
  },

  firstPrimiseBtn: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    width: "100%",
  },
});
