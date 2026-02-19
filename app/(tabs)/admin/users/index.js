import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  Avatar,
  Button,
  Chip,
  List,
  Modal,
  Portal,
  Switch,
  Text,
} from "react-native-paper";
import { useAuth } from "../../../../src/hooks/useAuth";
import { useUpdateProfileMutation } from "../../../../src/redux/authApi";
import { useGetUsersQuery } from "../../../../src/redux/usersApi";

export default function UsersListScreen() {
  const router = useRouter();
  const { isSPU, isADM } = useAuth();
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [filterVisible, setFilterVisible] = useState(false);

  // 🛰️ LIVE REGISTRY FETCH & MUTATIONS
  const { data: users = [], isLoading, error } = useGetUsersQuery();
  const [updateProfile] = useUpdateProfileMutation();

  // 🛡️ SPU-SCHEMA LOCKED FILTERING
  const filteredUsers = users?.filter((u) => {
    if (roleFilter !== "ALL" && u?.employment?.role !== roleFilter)
      return false;
    return !!u?.profile;
  });

  // 🛡️ TARGET #7: ACCOUNT STATUS TOGGLE
  const handleToggleStatus = async (user, currentStatus) => {
    const newStatus = currentStatus === "DISABLED" ? "ACTIVE" : "DISABLED";
    try {
      await updateProfile({
        uid: user.uid,
        updates: { accountStatus: newStatus },
      }).unwrap();
      // 🚀 Email Alert logic should be triggered by Firestore Cloud Function on this update
    } catch (err) {
      console.error("Failed to override user status:", err);
    }
  };

  if (isLoading)
    return <Text style={styles.center}>Synchronizing Registry...</Text>;
  if (error) return <Text style={styles.center}>Registry Access Denied</Text>;

  return (
    <View style={styles.container}>
      {/* 🛠️ HEADER CONTROLS */}
      <View style={styles.header}>
        <Pressable
          style={styles.filterTrigger}
          onPress={() => setFilterVisible(true)}
        >
          <Text style={{ color: "#64748b", fontWeight: "700" }}>
            Tier: {roleFilter}
          </Text>
        </Pressable>

        <View style={styles.actions}>
          {isSPU && (
            <Button
              mode="contained"
              compact
              onPress={() => router.push("/admin/users/create-admin")}
              style={styles.actionBtn}
            >
              + Admin
            </Button>
          )}
          {(isSPU || isADM) && (
            <Button
              mode="contained-tonal"
              compact
              onPress={() => router.push("/admin/users/create-manager")}
              style={styles.actionBtn}
            >
              + Manager
            </Button>
          )}
        </View>
      </View>

      {/* 📋 THE SOVEREIGN LIST */}
      <FlashList
        data={filteredUsers}
        keyExtractor={(item) => item?.uid || Math.random().toString()}
        estimatedItemSize={160}
        renderItem={({ item }) => {
          const name = item?.profile?.name || "Pending";
          const surname = item?.profile?.surname || "";
          const role = item?.employment?.role || "GST";
          const workbase = item?.access?.activeWorkbase?.name || "Global";
          const onboardingStatus = item?.onboarding?.status || "PENDING";
          const accountStatus = item?.accountStatus || "ACTIVE";

          return (
            <Pressable
              onPress={() => router.push(`/admin/users/${item.uid}`)}
              style={({ pressed }) => [
                styles.userCard,
                pressed && { opacity: 0.9 },
              ]}
            >
              {/* IDENTITY SECTION */}
              <View style={styles.cardHeader}>
                <Avatar.Text
                  size={36}
                  label={`${name?.[0] || "?"}${surname?.[0] || ""}`}
                  style={styles.avatar}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>
                    {name} {surname}
                  </Text>
                  <Text style={styles.email}>{item?.profile?.email}</Text>
                </View>
                <Chip textStyle={styles.roleText} style={styles.roleChip}>
                  {role}
                </Chip>
              </View>

              {/* CONTEXTUAL METRICS */}
              <View style={styles.contextRow}>
                <View style={styles.contextItem}>
                  <Text style={styles.contextLabel}>ACTIVE WORKBASE</Text>
                  <Text style={styles.contextValue} numberOfLines={1}>
                    {workbase}
                  </Text>
                </View>
                <View style={styles.contextItem}>
                  <Text style={styles.contextLabel}>ONBOARDING</Text>
                  <Text
                    style={[
                      styles.status,
                      onboardingStatus === "COMPLETED"
                        ? styles.statusActive
                        : styles.statusPending,
                    ]}
                  >
                    {onboardingStatus.replace(/_/g, " ")}
                  </Text>
                </View>
              </View>

              {/* FOOTER: ACCOUNT CONTROL (TARGET #7) */}
              <View style={styles.cardFooter}>
                <View style={styles.operationalInfo}>
                  <Text style={styles.contextLabel}>ACCOUNT STATUS</Text>
                  <Text
                    style={[
                      styles.accountStatusText,
                      accountStatus === "DISABLED" && { color: "#ef4444" },
                    ]}
                  >
                    {accountStatus}
                  </Text>
                </View>

                {(isSPU || isADM) && (
                  <View style={styles.switchContainer}>
                    <Switch
                      value={accountStatus === "ACTIVE"}
                      onValueChange={() =>
                        handleToggleStatus(item, accountStatus)
                      }
                      color="#2563eb"
                    />
                  </View>
                )}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.center}>No users found in this sector</Text>
        }
      />

      {/* 🏛️ ROLE SELECTION PORTAL */}
      <Portal>
        <Modal
          visible={filterVisible}
          onDismiss={() => setFilterVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
            Select Operational Tier
          </Text>
          {["ALL", "SPU", "ADM", "MNG", "SPV", "FWR"].map((role) => (
            <List.Item
              key={role}
              title={role}
              onPress={() => {
                setRoleFilter(role);
                setFilterVisible(false);
              }}
              right={(props) =>
                role === roleFilter ? (
                  <List.Icon {...props} icon="check" color="#2563eb" />
                ) : null
              }
            />
          ))}
          <Button onPress={() => setFilterVisible(false)}>Close</Button>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  actions: { flexDirection: "row", gap: 8 },
  actionBtn: { borderRadius: 8 },
  filterTrigger: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  userCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  avatar: { backgroundColor: "#e2e8f0" },
  name: { fontSize: 16, fontWeight: "900", color: "#1e293b" },
  email: { fontSize: 12, color: "#64748b" },
  roleChip: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  roleText: { fontSize: 10, fontWeight: "900", color: "#2563eb" },
  contextRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
    paddingVertical: 10,
    gap: 15,
  },
  contextItem: { flex: 1 },
  contextLabel: {
    fontSize: 8,
    fontWeight: "900",
    color: "#94a3b8",
    letterSpacing: 0.5,
  },
  contextValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
    paddingTop: 10,
  },
  operationalInfo: { flex: 1 },
  accountStatusText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#059669",
    marginTop: 2,
  },
  status: { fontSize: 11, fontWeight: "900", marginTop: 2 },
  statusActive: { color: "#059669" },
  statusPending: { color: "#2563eb" },
  center: {
    textAlign: "center",
    marginTop: 40,
    color: "#64748b",
    fontWeight: "700",
  },
  modal: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 16,
  },
  modalTitle: { marginBottom: 16, fontWeight: "900", color: "#1e293b" },
  switchContainer: { paddingLeft: 10 },
});
