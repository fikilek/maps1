import { StyleSheet, Text, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";

export const WardProgressChart = ({ data }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.chartTitle}>AUDIT PROGRESS BY WARD (%)</Text>

      <View style={styles.chartWrapper}>
        <BarChart
          data={data}
          horizontal
          barWidth={22}
          noOfSections={4}
          barBorderRadius={4}
          spacing={20}
          hideRules
          xAxisThickness={0}
          yAxisThickness={0}
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          isAnimated
          animationDuration={1000}
          // Display the percentage value on top of the bar
          showValuesAsTopLabel
          topLabelTextStyle={styles.topLabel}
        />
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
    fontSize: 12,
    fontWeight: "900",
    color: "#64748b",
    letterSpacing: 1,
    marginBottom: 20,
  },
  chartWrapper: {
    paddingRight: 20, // Extra room for the top labels
  },
  axisText: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "700",
  },
  topLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#1e293b",
  },
});
