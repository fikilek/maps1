import { StyleSheet, Text, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";

export const PropertyBarChart = ({ data }) => {
  // data expected: [{ value: 13809, label: 'Res', ... }, { value: 789, label: 'Com', ... }]

  return (
    <View style={styles.container}>
      <Text style={styles.chartTitle}>
        INFRASTRUCTURE PROFILE (PROPERTY TYPE)
      </Text>

      <View style={styles.chartWrapper}>
        <BarChart
          data={data}
          barWidth={40}
          noOfSections={4}
          barBorderRadius={8}
          frontColor={"#3b82f6"}
          yAxisThickness={0}
          xAxisThickness={0}
          hideRules
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          isAnimated
          showValuesAsTopLabel
          topLabelTextStyle={styles.topLabel}
        />
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoText}>
          Audit coverage: <Text style={styles.bold}>15,463 Total Erfs</Text>
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
    letterSpacing: 1.2,
    marginBottom: 25,
  },
  chartWrapper: { paddingBottom: 10 },
  axisText: { fontSize: 10, color: "#94a3b8", fontWeight: "700" },
  topLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#1e293b",
    marginBottom: 4,
  },
  infoRow: {
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  infoText: { fontSize: 11, color: "#64748b" },
  bold: { fontWeight: "900", color: "#1e293b" },
});
