// /app/(tabs)/admin/reports/workbases.js
import { useGetAstsByCountryCodeQuery } from "@/src/redux/astsApi"; // 🛰️ New hook
import { useGetLmsByCountryQuery } from "@/src/redux/geoApi";
import { useGetTrnsByCountryCodeQuery } from "@/src/redux/trnsApi";
import { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useGetErfsByCountryCodeQuery } from "../../../../src/redux/erfsApi";
import { useGetPremisesByCountryCodeQuery } from "../../../../src/redux/premisesApi";
import LmPremiseReportHeader from "./components/LmPremiseReportHeader";

export default function WorkbasesReport() {
  const country = { id: "ZA", name: "South Africa" };

  // 🛰️ 1. Fetch Master Local Municipalities
  const { data: lms = [], isLoading: loadingLms } = useGetLmsByCountryQuery(
    country.id,
  );

  // 🛰️ 2. Fetch National Transactions
  const { data: globalTrns = [], isLoading: loadingTrns } =
    useGetTrnsByCountryCodeQuery(country);

  // 🛰️ 3. Fetch National Assets (Meters)
  const { data: globalAsts = [], isLoading: loadingAsts } =
    useGetAstsByCountryCodeQuery(country);

  const { data: globalPrems = [], isLoading: loadingPrems } =
    useGetPremisesByCountryCodeQuery(country);

  const { data: globalErfs = [], isLoading: loadingErfs } =
    useGetErfsByCountryCodeQuery(country);

  // 🕵️ 4. THE AGGREGATOR
  const reportData = useMemo(() => {
    // A. Pre-group meters by LM for O(n) lookup performance
    const metersByLm = globalAsts.reduce((acc, ast) => {
      const lmId = ast?.accessData?.metadata?.lmPcode || "UNKNOWN";
      acc[lmId] = (acc[lmId] || 0) + 1;
      return acc;
    }, {});

    // B. Pre-group transactions by LM
    const trnsByLm = globalTrns.reduce((acc, trn) => {
      const lmId = trn.accessData?.metadata?.lmPcode || "UNKNOWN";
      acc[lmId] = (acc[lmId] || 0) + 1;
      return acc;
    }, {});

    // C. Pre-group premises by LM (Using parents.lmId)
    const premsByLm = globalPrems.reduce((acc, prem) => {
      const lmId = prem.parents?.lmId || "UNKNOWN";
      acc[lmId] = (acc[lmId] || 0) + 1;
      return acc;
    }, {});

    const statsByLm = globalErfs.reduce((acc, erf) => {
      const lmId = erf.admin?.localMunicipality?.pcode || "UNKNOWN";
      const wardId = erf.admin?.ward?.pcode;

      if (!acc[lmId]) {
        acc[lmId] = { erfs: 0, wards: new Set() };
      }

      acc[lmId].erfs += 1;
      if (wardId) acc[lmId].wards.add(wardId);

      return acc;
    }, {});

    // C. Map LMs to the Final UI Structure
    return lms
      .map((lm) => {
        const lmStats = statsByLm[lm.id] || { erfs: 0, wards: new Set() };
        return {
          id: lm.id,
          name: lm.name,
          province: lm.provinceName || "N/A",
          wardCount: lmStats.wards.size,
          erfCount: lmStats.erfs,
          premiseCount: premsByLm[lm.id] || 0,
          meterCount: metersByLm[lm.id] || 0, // ✅ Aggregated from globalAsts
          trnCount: trnsByLm[lm.id] || 0, // ✅ Aggregated from globalTrns
        };
      })
      .sort((a, b) => b.trnCount - a.trnCount || b.meterCount - a.meterCount);
  }, [lms, globalTrns, globalAsts]);

  if (loadingLms || loadingTrns || loadingAsts) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Synthesizing National Stats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LmPremiseReportHeader total={reportData.length} activeTab="LIST" />

      <View style={styles.tableHeader}>
        <Text style={[styles.col, { flex: 2 }]}>Workbase (LM)</Text>
        <Text style={[styles.col, styles.numCol]}>Wards</Text>
        <Text style={[styles.col, styles.numCol]}>Erfs</Text>
        <Text style={[styles.col, styles.numCol]}>Prems</Text>
        <Text style={[styles.col, styles.numCol]}>Meters</Text>
        <Text style={[styles.col, styles.numCol]}>Trns</Text>
      </View>

      <FlatList
        data={reportData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 2 }}>
              <Text style={styles.lmName}>{item.name}</Text>
              <Text style={styles.provName}>{item.province}</Text>
            </View>
            <Text style={[styles.cell, styles.numCell]}>{item.wardCount}</Text>
            <Text style={[styles.cell, styles.numCell]}>{item.erfCount}</Text>
            <Text style={[styles.cell, styles.numCell]}>
              {item.premiseCount}
            </Text>
            <Text
              style={[
                styles.cell,
                styles.numCell,
                { fontWeight: "900", color: "#1e293b" },
              ]}
            >
              {item.meterCount}
            </Text>
            <Text
              style={[
                styles.cell,
                styles.numCell,
                { color: "#2563eb", fontWeight: "900" },
              ]}
            >
              {item.trnCount}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

// ... styles as per your code
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
  tableHeader: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 2,
    borderColor: "#e2e8f0",
  },
  col: {
    fontSize: 9,
    fontWeight: "900",
    color: "#64748b",
    textTransform: "uppercase",
  },
  numCol: { flex: 0.7, textAlign: "center" },
  row: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: "center",
  },
  lmName: { fontSize: 13, fontWeight: "800", color: "#1e293b" },
  provName: { fontSize: 10, color: "#94a3b8", fontWeight: "600" },
  cell: { fontSize: 12, color: "#475569", fontWeight: "500" },
  numCell: { flex: 0.7, textAlign: "center" },
  emptyText: { color: "#94a3b8", fontSize: 12, fontStyle: "italic" },
});

// // /app/(tabs)/admin/reports/workbases.js
// import { useGetTrnsByCountryCodeQuery } from "@/src/redux/trnsApi";
// import { useMemo } from "react";
// import {
//   ActivityIndicator,
//   FlatList,
//   StyleSheet,
//   Text,
//   View,
// } from "react-native";
// import LmPremiseReportHeader from "./components/LmPremiseReportHeader";

// export default function WorkbasesReport() {
//   // 🏛️ THE SOVEREIGN STANDARD: Using the Country Object
//   const country = { id: "ZA", name: "South Africa" };

//   // 🛰️ 1. Fetch National Stats using the Object ID
//   const { data: globalStats = [], isLoading } =
//     useGetTrnsByCountryCodeQuery(country);

//   // 🕵️ 2. SORTER: Prioritizing high-activity regions
//   const sortedStats = useMemo(() => {
//     return [...globalStats].sort(
//       (a, b) => (b.meterCount || 0) - (a.meterCount || 0),
//     );
//   }, [globalStats]);

//   if (isLoading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#2563eb" />
//         <Text style={styles.loadingText}>
//           Synchronizing {country.name} Workbases...
//         </Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* 📊 Header reflects the total workbases in the Country Object scope */}
//       <LmPremiseReportHeader total={sortedStats.length} activeTab="LIST" />

//       {/* 📊 THE AGGREGATED TABLE HEADER */}
//       <View style={styles.tableHeader}>
//         <Text style={[styles.col, { flex: 2 }]}>Workbase (LM)</Text>
//         <Text style={[styles.col, styles.numCol]}>Wards</Text>
//         <Text style={[styles.col, styles.numCol]}>Erfs</Text>
//         <Text style={[styles.col, styles.numCol]}>Prems</Text>
//         <Text style={[styles.col, styles.numCol]}>Meters</Text>
//         <Text style={[styles.col, styles.numCol]}>Trns</Text>
//       </View>

//       <FlatList
//         data={sortedStats}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <View style={styles.row}>
//             <View style={{ flex: 2 }}>
//               <Text style={styles.lmName}>{item.name || "Unknown LM"}</Text>
//               <Text style={styles.provName}>{item.province || "N/A"}</Text>
//             </View>
//             <Text style={[styles.cell, styles.numCell]}>
//               {item.wardCount || 0}
//             </Text>
//             <Text style={[styles.cell, styles.numCell]}>
//               {item.erfCount || 0}
//             </Text>
//             <Text style={[styles.cell, styles.numCell]}>
//               {item.premiseCount || 0}
//             </Text>
//             <Text
//               style={[
//                 styles.cell,
//                 styles.numCell,
//                 { fontWeight: "900", color: "#1e293b" },
//               ]}
//             >
//               {item.meterCount || 0}
//             </Text>
//             <Text
//               style={[
//                 styles.cell,
//                 styles.numCell,
//                 { color: "#2563eb", fontWeight: "900" },
//               ]}
//             >
//               {item.trnCount || 0}
//             </Text>
//           </View>
//         )}
//         ListEmptyComponent={
//           <View style={styles.center}>
//             <Text style={styles.emptyText}>
//               No data found for {country.name}.
//             </Text>
//           </View>
//         }
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#fff" },
//   center: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 40,
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 12,
//     color: "#64748b",
//     fontWeight: "600",
//   },
//   tableHeader: {
//     flexDirection: "row",
//     padding: 12,
//     backgroundColor: "#f8fafc",
//     borderBottomWidth: 2,
//     borderColor: "#e2e8f0",
//   },
//   col: {
//     fontSize: 9,
//     fontWeight: "900",
//     color: "#64748b",
//     textTransform: "uppercase",
//   },
//   numCol: { flex: 0.7, textAlign: "center" },
//   row: {
//     flexDirection: "row",
//     paddingHorizontal: 12,
//     paddingVertical: 14,
//     borderBottomWidth: 1,
//     borderColor: "#f1f5f9",
//     alignItems: "center",
//   },
//   lmName: { fontSize: 13, fontWeight: "800", color: "#1e293b" },
//   provName: { fontSize: 10, color: "#94a3b8", fontWeight: "600" },
//   cell: {
//     fontSize: 12,
//     color: "#475569",
//     fontWeight: "500",
//   },
//   numCell: { flex: 0.7, textAlign: "center" },
//   emptyText: { color: "#94a3b8", fontSize: 12, fontStyle: "italic" },
// });
