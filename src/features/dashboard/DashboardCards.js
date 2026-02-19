import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Dimensions, StyleSheet, Text, View } from "react-native";

const { width } = Dimensions.get("window");

const PowerCard = ({ title, value, subtext, icon, color }) => (
  <View style={[styles.card, { borderLeftColor: color }]}>
    <View style={styles.cardHeader}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <Text style={styles.cardValue}>{value}</Text>
    <Text style={styles.cardSubtext}>{subtext}</Text>
  </View>
);

export const PowerNumbersRow = ({ stats }) => {
  return (
    <View style={styles.row}>
      <PowerCard
        title="TOTAL ERFS"
        value={stats?.totalErfs?.toLocaleString()}
        subtext={`${stats.auditedErfs} Audited`}
        icon="home-city-outline"
        color="#2563eb"
      />
      <PowerCard
        title="TOTAL ASSETS"
        value={stats?.totalMeters?.toLocaleString()}
        subtext="Water & Elec"
        icon="lightning-bolt-outline"
        color="#eab308"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 20,
  },
  card: {
    width: width / 2 - 24,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 5,
    // Elevation for "Wow"
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  cardTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748b",
    marginLeft: 6,
    letterSpacing: 1,
  },
  cardValue: { fontSize: 24, fontWeight: "900", color: "#1e293b" },
  cardSubtext: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: "600",
    marginTop: 2,
  },
});
