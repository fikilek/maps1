import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OperationalTeams() {
  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <View style={styles.mainWrapper}>
        {/* 🕵️ COLUMN 1: PERSONNEL REGISTRY (SPs & USERS) */}
        <View style={styles.col}>
          <Text style={styles.colHeader}>Personnel Registry</Text>
          <ScrollView style={styles.list}>
            <Text style={styles.spLabel}>Service Provider A</Text>
            <UserItem name="John Doe" role="FW" />
            <UserItem name="Jane Smith" role="FW" />

            <Text style={styles.spLabel}>Service Provider B</Text>
            <UserItem name="Bob Miller" role="FW" />
          </ScrollView>
        </View>

        {/* 🏛️ COLUMN 2: TEAM ORCHESTRATION */}
        <View style={[styles.col, { backgroundColor: "#f1f5f9" }]}>
          <Text style={styles.colHeader}>Operational Teams</Text>
          <ScrollView style={styles.list}>
            <TeamCard name="Alpha Squad" count={2} />
            <TeamCard name="Delta Unit" count={0} />
            <TouchableOpacity style={styles.addBtn}>
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.addBtnText}>NEW TEAM</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const UserItem = ({ name, role }) => (
  <TouchableOpacity style={styles.userItem}>
    <MaterialCommunityIcons name="account" size={16} color="#64748b" />
    <View>
      <Text style={styles.userName}>{name}</Text>
      <Text style={styles.userRole}>{role}</Text>
    </View>
    <MaterialCommunityIcons
      name="drag-vertical"
      size={20}
      color="#cbd5e1"
      style={{ marginLeft: "auto" }}
    />
  </TouchableOpacity>
);

const TeamCard = ({ name, count }) => (
  <View style={styles.teamCard}>
    <Text style={styles.teamName}>{name}</Text>
    <Text style={styles.teamCount}>{count} Active FWs</Text>
    <View style={styles.dropZone}>
      <Text style={styles.dropText}>Drag users here to allocate</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  mainWrapper: { flex: 1, flexDirection: "row" },
  col: { flex: 1, borderRightWidth: 1, borderColor: "#e2e8f0" },
  colHeader: {
    padding: 16,
    backgroundColor: "#1e293b",
    color: "#fff",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  list: { padding: 12 },
  spLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#2563eb",
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  userName: { fontSize: 13, fontWeight: "700", color: "#1e293b" },
  userRole: { fontSize: 10, color: "#64748b" },
  teamCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  teamName: { fontSize: 15, fontWeight: "900", color: "#1e293b" },
  teamCount: { fontSize: 11, color: "#2563eb", fontWeight: "700" },
  dropZone: {
    marginTop: 12,
    height: 60,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  dropText: { fontSize: 10, color: "#94a3b8", fontWeight: "600" },
  addBtn: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  addBtnText: { color: "#fff", fontSize: 11, fontWeight: "900" },
});
