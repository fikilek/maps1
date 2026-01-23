import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// 🏛️ SOVEREIGN CONTEXTS ONLY
import { useGeo } from "../../context/GeoContext";
import { useWarehouse } from "../../context/WarehouseContext";
import { HandleNuclearReset } from "../../test/mmkvNuclearReset";
import StealthAuditor from "../../test/premisesDiagnosis";
import ErfFilterHeader from "./erfFilterHeader";

function ErfItem({ item, isActive, onSelect, onMapPress, onErfDetailPress }) {
  // 🎯 Extract just what we need.
  // We use item?.premises?.length as a fallback if totals isn't calculated yet.
  const premiseCount = item?.totals?.premises ?? item?.premises?.length ?? 0;
  const summaryIcon = item?.summaryIcon || "home-city-outline";

  return (
    <View style={[styles?.itemWrapper, isActive && styles?.activeItemWrapper]}>
      <View style={styles?.itemContainer}>
        {/* 🎯 PILLAR 1: SELECTION & INFO (LEFT) */}
        <TouchableOpacity
          style={styles?.infoSection}
          onPress={() => onSelect(item?.id)}
          activeOpacity={0.7}
        >
          <View style={styles?.row}>
            <Text style={[styles?.parcelText, isActive && styles?.activeText]}>
              ERF {item?.erfNo || "N/A"}
            </Text>
          </View>
          <Text style={styles?.wardText}>{item?.admin?.ward?.name}</Text>
          <Text style={styles?.idText}>{item?.id || "N/Av"}</Text>
        </TouchableOpacity>

        {/* 🎯 PILLAR 2: PREMISE DASHBOARD (CENTER) - Simplified */}
        <TouchableOpacity
          style={styles.premiseSection}
          onPress={() => onErfDetailPress(item)}
        >
          <View style={styles.dashboardRowCentric}>
            <View style={styles.dashboardCol}>
              <MaterialCommunityIcons
                name={summaryIcon}
                size={22}
                color={isActive ? "#4CAF50" : "#455a64"}
              />
            </View>
            <View style={styles.dashboardCol}>
              <Text style={styles.bigCountText}>{premiseCount}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 🎯 PILLAR 3: MAP TRANSITION (RIGHT) */}
        <TouchableOpacity
          style={styles?.actionSection}
          onPress={() => onMapPress(item?.id)}
        >
          <View
            style={[styles?.iconCircle, isActive && styles?.activeIconCircle]}
          >
            <MaterialCommunityIcons
              name="map-search"
              size={24}
              color={isActive ? "#4CAF50" : "#00BFFF"}
            />
          </View>
          <Text style={[styles?.mapLinkText, isActive && { color: "#4CAF50" }]}>
            {isActive ? "GO TO" : "MAP"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// const ErfItem = memo(
//   function ErfItem({ item, isActive, onSelect, onMapPress, onErfDetailPress }) {
//     // 🎯 Warehouse already shredded this: totals { premises, water, elec }
//     const {
//       totals = { premises: item?.premises?.length, water: 0, elec: 0 },
//       summaryIcon = "home",
//     } = item;
//     // console.log(`erfNo`, item?.id);

//     return (
//       <View
//         style={[styles?.itemWrapper, isActive && styles?.activeItemWrapper]}
//       >
//         <View style={styles?.itemContainer}>
//           {/* 🎯 PILLAR 1: SELECTION & INFO (LEFT) */}
//           <TouchableOpacity
//             style={styles?.infoSection}
//             onPress={() => onSelect(item?.id)}
//             activeOpacity={0.7}
//           >
//             <View style={styles?.row}>
//               <Text
//                 style={[styles?.parcelText, isActive && styles?.activeText]}
//               >
//                 ERF {item?.erfNo || "N/A"}
//               </Text>
//             </View>
//             <Text style={styles?.wardText}>{item?.admin?.ward?.name}</Text>
//             <Text style={styles?.idText}>{item?.id || "N/Av"}</Text>
//           </TouchableOpacity>

//           {/* 🎯 PILLAR 2: PREMISE DASHBOARD (CENTER) */}
//           <TouchableOpacity
//             style={styles.premiseSection}
//             onPress={() => onErfDetailPress(item)}
//           >
//             {/* 🏛️ ROW 1: OCCUPANCY & TYPE */}
//             <View style={styles.dashboardRow}>
//               <View style={styles.dashboardCol}>
//                 <Text style={styles.bigCountText}>{totals?.premises || 0}</Text>
//               </View>
//               <View style={styles.dashboardCol}>
//                 <MaterialCommunityIcons
//                   name={summaryIcon}
//                   size={18}
//                   color="#455a64"
//                 />
//               </View>
//             </View>

//             {/* 🏛️ ROW 2: SERVICE INFRASTRUCTURE */}
//             <View style={styles.dashboardRow}>
//               <View style={styles.dashboardCol}>
//                 <View style={styles.serviceItem}>
//                   <MaterialCommunityIcons
//                     name="flash"
//                     size={14}
//                     color="#FBC02D"
//                   />
//                   <Text style={styles.serviceCount}>{totals?.elec || 0}</Text>
//                 </View>
//               </View>
//               <View style={styles.dashboardCol}>
//                 <View style={styles.serviceItem}>
//                   <MaterialCommunityIcons
//                     name="water"
//                     size={14}
//                     color="#1976D2"
//                   />
//                   <Text style={styles.serviceCount}>{totals?.water || 0}</Text>
//                 </View>
//               </View>
//             </View>
//           </TouchableOpacity>

//           {/* 🎯 PILLAR 3: MAP TRANSITION (RIGHT) */}
//           <TouchableOpacity
//             style={styles?.actionSection}
//             onPress={() => onMapPress(item?.id)}
//           >
//             <View
//               style={[styles?.iconCircle, isActive && styles?.activeIconCircle]}
//             >
//               <MaterialCommunityIcons
//                 name="map-search"
//                 size={24}
//                 color={isActive ? "#4CAF50" : "#00BFFF"}
//               />
//             </View>
//             <Text
//               style={[styles?.mapLinkText, isActive && { color: "#4CAF50" }]}
//             >
//               {isActive ? "GO TO" : "MAP"}
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   },
//   (prev, next) =>
//     prev?.isActive === next?.isActive &&
//     prev?.item?.id === next?.item?.id &&
//     prev?.item?.updatedAt === next?.item?.updatedAt,
// );

export default function ErfsScreen() {
  // console.log(``);
  // console.log(`ErfsScreen ----mounting `);
  const flatListRef = useRef(null);
  const router = useRouter();

  // 🏛️ Now these will work because of the 'export' fix!
  const { geoState, updateGeo } = useGeo();
  // console.log(`ErfsScreen ----geoState?.selectedWard`, geoState?.selectedWard);

  const { all, filtered, loading } = useWarehouse();

  const erfs = filtered.erfs;
  const wards = filtered.wards;

  useEffect(() => {
    if (erfs?.length > 0) {
      console.log(
        `🔎 [SCAN COMPLETE]: Found ${erfs?.length} Filtered Erfs in ErfsScreen .`,
      );
      console.log(
        `🔎 [SCAN COMPLETE]: Found ${wards?.length} Filtered Wards in ErfsScreen .`,
      );
    }
  }, [erfs]);

  return (
    <View style={styles.container}>
      {/* FOR TESTING ONLY - DO NOT DELETE */}
      <View>
        <HandleNuclearReset />
        <StealthAuditor />
      </View>

      <ErfFilterHeader
        // 🎯 Note: Since Warehouse doesn't have 'filters' yet,
        // we use geoState or local state for now
        search={""}
        setSearch={() => {}}
        selectedWard={geoState.selectedWard}
        setSelectedWard={(wardName) => updateGeo({ selectedWard: wardName })}
        availableWards={all?.wards} // Will come from 'wards' in Warehouse
        filteredCount={erfs?.length || 0}
        totalCount={erfs?.length || 0}
      />

      <FlashList
        ref={flatListRef}
        data={erfs || []}
        keyExtractor={(item) => item?.id}
        extraData={geoState?.selectedErf?.id}
        estimatedItemSize={106}
        renderItem={({ item }) => (
          <ErfItem
            item={item}
            isActive={item?.id === geoState?.selectedErf?.id}
            onSelect={() => {
              // 🎯 THE TOGGLE LOGIC:
              const isAlreadySelected = geoState?.selectedErf?.id === item.id;

              if (isAlreadySelected) {
                // If tapping the same one, clear it (deselect)
                updateGeo({ selectedErf: null });
                console.log("📴 [DESELECTED]: Filter cleared.");
              } else {
                // Otherwise, select it
                updateGeo({ selectedErf: item });
                console.log(`🎯 [SELECTED]: Erf ${item.erfNo}`);
              }
            }}
            onMapPress={() => {
              updateGeo({ selectedErf: item });
              router.push("/(tabs)/maps");
            }}
            onErfDetailPress={(item) => {
              updateGeo({ selectedErf: item });
              router.push(`/erfs/${item.id}`);
            }}
          />
        )}
      />

      {/* <FlashList
        ref={flatListRef}
        data={erfs || []}
        keyExtractor={(item) => item?.id}
        extraData={geoState?.selectedErf?.id}
        estimatedItemSize={106}
        renderItem={({ item }) => (
          <ErfItem
            item={item}
            isActive={item?.id === geoState?.selectedErf?.id}
            onSelect={() => updateGeo({ selectedErf: item })}
            onMapPress={() => {
              updateGeo({ selectedErf: item });
              router.push("/(tabs)/maps");
            }}
            onErfDetailPress={(item) => {
              // Use the dynamic route we just created
              updateGeo({ selectedErf: item });
              router.push(`/erfs/${item.id}`);
            }}
          />
        )}
      /> */}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  itemWrapper: {
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: "white",
    elevation: 3,
  },
  activeItemWrapper: {
    borderColor: "#00BFFF",
    borderWidth: 2,
    backgroundColor: "#f0faff",
  },
  itemContainer: { flexDirection: "row", alignItems: "center", padding: 12 },
  infoSection: { flex: 1.5 },
  // premiseSection: {
  //   flex: 1,
  //   alignItems: "center",
  //   borderLeftWidth: 1,
  //   borderRightWidth: 1,
  //   borderColor: "#eee",
  //   paddingHorizontal: 8,
  // },
  actionSection: { flex: 0.5, alignItems: "center" },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0faff",
    justifyContent: "center",
    alignItems: "center",
  },
  activeIconCircle: { backgroundColor: "#e8f5e9" },
  parcelText: { fontSize: 18, fontWeight: "800", color: "#2c3e50" },
  activeText: { color: "#00BFFF" },
  idText: { fontSize: 11, color: "#95a5a6", fontFamily: "monospace" },
  wardText: { fontSize: 12, color: "#7f8c8d", marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  mapLinkText: { fontSize: 10, fontWeight: "bold", color: "#00BFFF" },
  syncingBanner: {
    backgroundColor: "#e3f2fd",
    paddingVertical: 4,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  syncingText: { fontSize: 10, color: "#1976d2", fontWeight: "bold" },
  summaryStats: { alignItems: "center", marginTop: 4 },
  serviceDots: { flexDirection: "row", gap: 4, marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statText: { fontSize: 10, fontWeight: "bold", color: "#666" },

  premiseSection: {
    flex: 0.5,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#eee",
    paddingVertical: 4,
  },
  dashboardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    marginVertical: 1,
  },
  dashboardCol: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  bigCountText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#2c3e50",
  },
  serviceCount: {
    fontSize: 11,
    fontWeight: "600",
    color: "#546e7a",
  },
});
