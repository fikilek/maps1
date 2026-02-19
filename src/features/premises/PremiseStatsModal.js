import { ScrollView, StyleSheet, View } from "react-native";
import { BarChart, PieChart } from "react-native-gifted-charts";
import {
  Divider,
  IconButton,
  Modal,
  Portal,
  Surface,
  Text,
} from "react-native-paper";

const LegendItem = ({ color, label, value }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={styles.legendLabel}>{label}</Text>
    <Text style={styles.legendValue}>{value}</Text>
  </View>
);

export const PremiseStatsModal = ({ visible, onDismiss, stats }) => {
  if (!stats) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <View>
            <Text variant="headlineSmall" style={styles.title}>
              Field Intelligence
            </Text>
            <Text variant="bodySmall">Operations Summary</Text>
          </View>
          <IconButton icon="close-circle" size={28} onPress={onDismiss} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          {/* --- HERO CARDS --- */}
          <View style={styles.heroRow}>
            <Surface
              style={[styles.card, { borderLeftColor: "#2563eb" }]}
              elevation={1}
            >
              <Text style={styles.cardVal}>{stats.total}</Text>
              <Text style={styles.cardLabel}>PREMISES</Text>
            </Surface>
            <Surface
              style={[styles.card, { borderLeftColor: "#ef4444" }]}
              elevation={1}
            >
              <Text style={styles.cardVal}>{stats.noAccessCount}</Text>
              <Text style={styles.cardLabel}>NO ACCESS</Text>
            </Surface>
          </View>

          <View style={[styles.heroRow, { marginTop: 12 }]}>
            <Surface
              style={[styles.card, { borderLeftColor: "#fbbf24" }]}
              elevation={1}
            >
              <Text style={styles.cardVal}>{stats.elecMeters}</Text>
              <Text style={styles.cardLabel}>ELEC METERS</Text>
            </Surface>
            <Surface
              style={[styles.card, { borderLeftColor: "#0ea5e9" }]}
              elevation={1}
            >
              <Text style={styles.cardVal}>{stats.waterMeters}</Text>
              <Text style={styles.cardLabel}>WATER METERS</Text>
            </Surface>
          </View>

          <View style={[styles.heroRow, { marginTop: 12 }]}>
            <Surface
              style={[styles.card, { borderLeftColor: "#b45309" }]}
              elevation={1}
            >
              <Text style={styles.cardVal}>{stats.elecBulk}</Text>
              <Text style={styles.cardLabel}>BULK ELEC</Text>
            </Surface>
            <Surface
              style={[styles.card, { borderLeftColor: "#0369a1" }]}
              elevation={1}
            >
              <Text style={styles.cardVal}>{stats.waterBulk}</Text>
              <Text style={styles.cardLabel}>BULK WATER</Text>
            </Surface>
          </View>

          <Divider style={styles.divider} />

          {/* --- PROPERTY TYPES --- */}
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Property Distribution
          </Text>
          <Surface style={styles.tableSurface} elevation={0}>
            {stats.propStatsList?.map((item, index) => (
              <View key={item.name} style={styles.tableRow}>
                <Text style={styles.tableText}>
                  {index + 1}. {item.name}
                </Text>
                <Text style={styles.tableValue}>{item.count}</Text>
              </View>
            ))}
          </Surface>

          <View style={styles.chartContainer}>
            <PieChart
              data={stats.propPieData}
              donut
              radius={80}
              innerRadius={60}
              showText
              textColor="white"
              textSize={14}
              fontWeight="bold"
              centerLabelComponent={() => (
                <Text style={styles.centerLabel}>Mix</Text>
              )}
            />
            <View style={styles.legendContainer}>
              {stats.propPieData?.map((item, i) => (
                <LegendItem key={i} {...item} />
              ))}
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* --- SERVICES --- */}
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Services Detail
          </Text>
          <Surface style={styles.tableSurface} elevation={0}>
            {stats.serviceStatsList?.map((item, index) => (
              <View key={item.name} style={styles.tableRow}>
                <Text style={styles.tableText}>
                  {index + 1}. {item.name}
                </Text>
                <Text style={styles.tableValue}>{item.count}</Text>
              </View>
            ))}
          </Surface>

          <View style={styles.chartContainer}>
            <PieChart
              data={stats.servicesPieData}
              radius={80}
              showText
              textColor="black"
              textSize={12}
            />
          </View>

          <Divider style={styles.divider} />

          {/* --- NO ACCESS --- */}
          <Text variant="titleMedium" style={styles.sectionTitle}>
            No Access Breakdown
          </Text>

          {/* 🎯 TABLE ADDED HERE */}
          <Surface style={styles.tableSurface} elevation={0}>
            {stats.accessStatsList?.map((item, index) => (
              <View key={item.name} style={styles.tableRow}>
                <Text style={styles.tableText}>
                  {index + 1}. {item.name}
                </Text>
                <Text style={styles.tableValue}>{item.count}</Text>
              </View>
            ))}
          </Surface>

          <View style={styles.chartBox}>
            <BarChart
              data={stats.accessBarData}
              barWidth={35}
              barBorderRadius={6}
              frontColor="#ef4444"
              yAxisThickness={0}
              xAxisThickness={0}
              hideRules
              labelTextStyle={styles.barLabel}
            />
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    padding: 20,
    margin: 15,
    borderRadius: 24,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontWeight: "900", color: "#1e293b" },
  scroll: { marginTop: 10 },
  heroRow: { flexDirection: "row", justifyContent: "space-between" },
  card: {
    flex: 1,
    padding: 15,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderLeftWidth: 5,
  },
  cardVal: { fontSize: 20, fontWeight: "bold", color: "#1e293b" },
  cardLabel: { fontSize: 9, color: "#64748b", fontWeight: "900" },
  sectionTitle: { fontWeight: "800", marginTop: 25, color: "#334155" },
  tableSurface: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tableText: {
    fontSize: 13,
    color: "#1e293b",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  tableValue: { fontSize: 13, fontWeight: "900", color: "#2563eb" },
  chartContainer: {
    alignItems: "center",
    marginVertical: 20,
    backgroundColor: "#fcfcfc",
    padding: 15,
    borderRadius: 16,
  },
  centerLabel: {
    textAlign: "center",
    fontWeight: "900",
    fontSize: 16,
    color: "#1e293b",
  },
  legendContainer: {
    width: "100%",
    marginTop: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    marginVertical: 4,
    minWidth: "40%",
  },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendLabel: {
    flex: 1,
    fontSize: 11,
    color: "#475569",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  legendValue: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1e293b",
    marginLeft: 4,
  },
  chartBox: { alignItems: "center", paddingVertical: 25 },
  barLabel: { color: "#64748b", fontSize: 10, fontWeight: "600" },
  divider: { marginTop: 20 },
});

// import { ScrollView, StyleSheet, View } from "react-native";
// import { BarChart, PieChart } from "react-native-gifted-charts";
// import {
//   Divider,
//   IconButton,
//   Modal,
//   Portal,
//   Surface,
//   Text,
// } from "react-native-paper";

// export const PremiseStatsModal = ({ visible, onDismiss, stats }) => {
//   return (
//     <Portal>
//       <Modal
//         visible={visible}
//         onDismiss={onDismiss}
//         contentContainerStyle={styles.container}
//       >
//         <View style={styles.header}>
//           <View>
//             <Text variant="headlineSmall" style={styles.title}>
//               Field Stats
//             </Text>
//             <Text variant="bodySmall">Current Premises Overview</Text>
//           </View>
//           <IconButton icon="close-circle" size={28} onPress={onDismiss} />
//         </View>

//         <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
//           {/* Summary Row */}
//           {/* Row 1: High Level Totals */}
//           <View style={styles.heroRow}>
//             <Surface
//               style={[styles.card, { borderLeftColor: "#2563eb" }]}
//               elevation={1}
//             >
//               <Text style={styles.cardVal}>{stats.total}</Text>
//               <Text style={styles.cardLabel}>PREMISES</Text>
//             </Surface>
//             <Surface
//               style={[styles.card, { borderLeftColor: "#ef4444" }]}
//               elevation={1}
//             >
//               <Text style={styles.cardVal}>{stats.noAccessCount}</Text>
//               <Text style={styles.cardLabel}>NO ACCESS</Text>
//             </Surface>
//           </View>

//           {/* Row 2: Service Totals (Meters) */}
//           <View style={[styles.heroRow, { marginTop: 12 }]}>
//             <Surface
//               style={[styles.card, { borderLeftColor: "#fbbf24" }]}
//               elevation={1}
//             >
//               <Text style={styles.cardVal}>{stats.elecMeters || 0}</Text>
//               <Text style={styles.cardLabel}>ELEC METERS</Text>
//             </Surface>
//             <Surface
//               style={[styles.card, { borderLeftColor: "#0ea5e9" }]}
//               elevation={1}
//             >
//               <Text style={styles.cardVal}>{stats.waterMeters || 0}</Text>
//               <Text style={styles.cardLabel}>WATER METERS</Text>
//             </Surface>
//           </View>

//           {/* Row 3: Bulk Meters */}
//           <View style={[styles.heroRow, { marginTop: 12 }]}>
//             <Surface
//               style={[styles.card, { borderLeftColor: "#b45309" }]}
//               elevation={1}
//             >
//               <Text style={styles.cardVal}>{stats.elecBulk}</Text>
//               <Text style={styles.cardLabel}>BULK ELEC</Text>
//             </Surface>
//             <Surface
//               style={[styles.card, { borderLeftColor: "#0369a1" }]}
//               elevation={1}
//             >
//               <Text style={styles.cardVal}>{stats.waterBulk}</Text>
//               <Text style={styles.cardLabel}>BULK WATER</Text>
//             </Surface>
//           </View>

//           <Divider style={styles.divider} />

//           <Text variant="titleMedium" style={styles.sectionTitle}>
//             Property Distribution
//           </Text>

//           {/* 📋 THE TABLE SECTION */}
//           <Surface style={styles.tableSurface} elevation={0}>
//             {stats.propStatsList?.map((item, index) => (
//               <View key={item.name} style={styles.tableRow}>
//                 <Text style={styles.tableText}>
//                   {index + 1}. {item.name}
//                 </Text>
//                 <Text style={styles.tableValue}>{item.count}</Text>
//               </View>
//             ))}
//           </Surface>

//           {/* 🥧 A. PIE CHART */}
//           <Text variant="labelLarge" style={styles.subLabel}>
//             Visual Split (Pie)
//           </Text>
//           <View style={styles.chartContainer}>
//             {/* 🥧 THE PIE CHART WITH INLINE LABELS */}
//             <PieChart
//               data={stats.propPieData}
//               donut
//               radius={90}
//               innerRadius={60}
//               showText // 🎯 Shows the 'text' property inside
//               textColor="white"
//               textSize={14}
//               fontWeight="bold"
//               innerCircleColor={"#FFF"}
//               centerLabelComponent={() => (
//                 <Text style={styles.centerLabel}>
//                   Total{"\n"}
//                   {stats.total}
//                 </Text>
//               )}
//             />
//           </View>

//           {/* 📊 B. BAR CHART */}
//           {/* 📊 B. PROPERTY BAR CHART */}
//           <Text variant="labelLarge" style={styles.subLabel}>
//             Comparative Volume (Bar)
//           </Text>
//           <View style={styles.chartBox}>
//             <BarChart
//               data={stats.propBarData}
//               barWidth={35}
//               initialSpacing={15}
//               noOfSections={4}
//               maxValue={stats.maxPropValue} // 🎯 Headroom for numbers
//               barBorderRadius={6}
//               frontColor="#4f46e5"
//               showValuesAsTopText // 🎯 Show numbers
//               topLabelTextStyle={{
//                 color: "#4f46e5",
//                 fontSize: 12,
//                 fontWeight: "900",
//               }}
//               yAxisThickness={0}
//               xAxisThickness={0}
//               hideRules
//               labelTextStyle={styles.barLabel}
//             />
//           </View>

//           <Divider style={styles.divider} />

//           {/* --- SECTION: SERVICES (WATER/ELEC) --- */}
//           <Text variant="titleMedium" style={styles.sectionTitle}>
//             Services Detail
//           </Text>

//           {/* 🎯 TABLE BEFORE GRAPH */}
//           <Surface style={styles.tableSurface} elevation={0}>
//             {stats.serviceStatsList?.map((item, index) => (
//               <View key={item.name} style={styles.tableRow}>
//                 <Text style={styles.tableText}>
//                   {index + 1}. {item.name}
//                 </Text>
//                 <Text style={styles.tableValue}>{item.count}</Text>
//               </View>
//             ))}
//           </Surface>

//           <View style={styles.chartContainer}>
//             <PieChart
//               data={stats.servicesPieData}
//               radius={80}
//               showText
//               textColor="black"
//               textSize={12}
//             />
//           </View>

//           <Divider style={styles.divider} />

//           {/* 🛑 NO ACCESS BAR CHART */}
//           <Text variant="titleMedium" style={styles.sectionTitle}>
//             No Access Breakdown
//           </Text>
//           <View style={styles.chartBox}>
//             <BarChart
//               data={stats.accessBarData}
//               barWidth={35}
//               initialSpacing={15}
//               maxValue={stats.maxAccessValue} // 🎯 Headroom for numbers
//               barBorderRadius={6}
//               frontColor="#ef4444"
//               showValuesAsTopText // 🎯 Show numbers
//               topLabelTextStyle={{
//                 color: "#ef4444",
//                 fontSize: 12,
//                 fontWeight: "bold",
//               }}
//               yAxisThickness={0}
//               xAxisThickness={0}
//               hideRules
//               labelTextStyle={styles.barLabel}
//             />
//           </View>
//         </ScrollView>
//       </Modal>
//     </Portal>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: "white",
//     padding: 20,
//     margin: 20,
//     borderRadius: 24,
//     maxHeight: "85%",
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   title: { fontWeight: "900", color: "#1e293b" },
//   scroll: { marginTop: 15 },
//   heroRow: { flexDirection: "row", justifyContent: "space-between" },
//   card: {
//     flex: 1,
//     padding: 16,
//     marginHorizontal: 4,
//     borderRadius: 12,
//     backgroundColor: "#f8fafc",
//     borderLeftWidth: 5,
//   },
//   cardVal: { fontSize: 22, fontWeight: "bold" },
//   cardLabel: { fontSize: 10, color: "#64748b", fontWeight: "800" },
//   sectionTitle: { fontWeight: "800", marginTop: 24, color: "#334155" },
//   chartBox: { alignItems: "center", paddingVertical: 20 },
//   // centerLabel: { textAlign: "center", fontWeight: "900", color: "#1e293b" },
//   divider: { marginTop: 20 },

//   tableSurface: {
//     backgroundColor: "#f8fafc",
//     borderRadius: 12,
//     padding: 12,
//     marginTop: 10,
//     borderWidth: 1,
//     borderColor: "#e2e8f0",
//   },
//   tableRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     paddingVertical: 6,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f1f5f9",
//   },
//   tableText: {
//     fontSize: 14,
//     color: "#1e293b",
//     fontWeight: "600",
//     textTransform: "capitalize",
//   },
//   tableValue: {
//     fontSize: 14,
//     fontWeight: "900",
//     color: "#2563eb",
//   },
//   subLabel: {
//     marginTop: 20,
//     color: "#64748b",
//     fontWeight: "700",
//     textAlign: "center",
//   },
//   barLabel: {
//     color: "#64748b",
//     fontSize: 10,
//     fontWeight: "600",
//   },

//   chartContainer: {
//     alignItems: "center",
//     marginVertical: 15,
//     backgroundColor: "#fdfdfd",
//     padding: 15,
//     borderRadius: 16,
//   },
//   centerLabel: {
//     textAlign: "center",
//     fontWeight: "900",
//     fontSize: 16,
//     color: "#1e293b",
//   },
//   legendContainer: {
//     width: "100%",
//     marginTop: 20,
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "center",
//   },
//   legendItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginHorizontal: 10,
//     marginVertical: 5,
//     minWidth: "40%", // Keeps them in a neat 2-column grid
//   },
//   legendDot: {
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     marginRight: 8,
//   },
//   legendLabel: {
//     flex: 1,
//     fontSize: 12,
//     color: "#475569",
//     fontWeight: "600",
//     textTransform: "capitalize",
//   },
//   legendValue: {
//     fontSize: 12,
//     fontWeight: "800",
//     color: "#1e293b",
//     marginLeft: 5,
//   },
// });
