// /app/(tabs)/admin/reports/components/GraphsView.js
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { Divider, Surface, Text } from "react-native-paper";
// 🛰️ Using the existing library from your package.json
import { BarChart, PieChart } from "react-native-gifted-charts";

const screenWidth = Dimensions.get("window").width;

const PerformanceCard = ({ stats, title, isAggregate = false }) => {
  // 📊 1. Prepare Bar Chart Data
  const barData = [
    { value: stats.noAccess || 0, label: "NA", frontColor: "#94a3b8" },
    { value: stats.discoveries || 0, label: "Disc", frontColor: "#2563eb" },
    { value: stats.installations || 0, label: "Inst", frontColor: "#16a34a" },
    { value: stats.disconnections || 0, label: "Off", frontColor: "#dc2626" },
    { value: stats.reconnections || 0, label: "On", frontColor: "#0ea5e9" },
    { value: stats.inspections || 0, label: "Insp", frontColor: "#8b5cf6" },
    { value: stats.removals || 0, label: "Rem", frontColor: "#475569" },
  ];

  // 🥧 2. Prepare Pie Chart Data (Filtering out zeros to keep it clean)
  const pieData = [
    { value: stats.noAccess || 0, color: "#94a3b8", text: "NA" },
    { value: stats.discoveries || 0, color: "#2563eb", text: "Disc" },
    { value: stats.installations || 0, color: "#16a34a", text: "Inst" },
    { value: stats.disconnections || 0, color: "#dc2626", text: "Off" },
    { value: stats.reconnections || 0, color: "#0ea5e9", text: "On" },
    { value: stats.inspections || 0, color: "#8b5cf6", text: "Insp" },
    { value: stats.removals || 0, color: "#475569", text: "Rem" },
  ].filter((item) => item.value > 0);

  return (
    <Surface
      style={[styles.card, isAggregate && styles.aggCard]}
      elevation={isAggregate ? 3 : 1}
    >
      <Text style={styles.cardTitle}>{title}</Text>
      <Divider style={styles.cardDivider} />

      <Text style={styles.chartLabel}>Volume by Action</Text>
      <View style={styles.barWrapper}>
        <BarChart
          data={barData}
          barWidth={22}
          spacing={15}
          roundedTop
          noOfSections={4}
          yAxisThickness={0}
          xAxisThickness={0}
          yAxisTextStyle={{ color: "#94a3b8", fontSize: 10 }}
          xAxisLabelTextStyle={{
            color: "#475569",
            fontSize: 9,
            fontWeight: "bold",
          }}
          hideRules
          isAnimated
        />
      </View>

      <Text style={[styles.chartLabel, { marginTop: 25 }]}>
        Activity Distribution
      </Text>
      <View style={styles.pieWrapper}>
        {pieData.length > 0 ? (
          <PieChart
            data={pieData}
            donut
            showGradient
            sectionAutoFocus
            radius={70}
            innerRadius={45}
            innerCircleColor={"#fff"}
            centerLabelComponent={() => (
              <View style={{ justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                  {Object.values(stats).reduce(
                    (a, b) => (typeof b === "number" ? a + b : a),
                    0,
                  )}
                </Text>
                <Text style={{ fontSize: 8, color: "#94a3b8" }}>TOTAL</Text>
              </View>
            )}
          />
        ) : (
          <Text style={styles.emptyText}>
            No transactions for this selection.
          </Text>
        )}
      </View>
    </Surface>
  );
};

export default function GraphsView({ data, totals }) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* 🏛️ NATIONAL AGGREGATE */}
      <PerformanceCard
        stats={totals}
        title="NATIONAL AGGREGATE (FILTERED)"
        isAggregate
      />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>INDIVIDUAL AGENT ANALYTICS</Text>
      </View>

      {/* 🏛️ INDIVIDUAL CARDS */}
      {data.map((user) => (
        <PerformanceCard key={user.uid} stats={user} title={user.name} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 15 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 1,
    borderLeftColor: "#e2e8f0",
  },
  aggCard: { borderLeftWidth: 6, borderLeftColor: "#2563eb" },
  cardTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#1e293b",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  cardDivider: { marginBottom: 20 },
  chartLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748b",
    marginBottom: 15,
    textTransform: "uppercase",
  },
  barWrapper: { alignItems: "center", marginLeft: -20 }, // Offsets internal library padding
  pieWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  sectionHeader: { marginVertical: 15, paddingLeft: 5 },
  sectionHeaderText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#475569",
    letterSpacing: 1,
  },
  emptyText: {
    textAlign: "center",
    padding: 20,
    fontSize: 11,
    color: "#94a3b8",
    fontStyle: "italic",
  },
});
