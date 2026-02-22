import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function ReportsIndex() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      {/* 🚀 OPERATIONAL INTEL */}
      <Section title="Field Operations">
        <ReportCard
          title="LM Premise Report"
          subtitle="Detailed audit for payment prep (Meter-per-row)"
          icon="home-city"
          onPress={() => router.push("/admin/reports/lm-premise-report")}
        />
        <ReportCard
          title="No Access Report"
          subtitle="View friction and blocked properties"
          icon="door-closed-lock"
          onPress={() => router.push("/admin/reports/no-access-report")}
        />
        <ReportCard
          title="Users Report"
          subtitle="Performance & Transaction tracking for all agents"
          icon="account-group-outline" // 🏛️ More appropriate for a User report
          onPress={() => router.push("/admin/reports/users-trns-report")}
        />
        <ReportCard
          title="Normalisation Report"
          subtitle="Tracking normalisation transactions "
          icon="hammer-wrench"
          onPress={() => router.push("/admin/reports/normalisation-report")}
        />
        <ReportCard
          title="Anomaly Report"
          subtitle="Details of Anomaly and Anomaly Details transactions "
          icon="alert-decagram"
          onPress={() => router.push("/admin/reports/anomaly-report")}
        />
      </Section>

      {/* 🏛️ MANAGEMENT INTEL */}
      <Section title="Governance & Registry">
        <ReportCard
          title="Workbases (WBs)"
          subtitle="National LM statistics and coverage"
          icon="office-building-marker"
          onPress={() => router.push("/admin/reports/workbases")}
        />
        <ReportCard
          title="Service Provider Report"
          subtitle="Contractor audit: Users vs. Production"
          icon="hard-hat"
          onPress={() => router.push("/admin/reports/service-provider-report")}
        />
        <ReportCard
          title="User Registry"
          subtitle="Full personnel list filtered by SP"
          icon="account-group"
          onPress={() => router.push("/admin/reports/users-report")}
        />
      </Section>

      {/* 💰 FINANCIAL INTEL */}
      <Section title="Finance (WIP)">
        <ReportCard
          title="Prepaid Revenue Report"
          subtitle="Strategy Phase: Sales vs. Audits"
          icon="currency-usd"
          onPress={() => router.push("/admin/reports/prepaid-revenue-report")}
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
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  section: { marginBottom: 24 },
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
  textColumn: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: "#1e293b" },
  cardSubtitle: { fontSize: 11, color: "#64748b", marginTop: 2 },
});
