import { useAuth } from "@/src/hooks/useAuth";
import {
  useSetActiveWorkbaseMutation,
  useUpdateProfileMutation,
} from "@/src/redux/authApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UserSettings() {
  const { profile, activeWorkbase, user } = useAuth();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [setActiveWorkbase, { isLoading: isSwitching }] =
    useSetActiveWorkbaseMutation();

  // 📝 EDIT STATE
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: profile?.profile?.name || "",
    surname: profile?.profile?.surname || "",
    email: profile?.profile?.email || "",
    cell: profile?.contact?.cell || "",
  });

  // 🌍 WORKBASE MODAL STATE
  const [wbModalVisible, setWbModalVisible] = useState(false);

  // 💾 SAVE PROFILE
  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        uid: user.uid,
        updates: {
          "profile.name": editData.name,
          "profile.surname": editData.surname,
          "profile.email": editData.email,
          "profile.displayName": `${editData.name} ${editData.surname}`,
          "contact.cell": editData.cell,
        },
      }).unwrap();
      setIsEditing(false);
    } catch (err) {
      console.error("Update Failed", err);
    }
  };

  // 🛰️ SWITCH WORKBASE
  const handleSwitchWorkbase = async (wb) => {
    try {
      await setActiveWorkbase({ uid: user.uid, workbase: wb }).unwrap();
      setWbModalVisible(false);
    } catch (err) {
      console.error("Switch Failed", err);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Account Settings</Text>
          <TouchableOpacity
            onPress={() =>
              isEditing ? handleSaveProfile() : setIsEditing(true)
            }
            style={[styles.editBtn, isEditing && styles.saveBtn]}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.editBtnText}>
                {isEditing ? "SAVE" : "EDIT"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 👤 PROFILE SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Sovereign Profile</Text>
          <View style={styles.card}>
            <EditableItem
              icon="account"
              label="Name"
              value={editData.name}
              isEditing={isEditing}
              onChangeText={(t) => setEditData({ ...editData, name: t })}
            />
            <EditableItem
              icon="account-outline"
              label="Surname"
              value={editData.surname}
              isEditing={isEditing}
              onChangeText={(t) => setEditData({ ...editData, surname: t })}
            />
            <EditableItem
              icon="email"
              label="Email"
              value={editData.email}
              isEditing={isEditing}
              onChangeText={(t) => setEditData({ ...editData, email: t })}
            />
            <EditableItem
              icon="phone"
              label="Cell Number"
              value={editData.cell}
              isEditing={isEditing}
              onChangeText={(t) => setEditData({ ...editData, cell: t })}
            />
          </View>
        </View>

        {/* 🏢 DEPLOYMENT SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Deployment Info</Text>
          <View style={styles.card}>
            {/* 🛰️ ACTIVE WORKBASE SWITCHER */}
            <TouchableOpacity
              style={styles.wbRow}
              // onPress={() => setWbModalVisible(true)}
            >
              <View style={styles.rowLeft}>
                <MaterialCommunityIcons
                  name="map-marker-radius"
                  size={20}
                  color="#2563eb"
                />
                <Text style={styles.rowLabel}>Active Workbase</Text>
              </View>
              <View style={styles.wbPill}>
                <Text style={styles.wbPillText}>
                  {activeWorkbase?.name || "Select Base"}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <ReadOnlyItem
              icon="shield-account"
              label="Role"
              value={profile?.employment?.role}
            />
            <ReadOnlyItem
              icon="office-building"
              label="Service Provider"
              value={profile?.employment?.serviceProvider?.name}
            />
          </View>
        </View>
      </ScrollView>

      {/* 🏛️ WORKBASE SELECTOR MODAL */}
      <Modal visible={wbModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setWbModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Switch Active Territory</Text>
              <FlatList
                data={profile?.access?.workbases || []}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.wbOption,
                      activeWorkbase?.id === item.id && styles.activeWbOption,
                    ]}
                    onPress={() => handleSwitchWorkbase(item)}
                  >
                    <Text
                      style={[
                        styles.wbOptionText,
                        activeWorkbase?.id === item.id && styles.activeWbText,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {activeWorkbase?.id === item.id && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={20}
                        color="#2563eb"
                      />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    No other workbases assigned.
                  </Text>
                }
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------------- UI HELPERS ---------------- */

const EditableItem = ({ icon, label, value, isEditing, onChangeText }) => (
  <View style={styles.row}>
    <View style={styles.rowLeft}>
      <MaterialCommunityIcons name={icon} size={20} color="#64748b" />
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    {isEditing ? (
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={`Enter ${label}`}
      />
    ) : (
      <Text style={styles.rowValue}>{value || "---"}</Text>
    )}
  </View>
);

const ReadOnlyItem = ({ icon, label, value }) => (
  <View style={styles.row}>
    <View style={styles.rowLeft}>
      <MaterialCommunityIcons name={icon} size={20} color="#94a3b8" />
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <Text style={[styles.rowValue, { color: "#94a3b8" }]}>
      {value || "N/A"}
    </Text>
  </View>
);

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { padding: 16, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: { fontSize: 24, fontWeight: "900", color: "#1e293b" },
  editBtn: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtn: { backgroundColor: "#059669" },
  editBtnText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  section: { marginBottom: 24 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "900",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: "center",
  },
  wbRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    alignItems: "center",
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowLabel: { fontSize: 14, fontWeight: "700", color: "#334155" },
  rowValue: { fontSize: 13, color: "#64748b", fontWeight: "600" },
  input: {
    flex: 1,
    textAlign: "right",
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "700",
    padding: 0,
  },
  wbPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  wbPillText: { fontSize: 12, fontWeight: "900", color: "#2563eb" },
  divider: { height: 1, backgroundColor: "#f1f5f9" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1e293b",
    marginBottom: 16,
  },
  wbOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  activeWbOption: { backgroundColor: "#f8fafc" },
  wbOptionText: { fontSize: 15, fontWeight: "600", color: "#475569" },
  activeWbText: { color: "#2563eb", fontWeight: "800" },
  emptyText: { textAlign: "center", color: "#94a3b8", marginTop: 20 },
});
