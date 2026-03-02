import { useWarehouse } from "@/src/context/WarehouseContext";
import { useGetServiceProvidersQuery } from "@/src/redux/spApi";
import { useGetUsersQuery } from "@/src/redux/usersApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import LmPremiseReportHeader from "../../../../components/LmPremiseReportHeader";

export default function ServiceProviderReport() {
  const [activeTab, setActiveTab] = useState("LIST");
  const { all } = useWarehouse();

  // 🛰️ Global Streams
  const { data: sps = [], isLoading: loadingSps } =
    useGetServiceProvidersQuery();
  const { data: users = [], isLoading: loadingUsers } = useGetUsersQuery();

  const reportData = useMemo(() => {
    return sps.map((sp) => {
      // 🎯 PERSONNEL: Count users linked to this SP
      const spUsers = users.filter(
        (u) => u.employment?.serviceProvider?.id === sp.id,
      );

      // 🎯 PRODUCTION: Count meters in Warehouse linked to this SP ID
      const auditedMeters =
        all?.asts?.filter((a) => a.metadata?.spId === sp.id) || [];

      // 🎯 CLIENTS: Count from the new 'clients' array in the schema
      const clientCount = sp.clients?.length || 0;

      return {
        id: sp.id,
        // 🛡️ MAPPING TO NEW PROFILE SCHEMA
        name:
          sp.profile?.registeredName || sp.profile?.tradingName || "Unknown SP",
        tradingNo: sp.profile?.tradingNumber || "N/A",
        userCount: spUsers.length,
        meterCount: auditedMeters.length,
        wbCount: clientCount,
        status: sp.status || "ACTIVE",
      };
    });
  }, [sps, users, all]);

  if (loadingSps || loadingUsers) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Auditing Service Providers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🏛️ REPS HEADER */}
      <LmPremiseReportHeader
        total={reportData.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 📑 TABLE HEADER */}
      <View style={styles.tableHeader}>
        <Text style={[styles.col, { flex: 2 }]}>Service Provider</Text>
        <Text style={[styles.col, { flex: 0.8, textAlign: "center" }]}>
          Staff
        </Text>
        <Text style={[styles.col, { flex: 1, textAlign: "center" }]}>
          Audits
        </Text>
        <Text style={[styles.col, { flex: 0.8, textAlign: "center" }]}>
          Clients
        </Text>
        <Text style={[styles.col, { flex: 0.6, textAlign: "right" }]}>
          Status
        </Text>
      </View>

      <FlatList
        data={reportData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            {/* SP Identity (New Schema) */}
            <View style={{ flex: 2 }}>
              <Text style={styles.spName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.regText}>REG: {item.tradingNo}</Text>
            </View>

            {/* Personnel Count */}
            <Text style={[styles.cell, { flex: 0.8 }]}>{item.userCount}</Text>

            {/* Production (Audit Volume) */}
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={[
                  styles.countText,
                  { color: item.meterCount > 0 ? "#059669" : "#94a3b8" },
                ]}
              >
                {item.meterCount}
              </Text>
              <Text style={styles.tinyLabel}>CAPTURED</Text>
            </View>

            {/* Active Clients (New Schema) */}
            <Text style={[styles.cell, { flex: 0.8 }]}>{item.wbCount}</Text>

            {/* Status Shield */}
            <View style={{ flex: 0.6, alignItems: "flex-end" }}>
              <MaterialCommunityIcons
                name={
                  item.status === "ACTIVE" ? "shield-check" : "shield-alert"
                }
                size={22}
                color={item.status === "ACTIVE" ? "#059669" : "#ef4444"}
              />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: "#64748b",
    fontWeight: "700",
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
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: "center",
  },
  spName: { fontSize: 13, fontWeight: "800", color: "#1e293b" },
  regText: { fontSize: 9, color: "#94a3b8", fontFamily: "monospace" },
  cell: {
    fontSize: 12,
    textAlign: "center",
    color: "#475569",
    fontWeight: "600",
  },
  countText: { fontSize: 13, fontWeight: "900" },
  tinyLabel: {
    fontSize: 7,
    fontWeight: "800",
    color: "#94a3b8",
    marginTop: -2,
  },
});

// import { useWarehouse } from "@/src/context/WarehouseContext";
// import { useGetServiceProvidersQuery } from "@/src/redux/spApi";
// import { useGetUsersQuery } from "@/src/redux/usersApi";
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

// export default function ServiceProviderReport() {
//   const [activeTab, setActiveTab] = useState("LIST");
//   const { all } = useWarehouse();

//   // 🛰️ 1. Global Streams (Sovereign Context)
//   const { data: sps = [], isLoading: loadingSps } =
//     useGetServiceProvidersQuery();
//   const { data: users = [], isLoading: loadingUsers } = useGetUsersQuery();

//   // 🕵️ 2. PRODUCTION INTELLIGENCE: Aggregating Personnel vs. Audits
//   const reportData = useMemo(() => {
//     return sps.map((sp) => {
//       // 🎯 PERSONNEL: Count users linked to this SP in their employment profile
//       const spUsers = users.filter(
//         (u) => u.employment?.serviceProvider?.id === sp.id,
//       );

//       // 🎯 PRODUCTION: How many meters currently in the Warehouse were audited by this SP?
//       // (Checks for spId in the metadata stamped during the transaction)
//       const auditedMeters =
//         all?.asts?.filter((a) => a.metadata?.spId === sp.id) || [];

//       // 🎯 COVERAGE: Which unique LMs (Workbases) have they physically touched?
//       const activeLms = new Set();
//       auditedMeters.forEach((m) => {
//         if (m.parents?.lmId) activeLms.add(m.parents.lmId);
//       });

//       return {
//         id: sp.id,
//         name: sp.name || "Unknown Contractor",
//         regNo: sp.regNo || "N/A",
//         userCount: spUsers.length,
//         meterCount: auditedMeters.length,
//         wbCount: activeLms.size,
//         status: sp.status || "ACTIVE",
//       };
//     });
//   }, [sps, users, all]);

//   if (loadingSps || loadingUsers) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#2563eb" />
//         <Text style={styles.loadingText}>Auditing Service Providers...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <LmPremiseReportHeader
//         total={reportData.length}
//         activeTab={activeTab}
//         onTabChange={setActiveTab}
//       />

//       {/* 📑 TABLE HEADER */}
//       <View style={styles.tableHeader}>
//         <Text style={[styles.col, { flex: 2 }]}>Service Provider</Text>
//         <Text style={[styles.col, { flex: 0.8, textAlign: "center" }]}>
//           Users
//         </Text>
//         <Text style={[styles.col, { flex: 1, textAlign: "center" }]}>
//           Meters
//         </Text>
//         <Text style={[styles.col, { flex: 1, textAlign: "center" }]}>WBs</Text>
//         <Text style={[styles.col, { flex: 0.8, textAlign: "right" }]}>
//           Status
//         </Text>
//       </View>

//       <FlatList
//         data={reportData}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <View style={styles.row}>
//             {/* SP Identity */}
//             <View style={{ flex: 2 }}>
//               <Text style={styles.spName}>{item.name}</Text>
//               <Text style={styles.regText}>ID: {item.id?.slice(-6)}</Text>
//             </View>

//             {/* Personnel Count */}
//             <Text style={[styles.cell, { flex: 0.8 }]}>{item.userCount}</Text>

//             {/* Production (Audit Volume) */}
//             <View style={{ flex: 1, alignItems: "center" }}>
//               <Text
//                 style={[
//                   styles.countText,
//                   { color: item.meterCount > 0 ? "#059669" : "#94a3b8" },
//                 ]}
//               >
//                 {item.meterCount}
//               </Text>
//               <Text style={styles.tinyLabel}>AUDITS</Text>
//             </View>

//             {/* Active LMs touched */}
//             <Text style={[styles.cell, { flex: 1 }]}>{item.wbCount}</Text>

//             {/* Status Shield */}
//             <View style={{ flex: 0.8, alignItems: "flex-end" }}>
//               <MaterialCommunityIcons
//                 name={
//                   item.status === "ACTIVE" ? "shield-check" : "shield-alert"
//                 }
//                 size={22}
//                 color={item.status === "ACTIVE" ? "#059669" : "#ef4444"}
//               />
//             </View>
//           </View>
//         )}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#fff" },
//   center: { flex: 1, justifyContent: "center", alignItems: "center" },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 12,
//     color: "#64748b",
//     fontWeight: "700",
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
//   row: {
//     flexDirection: "row",
//     paddingHorizontal: 12,
//     paddingVertical: 14,
//     borderBottomWidth: 1,
//     borderColor: "#f1f5f9",
//     alignItems: "center",
//   },
//   spName: { fontSize: 13, fontWeight: "800", color: "#1e293b" },
//   regText: { fontSize: 9, color: "#94a3b8", fontFamily: "monospace" },
//   cell: {
//     fontSize: 12,
//     textAlign: "center",
//     color: "#475569",
//     fontWeight: "600",
//   },
//   countText: { fontSize: 13, fontWeight: "900" },
//   tinyLabel: {
//     fontSize: 7,
//     fontWeight: "800",
//     color: "#94a3b8",
//     marginTop: -2,
//   },
// });
