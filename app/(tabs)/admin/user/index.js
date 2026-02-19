import { useAuth } from "@/src/hooks/useAuth";
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

export default function UserHub() {
  const { profile, activeWorkbase } = useAuth();
  const router = useRouter();

  // 🛡️ Sovereign Initials
  const name = profile?.profile?.name || "";
  const surname = profile?.profile?.surname || "";
  const initials =
    `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase() || "??";

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 👤 SOVEREIGN IDENTITY HEADER */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>
            {profile?.profile?.displayName || "Field Agent"}
          </Text>
          <View style={styles.wbBadge}>
            <MaterialCommunityIcons
              name="map-marker-radius"
              size={14}
              color="#2563eb"
            />
            <Text style={styles.wbText}>
              {activeWorkbase?.name || "Global iREPS"}
            </Text>
          </View>
        </View>

        {/* 🚀 NAVIGATION DOSSIER */}
        <View style={styles.menuSection}>
          <HubCard
            title="My Production Stats"
            subtitle="View earnings and transaction audits"
            icon="chart-areaspline"
            color="#2563eb"
            onPress={() => router.push("/admin/user/user-stats")}
          />

          <HubCard
            title="Account Settings"
            subtitle="Update profile and active workbase"
            icon="account-cog"
            color="#64748b"
            onPress={() => router.push("/admin/user/user-settings")}
          />
        </View>

        {/* 🛡️ SYSTEM INFO */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>
              {profile?.employment?.role || "USER"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Service Provider</Text>
            <Text style={styles.infoValue}>
              {profile?.employment?.serviceProvider?.name || "Independent"}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- INTERNAL COMPONENTS ---------------- */

const HubCard = ({ title, subtitle, icon, color, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
    <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
      <MaterialCommunityIcons name={icon} size={28} color={color} />
    </View>
    <View style={styles.cardText}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={24} color="#cbd5e1" />
  </TouchableOpacity>
);

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { padding: 20, alignItems: "center" },
  profileHeader: { alignItems: "center", marginBottom: 32, marginTop: 20 },
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "900" },
  userName: { fontSize: 24, fontWeight: "900", color: "#1e293b" },
  wbBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
    gap: 6,
  },
  wbText: { fontSize: 12, fontWeight: "800", color: "#2563eb" },

  menuSection: { width: "100%", gap: 16, marginBottom: 32 },
  card: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 2,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#1e293b" },
  cardSubtitle: { fontSize: 12, color: "#64748b", marginTop: 2 },

  infoBox: {
    width: "100%",
    backgroundColor: "#f1f5f9",
    padding: 20,
    borderRadius: 16,
    gap: 12,
  },
  infoRow: { flexDirection: "row", justifyContent: "space-between" },
  infoLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  infoValue: { fontSize: 13, fontWeight: "700", color: "#475569" },
});
