import { StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";

export const RevenueTrendChart = () => {
  const lineData = [
    { value: 68.5, label: "Sep" },
    { value: 74.2, label: "Oct" },
    { value: 82.1, label: "Nov" },
    { value: 88.4, label: "Dec" },
    { value: 92.2, label: "Jan", dataPointText: "R92.2M" },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.chartTitle}>MONTHLY REVENUE TREND (MILLIONS)</Text>

      <View style={styles.chartWrapper}>
        <LineChart
          data={lineData}
          height={180}
          curved
          color="#fbbf24" // iREPS Gold
          thickness={4}
          dataPointsColor="#1e293b"
          dataPointsRadius={5}
          focusedDataPointColor="#fbbf24"
          initialSpacing={20}
          noOfSections={4}
          yAxisColor="#cbd5e1"
          xAxisColor="#cbd5e1"
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          // Gradient Fill for "Wow" factor
          areaChart
          startFillColor="rgba(251, 191, 36, 0.3)"
          endFillColor="rgba(251, 191, 36, 0.01)"
          hideRules
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Total Growth since Sep 2025:{" "}
          <Text style={styles.success}>+34.6%</Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 20,
    elevation: 4,
  },
  chartTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#64748b",
    letterSpacing: 1,
    marginBottom: 25,
  },
  chartWrapper: { marginLeft: -10 },
  axisText: { fontSize: 10, color: "#94a3b8", fontWeight: "700" },
  footer: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
  },
  footerText: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  success: { color: "#4CD964", fontWeight: "900" },
});
