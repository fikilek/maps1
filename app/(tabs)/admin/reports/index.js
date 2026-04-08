import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function ReportsIndex() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      {/* 📚 REGISTRY & INVENTORY */}
      <Section title="Registry & Inventory">
        <ReportCard
          title="Meter Registry"
          subtitle="AST and meter inventory from operational records"
          icon="counter"
          onPress={() => router.push("/admin/reports/meter-registry")}
        />
        <ReportCard
          title="Premise Registry"
          subtitle="LM-wide premise inventory and coverage view"
          icon="home-city"
          onPress={() => router.push("/admin/reports/premise-registry")}
        />
        <ReportCard
          title="Erfs Registry"
          subtitle="LM-wide Erfs inventory and coverage view"
          icon="home-city"
          onPress={() => router.push("/admin/reports/erf-registry")}
        />
        <ReportCard
          title="Ward Registry"
          subtitle="Ward structure and assignments."
          icon="office-building-marker"
          onPress={() => router.push("/admin/reports/ward-registry")}
        />
        <ReportCard
          title="Workbase Registry"
          subtitle="Workbase structure, assignments and LM coverage"
          icon="office-building-marker"
          onPress={() => router.push("/admin/reports/workbase-registry")}
        />
        <ReportCard
          title="Service Provider Registry"
          subtitle="Provider structure, status and user footprint"
          icon="hard-hat"
          onPress={() =>
            router.push("/admin/reports/service-provider-registry")
          }
        />
        <ReportCard
          title="User Registry"
          subtitle="Full personnel listing by role, provider and status"
          icon="account-group"
          onPress={() => router.push("/admin/reports/user-registry")}
        />
      </Section>

      {/* ⚙️ ACTIVITY REPORTS */}
      <Section title="Activity Reports">
        <ReportCard
          title="No Access Report"
          subtitle="Blocked access events, reasons and affected premises"
          icon="door-closed-lock"
          onPress={() => router.push("/admin/reports/no-access-report")}
        />
        <ReportCard
          title="User Activity Report"
          subtitle="Transaction activity and field-user performance"
          icon="account-group-outline"
          onPress={() => router.push("/admin/reports/users-activity-report")}
        />
        <ReportCard
          title="Normalisation Report"
          subtitle="Normalisation transactions and action patterns"
          icon="hammer-wrench"
          onPress={() => router.push("/admin/reports/normalisation-report")}
        />
        <ReportCard
          title="Anomaly Report"
          subtitle="Anomaly events, types and detail patterns"
          icon="alert-decagram"
          onPress={() => router.push("/admin/reports/anomaly-report")}
        />
      </Section>

      {/* 💰 REVENUE */}
      <Section title="Revenue">
        <ReportCard
          title="Prepaid Revenue Report"
          subtitle="LM prepaid sales, meter activity and monthly trends"
          icon="currency-usd"
          onPress={() => router.push("/admin/reports/prepaid-revenue-report")}
        />
        <ReportCard
          title="Prepaid Revenue Dashboard"
          subtitle="Visual revenue trends and grouped sales insights"
          icon="chart-line"
          onPress={() =>
            router.push("/admin/reports/prepaid-revenue-dashboard")
          }
        />
      </Section>
    </ScrollView>
  );
}

/* ---------------- UI HELPERS ---------------- */

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function ReportCard({ title, subtitle, icon, onPress }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.iconBox}>
        <MaterialCommunityIcons name={icon} size={28} color="#2563eb" />
      </View>

      <View style={styles.textColumn}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={20} color="#cbd5e1" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#64748b",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  iconBox: {
    width: 48,
    height: 48,
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textColumn: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e293b",
  },
  cardSubtitle: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
});
