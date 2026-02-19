import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Workorders() {
  const router = useRouter();
  const [filter, setFilter] = useState("ACTIVE");

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      {/* 🧭 JURISDICTIONAL FILTERS */}
      <View style={styles.tabBar}>
        <TabItem
          label="Active"
          count={12}
          active={filter === "ACTIVE"}
          onPress={() => setFilter("ACTIVE")}
        />
        <TabItem
          label="Pending"
          count={5}
          active={filter === "PENDING"}
          onPress={() => setFilter("PENDING")}
        />
        <TabItem
          label="Done"
          count={84}
          active={filter === "COMPLETED"}
          onPress={() => setFilter("COMPLETED")}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 📑 TACTICAL QUEUE */}
        <WorkorderCard
          id="WO-2026-001"
          team="Alpha Squad"
          area="Knysna Central"
          tasks={45}
          progress={0.65}
          status="IN_PROGRESS"
        />

        <WorkorderCard
          id="WO-2026-002"
          team="Response Unit 1"
          area="The Heads"
          tasks={12}
          progress={0.1}
          status="IN_PROGRESS"
        />

        <WorkorderCard
          id="WO-2026-003"
          team="Unassigned"
          area="Belvidere"
          tasks={120}
          progress={0}
          status="PENDING"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- INTERNAL COMPONENTS ---------------- */

const TabItem = ({ label, count, active, onPress }) => (
  <TouchableOpacity
    style={[styles.tab, active && styles.activeTab]}
    onPress={onPress}
  >
    <Text style={[styles.tabLabel, active && styles.activeTabLabel]}>
      {label}
    </Text>
    <View style={[styles.countBadge, active && styles.activeCountBadge]}>
      <Text style={[styles.countText, active && styles.activeCountText]}>
        {count}
      </Text>
    </View>
  </TouchableOpacity>
);

const WorkorderCard = ({ id, team, area, tasks, progress, status }) => (
  <TouchableOpacity style={styles.card} activeOpacity={0.7}>
    <View style={styles.cardHeader}>
      <Text style={styles.woId}>{id}</Text>
      <View
        style={[
          styles.statusBadge,
          status === "PENDING" && styles.pendingBadge,
        ]}
      >
        <Text
          style={[
            styles.statusText,
            status === "PENDING" && styles.pendingText,
          ]}
        >
          {status.replace("_", " ")}
        </Text>
      </View>
    </View>

    <View style={styles.cardBody}>
      <View style={styles.infoRow}>
        <MaterialCommunityIcons
          name="account-group-outline"
          size={16}
          color="#64748b"
        />
        <Text style={styles.infoText}>{team}</Text>
      </View>
      <View style={styles.infoRow}>
        <MaterialCommunityIcons
          name="map-marker-outline"
          size={16}
          color="#64748b"
        />
        <Text style={styles.infoText}>{area}</Text>
      </View>
    </View>

    {/* 📊 PROGRESS ORCHESTRATION */}
    <View style={styles.progressSection}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{tasks} Tasks Total</Text>
        <Text style={styles.progressPercent}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
      <View style={styles.progressBarBg}>
        <View
          style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
        />
      </View>
    </View>
  </TouchableOpacity>
);

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontWeight: "900", color: "#1e293b" },
  createBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createBtnText: { color: "#fff", fontSize: 11, fontWeight: "900" },

  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    gap: 20,
  },
  tab: {
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderBottomWidth: 2,
    borderColor: "transparent",
  },
  activeTab: { borderColor: "#2563eb" },
  tabLabel: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  activeTabLabel: { color: "#2563eb" },
  countBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeCountBadge: { backgroundColor: "#eff6ff" },
  countText: { fontSize: 10, fontWeight: "800", color: "#64748b" },
  activeCountText: { color: "#2563eb" },

  scrollContent: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  woId: { fontSize: 15, fontWeight: "900", color: "#1e293b" },
  statusBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#166534",
    textTransform: "uppercase",
  },
  pendingBadge: { backgroundColor: "#f1f5f9" },
  pendingText: { color: "#475569" },

  cardBody: { gap: 6, marginBottom: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 12, fontWeight: "600", color: "#475569" },

  progressSection: {
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
    paddingTop: 12,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: { fontSize: 11, fontWeight: "700", color: "#94a3b8" },
  progressPercent: { fontSize: 11, fontWeight: "900", color: "#1e293b" },
  progressBarBg: {
    height: 6,
    backgroundColor: "#f1f5f9",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", backgroundColor: "#2563eb" },
});
