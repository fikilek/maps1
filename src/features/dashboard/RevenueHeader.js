import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Dimensions, StyleSheet, Text, View } from "react-native";

const { width } = Dimensions.get("window");

export const RevenueHeader = ({ totalRevenue }) => {
  // 📈 Financial Logic
  const vatRate = 0.15;
  const vatAmount = totalRevenue * (vatRate / (1 + vatRate));
  const netRevenue = totalRevenue - vatAmount;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.label}>TOTAL PREPAID REVENUE (JAN 2026)</Text>
        <MaterialCommunityIcons name="shield-check" size={16} color="#4CD964" />
      </View>

      <View style={styles.mainAmountRow}>
        <Text style={styles.currency}>R</Text>
        <Text style={styles.amountText}>
          {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.subMetricsRow}>
        <View style={styles.subItem}>
          <Text style={styles.subLabel}>VAT (15%)</Text>
          <Text style={styles.subValue}>
            R{" "}
            {vatAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Text>
        </View>
        <View style={[styles.subItem, styles.leftBorder]}>
          <Text style={styles.subLabel}>NET REVENUE</Text>
          <Text style={styles.subValue}>
            R{" "}
            {netRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1e293b", // Deep Slate for "Executive" feel
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 20,
    marginTop: 10,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  mainAmountRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  currency: {
    color: "#fbbf24",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 8,
    marginRight: 4,
  },
  amountText: { color: "#fff", fontSize: 42, fontWeight: "900" },
  divider: {
    height: 1,
    backgroundColor: "rgba(148, 163, 184, 0.2)",
    marginBottom: 16,
  },
  subMetricsRow: { flexDirection: "row", justifyContent: "space-between" },
  subItem: { flex: 1 },
  leftBorder: {
    borderLeftWidth: 1,
    borderLeftColor: "rgba(148, 163, 184, 0.2)",
    paddingLeft: 20,
  },
  subLabel: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 4,
  },
  subValue: { color: "#cbd5e1", fontSize: 16, fontWeight: "700" },
});
