import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrepaidRevenueReport() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 🧠 THE "ENOUGH THINKING" HEADER */}
        <View style={styles.brainSection}>
          <MaterialCommunityIcons name="brain" size={80} color="#2563eb" />
          <Text style={styles.mainTitle}>Revenue Engine Intelligence</Text>
          <Text style={styles.statusBadge}>
            STRATEGY PHASE: ENOUGH THINKING
          </Text>
        </View>

        {/* 📝 THE STORY / BLUEPRINT */}
        <View style={styles.storyCard}>
          <Text style={styles.storyHeader}>The Objective</Text>
          <Text style={styles.storyText}>
            This report is designed to be the ultimate financial audit tool for
            Local Municipalities. It will perform a Triple-Match between three
            sovereign data sources:
          </Text>

          <View style={styles.stepRow}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>1</Text>
            </View>
            <Text style={styles.stepDesc}>
              Monthly Vendor Sales Files (CSV/Excel Imports)
            </Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>2</Text>
            </View>
            <Text style={styles.stepDesc}>
              Live Audited Meters in the iREPS Warehouse
            </Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>3</Text>
            </View>
            <Text style={styles.stepDesc}>
              Historical Consumption Patterns from Firestore
            </Text>
          </View>
        </View>

        {/* 🚧 COMING SOON SECTION */}
        <View style={styles.wipBox}>
          <MaterialCommunityIcons name="tools" size={24} color="#f59e0b" />
          <Text style={styles.wipText}>TO FOLLOW SOON</Text>
          <Text style={styles.wipSub}>
            We are currently refining the Power Query aggregation logic to
            handle millions of sales records without impacting mobile
            performance.
          </Text>
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>RETURN TO REPORTS</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 24, alignItems: "center" },
  brainSection: { alignItems: "center", marginBottom: 32 },
  mainTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1e293b",
    marginTop: 16,
  },
  statusBadge: {
    backgroundColor: "#dbeafe",
    color: "#2563eb",
    fontSize: 10,
    fontWeight: "900",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  storyCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    width: "100%",
    elevation: 2,
    marginBottom: 24,
  },
  storyHeader: {
    fontSize: 16,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 12,
  },
  storyText: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  stepNum: {
    backgroundColor: "#2563eb",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  stepDesc: { fontSize: 13, color: "#475569", fontWeight: "600", flex: 1 },
  wipBox: {
    alignItems: "center",
    padding: 20,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#cbd5e1",
    borderRadius: 16,
    width: "100%",
  },
  wipText: { fontSize: 16, fontWeight: "900", color: "#f59e0b", marginTop: 8 },
  wipSub: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 4,
    fontStyle: "italic",
  },
  backBtn: {
    marginTop: 32,
    backgroundColor: "#1e293b",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backBtnText: { color: "#fff", fontWeight: "900", fontSize: 12 },
});
