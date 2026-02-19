import { StyleSheet, Text, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";

export const NoAccessReasonsChart = ({ data }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.chartTitle}>NO-ACCESS REASONS (FIELD OBSTACLES)</Text>

      <View style={styles.chartWrapper}>
        <BarChart
          data={data}
          horizontal
          barWidth={24}
          noOfSections={3}
          barBorderRadius={6}
          spacing={25}
          hideRules
          xAxisThickness={0}
          yAxisThickness={0}
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          isAnimated
          animationDuration={1200}
          showValuesAsTopLabel
          topLabelTextStyle={styles.topLabel}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Total Obstacles: <Text style={styles.bold}>3,244</Text>
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
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  chartTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#64748b",
    letterSpacing: 1,
    marginBottom: 20,
  },
  chartWrapper: { paddingRight: 40 }, // Space for the value labels
  axisText: { fontSize: 10, color: "#94a3b8", fontWeight: "700" },
  topLabel: { fontSize: 11, fontWeight: "900", color: "#1e293b" },
  footer: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
  },
  footerText: { fontSize: 12, color: "#64748b" },
  bold: { fontWeight: "900", color: "#1e293b" },
});
