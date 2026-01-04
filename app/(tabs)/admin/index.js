import { useAuth } from "@/src/hooks/useAuth";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function AdminDashboard() {
  const router = useRouter();
  const { isSPU } = useAuth();

  return (
    <View style={styles.container}>
      {/* Service Providers */}
      <Section title="Service Providers">
        <Card
          title="Service Providers"
          subtitle="View & manage contractors"
          onPress={() => router.push("/(tabs)/admin/service-providers")}
        />

        {isSPU && (
          <Card
            title="Register Contractor"
            subtitle="Create a Main Contractor (MNC)"
            onPress={() =>
              router.push("/(tabs)/admin/service-providers/create")
            }
          />
        )}
      </Section>

      {/* Users */}

      {isSPU && (
        <Section title="Users">
          <Card
            title="Create Admin"
            subtitle="Add a system administrator"
            onPress={() => router.push("/(tabs)/admin/(spu)/create-admin")}
          />
        </Section>
      )}
    </View>
  );
}

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
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
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
