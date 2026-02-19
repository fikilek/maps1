import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Dimensions, StyleSheet, Text, View } from "react-native";

const { width } = Dimensions.get("window");

const RiskCard = ({ title, value, icon, color }) => (
  <View style={[styles.card, { borderTopColor: color }]}>
    <MaterialCommunityIcons
      name={icon}
      size={20}
      color={color}
      style={styles.icon}
    />
    <Text style={styles.cardValue}>{value.toLocaleString()}</Text>
    <Text style={styles.cardTitle}>{title}</Text>
  </View>
);

export const RevenueRiskRow = ({ anomalies }) => {
  return (
    <View style={styles.row}>
      <RiskCard
        title="BYPASSED"
        value={anomalies.bypassed || 0}
        icon="flash-alert-outline"
        color="#ef4444" // Dangerous Red
      />
      <RiskCard
        title="VANDALIZED"
        value={anomalies.vandalized || 0}
        icon="hammer-wrench"
        color="#f59e0b" // Warning Amber
      />
      <RiskCard
        title="NO ACCESS"
        value={anomalies.noAccess || 0}
        icon="door-closed-lock"
        color="#64748b" // Neutral Slate
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  card: {
    width: width / 3 - 16,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    borderTopWidth: 4,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  icon: { marginBottom: 4 },
  cardValue: { fontSize: 18, fontWeight: "900", color: "#1e293b" },
  cardTitle: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 0.5,
  },
});
