import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo } from "react"; // 🎯 Added useCallback for handlers
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useGeo } from "../../../src/context/GeoContext";
import { useWarehouse } from "../../../src/context/WarehouseContext"; // 🎯 Using the Warehouse
import PremiseCard from "../../../src/features/premises/PremiseCard";

export default function ErfDetailScreen() {
  const { id } = useLocalSearchParams(); // Erf ID
  const router = useRouter();
  const { geoState, updateGeo } = useGeo();
  const { all } = useWarehouse();

  // 🏛️ 1. RESOLVE PREMISES FOR THIS ERF
  const premises = useMemo(() => {
    const activeErfId = id || geoState?.selectedErf?.id;
    if (!activeErfId) return [];

    // Filter from 'all.prems' to ensure we see the whole property stack
    return (all?.prems || [])
      .filter((p) => p.erfId === activeErfId)
      .sort((a, b) => {
        const timeA = new Date(a.metadata?.updated?.at || 0).getTime();
        const timeB = new Date(b.metadata?.updated?.at || 0).getTime();
        return timeB - timeA; // Latest first
      });
  }, [id, all?.prems, geoState?.selectedErf?.id]);

  // 🏛️ 2. TACTICAL HANDLERS (Standardized for the Card)
  const handleMapPress = useCallback(
    (p) => {
      console.log(
        `📡 [ErfsDetail]: Executing Double-Tap Jump for Premise: ${p.id}`,
      );

      // 🎯 TAP 1: Confirm the Erf (The Sovereign)
      // Even though we are on the Erf screen, we re-select it to
      // clear any previous 'stale' selections in the GeoContext.
      updateGeo({
        selectedErf: geoState?.selectedErf, // Use the current Erf from state
        lastSelectionType: "ERF",
      });

      // 🎯 TAP 2: Select the Premise (The Target)
      updateGeo({
        selectedPremise: p,
        lastSelectionType: "PREMISE",
      });

      // 🚀 THE JUMP
      router.replace("/(tabs)/maps");
    },
    [geoState?.selectedErf, router, updateGeo],
  );

  const handleDiscover = useCallback(
    (p) => {
      // Navigate to form with discovery params
      router.push({
        pathname: "/(tabs)/premises/form",
        params: {
          premiseId: p?.id,
          action: JSON.stringify({ access: "yes", meterType: "" }),
        },
      });
    },
    [router],
  );

  const handleInstall = useCallback((p) => {
    // Future install workflow trigger
  }, []);

  // 🏛️ TACTICAL CORRECTION: Pointing to the Sovereign Edit route
  const handleDetailPress = useCallback(
    (p) => {
      // 🚀 Redirect to the 'FormPremise' data route /app/(tabs))/erfs/form (FormPremise)
      router.push({
        pathname: "/erfs/form",
        params: {
          id: id, // The parent Erf ID (Anchor)
          premiseId: p?.id, // The specific Premise ID (Target)
        },
      });
    },
    [id, router],
  );

  const handleDuplicate = useCallback(
    (p) => {
      router.push({
        pathname: "/erfs/form",
        params: {
          id: p?.erfId,
          duplicateId: p?.id, // 🎯 The "DNA" source for the new record
        },
      });
    },
    [router],
  );

  const handleNaPress = useCallback(
    (p) => {
      router.push({
        pathname: "/premises/NaScreen",
        params: { premiseId: p.id },
      });
    },
    [router],
  );

  // 🏛️ 3. RESOLVE WARD NO
  const wardNo = useMemo(() => {
    const parentErf = all?.erfs?.find((e) => e.id === id);
    return parentErf?.admin?.ward?.name?.replace(/\D/g, "") || "?";
  }, [all?.erfs, id]);

  // 💡 Grouping logic (Main Structure vs Outbuildings)
  const grouped = useMemo(() => {
    return premises.reduce((acc, p) => {
      const groupName = p?.propertyType?.name || "Main Structure";
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(p);
      return acc;
    }, {});
  }, [premises]);

  // --- 🛡️ EMPTY STATE ---
  if (premises.length === 0) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{ title: `Erf ${geoState?.selectedErf?.erfNo || "Detail"}` }}
        />
        <View style={styles.emptyStateContainer}>
          <MaterialCommunityIcons
            name="office-building-plus"
            size={80}
            color="#cbd5e1"
          />
          <Text style={styles.emptyTitle}>No Structure Captured</Text>
          <Text style={styles.emptySubText}>
            This Erf currently has no premises recorded.
          </Text>
          <TouchableOpacity
            style={styles.initializeBtn}
            onPress={() => router.push(`/erfs/form?id=${id}`)}
          >
            <Text style={styles.initializeBtnText}>ADD FIRST PREMISE</Text>
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
        options={{ title: `Erf ${geoState?.selectedErf?.erfNo || "Detail"}` }}
      />

      {Object.keys(grouped).map((groupName) => (
        <View key={groupName} style={styles.groupContainer}>
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

          {grouped[groupName].map((p) => (
            <View key={p.id} style={{ paddingHorizontal: 4 }}>
              <PremiseCard
                item={p}
                wardNo={wardNo}
                onMapPress={handleMapPress}
                onDiscover={handleDiscover}
                onInstall={handleInstall}
                onDetailPress={handleDetailPress}
                onNaPress={handleNaPress}
                onDuplicate={handleDuplicate}
              />
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  groupContainer: { marginBottom: 16 },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#e2e8f0",
    gap: 8,
  },
  groupHeaderText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    letterSpacing: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#475569",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  initializeBtn: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  initializeBtnText: { color: "#FFF", fontSize: 14, fontWeight: "900" },
  addBtn: {
    backgroundColor: "#059669",
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
});

// import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
// import { Stack, useLocalSearchParams, useRouter } from "expo-router";
// import { useMemo } from "react";
// import {
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { Badge, Surface } from "react-native-paper";
// import { useGeo } from "../../../src/context/GeoContext";
// import { useGetPremisesByLmPcodeQuery } from "../../../src/redux/premisesApi";

// // 🎨 Derive color based on occupancy status
// const getStatusColor = (status) => {
//   const colors = {
//     OCCUPIED: "#28A745", // Green
//     VANDALISED: "#DC3545", // Red
//     VACANT: "#FFC107", // Amber
//     UNOCCUPIED: "#6C757D", // Gray
//   };
//   return colors[status] || "#6C757D";
// };

// const PremiseCard = ({ premise, isSubUnit, onEdit }) => {
//   const router = useRouter();
//   // Logic to build the identity string
//   const propertyIdentity = [
//     premise?.propertyType?.type,
//     premise?.propertyType?.name,
//     premise?.propertyType?.unitNo && premise?.propertyType?.unitNo?.length > 0
//       ? `Unit ${premise?.propertyType?.unitNo}`
//       : null,
//   ]
//     .filter(Boolean)
//     .join(" | "); // Filters out empty values and joins with a pipe

//   return (
//     <Surface style={[styles.card, isSubUnit && styles.subUnitCard]}>
//       {/* 🏆 THE NEW CARD HEADER: Property Identity */}
//       <View style={styles.propertyHeader}>
//         <MaterialCommunityIcons
//           name="office-building-marker"
//           size={23}
//           color="#1e293b"
//         />
//         <Text
//           style={styles.identityText}
//           numberOfLines={1}
//           ellipsizeMode="tail"
//         >
//           {propertyIdentity}
//         </Text>
//       </View>

//       <View style={styles.cardTop}>
//         <View style={styles.addressSection}>
//           <Text style={styles?.streetLabel}>
//             {premise?.address?.strNo} {premise?.address?.strName}{" "}
//             {premise?.address?.strType}
//           </Text>
//         </View>
//         <Badge
//           style={{
//             backgroundColor: getStatusColor(premise?.occupancy?.status),
//             color: "white",
//             fontWeight: "bold",
//           }}
//         >
//           {premise?.occupancy?.status}
//         </Badge>
//       </View>

//       <View style={styles.cardActionsRow}>
//         <View style={styles.verticalDivider} />

//         {/* 📍 MAP BUTTON */}
//         <TouchableOpacity
//           style={styles.actionBtn}
//           onPress={() => {
//             // console.log("Navigating to Map for Premise:", premise.id);
//             // Logic to navigate to map and center on premise.geometry.centroid
//             router.push({
//               pathname: "/(tabs)/maps",
//               params: {
//                 focusErf: premise?.erfId,
//                 focusPremise: premise?.id,
//                 lat: premise?.geometry?.centroid[1],
//                 lng: premise?.geometry?.centroid[0],
//               },
//             });
//           }}
//         >
//           <MaterialCommunityIcons
//             name="map-marker-radius"
//             size={18}
//             color="#007AFF"
//           />
//           <Text style={[styles.actionBtnText, { color: "#007AFF" }]}>
//             View Map
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </Surface>
//   );
// };

// export default function ErfDetailScreen() {
//   // console.log(` `);
//   // console.log(`PremiseDetailScreen ----mounted`);

//   const { id } = useLocalSearchParams(); //erfId
//   // console.log(`PremiseDetailScreen ----(erfId) id`, id);

//   const router = useRouter();

//   const { geoState } = useGeo();

//   const { data: premisesData } = useGetPremisesByLmPcodeQuery({
//     lmPcode: geoState?.selectedLm?.id,
//   });

//   // 🏛️ 2. The Filtered Resolver
//   const premises = useMemo(() => {
//     const activeErfId = id || geoState?.selectedErf?.id;

//     // If the query hasn't returned data yet, return empty
//     if (!premisesData || !activeErfId) return [];

//     // 🎯 THE DIRECT HIT: Filter the RTK Cache directly
//     // We look for any premise where erfId matches our current target
//     return premisesData
//       .filter((p) => p.erfId === activeErfId)
//       .sort((a, b) => {
//         // 🏛️ Path Correction for the new Sovereign timestamps
//         const dateA = new Date(a.metadata?.updated?.at || 0).getTime();
//         const dateB = new Date(b.metadata?.updated?.at || 0).getTime();
//         return dateB - dateA; // Latest first
//       });
//   }, [id, premisesData, geoState?.selectedErf?.id]);

//   // 💡 Helper to group by Block Name or 'General'
//   const grouped = premises.reduce((acc, p) => {
//     const groupName = p?.propertyType?.name || "Main Structure";
//     if (!acc[groupName]) acc[groupName] = [];
//     acc[groupName].push(p);
//     return acc;
//   }, {});

//   // If no premises exists yet
//   if (premises.length === 0) {
//     return (
//       <View style={styles.container}>
//         <Stack.Screen
//           options={{
//             title: `Erf ${geoState?.selectedErf?.erfNo || "Detail"}`,
//             headerLeft: () => (
//               <TouchableOpacity
//                 onPress={() => router.replace("/(tabs)/erfs")}
//                 style={{ marginLeft: 10 }}
//               >
//                 <Ionicons name="arrow-back" size={24} color="#000" />
//               </TouchableOpacity>
//             ),
//           }}
//         />

//         <View style={styles.emptyStateContainer}>
//           <MaterialCommunityIcons
//             name="office-building-plus"
//             size={80}
//             color="#cbd5e1"
//           />
//           <Text style={styles.emptyTitle}>No Structure Captured</Text>
//           <Text style={styles.emptySubText}>
//             This Erf currently has no premises recorded. Begin by adding the
//             main structure or back-rooms.
//           </Text>

//           <TouchableOpacity
//             style={styles.firstPrimiseBtn}
//             onPress={() => router.push(`/erfs/form?id=${id}`)}
//           >
//             <Text style={styles.initializeBtnText}>ADD FIRST PREMISE</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.secondaryBtn}
//             onPress={() => router.back()}
//           >
//             <Text style={styles.secondaryBtnText}>GO BACK TO ERF</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   }

//   return (
//     <ScrollView
//       style={styles.container}
//       contentContainerStyle={{ paddingBottom: 40 }}
//     >
//       <Stack.Screen
//         options={{
//           title: `Erf ${geoState?.selectedErf?.erfNo || "Detail"}`,
//           headerLeft: () => (
//             <TouchableOpacity
//               onPress={() => router.replace("/(tabs)/erfs")}
//               style={{ marginLeft: 10 }}
//             >
//               <Ionicons name="arrow-back" size={24} color="#000" />
//             </TouchableOpacity>
//           ),
//         }}
//       />

//       {Object.keys(grouped).map((groupName) => (
//         <View key={groupName} style={styles.groupContainer}>
//           {/* The Group Header (e.g., 'Block A' or 'Main House') */}
//           <View style={styles.groupHeader}>
//             <MaterialCommunityIcons
//               name="layers-triple-outline"
//               size={18}
//               color="#059669"
//             />
//             <Text style={styles.groupHeaderText}>
//               {groupName.toUpperCase()}
//             </Text>
//           </View>

//           {/* The Individual Premise Cards */}
//           {grouped[groupName].map((p) => (
//             <PremiseCard
//               key={p.id}
//               premise={p}
//               isSubUnit={groupName !== "Main Structure"}
//               onEdit={(item) =>
//                 router.push(`/premises/form?id=${id}&premiseId=${item.id}`)
//               }
//             />
//           ))}
//         </View>
//       ))}

//       {/* Tactical Button to Add More Premises to this Erf */}
//       <TouchableOpacity
//         style={[
//           styles.initializeBtn,
//           { marginHorizontal: 16, marginTop: 20, backgroundColor: "#059669" },
//         ]} // Changed to green for 'Success/Add'
//         onPress={() => {
//           // 🎯 Grab address from the first existing premise to auto-fill the form
//           const template = premises[0];

//           router.push({
//             pathname: "/erfs/form",
//             params: {
//               id: id, // The Erf ID
//               strNo: template?.address?.strNo || "",
//               strName: template?.address?.strName || "",
//               strType: template?.address?.strType || "",
//             },
//           });
//         }}
//       >
//         <MaterialCommunityIcons
//           name="plus-circle-outline"
//           size={22}
//           color="#FFF"
//         />
//         <Text style={styles.initializeBtnText}> ADD ANOTHER PREMISE</Text>
//       </TouchableOpacity>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#f1f5f9" },
//   centered: { flex: 1, justifyContent: "center", alignItems: "center" },
//   groupContainer: { marginBottom: 20 },
//   groupHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: "#e2e8f0",
//     gap: 8,
//   },
//   groupHeaderText: {
//     fontSize: 13,
//     fontWeight: "800",
//     color: "#334155",
//     letterSpacing: 0.5,
//   },
//   card: {
//     backgroundColor: "#FFF",
//     marginHorizontal: 12,
//     marginTop: 10,
//     borderRadius: 12,
//     padding: 16,
//     elevation: 2,
//   },
//   subUnitCard: {
//     marginLeft: 30, // Visual indentation for units within a group
//     borderLeftWidth: 3,
//     borderLeftColor: "#059669",
//   },
//   cardTop: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "flex-start",
//     marginBottom: 15,
//   },
//   addressSection: { flex: 1 },
//   unitBadge: {
//     fontSize: 10,
//     fontWeight: "bold",
//     color: "#64748b",
//     backgroundColor: "#f1f5f9",
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 4,
//     alignSelf: "flex-start",
//     marginBottom: 4,
//   },
//   streetLabel: {
//     fontSize: 16,
//     fontWeight: "700",
//     color: "#1e293b",
//   },
//   meterGrid: {
//     flexDirection: "row",
//     backgroundColor: "#f8fafc",
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 12,
//     borderWidth: 1,
//     borderColor: "#f1f5f9",
//   },
//   gridCell: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 10,
//     paddingHorizontal: 8,
//   },
//   meterCount: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: "#0f172a",
//   },
//   meterSub: {
//     fontSize: 10,
//     color: "#64748b",
//     textTransform: "uppercase",
//   },
//   editAction: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 6,
//     paddingTop: 8,
//     borderTopWidth: 1,
//     borderTopColor: "#f1f5f9",
//   },
//   editText: {
//     color: "#64748B",
//     fontWeight: "700",
//     fontSize: 12,
//   },
//   emptyStateContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 30,
//   },
//   emptyTitle: {
//     fontSize: 22,
//     fontWeight: "800",
//     color: "#475569",
//     marginTop: 20,
//     textAlign: "center",
//   },
//   emptySubText: {
//     fontSize: 15,
//     color: "#94a3b8",
//     textAlign: "center",
//     marginTop: 12,
//     lineHeight: 22,
//     marginBottom: 40,
//   },
//   initializeBtn: {
//     backgroundColor: "#007AFF",
//     paddingVertical: 16,
//     borderRadius: 12,
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     elevation: 4,
//   },
//   initializeBtnText: {
//     color: "#FFFFFF",
//     fontSize: 15,
//     fontWeight: "bold",
//     letterSpacing: 1,
//   },
//   secondaryBtn: {
//     marginTop: 15,
//     padding: 10,
//   },
//   secondaryBtnText: {
//     color: "#64748b",
//     fontWeight: "600",
//   },
//   propertyHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 10,
//     backgroundColor: "lightgrey",
//     padding: 5,
//     borderRadius: 10,
//   },
//   cardActionsRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingTop: 12,
//     marginTop: 4,
//     borderTopWidth: 1,
//     borderTopColor: "#f1f5f9",
//   },
//   actionBtn: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     gap: 6,
//     paddingVertical: 4,
//   },
//   actionBtnText: {
//     color: "#64748B",
//     fontWeight: "700",
//     fontSize: 12,
//   },
//   verticalDivider: {
//     width: 1,
//     height: 20,
//     backgroundColor: "#e2e8f0",
//   },

//   firstPrimiseBtn: {
//     backgroundColor: "#007AFF",
//     paddingVertical: 16,
//     borderRadius: 12,
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
//     elevation: 4,
//     width: "100%",
//   },
// });
