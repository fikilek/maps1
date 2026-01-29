import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// 🏛️ SOVEREIGN CONTEXTS ONLY
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useGeo } from "../../context/GeoContext";
import { useWarehouse } from "../../context/WarehouseContext";
import { HandleNuclearReset } from "../../test/mmkvNuclearReset";
import StealthAuditor from "../../test/premisesDiagnosis";
import ErfFilterHeader from "./erfFilterHeader";

// function ErfItem({ item, isActive, onSelect, onMapPress, onErfDetailPress }) {
//   const premiseCount = `${item?.totals?.premises ?? item?.premises?.length ?? 0}`;
//   const summaryIcon = `${item?.summaryIcon || "home-city-outline"}`;

//   return (
//     <View style={[styles?.itemWrapper, isActive && styles?.activeItemWrapper]}>
//       <View style={styles?.itemContainer}>
//         <TouchableOpacity
//           style={styles?.infoSection}
//           onPress={() => onSelect(item?.id)}
//           activeOpacity={0.7}
//         >
//           <View style={styles?.row}>
//             <Text style={[styles?.parcelText, isActive && styles?.activeText]}>
//               {/* 🛡️ FORCE STRING */}
//               {`ERF ${item?.erfNo || "N/A"}`}
//             </Text>
//           </View>

//           {/* 🎯 THE CRASH ZONE: Force Ward name to string */}
//           <Text style={styles?.wardText}>
//             {`${item?.admin?.ward?.name || item?.ward || "Unknown Ward"}`}
//           </Text>

//           {/* 🛡️ FORCE STRING */}
//           <Text style={styles?.idText}>{`${item?.id || "N/Av"}`}</Text>
//         </TouchableOpacity>

//         {/* ... rest of the component ... */}
//         <View style={styles.dashboardCol}>
//           <Text style={styles.bigCountText}>{premiseCount}</Text>
//         </View>
//       </View>
//     </View>
//   );
// }

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
          {/* <Text style={styles?.wardText}>{item?.admin?.ward?.name}</Text> */}
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

export default function ErfsScreen() {
  // console.log(``);
  // console.log(`ErfsScreen ----mounting `);
  const flatListRef = useRef(null);
  const router = useRouter();

  // 🏛️ Now these will work because of the 'export' fix!
  const { geoState, setGeoState } = useGeo();
  // console.log(`ErfsScreen ----geoState?.selectedWard`, geoState?.selectedWard);

  const { all, filtered, loading } = useWarehouse();
  // console.log(`ErfsScreen ----filtered`, filtered);

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
        search={""}
        setSearch={() => {}}
        // 🛡️ Pass the object as is
        selectedWard={geoState.selectedWard}
        // 🎯 THE FIX: Rename the argument to 'ward' to reflect reality
        // and ensure we are passing the whole object to the state
        setSelectedWard={(ward) => {
          console.log("📡 [GOC]: Updating Ward to:", ward?.name || ward);
          // setGeoState({ selectedWard: ward });
          setGeoState((prev) => ({ ...prev, selectedWard: ward }));
        }}
        availableWards={all?.wards}
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
              const isAlreadySelected = geoState?.selectedErf?.id === item.id;

              if (isAlreadySelected) {
                // 🛡️ FIX: Spread the previous state to keep LM/Ward!
                setGeoState((prev) => ({ ...prev, selectedErf: null }));
                console.log("📴 [DESELECTED]: Filter cleared.");
              } else {
                // 🛡️ FIX: Spread the previous state!
                setGeoState((prev) => ({ ...prev, selectedErf: item }));
                console.log(`🎯 [SELECTED]: Erf ${item.erfNo}`);
              }
            }}
            onMapPress={() => {
              // 🛡️ FIX: Spread the previous state!
              setGeoState((prev) => ({ ...prev, selectedErf: item }));
              router.push("/(tabs)/maps");
            }}
            onErfDetailPress={(item) => {
              // 🛡️ FIX: Spread the previous state!
              setGeoState((prev) => ({ ...prev, selectedErf: item }));
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
            onSelect={() => {
              // 🎯 THE TOGGLE LOGIC:
              const isAlreadySelected = geoState?.selectedErf?.id === item.id;

              if (isAlreadySelected) {
                // If tapping the same one, clear it (deselect)
                setGeoState({ selectedErf: null });
                console.log("📴 [DESELECTED]: Filter cleared.");
              } else {
                // Otherwise, select it
                setGeoState({ selectedErf: item });
                console.log(`🎯 [SELECTED]: Erf ${item.erfNo}`);
              }
            }}
            onMapPress={() => {
              setGeoState({ selectedErf: item });
              router.push("/(tabs)/maps");
            }}
            onErfDetailPress={(item) => {
              setGeoState({ selectedErf: item });
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
