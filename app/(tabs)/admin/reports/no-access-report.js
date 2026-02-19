// app/(tabs)/admin/reports/no-access-report.js
import { useAuth } from "@/src/hooks/useAuth"; // 🛰️ THE JURISDICTION KEY
import { useGetTrnsByLmPcodeQuery } from "@/src/redux/trnsApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import LmPremiseReportHeader from "./components/LmPremiseReportHeader";

export default function NoAccessReport() {
  // 🏛️ DYNAMIC SCOPE: Pull the current active workbase from the profile
  const { profile } = useAuth();
  const lmPcode = profile?.access?.activeWorkbase?.id;
  const lmName = profile?.access?.activeWorkbase?.name || "Municipality";

  // 🛰️ API FETCH: Only runs if lmPcode exists
  const { data: trns = [], isLoading } = useGetTrnsByLmPcodeQuery(
    { lmPcode },
    { skip: !lmPcode },
  );

  const [activeTab, setActiveTab] = useState("LIST");

  // 🕵️ INTELLIGENCE FILTER: Isolate the "No Access" Transactions for THIS LM
  const naReportData = useMemo(() => {
    return trns
      .filter((t) => t?.accessData?.access?.hasAccess === "no")
      .map((t) => ({
        id: t?.id,
        erfNo: t?.accessData?.premise?.erfNo || "N/A",
        address: t?.accessData?.premise?.address || "Unknown Adr",
        reason: t?.accessData?.access?.reason || "No reason provided",
        agent: t?.accessData?.metadata?.updated?.byUser || "Field Agent",
        timestamp: t?.accessData?.metadata?.updated?.at,
      }))
      .sort((a, b) => new Date(b?.timestamp) - new Date(a?.timestamp)); // Latest first
  }, [trns]);

  if (isLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Scoping {lmName} Intelligence...</Text>
      </View>
    );

  if (!lmPcode) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons
          name="map-marker-off"
          size={48}
          color="#cbd5e1"
        />
        <Text style={styles.emptyTitle}>No Workbase Selected</Text>
        <Text style={styles.emptySub}>
          Please select a municipality in the header.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LmPremiseReportHeader
        total={naReportData.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 📑 TACTICAL TABLE HEADER */}
      <View style={styles.tableHeader}>
        <Text style={[styles.col, { flex: 1 }]}>Erf</Text>
        <Text style={[styles.col, { flex: 2 }]}>Address</Text>
        <Text style={[styles.col, { flex: 2 }]}>Reason / Friction</Text>
        <Text style={[styles.col, { flex: 1.5 }]}>Agent</Text>
      </View>

      <FlatList
        data={naReportData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={[styles.cell, { flex: 1, fontWeight: "800" }]}>
              {item.erfNo}
            </Text>
            <View style={{ flex: 2 }}>
              <Text style={styles.adrText} numberOfLines={1}>
                {item.address}
              </Text>
              <Text style={styles.timeText}>
                {new Date(item.timestamp).toLocaleDateString()}
              </Text>
            </View>
            <View style={[styles.reasonBadge, { flex: 2 }]}>
              <Text style={styles.reasonText} numberOfLines={2}>
                {item.reason}
              </Text>
            </View>
            <View
              style={{
                flex: 1.5,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <MaterialCommunityIcons
                name="account-hard-hat"
                size={14}
                color="#64748b"
              />
              <Text style={styles.agentText} numberOfLines={1}>
                {item.agent.split(" ")[0]}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={40}
              color="#10b981"
            />
            <Text style={styles.emptyText}>
              Zero No Access events in {lmName}.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: { marginTop: 12, color: "#64748b", fontWeight: "600" },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#475569",
    marginTop: 12,
  },
  emptySub: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 4,
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
  row: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: "center",
  },
  cell: { fontSize: 11, color: "#1e293b" },
  adrText: { fontSize: 11, fontWeight: "600", color: "#334155" },
  timeText: { fontSize: 9, color: "#94a3b8" },
  reasonBadge: {
    backgroundColor: "#fff1f2",
    padding: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  reasonText: { fontSize: 10, fontWeight: "700", color: "#e11d48" },
  agentText: { fontSize: 10, color: "#64748b", fontWeight: "600" },
  empty: { padding: 60, alignItems: "center" },
  emptyText: { marginTop: 10, color: "#64748b", fontWeight: "600" },
});

// import { useGetTrnsByLmPcodeQuery } from "@/src/redux/trnsApi";
// import { MaterialCommunityIcons } from "@expo/vector-icons";
// import { useMemo, useState } from "react";
// import {
//   ActivityIndicator,
//   FlatList,
//   StyleSheet,
//   Text,
//   View,
// } from "react-native";
// import LmPremiseReportHeader from "./components/LmPremiseReportHeader";

// export default function NoAccessReport() {
//   const lmPcode = "ZA1048"; // Targeted at Knysna for current operations
//   const { data: trns = [], isLoading } = useGetTrnsByLmPcodeQuery({ lmPcode });
//   const [activeTab, setActiveTab] = useState("LIST");

//   // 🕵️ INTELLIGENCE FILTER: Isolate the "No Access" Transactions
//   const naReportData = useMemo(() => {
//     return trns
//       .filter((t) => t.accessData?.access?.hasAccess === "no")
//       .map((t) => ({
//         id: t.id,
//         erfNo: t.accessData?.premise?.erfNo || "N/A",
//         address: t.accessData?.premise?.address || "Unknown Adr",
//         reason: t.accessData?.access?.reason || "No reason provided",
//         agent: t.accessData?.metadata?.updated?.byUser || "Field Agent",
//         timestamp: t.accessData?.metadata?.updated?.at,
//       }));
//   }, [trns]);

//   if (isLoading)
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#2563eb" />
//       </View>
//     );

//   return (
//     <View style={styles.container}>
//       <LmPremiseReportHeader
//         total={naReportData.length}
//         activeTab={activeTab}
//         onTabChange={setActiveTab}
//       />

//       {/* 📑 TACTICAL TABLE HEADER */}
//       <View style={styles.tableHeader}>
//         <Text style={[styles.col, { flex: 1 }]}>Erf</Text>
//         <Text style={[styles.col, { flex: 2 }]}>Address</Text>
//         <Text style={[styles.col, { flex: 2 }]}>Reason / Friction</Text>
//         <Text style={[styles.col, { flex: 1.5 }]}>Agent</Text>
//       </View>

//       <FlatList
//         data={naReportData}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <View style={styles.row}>
//             <Text style={[styles.cell, { flex: 1, fontWeight: "800" }]}>
//               {item.erfNo}
//             </Text>
//             <View style={{ flex: 2 }}>
//               <Text style={styles.adrText}>{item.address}</Text>
//               <Text style={styles.timeText}>
//                 {new Date(item.timestamp).toLocaleDateString()}
//               </Text>
//             </View>
//             <View style={[styles.reasonBadge, { flex: 2 }]}>
//               <Text style={styles.reasonText}>{item.reason}</Text>
//             </View>
//             <View
//               style={{
//                 flex: 1.5,
//                 flexDirection: "row",
//                 alignItems: "center",
//                 gap: 4,
//               }}
//             >
//               <MaterialCommunityIcons
//                 name="account-hard-hat"
//                 size={14}
//                 color="#64748b"
//               />
//               <Text style={styles.agentText}>{item.agent.split(" ")[0]}</Text>
//             </View>
//           </View>
//         )}
//         ListEmptyComponent={
//           <View style={styles.empty}>
//             <Text>No No Access events recorded.</Text>
//           </View>
//         }
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#fff" },
//   center: { flex: 1, justifyContent: "center", alignItems: "center" },
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
//   row: {
//     flexDirection: "row",
//     padding: 12,
//     borderBottomWidth: 1,
//     borderColor: "#f1f5f9",
//     alignItems: "center",
//   },
//   cell: { fontSize: 11, color: "#1e293b" },
//   adrText: { fontSize: 11, fontWeight: "600", color: "#334155" },
//   timeText: { fontSize: 9, color: "#94a3b8" },
//   reasonBadge: {
//     backgroundColor: "#fff1f2",
//     padding: 6,
//     borderRadius: 4,
//     marginRight: 8,
//   },
//   reasonText: { fontSize: 10, fontWeight: "700", color: "#e11d48" }, // Red for friction
//   agentText: { fontSize: 10, color: "#64748b", fontWeight: "600" },
//   empty: { padding: 40, alignItems: "center" },
// });
