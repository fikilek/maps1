import { Dimensions, StyleSheet, Text, View } from "react-native";

const { width } = Dimensions.get("window");

export const RevenueCard = ({ amount }) => (
  <View style={styles.card}>
    <Text style={styles.label}>TOTAL PREPAID REVENUE (JAN 2026)</Text>

    <View style={styles.row}>
      <Text style={styles.currency}>R</Text>
      <Text style={styles.value}>{amount.toLocaleString()}</Text>
    </View>

    <View style={styles.footer}>
      <Text style={styles.footerText}>
        +12.4% <Text style={styles.footerSub}>vs Dec 2025</Text>
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1e293b", // Dark Slate
    marginHorizontal: 16,
    marginTop: 10,
    padding: 24,
    borderRadius: 20,
    // Premium Shadow
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  label: {
    color: "#94a3b8", // Light Slate for the secondary info
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start", // Keeps the "R" slightly elevated
  },
  currency: {
    color: "#fbbf24", // iREPS Gold
    fontSize: 24,
    fontWeight: "900",
    marginTop: 6, // Optical alignment with the larger value
    marginRight: 4,
  },
  value: {
    color: "#ffffff",
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: -1,
  },
  footer: {
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(148, 163, 184, 0.2)", // Subtle divider
  },
  footerText: {
    color: "#4ade80", // Success Green for the growth percentage
    fontSize: 13,
    fontWeight: "800",
  },
  footerSub: {
    color: "#64748b",
    fontWeight: "600",
  },
});
