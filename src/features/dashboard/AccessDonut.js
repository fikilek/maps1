import { StyleSheet, Text, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";

export const AccessDonut = ({ data }) => {
  // data expected: [{ value: 86, color: '#4CD964', text: 'Access' }, { value: 14, color: '#FF3B30', text: 'No Access' }]

  return (
    <View style={styles.container}>
      <Text style={styles.chartTitle}>AUDIT ACCESS SUCCESS RATE</Text>

      <View style={styles.chartWrapper}>
        <PieChart
          data={data}
          donut
          radius={80}
          innerRadius={60}
          innerCircleColor={"#ffffff"}
          centerLabelComponent={() => (
            <View style={styles.centerLabel}>
              <Text style={styles.centerValue}>{data[0].value}%</Text>
              <Text style={styles.centerText}>SUCCESS</Text>
            </View>
          )}
        />

        <View style={styles.legendContainer}>
          {data.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text style={styles.legendLabel}>{item.text}: </Text>
              <Text style={styles.legendValue}>{item.value}%</Text>
            </View>
          ))}
        </View>
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
    marginBottom: 20,
  },
  chartWrapper: { alignItems: "center" },
  centerLabel: { justifyContent: "center", alignItems: "center" },
  centerValue: { fontSize: 22, fontWeight: "900", color: "#1e293b" },
  centerText: { fontSize: 9, color: "#94a3b8", fontWeight: "800" },
  legendContainer: {
    flexDirection: "row",
    marginTop: 20,
    width: "100%",
    justifyContent: "space-around",
  },
  legendItem: { flexDirection: "row", alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendLabel: { fontSize: 11, color: "#64748b", fontWeight: "600" },
  legendValue: { fontSize: 11, color: "#1e293b", fontWeight: "900" },
});
