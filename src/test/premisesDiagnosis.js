import { useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useGeo } from "../context/GeoContext";
import { useWarehouse } from "../context/WarehouseContext";
import { erfsApi } from "../redux/erfsApi";
import { premisesApi } from "../redux/premisesApi";
// import { useAuth } from "../src/hooks/useAuth"; // 🎯 Added Auth hook
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import { erfMemory } from "../storage/erfMemory";
import { premiseMemory } from "../storage/premiseMemory";

const EMPTY_META = { metaEntries: [] };
const EMPTY_PREMS = [];

const StealthAuditor = () => {
  const [visible, setVisible] = useState(false);
  const warehouse = useWarehouse();
  const { geoState } = useGeo();
  const { activeWorkbase } = useAuth(); // 🎯 Pilot's current location

  // 🛰️ DYNAMIC PCODE: Follow the active workbase
  const currentPcode = activeWorkbase?.id;

  // 🧠 REDUX CACHE SELECTORS (Dynamic Pcode)
  const ramErfData = useSelector(
    (state) =>
      erfsApi?.endpoints?.getErfsByLmPcode?.select({ lmPcode: currentPcode })(
        state,
      )?.data || EMPTY_META,
  );

  const ramPremiseData = useSelector(
    (state) =>
      premisesApi?.endpoints?.getPremisesByLmPcode?.select({
        lmPcode: currentPcode,
      })(state)?.data || EMPTY_PREMS,
  );

  const auditReport = useMemo(() => {
    if (!currentPcode) return null;

    // 🧠 1. RAM DATA (Active Context)
    const lib = warehouse?.all?.geoLibrary || {};
    const geoKeys = Object.keys(lib);
    const validGeoCount = geoKeys?.reduce((acc, key) => {
      // Filter for Erf geometries specifically
      const isErf = key.length > 10;
      const hasGeo = !!lib[key]?.geometry;
      if (isErf && hasGeo) return acc + 1;
      return acc;
    }, 0);

    const ramErfs = ramErfData?.metaEntries || [];
    const ramPrems = ramPremiseData || [];

    // 💾 2. DISK DATA (Active Context)
    const diskErfs = erfMemory?.getErfsMetaList(currentPcode) || [];
    const diskPremises = premiseMemory?.getLmList(currentPcode) || [];
    const diskShardsCount = erfMemory?.getGeoCount
      ? erfMemory.getGeoCount(currentPcode)
      : 0;

    // 🌍 3. GLOBAL VAULT SCAN (The Garrison Registry)
    // We scan ALL keys in the vault to find every LM stored
    const allVaultKeys = erfMemory.getAllKeys ? erfMemory.getAllKeys() : [];

    const registry = allVaultKeys
      .filter((key) => key.startsWith("meta_ZA")) // Look for LM Metadata shards
      .map((key) => {
        const pcode = key.replace("meta_", "");
        // Quick count for the list
        const meta = erfMemory.getErfsMetaList(pcode) || [];
        return {
          pcode,
          count: meta.length,
          isActive: pcode === currentPcode,
        };
      })
      .sort((a, b) => b.count - a.count);

    // 📟 4. METER LOGIC (RAM vs DISK)

    // 📟 4. METER LOGIC (Sovereign Array + Count Check)
    const countMeters = (prems) =>
      prems.reduce(
        (acc, p) => {
          // 🎯 Detect if it's an array (waterMeters) or a direct count (waterMeter)
          const wCount = Array.isArray(p?.services?.waterMeters)
            ? p.services.waterMeters.length
            : p?.services?.waterMeter || 0;

          const eCount = Array.isArray(p?.services?.electricityMeters)
            ? p.services.electricityMeters.length
            : p?.services?.electricityMeter || 0;

          return {
            water: acc.water + wCount,
            elec: acc.elec + eCount,
          };
        },
        { water: 0, elec: 0 },
      );

    const ramMeters = countMeters(ramPrems);
    const diskMeters = countMeters(diskPremises);

    return {
      pcode: currentPcode,
      name: activeWorkbase?.name,
      ram: {
        erfs: ramErfs.length,
        geo: validGeoCount,
        prems: ramPrems.length,
        meters: ramMeters.water + ramMeters.elec,
      },
      disk: {
        erfs: diskErfs.length,
        geo: diskShardsCount,
        prems: diskPremises.length,
        meters: diskMeters.water + diskMeters.elec,
      },
      registry, // 🎯 Now shows ALL municipalities in the vault
      isSynced:
        ramErfs.length === diskErfs.length &&
        ramPrems.length === diskPremises.length,
    };
  }, [
    ramErfData,
    ramPremiseData,
    currentPcode,
    warehouse?.all?.geoLibrary,
    geoState,
    activeWorkbase,
  ]);
  console.log(`StealthAuditor --auditReport`, auditReport);

  if (!currentPcode) return null;

  return (
    <>
      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: auditReport?.isSynced ? "#4CD964" : "#FF9500" },
        ]}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.fabText}>📊</Text>
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Sovereign Diagnostic</Text>
              <Text style={styles.headerSub}>
                Scoping: {auditReport?.name} ({auditReport?.pcode})
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setVisible(false)}
              style={styles.closeBtn}
            >
              <Text style={styles.closeText}>CLOSE</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>📍 ACTIVE CONTEXT</Text>
            <View style={styles.contextCard}>
              <ContextRow label="Workbase" value={auditReport?.name} />
              <ContextRow
                label="Pilot Erf"
                value={geoState?.selectedErf?.erfNo || "None"}
              />
              <ContextRow
                label="Sync Status"
                value={auditReport?.isSynced ? "✅ MATCH" : "⚠️ DELTA"}
              />
            </View>

            <Text style={styles.sectionTitle}>
              💾 STORAGE INTEGRITY (RAM vs DISK)
            </Text>
            <View style={styles.statsContainer}>
              <AuditCard
                title="🧠 RAM CACHE"
                data={auditReport?.ram}
                color="#007AFF"
              />
              <AuditCard
                title="💾 MMKV DISK"
                data={auditReport?.disk}
                color="#4CD964"
              />
            </View>

            {/* 🏛️ GLOBAL REGISTRY SECTION */}
            <Text style={styles.sectionTitle}>
              🌍 GLOBAL MMKV REGISTRY (ALL STORED MUNIS)
            </Text>
            <View style={styles.contextCard}>
              {auditReport?.registry?.length === 0 ? (
                <Text style={styles.emptyText}>No data on disk yet.</Text>
              ) : (
                auditReport.registry.map((muni) => (
                  <View key={muni.pcode} style={styles.registryRow}>
                    <View style={styles.muniLabelGroup}>
                      <MaterialCommunityIcons
                        name="database"
                        size={12}
                        color="#64748b"
                      />
                      <Text style={styles.muniPcode}>{muni.pcode}</Text>
                      {muni.pcode === auditReport.pcode && (
                        <View style={styles.activePill}>
                          <Text style={styles.activeText}>ACTIVE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.muniCount}>{muni.count} Erfs</Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const ContextRow = ({ label, value, isBroken }) => (
  <View style={styles.contextRow}>
    <Text style={styles.contextLabel}>{label}:</Text>
    <Text
      style={[
        styles.contextValue,
        isBroken && { color: "#FF3B30", fontWeight: "900" },
      ]}
    >
      {value} {isBroken ? "⚠️ ORPHAN" : ""}
    </Text>
  </View>
);

const AuditCard = ({ title, data, color }) => {
  console.log(`title`, title);
  console.log(`data`, data);
  return (
    <View style={[styles.card, { borderTopColor: color }]}>
      <Text style={[styles.cardTitle, { color }]}>{title}</Text>
      <Text style={styles.statLabel}>
        Erfs: <Text style={styles.statVal}>{data?.erfs}</Text>
      </Text>
      <Text style={styles.statLabel}>
        Geo: <Text style={styles.statVal}>{data?.geo}</Text>
      </Text>
      <Text style={styles.statLabel}>
        Prems: <Text style={styles.statVal}>{data?.prems}</Text>
      </Text>
      <Text style={styles.statLabel}>
        Meters: <Text style={styles.statVal}>{data?.meters}</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    zIndex: 9999,
  },
  fabText: { fontSize: 24 },
  modalContainer: { flex: 1, backgroundColor: "#F2F2F7" },
  header: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  headerTitle: { fontSize: 18, fontWeight: "900" },
  closeBtn: { padding: 8, backgroundColor: "#FF3B30", borderRadius: 6 },
  closeText: { color: "#fff", fontWeight: "bold" },
  content: { padding: 15 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#8E8E93",
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: 1,
  },
  contextCard: { backgroundColor: "#fff", padding: 15, borderRadius: 12 },
  contextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  contextLabel: { fontSize: 12, color: "#8E8E93", fontWeight: "600" },
  contextValue: { fontSize: 12, fontWeight: "800" },
  statsContainer: { flexDirection: "row", justifyContent: "space-between" },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    borderTopWidth: 5,
  },
  cardTitle: { fontWeight: "900", fontSize: 11, marginBottom: 8 },
  statLabel: { fontSize: 10, color: "#8E8E93", marginBottom: 2 },
  statVal: { color: "#000", fontWeight: "800" },
  signalBadge: {
    marginTop: 10,
    padding: 6,
    borderRadius: 4,
    alignItems: "center",
  },
  signalText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  registryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f1f5f9",
  },
  muniLabelGroup: { flexDirection: "row", alignItems: "center", gap: 6 },
  muniPcode: { fontSize: 13, fontWeight: "700", color: "#1e293b" },
  muniCount: { fontSize: 12, fontWeight: "800", color: "#059669" },
  activePill: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#2563eb",
  },
  activeText: { fontSize: 8, fontWeight: "900", color: "#2563eb" },
  emptyText: {
    fontSize: 12,
    color: "#94a3b8",
    fontStyle: "italic",
    textAlign: "center",
  },
});

export default StealthAuditor;

// import { useMemo, useState } from "react";
// import {
//   Modal,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useSelector } from "react-redux";
// import { useGeo } from "../context/GeoContext";
// import { useWarehouse } from "../context/WarehouseContext";
// import { erfsApi } from "../redux/erfsApi";
// import { premisesApi } from "../redux/premisesApi";
// import { erfMemory } from "../storage/erfMemory";
// import { premiseMemory } from "../storage/premiseMemory";

// const EMPTY_META = { metaEntries: [] };
// const EMPTY_PREMS = [];

// const StealthAuditor = ({ lmPcode = "ZA1048" }) => {
//   const [visible, setVisible] = useState(false);
//   const warehouse = useWarehouse();
//   // console.log(
//   //   `StealthAuditor ----warehouse.all.geoLibrary.ZA1048.coordinates`,
//   //   warehouse.all.geoLibrary.ZA1048.coordinates,
//   // );
//   const { geoState } = useGeo();

//   // 🧠 REDUX CACHE SELECTORS (RAM)
//   const ramErfData = useSelector(
//     (state) =>
//       erfsApi?.endpoints?.getErfsByLmPcode?.select({ lmPcode })(state)?.data ||
//       EMPTY_META,
//   );

//   const ramPremiseData = useSelector(
//     (state) =>
//       premisesApi?.endpoints?.getPremisesByLmPcode?.select({ lmPcode })(state)
//         ?.data || EMPTY_PREMS,
//   );

//   const auditReport = useMemo(() => {
//     // 🧠 1. RAM DATA (Warehouse geoLibrary)
//     const lib = warehouse?.all?.geoLibrary || {};
//     const geoKeys = Object.keys(lib);

//     const validGeoCount = geoKeys?.reduce((acc, key) => {
//       // We count keys that start with 'W' (Erf ID signature) and have a geometry object
//       if (key?.startsWith("W") && lib[key]?.geometry) {
//         return acc + 1;
//       }
//       return acc;
//     }, 0);

//     // 💾 2. DISK DATA (MMKV Shreds)
//     const diskRaw = erfMemory?.getErfsMetaList(lmPcode);
//     const diskErfs = Array?.isArray(diskRaw)
//       ? diskRaw
//       : diskRaw?.metaEntries || [];
//     const diskPremises = premiseMemory?.getLmList(lmPcode) || [];

//     // 🕵️ THE SHARD SCANNER: Count individual keys in MMKV that match our pattern
//     // This replaces the old 'Object.keys(diskGeo).length' logic
//     const diskShardsCount = erfMemory?.getGeoCount();

//     // 🧠 3. RAM DATA COUNTS
//     const ramErfs = ramErfData?.metaEntries || [];

//     // 🎯 4. METER & LINK LOGIC
//     const countMeters = (prems) =>
//       prems.reduce(
//         (acc, p) => ({
//           water: acc?.water + (p.services?.waterMeters?.length || 0),
//           elec: acc?.elec + (p.services?.electricityMeters?.length || 0),
//         }),
//         { water: 0, elec: 0 },
//       );

//     const ramMeters = countMeters(ramPremiseData);
//     const diskMeters = countMeters(diskPremises);

//     return {
//       ram: {
//         erfs: ramErfs?.length,
//         geo: validGeoCount,
//         prems: ramPremiseData?.length || 0,
//         meters: ramMeters?.water + ramMeters?.elec,
//         links: ramErfs?.reduce((acc, e) => acc + (e?.premises?.length || 0), 0),
//       },
//       disk: {
//         erfs: diskErfs?.length,
//         geo: diskShardsCount, // 🎯 Now reports the actual number of shreds on disk
//         prems: diskPremises?.length,
//         meters: diskMeters?.water + diskMeters?.elec,
//         links: diskErfs.reduce((acc, e) => acc + (e?.premises?.length || 0), 0),
//       },
//       linkedErfs: diskErfs
//         .filter((e) => e?.premises?.length > 0)
//         .map((e) => ({ erfNo: e?.erfNo, count: e?.premises.length })),
//       premiseMeterLinks: diskPremises.map((p) => ({
//         erfNo: p?.erfNo || "??",
//         id: p?.id?.slice(-6),
//         water: p?.services?.waterMeters?.length || 0,
//         elec: p?.services?.electricityMeters?.length || 0,
//       })),
//       isSynced:
//         ramErfs?.length === diskErfs?.length &&
//         ramPremiseData?.length === diskPremises?.length &&
//         validGeoCount === diskShardsCount, // 🛡️ Checks if RAM shreds match DISK shreds
//     };
//   }, [ramErfData, ramPremiseData, lmPcode, warehouse?.all?.geoLibrary]);

//   return (
//     <>
//       <TouchableOpacity
//         style={[
//           styles.fab,
//           { backgroundColor: auditReport?.isSynced ? "#4CD964" : "#FF9500" },
//         ]}
//         onPress={() => setVisible(true)}
//       >
//         <Text style={styles.fabText}>📊</Text>
//       </TouchableOpacity>

//       <Modal visible={visible} animationType="slide">
//         <SafeAreaView style={styles.modalContainer}>
//           <View style={styles.header}>
//             <Text style={styles.headerTitle}>System Diagnostic</Text>
//             <TouchableOpacity
//               onPress={() => setVisible(false)}
//               style={styles.closeBtn}
//             >
//               <Text style={styles.closeText}>CLOSE</Text>
//             </TouchableOpacity>
//           </View>

//           <ScrollView style={styles.content}>
//             {/* 📍 SECTION 1: GEO CONTEXT (The Compass) */}
//             <Text style={styles.sectionTitle}>📍 GEO CONTEXT</Text>
//             <View style={styles.contextCard}>
{
  /* <ContextRow label="LM" value={geoState.selectedLm?.id || "None"} />; */
}
//               <ContextRow
//                 label="Ward"
//                 value={geoState?.selectedWard || "None"}
//               />
//               <ContextRow
//                 label="Erf"
//                 value={geoState?.selectedErf?.erfNo || "None"}
//               />
//               <ContextRow
//                 label="Premise"
//                 value={geoState?.selectedPremise?.id?.slice(-6) || "None"}
//               />
//             </View>

//             {/* 💾 SECTION 2: STORAGE INTEGRITY (RAM vs DISK) */}
//             <Text style={styles.sectionTitle}>💾 STORAGE INTEGRITY</Text>
//             <View style={styles.statsContainer}>
//               <AuditCard
//                 title="🧠 RAM CACHE"
//                 data={auditReport.ram}
//                 color="#007AFF"
//               />
//               <AuditCard
//                 title="💾 MMKV DISK"
//                 data={auditReport?.disk}
//                 color="#4CD964"
//               />
//             </View>

//             {/* 🏘️ SECTION 3: ERF LINKS (Rule 2) */}
//             <Text style={styles.sectionTitle}>🏘️ ERFS WITH PREMISE LINKS</Text>
//             <View style={styles.tableCard}>
//               <View style={styles.tableHeader}>
//                 <Text style={{ flex: 2, fontSize: 10, fontWeight: "800" }}>
//                   Erf No
//                 </Text>
//                 <Text
//                   style={{
//                     flex: 1,
//                     fontSize: 10,
//                     fontWeight: "800",
//                     textAlign: "right",
//                   }}
//                 >
//                   Total Prems
//                 </Text>
//               </View>
//               {auditReport?.linkedErfs?.map((item, i) => {
//                 // console.log(`StealthAuditor ----item`, item);
//                 return (
//                   <View key={i} style={styles.tableRow}>
//                     <Text style={{ flex: 2, fontWeight: "700" }}>
//                       {item?.erfNo}
//                     </Text>
//                     <Text
//                       style={{
//                         flex: 1,
//                         textAlign: "right",
//                         color: "#059669",
//                         fontWeight: "bold",
//                       }}
//                     >
//                       {item?.count}
//                     </Text>
//                   </View>
//                 );
//               })}
//             </View>

//             {/* 📟 SECTION 4: PREMISE METERS (Rule 3) */}
//             <Text style={styles.sectionTitle}>📟 PREMISES WITH METERS</Text>
//             <View style={styles.tableCard}>
//               <View style={styles.tableHeader}>
//                 <Text style={styles.tableColHead}>ERF</Text>
//                 <Text style={styles.tableColHead}>PREM ID</Text>
//                 <Text style={styles.tableColHead}>WTR</Text>
//                 <Text style={styles.tableColHead}>ELC</Text>
//               </View>
//               {auditReport.premiseMeterLinks.map((p, i) => (
//                 <View key={i} style={styles.tableRow}>
//                   <Text style={styles.tableColText}>{p?.erfNo}</Text>
//                   <Text style={styles.tableColText}>{p?.id}</Text>
//                   <Text style={[styles.tableColText, { color: "#3b82f6" }]}>
//                     {p?.water}
//                   </Text>
//                   <Text style={[styles.tableColText, { color: "#f59e0b" }]}>
//                     {p?.elec}
//                   </Text>
//                 </View>
//               ))}
//             </View>

//             <View style={{ height: 40 }} />
//           </ScrollView>
//         </SafeAreaView>
//       </Modal>
//     </>
//   );
// };

// // --- Helpers ---
// const ContextRow = ({ label, value }) => (
//   <View style={styles.contextRow}>
//     <Text style={styles.contextLabel}>{label}:</Text>
//     <Text style={styles.contextValue}>{value}</Text>
//   </View>
// );

// const AuditCard = ({ title, data, color }) => {
//   console.log(`title`, title);
//   console.log(`data`, data);
//   // 🚨 ALERT: If Erfs exist but Geo is missing
//   const isGeoBroken = data?.erfs > 0 && data?.geo === 0;
//   const isGeoPartial = data?.erfs > data?.geo && data?.geo > 0;

//   return (
//     <View style={[styles.card, { borderTopColor: color }]}>
//       <Text style={[styles.cardTitle, { color }]}>{title}</Text>
//       <Text style={styles.statLabel}>
//         Erfs: <Text style={styles.statVal}>{data?.erfs}</Text>
//       </Text>
//       <Text style={styles.statLabel}>
//         Geo:{" "}
//         <Text
//           style={[
//             styles.statVal,
//             isGeoBroken
//               ? { color: "red" }
//               : isGeoPartial
//                 ? { color: "orange" }
//                 : { color: "#4CD964" },
//           ]}
//         >
//           {data?.geo} {isGeoBroken ? "⚠️" : ""}
//         </Text>
//       </Text>
//       <Text style={styles.statLabel}>
//         Prems: <Text style={styles.statVal}>{data?.prems}</Text>
//       </Text>
//       <Text style={styles.statLabel}>
//         Meters: <Text style={styles.statVal}>{data?.meters}</Text>
//       </Text>
//       <Text style={styles.statLabel}>
//         Links: <Text style={styles.statVal}>{data?.links}</Text>
//       </Text>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   fab: {
//     position: "absolute",
//     bottom: 20,
//     right: 20,
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     justifyContent: "center",
//     alignItems: "center",
//     elevation: 8,
//   },
//   fabText: { fontSize: 24 },
//   modalContainer: { flex: 1, backgroundColor: "#F2F2F7" },
//   header: {
//     padding: 20,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     backgroundColor: "#fff",
//     borderBottomWidth: 1,
//     borderColor: "#eee",
//   },
//   headerTitle: { fontSize: 18, fontWeight: "900" },
//   closeBtn: { padding: 8, backgroundColor: "#FF3B30", borderRadius: 6 },
//   closeText: { color: "#fff", fontWeight: "bold" },
//   content: { padding: 15 },
//   sectionTitle: {
//     fontSize: 11,
//     fontWeight: "900",
//     color: "#8E8E93",
//     marginTop: 20,
//     marginBottom: 8,
//     letterSpacing: 1,
//   },
//   contextCard: { backgroundColor: "#fff", padding: 15, borderRadius: 12 },
//   contextRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 4,
//   },
//   contextLabel: { fontSize: 12, color: "#8E8E93", fontWeight: "600" },
//   contextValue: { fontSize: 12, fontWeight: "800" },
//   statsContainer: { flexDirection: "row", justifyContent: "space-between" },
//   card: {
//     width: "48%",
//     backgroundColor: "#fff",
//     padding: 12,
//     borderRadius: 12,
//     borderTopWidth: 5,
//   },
//   cardTitle: { fontWeight: "900", fontSize: 11, marginBottom: 8 },
//   statLabel: { fontSize: 10, color: "#8E8E93", marginBottom: 2 },
//   statVal: { color: "#000", fontWeight: "800" },
//   tableCard: { backgroundColor: "#fff", borderRadius: 12, padding: 12 },
//   tableHeader: {
//     flexDirection: "row",
//     borderBottomWidth: 1,
//     borderColor: "#f1f5f9",
//     paddingBottom: 6,
//   },
//   tableColHead: {
//     flex: 1,
//     fontSize: 10,
//     fontWeight: "800",
//     color: "#94a3b8",
//     textAlign: "center",
//   },
//   tableColText: {
//     flex: 1,
//     fontSize: 11,
//     fontWeight: "700",
//     textAlign: "center",
//   },
//   tableRow: {
//     flexDirection: "row",
//     paddingVertical: 10,
//     borderBottomWidth: 0.5,
//     borderColor: "#f1f5f9",
//   },
// });

// export default StealthAuditor;
