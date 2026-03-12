import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Modal,
  Portal,
  Surface,
} from "react-native-paper";

import { useGeo } from "../../../src/context/GeoContext";
import { usePremiseFilter } from "../../../src/context/PremiseFilterContext";
import { useWarehouse } from "../../../src/context/WarehouseContext";
import PremiseCard from "../../../src/features/premises/PremiseCard";

export default function PremisesScreen() {
  const router = useRouter();
  const { all, loading, scopeState } = useWarehouse();
  // console.log(`all.prems?.length`, all.prems?.length);

  const { geoState, updateGeo } = useGeo();
  // console.log(`geoState`, geoState);
  const { selectedLm, selectedWard, selectedErf, selectedPremise } = geoState;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [missionPremise, setMissionPremise] = useState(null);
  const [hasAccess, setHasAccess] = useState(true);
  const [meterType, setMeterType] = useState("");

  const { filterState } = usePremiseFilter();

  const erfById = useMemo(() => {
    const map = {};
    (all?.erfs || []).forEach((erf) => {
      if (erf?.id) map[erf.id] = erf;
    });
    return map;
  }, [all?.erfs]);

  const screenMode = useMemo(() => {
    if (!selectedLm) return "no-lm";
    if (!selectedWard) return "lm-overview";
    if (scopeState === "invalid-ward") return "invalid-ward";
    if (loading) return "loading";
    if (selectedErf) return "erf-scope";
    return "ward-scope";
  }, [selectedLm, selectedWard, selectedErf, scopeState, loading]);

  const basePremises = useMemo(() => {
    if (!selectedWard) return [];
    if (!selectedErf) return all?.prems || [];
    return (all?.prems || []).filter((p) => p?.erfId === selectedErf?.id);
  }, [all?.prems, selectedWard, selectedErf]);
  // console.log(`basePremises?.length`, basePremises?.length);

  const displayPremises = useMemo(() => {
    let list = [...basePremises];

    if (filterState?.propertyTypes?.length > 0) {
      list = list.filter((p) =>
        filterState.propertyTypes.includes(p?.propertyType?.type),
      );
    }

    if (filterState?.searchQuery) {
      const query = String(filterState.searchQuery || "")
        .toLowerCase()
        .trim();

      list = list.filter((p) => {
        const strName = p?.address?.strName?.toLowerCase() || "";
        const strNo = String(p?.address?.strNo || "").toLowerCase();
        const erfNo = String(p?.erfNo || "").toLowerCase();

        return (
          strName.includes(query) ||
          strNo.includes(query) ||
          erfNo.includes(query)
        );
      });
    }

    return list;
  }, [basePremises, filterState?.propertyTypes, filterState?.searchQuery]);

  // const basePremises = useMemo(() => {
  //   if (!selectedWard) return [];

  //   if (!selectedErf) return wardScopedPremises;

  //   return wardScopedPremises.filter((p) => p?.erfId === selectedErf?.id);
  // }, [selectedWard, selectedErf, wardScopedPremises]);

  // const displayPremises = useMemo(() => {
  //   let list = [...basePremises];

  //   if (filterState?.propertyTypes?.length > 0) {
  //     list = list.filter((p) =>
  //       filterState.propertyTypes.includes(p?.propertyType?.type),
  //     );
  //   }

  //   if (filterState?.searchQuery) {
  //     const query = String(filterState.searchQuery || "")
  //       .toLowerCase()
  //       .trim();

  //     list = list.filter((p) => {
  //       const strName = p?.address?.strName?.toLowerCase() || "";
  //       const strNo = String(p?.address?.strNo || "").toLowerCase();
  //       const erfNo = String(p?.erfNo || "").toLowerCase();
  //       const accountNo = String(p?.accountNo || "").toLowerCase();

  //       return (
  //         strName.includes(query) ||
  //         strNo.includes(query) ||
  //         erfNo.includes(query) ||
  //         accountNo.includes(query)
  //       );
  //     });
  //   }

  //   return list.sort((a, b) => {
  //     const timeA = new Date(a?.metadata?.updated?.at || 0).getTime();
  //     const timeB = new Date(b?.metadata?.updated?.at || 0).getTime();
  //     return timeB - timeA;
  //   });
  // }, [basePremises, filterState?.propertyTypes, filterState?.searchQuery]);

  const handleConfirmMission = () => {
    if (!missionPremise) return;

    setIsModalVisible(false);

    router.push({
      pathname: "/(tabs)/premises/form",
      params: {
        premiseId: missionPremise?.id,
        address:
          `${missionPremise?.address?.strNo || ""} ${missionPremise?.address?.strName || ""} ${missionPremise?.address?.strType || ""}`.trim(),
        erfNo: missionPremise?.erfNo,
        action: JSON.stringify({
          access: hasAccess ? "yes" : "no",
          meterType: meterType,
        }),
      },
    });
  };

  const handleMapPress = useCallback(
    (p) => {
      const parentErf = erfById[p?.erfId] || null;

      updateGeo({
        selectedErf: parentErf,
        selectedPremise: p,
        lastSelectionType: "PREMISE",
      });

      router.replace("/(tabs)/maps");
    },
    [erfById, router, updateGeo],
  );

  const handleEditPremise = useCallback(
    (p) => {
      router.push({
        pathname: "/premises/formPremise",
        params: { id: p?.erfId, premiseId: p?.id },
      });
    },
    [router],
  );

  const handleDiscover = useCallback(
    (p) => {
      const parentErf = erfById[p?.erfId] || null;

      updateGeo({
        selectedErf: parentErf || { id: p?.erfId, erfNo: p?.erfNo },
        selectedPremise: p,
        lastSelectionType: "PREMISE",
      });

      setMissionPremise(p);
      setHasAccess(true);
      setMeterType("");
      setIsModalVisible(true);
    },
    [erfById, updateGeo],
  );

  const handleNaPress = useCallback(
    (p) => {
      router.push({
        pathname: "/premises/NaScreen",
        params: { premiseId: p?.id },
      });
    },
    [router],
  );

  const handleDuplicate = useCallback(
    (p) => {
      router.push({
        pathname: "/premises/formPremise",
        params: { id: p?.erfId, duplicateId: p?.id },
      });
    },
    [router],
  );

  const renderPremiseItem = useCallback(
    ({ item }) => {
      const parentErf = erfById[item?.erfId];
      const wardName = parentErf?.admin?.ward?.name || "W?";
      const wardNo = String(wardName).replace(/\D/g, "");
      const isSelected = selectedPremise?.id === item?.id;

      return (
        <View style={isSelected ? styles.selectedCardWrap : undefined}>
          <PremiseCard
            item={item}
            wardNo={wardNo}
            onMapPress={handleMapPress}
            onDiscover={handleDiscover}
            onEditPress={handleEditPremise}
            onNaPress={handleNaPress}
            onDuplicate={handleDuplicate}
          />
        </View>
      );
    },
    [
      erfById,
      selectedPremise?.id,
      handleEditPremise,
      handleMapPress,
      handleDiscover,
      handleNaPress,
      handleDuplicate,
    ],
  );

  const scopeTitle = useMemo(() => {
    if (!selectedLm) return "No municipality selected";
    if (!selectedWard) return "LM Overview";
    if (selectedErf) {
      return `Premises for ERF ${selectedErf?.erfNo || selectedErf?.id || ""}`;
    }
    return `Premises for ${selectedWard?.name || selectedWard?.id || ""}`;
  }, [selectedLm, selectedWard, selectedErf]);

  if (screenMode === "no-lm") {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons
          name="map-marker-off-outline"
          size={64}
          color="#CBD5E1"
        />
        <Text style={styles.emptyText}>No municipality selected.</Text>
      </View>
    );
  }

  if (screenMode === "lm-overview") {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons
          name="map-search-outline"
          size={64}
          color="#CBD5E1"
        />
        <Text style={styles.emptyText}>Select a ward to view premises.</Text>
      </View>
    );
  }

  if (screenMode === "invalid-ward") {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={64}
          color="#F59E0B"
        />
        <Text style={styles.emptyText}>
          Selected ward is invalid for this municipality.
        </Text>
      </View>
    );
  }

  if (screenMode === "loading") {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#2563eb" />
        <Text style={styles.loadingText}>Loading premises...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.scopeBanner}>
        <View>
          <Text style={styles.scopeTitle}>{scopeTitle}</Text>
          <Text style={styles.scopeSubtitle}>
            {displayPremises.length} premise
            {displayPremises.length === 1 ? "" : "s"}
          </Text>
        </View>
        <View>
          {selectedErf ? (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/premises/formPremise",
                  params: {
                    id: selectedErf?.id, // The parent Erf ID (Anchor)
                  },
                })
              }
              style={styles.addHeaderBtn}
            >
              <MaterialCommunityIcons
                name="plus-box"
                size={48}
                color="#059669"
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/erfs")}
              style={styles.selectErfBtn}
            >
              <MaterialCommunityIcons
                name="vector-square"
                size={26}
                color="#2563eb"
              />

              <View style={styles.selectErfTextBlock}>
                <Text style={styles.selectErfSubtitle}>To ceate premise</Text>
                <Text style={styles.selectErfTitle}>SELECT ERF</Text>
              </View>

              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="#64748b"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlashList
        data={displayPremises}
        keyExtractor={(item) => item?.id}
        estimatedItemSize={180}
        contentContainerStyle={{ padding: 12 }}
        renderItem={renderPremiseItem}
        ListEmptyComponent={
          <View style={styles.container}>
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
                onPress={() =>
                  router.push({
                    pathname: "/premises/formPremise",
                    params: {
                      id: selectedErf?.id, // The parent Erf ID (Anchor)
                    },
                  })
                }
              >
                <Text style={styles.initializeBtnText}>ADD FIRST PREMISE</Text>
              </TouchableOpacity>
            </View>
          </View>

          // <View style={styles.emptyContainer}>
          //   <MaterialCommunityIcons
          //     name="office-building-marker-outline"
          //     size={64}
          //     color="#CBD5E1"
          //   />
          //   <Text style={styles.emptyText}>
          //     {selectedErf
          //       ? "No premises found for the selected erf."
          //       : "No premises found for the selected ward."}
          //   </Text>
          // </View>
        }
      />

      <Portal>
        <Modal
          visible={isModalVisible}
          onDismiss={() => setIsModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Mission Discovery</Text>

          <Surface style={styles.modalCard} elevation={1}>
            <Text style={styles.modalLabel}>Access Status</Text>
            <View style={styles.toggleRow}>
              <Button
                mode={hasAccess ? "contained" : "outlined"}
                onPress={() => setHasAccess(true)}
                style={{ flex: 1, marginRight: 4 }}
              >
                ACCESS
              </Button>
              <Button
                mode={!hasAccess ? "contained" : "outlined"}
                onPress={() => setHasAccess(false)}
                style={{ flex: 1 }}
                buttonColor={!hasAccess ? "#B22222" : undefined}
              >
                NO ACCESS
              </Button>
            </View>
          </Surface>

          {hasAccess && (
            <Surface style={styles.modalCard} elevation={1}>
              <Text style={styles.modalLabel}>Resource Type</Text>
              <View style={styles.toggleRow}>
                <Button
                  mode={meterType === "water" ? "contained" : "outlined"}
                  onPress={() => setMeterType("water")}
                  style={{ flex: 1, marginRight: 4 }}
                >
                  WATER
                </Button>
                <Button
                  mode={meterType === "electricity" ? "contained" : "outlined"}
                  onPress={() => setMeterType("electricity")}
                  style={{ flex: 1 }}
                >
                  ELEC
                </Button>
              </View>
            </Surface>
          )}

          <Button
            mode="contained"
            onPress={handleConfirmMission}
            style={styles.confirmButton}
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

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontWeight: "600",
  },

  scopeBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },

  scopeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  scopeSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 100,
    paddingHorizontal: 24,
  },

  emptyText: {
    color: "#94A3B8",
    marginTop: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  selectedCardWrap: {
    borderWidth: 4,
    borderColor: "#90b3ff",
    borderRadius: 16,
  },

  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },

  modalTitle: {
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 20,
    fontSize: 18,
    color: "#0F172A",
  },

  modalCard: {
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
  },

  modalLabel: {
    fontWeight: "700",
    color: "#334155",
  },

  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  confirmButton: {
    marginTop: 10,
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
  },

  // 8888888888888888888888888

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

  selectErfBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
  },

  selectErfTextBlock: {
    marginLeft: 10,
    marginRight: 10,
  },

  selectErfTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#2563eb",
    letterSpacing: 0.5,
  },

  selectErfSubtitle: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 1,
    fontWeight: "600",
  },
});

// import { MaterialCommunityIcons } from "@expo/vector-icons";
// import { FlashList } from "@shopify/flash-list";
// import { useRouter } from "expo-router";
// import { useCallback, useMemo, useState } from "react";
// import { StyleSheet, Text, View } from "react-native";
// import {
//   ActivityIndicator,
//   Button,
//   Modal,
//   Portal,
//   Surface,
// } from "react-native-paper";

// import { useGeo } from "../../../src/context/GeoContext";
// import { useWarehouse } from "../../../src/context/WarehouseContext";
// import PremiseCard from "../../../src/features/premises/PremiseCard";

// // 🎯 THE FIX: Direct import from the dedicated Context file
// import { usePremiseFilter } from "../../../src/context/PremiseFilterContext";

// export default function PremisesScreen() {
//   const router = useRouter();
//   const { all, loading } = useWarehouse();
//   const { updateGeo } = useGeo();

//   // 📝 LOCAL UI STATE
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [selectedPremise, setSelectedPremise] = useState(null);
//   const [hasAccess, setHasAccess] = useState(true);
//   const [meterType, setMeterType] = useState("");

//   // 🛡️ SOVEREIGN FILTER STATE (Decoupled)
//   const { filterState, setFilterState, showSearch, setShowSearch } =
//     usePremiseFilter();

//   // 🏛️ FILTER LOGIC: Memoized for A06 Performance
//   const displayPremises = useMemo(() => {
//     let list = [...(all?.prems || [])];

//     // Gate 1: Property Type
//     if (filterState?.propertyTypes?.length > 0) {
//       list = list.filter((p) =>
//         filterState.propertyTypes.includes(p?.propertyType?.type),
//       );
//     }

//     // Gate 2: Territorial Ward
//     if (filterState?.wards?.length > 0) {
//       list = list.filter((p) => {
//         const erfData = (all?.erfs || []).find((erf) => erf.id === p?.erfId);
//         const wardName = erfData?.admin?.ward?.name || "Unknown Ward";
//         return filterState.wards.includes(wardName);
//       });
//     }

//     // Gate 3: Search Query
//     if (filterState?.searchQuery) {
//       const query = filterState.searchQuery.toLowerCase();
//       list = list.filter((p) => {
//         const strName = p?.address?.strName?.toLowerCase() || "";
//         const strNo = p?.address?.strNo || "";
//         const erfNo = p?.erfNo || "";
//         return (
//           strName.includes(query) ||
//           strNo.includes(query) ||
//           erfNo.includes(query)
//         );
//       });
//     }

//     return list.sort((a, b) => {
//       const timeA = new Date(a?.metadata?.updated?.at || 0).getTime();
//       const timeB = new Date(b?.metadata?.updated?.at || 0).getTime();
//       return timeB - timeA;
//     });
//   }, [
//     all?.prems,
//     all?.erfs,
//     filterState.propertyTypes,
//     filterState.wards,
//     filterState.searchQuery,
//   ]);

//   // 🛰️ HANDLERS (The Navigation Arsenal)
//   const handleConfirmMission = () => {
//     if (!selectedPremise) return;
//     setIsModalVisible(false);
//     router.push({
//       pathname: "/(tabs)/premises/form",
//       params: {
//         premiseId: selectedPremise?.id,
//         address:
//           `${selectedPremise?.address?.strNo || ""} ${selectedPremise?.address?.strName || ""} ${selectedPremise?.address?.strType || ""}`.trim(),
//         erfNo: selectedPremise?.erfNo,
//         action: JSON.stringify({
//           access: hasAccess ? "yes" : "no",
//           meterType: meterType,
//         }),
//       },
//     });
//   };

//   const handleMapPress = useCallback(
//     (p) => {
//       const parentErf = all?.erfs?.find((e) => e.id === p?.erfId);
//       updateGeo({
//         selectedErf: parentErf || null,
//         lastSelectionType: "ERF",
//       });
//       updateGeo({
//         selectedPremise: p,
//         lastSelectionType: "PREMISE",
//       });
//       router.replace("/(tabs)/maps");
//     },
//     [all?.erfs, router, updateGeo],
//   );

//   const handleEditPremise = useCallback(
//     (p) => {
//       router.push({
//         pathname: "/erfs/form",
//         params: { id: p?.erfId, premiseId: p?.id },
//       });
//     },
//     [router],
//   );

//   const handleDiscover = useCallback(
//     (p) => {
//       const parentErf = all?.erfs?.find((e) => e.id === p.erfId);
//       updateGeo({
//         selectedPremise: p,
//         selectedErf: parentErf || { id: p?.erfId, erfNo: p?.erfNo },
//         lastSelectionType: "PREMISE",
//       });
//       setSelectedPremise(p);
//       setIsModalVisible(true);
//     },
//     [all?.erfs, updateGeo],
//   );

//   const handleNaPress = useCallback(
//     (p) => {
//       router.push({
//         pathname: "/premises/NaScreen",
//         params: { premiseId: p?.id },
//       });
//     },
//     [router],
//   );

//   const handleDuplicate = useCallback(
//     (p) => {
//       router.push({
//         pathname: "/erfs/form",
//         params: { id: p?.erfId, duplicateId: p?.id },
//       });
//     },
//     [router],
//   );

//   // 📋 RENDER ITEM
//   const renderPremiseItem = useCallback(
//     ({ item }) => {
//       const parentErf = all?.erfs?.find((e) => e.id === item?.erfId);
//       const wardName = parentErf?.admin?.ward?.name || "W?";
//       const wardNo = wardName.replace(/\D/g, "");

//       return (
//         <PremiseCard
//           item={item}
//           wardNo={wardNo}
//           onMapPress={handleMapPress}
//           onDiscover={handleDiscover}
//           onEditPress={handleEditPremise}
//           onNaPress={handleNaPress}
//           onDuplicate={handleDuplicate}
//         />
//       );
//     },
//     [
//       all?.erfs,
//       handleEditPremise,
//       handleMapPress,
//       handleDiscover,
//       handleNaPress,
//       handleDuplicate,
//     ],
//   );

//   if (loading) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator color="#2563eb" />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <FlashList
//         data={displayPremises}
//         keyExtractor={(item) => item?.id}
//         estimatedItemSize={180}
//         contentContainerStyle={{ padding: 12 }}
//         renderItem={renderPremiseItem}
//         ListEmptyComponent={
//           <View style={styles.emptyContainer}>
//             <MaterialCommunityIcons
//               name="office-building-marker-outline"
//               size={64}
//               color="#CBD5E1"
//             />
//             <Text style={styles.emptyText}>No premises found.</Text>
//           </View>
//         }
//       />

//       {/* 🏛️ DISCOVERY MODAL */}
//       <Portal>
//         <Modal
//           visible={isModalVisible}
//           onDismiss={() => setIsModalVisible(false)}
//           contentContainerStyle={styles.modalContainer}
//         >
//           <Text variant="headlineSmall" style={styles.modalTitle}>
//             Mission Discovery
//           </Text>
//           <Surface style={styles.modalCard} elevation={1}>
//             <Text variant="labelLarge">Access Status</Text>
//             <View style={styles.toggleRow}>
//               <Button
//                 mode={hasAccess ? "contained" : "outlined"}
//                 onPress={() => setHasAccess(true)}
//                 style={{ flex: 1, marginRight: 4 }}
//               >
//                 ACCESS
//               </Button>
//               <Button
//                 mode={!hasAccess ? "contained" : "outlined"}
//                 onPress={() => setHasAccess(false)}
//                 style={{ flex: 1 }}
//                 buttonColor={!hasAccess ? "#B22222" : null}
//               >
//                 NO ACCESS
//               </Button>
//             </View>
//           </Surface>

//           {hasAccess && (
//             <Surface style={styles.modalCard} elevation={1}>
//               <Text variant="labelLarge">Resource Type</Text>
//               <View style={styles.toggleRow}>
//                 <Button
//                   mode={meterType === "water" ? "contained" : "outlined"}
//                   onPress={() => setMeterType("water")}
//                   style={{ flex: 1, marginRight: 4 }}
//                 >
//                   WATER
//                 </Button>
//                 <Button
//                   mode={meterType === "electricity" ? "contained" : "outlined"}
//                   onPress={() => setMeterType("electricity")}
//                   style={{ flex: 1 }}
//                 >
//                   ELEC
//                 </Button>
//               </View>
//             </Surface>
//           )}

//           <Button
//             mode="contained"
//             onPress={handleConfirmMission}
//             style={styles.confirmButton}
//           >
//             START DISCOVERY
//           </Button>
//         </Modal>
//       </Portal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#F8FAFC" },
//   centered: { flex: 1, justifyContent: "center", alignItems: "center" },
//   emptyContainer: { alignItems: "center", marginTop: 100 },
//   emptyText: { color: "#94A3B8", marginTop: 12, fontWeight: "600" },
//   modalContainer: {
//     backgroundColor: "white",
//     padding: 20,
//     margin: 20,
//     borderRadius: 12,
//   },
//   modalTitle: { textAlign: "center", fontWeight: "bold", marginBottom: 20 },
//   modalCard: {
//     padding: 15,
//     marginBottom: 15,
//     borderRadius: 8,
//     backgroundColor: "#f9f9f9",
//   },
//   toggleRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginTop: 10,
//   },
//   confirmButton: {
//     marginTop: 10,
//     borderRadius: 8,
//     height: 50,
//     justifyContent: "center",
//   },
// });
