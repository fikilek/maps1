import { useAuth } from "@/src/hooks/useAuth";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function AdminDashboard() {
  const router = useRouter();
  const { isSPU, isADM, isMNG, isSPV, isFWR } = useAuth();
  // console.log(`isMNG`, JSON.stringify(isMNG, null, 2));

  return (
    <ScrollView style={styles.container}>
      <Section title="Operational Management">
        {/* SPU/ADM see all SPs, MNG/SPV(MNC) see own MNC and SUBS , SPV(SUBC) see SP, FWR see own SP */}
        {(isSPU || isADM || isMNG || isFWR || isSPV) && (
          <Card
            title="Service Providers"
            subtitle="View & manage contractors"
            onPress={() => router.push("/(tabs)/admin/service-providers")}
          />
        )}

        {/* All see own user */}
        {(isSPU || isADM || isMNG || isFWR || isSPV) && (
          <Card
            title="User"
            subtitle="View platform a user"
            onPress={() => router.push("/(tabs)/admin/user")}
          />
        )}

        {/* SPU/ADM see all users, MNG/SPV(MNC) see own MNC users and SUBs users , SPV(SUBC) see own SP users, FWR no access */}
        {(isSPU || isADM || isMNG || isSPV) && (
          <Card
            title="Users"
            subtitle="View platform users"
            onPress={() => router.push("/(tabs)/admin/users")}
          />
        )}

        {(isSPU || isADM || isMNG) && (
          <Card
            title="Pending Authorizations"
            subtitle="Review and mobilise new recruits"
            icon="account-clock"
            color="#f59e0b"
            onPress={() => router.push("/admin/pendingUsers")}
          />
        )}
      </Section>

      {/* 🛠️ New Configuration Section */}
      {(isSPU || isADM) && (
        <Section title="System Configuration">
          <Card
            title="Dropdown Settings"
            subtitle="Manage meter types, anomalies & manufacturers"
            onPress={() => router.push("/(tabs)/admin/settings")}
          />
        </Section>
      )}

      {/* 📈 New Reporting Section */}
      {(isSPU || isADM || isMNG) && (
        <Section title="Reporting & Intelligence">
          <Card
            title="Management Reports"
            subtitle="Financial, Operational & User Reports"
            onPress={() => router.push("/(tabs)/admin/reports")}
          />
          <Card
            title="Operations Management Center"
            subtitle="Workorder allocation, FW teams etc "
            onPress={() => router.push("/(tabs)/admin/operations")}
          />
        </Section>
      )}

      {/* 📈 Local Storage Section */}
      {(isSPU || isADM || isMNG || isSPV || isFWR) && (
        <Section title="Local Storage">
          <Card
            title="Ward ERFs Storage"
            subtitle="Ward ERFs sync & management"
            onPress={() => router.push("/(tabs)/admin/storage/ward-erfs-sync")}
          />
          <Card
            title="Meter Discovery Forms Storage"
            subtitle="Offline Meter Audit forms queue"
            onPress={() =>
              router.push("/(tabs)/admin/storage/forms-submission-queue")
            }
          />
          <Card
            title="Sales Storage"
            subtitle="Offline Sales data"
            onPress={() => router.push("/(tabs)/admin/storage/sales-sync")}
          />
          <Card
            title="Premise Forms Storage"
            subtitle="Offline Premise submission queue"
            onPress={() =>
              router.push("/(tabs)/admin/storage/premise-offline-storage")
            }
          />
        </Section>
      )}
    </ScrollView>
  );
}

// ... Card and Section components and styles stay the same

/* ---------------- UI Helpers ---------------- */

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Card({ title, subtitle, onPress }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#f5f5f5",
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
});
