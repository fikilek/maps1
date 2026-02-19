import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export default function QualityAssurance() {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="shield-search" size={80} color="#0891b2" />
      <Text style={styles.title}>QA Gateway</Text>
      <Text style={styles.subtitle}>
        Manual verification of FormDiscovery & FormInspection documents.
        Enabling Supervisor approval workflows.
      </Text>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>DEVELOPMENT PHASE: COMING SOON</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  title: { fontSize: 22, fontWeight: "900", color: "#1e293b", marginTop: 20 },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
  },
  badge: {
    marginTop: 30,
    backgroundColor: "#0891b2",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "900" },
});
