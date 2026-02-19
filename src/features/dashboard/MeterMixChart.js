import { StyleSheet, Text, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";

export const MeterMixChart = ({ waterCount, elecCount }) => {
  const total = waterCount + elecCount;

  // 📊 Chart Data Preparation
  const pieData = [
    { value: waterCount, color: "#3b82f6", text: "Water", focused: true }, // iREPS Water Blue
    { value: elecCount, color: "#eab308", text: "Elec" }, // iREPS Elec Gold
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.chartTitle}>METER DISTRIBUTION</Text>

      <View style={styles.chartWrapper}>
        <PieChart
          data={pieData}
          donut
          sectionAutoFocus
          radius={90}
          innerRadius={60}
          innerCircleColor={"#ffffff"}
          centerLabelComponent={() => {
            return (
              <View style={styles.centerLabel}>
                <Text style={styles.centerValue}>{total}</Text>
                <Text style={styles.centerText}>TOTAL</Text>
              </View>
            );
          }}
        />

        {/* 🏷️ Custom Legend */}
        <View style={styles.legendContainer}>
          <LegendItem label="Water Meters" value={waterCount} color="#3b82f6" />
          <LegendItem label="Elec Meters" value={elecCount} color="#eab308" />
        </View>
      </View>
    </View>
  );
};

const LegendItem = ({ label, value, color }) => (
  <View style={styles.legendItem}>
    <View style={[styles.dot, { backgroundColor: color }]} />
    <Text style={styles.legendLabel}>{label}: </Text>
    <Text style={styles.legendValue}>{value.toLocaleString()}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#64748b",
    letterSpacing: 1,
    marginBottom: 20,
  },
  chartWrapper: { alignItems: "center", justifyContent: "center" },
  centerLabel: { justifyContent: "center", alignItems: "center" },
  centerValue: { fontSize: 24, fontWeight: "900", color: "#1e293b" },
  centerText: { fontSize: 10, color: "#94a3b8", fontWeight: "700" },
  legendContainer: { marginTop: 20, width: "100%" },
  legendItem: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendLabel: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  legendValue: { fontSize: 12, color: "#1e293b", fontWeight: "800" },
});
