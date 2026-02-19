import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, View } from "react-native";
import { Avatar, Card, Surface, Text } from "react-native-paper";
import { useAuth } from "../../../../src/hooks/useAuth";
// We'll create this slice/api next to fetch revenue data
// import { useGetRevenueStatsQuery } from '../../../src/redux/revenueApi';

export default function RevenueAnalyticsScreen() {
  const { activeWorkbase } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Revenue Command</Text>
        <Text style={styles.subtitle}>{activeWorkbase?.name} Operations</Text>
      </View>

      {/* 💰 TOTAL REVENUE POD */}
      <Surface style={styles.revenueMainCard} elevation={2}>
        <Avatar.Icon
          size={48}
          icon="currency-usd"
          style={{ backgroundColor: "#0891b2" }}
        />
        <View style={styles.revTextContainer}>
          <Text style={styles.revLabel}>Total Prepaid Yield (MTD)</Text>
          <Text style={styles.revValue}>R 1,245,670.00</Text>
        </View>
      </Surface>

      <View style={styles.grid}>
        <StatCard
          title="Tokens Sold"
          value="14,200"
          icon="ticket-confirmation"
          color="#0891b2"
        />
        <StatCard
          title="Avg Purchase"
          value="R 87.00"
          icon="trending-up"
          color="#0ea5e9"
        />
      </View>

      <Card style={styles.chartPlaceholder}>
        <Card.Title
          title="Purchasing Trends"
          subtitle="Daily token sales volume"
        />
        <Card.Content>
          <View style={styles.fakeChart}>
            <Text style={{ color: "#94a3b8" }}>
              {" "}
              [ Line Graph: Token Sales Over 30 Days ]{" "}
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Surface style={styles.warningBox}>
        <Text style={styles.warningTitle}>Revenue Leakage Alert</Text>
        <Text style={styles.warningText}>
          34 Meters in Ward 4 have reported 0 purchases in 60 days. Immediate
          inspection recommended.
        </Text>
      </Surface>
    </ScrollView>
  );
}

const StatCard = ({ title, value, icon, color }) => (
  <Surface style={styles.statCard} elevation={1}>
    <MaterialCommunityIcons name={icon} size={24} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{title}</Text>
  </Surface>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "900", color: "#1e293b" },
  subtitle: { fontSize: 14, color: "#64748b", fontWeight: "600" },
  revenueMainCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  revTextContainer: { marginLeft: 16 },
  revLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  revValue: { fontSize: 28, fontWeight: "900", color: "#0891b2" },
  grid: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e293b",
    marginTop: 8,
  },
  statLabel: { fontSize: 10, fontWeight: "700", color: "#64748b" },
  chartPlaceholder: {
    borderRadius: 16,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  fakeChart: {
    height: 150,
    justifyContent: "center",
    alignItems: "center",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    marginTop: 10,
  },
  warningBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff1f2",
    borderLeftWidth: 4,
    borderLeftColor: "#e11d48",
  },
  warningTitle: {
    fontWeight: "900",
    color: "#9f1239",
    fontSize: 12,
    marginBottom: 4,
  },
  warningText: { fontSize: 12, color: "#be123c" },
});
