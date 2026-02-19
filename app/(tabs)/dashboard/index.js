// app/(tabs)/dashboard/index.js
import { useMemo, useState } from "react";
import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWarehouse } from "../../../src/context/WarehouseContext";

// 🎯 v0.4 Components
// import { AccessDonut } from "../../../src/features/dashboard/AccessDonut";
import { AgentLeaderboard } from "../../../src/features/dashboard/AgentLeaderboard";
import { PowerNumbersRow } from "../../../src/features/dashboard/DashboardCards";
import { NoAccessReasonsChart } from "../../../src/features/dashboard/NoAccessReasonsChart";
// import { PropertyBarChart } from "../../../src/features/dashboard/PropertyBarChart";
import { AccessDonut } from "../../../src/features/dashboard/AccessDonut";
import { PropertyBarChart } from "../../../src/features/dashboard/PropertyBarChart";
import { RevenueCard } from "../../../src/features/dashboard/RevenueCard";
import { RevenueHeader } from "../../../src/features/dashboard/RevenueHeader";
import { RevenueRiskRow } from "../../../src/features/dashboard/RevenueRiskRow";
import { RevenueTrendChart } from "../../../src/features/dashboard/RevenueTrendChart";
import { WardSelector } from "../../../src/features/dashboard/WardSelector";

export default function DashboardScreen() {
  const { all } = useWarehouse();
  const [selectedWard, setSelectedWard] = useState(null); // null = ALL

  const totalRevenue = 92234524;

  // ⚠️ Revenue Integrity (The "Risk" total)

  const stats = useMemo(() => {
    // 📊 THE v0.4 AGGREGATOR
    // In a live system, these filters would hit your 5,148 Erfs + Jan CSV
    const erfs = all?.erfs || [];
    const premises = all?.premises || [];

    // 🎯 FILTER DATA based on Drill-Down selection
    const filteredErfs = selectedWard
      ? erfs.filter((e) => e.wardNo === selectedWard)
      : erfs;

    const filteredPrems = selectedWard
      ? premises.filter((p) => p.wardNo === selectedWard)
      : premises;

    // ⚠️ Revenue Integrity (The "Risk" total)
    const anomalies = filteredPrems.reduce(
      (acc, p) => {
        if (p.occupancy?.status === "NO_ACCESS") acc.noAccess++;
        if (p.services?.meterStatus === "VANDALIZED") acc.vandalized++;
        if (p.services?.meterStatus === "BYPASSED") acc.bypassed++;
        return acc;
      },
      { noAccess: 0, vandalized: 0, bypassed: 0 },
    );

    return {
      lmName: all?.selectedLm?.name || "Knysna",
      totalErfs: 15463, // From v0.4 Sheet
      totalTrns: 23356, // Transactions count
      revenue: 9223424, // R 92.2M (The Epitome)

      // 🍩 Access Ratio (86% Access vs 14% No Access)
      accessData: [
        { value: 86, color: "#4CD964", text: "Access" },
        { value: 14, color: "#FF3B30", text: "No Access" },
      ],

      // 🏢 Property Mix (Management View)
      propertyData: [
        { value: 13809, label: "Res", frontColor: "#3b82f6" },
        { value: 789, label: "Com", frontColor: "#10b981" },
        { value: 786, label: "Vac", frontColor: "#94a3b8" },
      ],

      // ⚠️ No Access Reasons (The "Operational Why")
      naReasons: [
        { label: "Locked", value: 1800, color: "#f59e0b" },
        { label: "Dogs", value: 944, color: "#ef4444" },
        { label: "Refused", value: 500, color: "#7c3aed" },
      ],

      anomalies,
      leaderboardData: [
        { label: "Rste", value: 10510 },
        { label: "Thato", value: 8174 },
        { label: "Elsa", value: 4672 },
      ],
    };
  }, [selectedWard, all]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* 💰 THE REVENUE EPITOME */}
      <RevenueHeader totalRevenue={totalRevenue} />

      {/* 🏎️ THE ENGINE: Ward Selector */}
      <WardSelector activeWard={selectedWard} onSelect={setSelectedWard} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.welcome}>Revenue & Infrastructure Audit</Text>
          <Text style={styles.lmTitle}>
            {selectedWard ? `Ward ${selectedWard}` : stats.lmName}{" "}
            {selectedWard ? "Audit" : "Summary"}
          </Text>
        </View>

        {/* 💰 THE "EPITOME" CARD: Revenue First */}
        <RevenueCard amount={stats.revenue} />

        {/* 📈 NEW: The Trend Line */}
        <RevenueTrendChart />

        {/* 🏢 THE REVENUE RISK CARD (New Management Tool) */}
        <RevenueRiskRow anomalies={stats.anomalies} />

        {/* 🏆 THE PERFORMANCE ROW */}
        <AgentLeaderboard data={stats.leaderboardData} />

        {/* 📊 SCALE: Erfs and Transactions */}
        <PowerNumbersRow stats={stats} />

        {/* 🍩 RISK ANALYSIS: Access Ratio */}
        <AccessDonut data={stats.accessData} />

        {/* 🏗️ ASSET PROFILE: Property Mix */}
        <PropertyBarChart data={stats.propertyData} />

        {/* 🚫 THE "WHY" CHART: Dogs vs Locked Gates */}
        <NoAccessReasonsChart data={stats.naReasons} />

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { paddingHorizontal: 20, paddingVertical: 15 },
  welcome: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "700",
    letterSpacing: 1,
  },
  lmTitle: { fontSize: 26, fontWeight: "900", color: "#1e293b" },
});

// import { useMemo } from "react";
// import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useWarehouse } from "../../../src/context/WarehouseContext";
// import { ActivityPulse } from "../../../src/features/dashboard/ActivityPulse";
// import { PowerNumbersRow } from "../../../src/features/dashboard/DashboardCards";
// import { MeterMixChart } from "../../../src/features/dashboard/MeterMixChart";
// import { WardProgressChart } from "../../../src/features/dashboard/WardProgressChart";

// export default function DashboardScreen() {
//   const { all } = useWarehouse();

//   // 🧠 THE AGGREGATOR: Turning raw data into iREPS Intelligence
//   const stats = useMemo(() => {
//     const erfs = all?.erfs || [];
//     const premises = all?.premises || [];
//     const lmName = all?.selectedLm?.name || "South Africa";

//     // 1. Audit Math
//     const auditedErfs = erfs.filter((e) => e.premises?.length > 0).length;

//     // 2. Meter Mix Math
//     let water = 0;
//     let elec = 0;
//     premises.forEach((p) => {
//       water += p.services?.waterMeter || 0;
//       elec += p.services?.electricityMeter || 0;
//     });

//     // 3. Ward Progress Math
//     const wardMap = {};
//     erfs.forEach((erf) => {
//       const w = erf.wardNo || "Unk";
//       if (!wardMap[w]) wardMap[w] = { total: 0, audited: 0 };
//       wardMap[w].total++;
//       if (erf.premises?.length > 0) wardMap[w].audited++;
//     });

//     const wardData = Object.keys(wardMap)
//       .map((w) => ({
//         value: Math.round((wardMap[w].audited / wardMap[w].total) * 100),
//         label: `W${w}`,
//         frontColor:
//           wardMap[w].audited / wardMap[w].total > 0.7 ? "#4CD964" : "#FF9500",
//       }))
//       .sort((a, b) => b.value - a.value)
//       .slice(0, 6); // Top 6 for visual clarity

//     return {
//       totalErfs: erfs.length,
//       auditedErfs,
//       totalMeters: water + elec,
//       waterCount: water,
//       elecCount: elec,
//       wardData,
//       lmName,
//     };
//   }, [all]);

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" />
//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={styles.scrollContent}
//       >
//         {/* 🏢 HEADER SECTION */}
//         <View style={styles.header}>
//           <Text style={styles.welcome}>Welcome to iREPS</Text>
//           <Text style={styles.lmTitle}>{stats.lmName} Command Center</Text>
//         </View>

//         {/* 📊 ROW 1: POWER NUMBERS */}
//         <PowerNumbersRow stats={stats} />

//         {/* 🥧 ROW 2: METER DISTRIBUTION */}
//         <MeterMixChart
//           waterCount={stats.waterCount}
//           elecCount={stats.elecCount}
//         />

//         {/* 📈 ROW 3: WARD PERFORMANCE */}
//         <WardProgressChart data={stats.wardData} />

//         {/* 💓 ROW 4: ACTIVITY PULSE */}
//         <ActivityPulse
//           activities={[]} /* We will hook this to actual transactions soon */
//         />

//         <View style={{ height: 100 }} />
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#F8FAFC" },
//   scrollContent: { paddingBottom: 20 },
//   header: { paddingHorizontal: 20, paddingTop: 10, marginBottom: 10 },
//   welcome: { fontSize: 14, color: "#64748b", fontWeight: "600" },
//   lmTitle: { fontSize: 24, fontWeight: "900", color: "#1e293b" },
// });

// // import { useMemo } from "react";
// // import { Text, View } from "react-native";
// // import { useWarehouse } from "../../../src/context/WarehouseContext";

// // const DashboardScreen = () => {
// //   // Inside dashboard/index.js
// //   const { all } = useWarehouse();

// //   const stats = useMemo(() => {
// //     const erfs = all?.erfs || [];
// //     const premises = all?.premises || [];

// //     // 🎯 Calculate Audited Erfs (Erfs linked to premises)
// //     const auditedCount = erfs.filter((e) => e.premises?.length > 0).length;

// //     // 🎯 Calculate Total Meters
// //     let water = 0;
// //     let elec = 0;

// //     premises.forEach((p) => {
// //       water += p.services?.waterMeter || 0; // Based on your updated Premise Schema
// //       elec += p.services?.electricityMeter || 0; // Based on your updated Premise Schema
// //     });
// //     return {
// //       totalErfs: erfs.length,
// //       auditedErfs: auditedCount,
// //       waterCount: water,
// //       elecCount: elec,
// //     };
// //   }, [all]);
// //   console.log(`DashboardScreen ----stats`, stats);

// //   const wardStats = useMemo(() => {
// //     const erfs = all?.erfs || [];
// //     const wardMap = {};

// //     // 🎯 Group Erfs by Ward
// //     erfs.forEach((erf) => {
// //       const wardNo = erf.wardNo || "Unassigned";
// //       if (!wardMap[wardNo]) {
// //         wardMap[wardNo] = { total: 0, audited: 0 };
// //       }
// //       wardMap[wardNo].total += 1;
// //       // An Erf is "Audited" if it has at least one premise linked
// //       if (erf.premises?.length > 0) {
// //         wardMap[wardNo].audited += 1;
// //       }
// //     });

// //     // 🎯 Convert to Chart Data
// //     return Object.keys(wardMap)
// //       .map((wardNo) => {
// //         const { total, audited } = wardMap[wardNo];
// //         const percentage = total > 0 ? Math.round((audited / total) * 100) : 0;

// //         return {
// //           value: percentage,
// //           label: `Ward ${wardNo}`,
// //           frontColor: percentage > 70 ? "#4CD964" : "#FF9500", // Green if > 70%, else Orange
// //         };
// //       })
// //       .sort((a, b) => b.value - a.value); // Sort by highest progress first
// //   }, [all]);
// //   console.log(`DashboardScreen ----wardStats`, wardStats);

// //   // Inside dashboard/index.js
// //   const recentActivity = useMemo(() => {
// //     const premises = all?.premises || [];

// //     // 🎯 Sort by most recently updated
// //     return premises
// //       .filter((p) => p.metadata?.updatedAt)
// //       .sort(
// //         (a, b) =>
// //           new Date(b.metadata.updatedAt) - new Date(a.metadata.updatedAt),
// //       )
// //       .slice(0, 5) // Take the top 5
// //       .map((p) => ({
// //         id: p.id,
// //         type: p.occupancy?.status || "AUDITED",
// //         title: `Erf ${p.erfNo}`,
// //         subtitle: `${p.address?.strNo} ${p.address?.StrName}`,
// //         time: new Date(p.metadata.updatedAt).toLocaleTimeString([], {
// //           hour: "2-digit",
// //           minute: "2-digit",
// //         }),
// //         icon:
// //           p.occupancy?.status === "NO_ACCESS"
// //             ? "close-octagon"
// //             : "check-circle",
// //       }));
// //   }, [all]);
// //   console.log(`DashboardScreen ----recentActivity`, recentActivity);

// //   return (
// //     <View>
// //       <Text>DashboardScreen</Text>
// //     </View>
// //   );
// // };

// // export default DashboardScreen;
