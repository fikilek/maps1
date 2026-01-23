import { useAuth } from "@/src/hooks/useAuth";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function AdminDashboard() {
  const router = useRouter();
  const { isSPU, isADM, isMNG } = useAuth();

  const canViewUsers = isSPU || isADM || isMNG;
  // 🎯 Only Superusers and Managers should modify the "Laws of the Form"
  const canManageSettings = isSPU || isMNG;

  return (
    <ScrollView style={styles.container}>
      <Section title="Operational Management">
        <Card
          title="Service Providers"
          subtitle="View & manage contractors"
          onPress={() => router.push("/(tabs)/admin/service-providers")}
        />

        {canViewUsers && (
          <Card
            title="Users"
            subtitle="View platform users"
            onPress={() => router.push("/(tabs)/admin/users")}
          />
        )}
      </Section>

      {/* 🛠️ New Configuration Section */}
      {canManageSettings && (
        <Section title="System Configuration">
          <Card
            title="Dropdown Settings"
            subtitle="Manage meter types, anomalies & manufacturers"
            onPress={() => router.push("/(tabs)/admin/settings")}
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
