import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export const AgentLeaderboard = ({ data }) => {
  const maxVal = Math.max(...data.map((d) => d.value));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SERVICE PROVIDER LEADERBOARD (TRNS)</Text>

      {data.map((item, index) => (
        <View key={item.label} style={styles.leaderRow}>
          <View style={styles.rankCircle}>
            <Text style={styles.rankText}>{index + 1}</Text>
          </View>

          <View style={styles.statsColumn}>
            <View style={styles.infoRow}>
              <Text style={styles.nameText}>{item.label}</Text>
              <Text style={styles.valueText}>
                {item.value.toLocaleString()}
              </Text>
            </View>

            {/* 📊 Performance Bar */}
            <View style={styles.barBackground}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${(item.value / maxVal) * 100}%`,
                    backgroundColor: index === 0 ? "#fbbf24" : "#3b82f6", // Gold for #1
                  },
                ]}
              />
            </View>
          </View>
        </View>
      ))}

      <View style={styles.footer}>
        <MaterialCommunityIcons
          name="information-outline"
          size={12}
          color="#94a3b8"
        />
        <Text style={styles.footerText}>
          Based on verified Jan 2026 transactions
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 20,
    elevation: 4,
  },
  title: {
    fontSize: 11,
    fontWeight: "900",
    color: "#64748b",
    letterSpacing: 1,
    marginBottom: 20,
  },
  leaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  rankCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  rankText: { fontSize: 12, fontWeight: "900", color: "#1e293b" },
  statsColumn: { flex: 1 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  nameText: { fontSize: 14, fontWeight: "800", color: "#1e293b" },
  valueText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  barBackground: {
    height: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 3 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f8fafc",
  },
  footerText: {
    fontSize: 10,
    color: "#94a3b8",
    marginLeft: 4,
    fontWeight: "600",
  },
});
