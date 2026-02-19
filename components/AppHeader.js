import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useAuth } from "../src/hooks/useAuth";
import {
  useSignoutMutation,
  useUpdateProfileMutation,
} from "../src/redux/authApi";
import { useGetLmsByCountryQuery } from "../src/redux/geoApi";

export default function AppHeader({ title }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [wbModalVisible, setWbModalVisible] = useState(false);

  const { activeWorkbase, profile, user, isSPU } = useAuth();
  const [signout] = useSignoutMutation();
  const [updateProfile] = useUpdateProfileMutation();
  const router = useRouter();

  // 🛰️ SOVEREIGN REGISTRY FETCH
  // SPU sees all LMs in 'ZA'. Standard users see their assigned list.
  const countryId = "ZA";
  const { data: allLms = [] } = useGetLmsByCountryQuery(countryId, {
    skip: !isSPU,
  });

  const name = profile?.profile?.name || "";
  const surname = profile?.profile?.surname || "";
  const role = profile?.employment?.role || "USER";
  const initials =
    `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase() || "??";

  // 📝 SELECTOR SOURCE LOGIC
  const availableJurisdictions = isSPU
    ? allLms
    : profile?.access?.workbases || [];

  const closeMenu = () => setMenuVisible(false);
  const closeWbModal = () => setWbModalVisible(false);

  const handleWorkbaseChange = async (wb) => {
    console.log(` `);
    console.log(`wb?.id`, wb?.id);
    console.log(`wb?.name`, wb?.name);
    try {
      // 🛡️ SCHEMA ENFORCEMENT: Strictly { id, name }
      // This prevents the geometry/metadata bloat seen in the previous SPU update.
      const standardWorkbasePointer = {
        id: wb.id, // Ensure we use the PCode as the ID
        name: wb.name,
      };

      await updateProfile({
        uid: user.uid,
        update: {
          "access.activeWorkbase": standardWorkbasePointer,
        },
      }).unwrap();

      closeWbModal();
    } catch (err) {
      console.error("Standard Schema Update Failed:", err);
    }
  };

  return (
    <View style={styles.container}>
      {/* 🎯 LEFT: TITLE */}
      <View style={styles.leftCol}>
        <Text style={styles.tabTitle}>{title}</Text>
      </View>

      {/* 🎯 CENTER: JURISDICTION SELECTOR */}
      <TouchableOpacity
        style={styles.centerCol}
        onPress={() => setWbModalVisible(true)}
        activeOpacity={0.6}
      >
        <View style={styles.wbBadge}>
          <MaterialCommunityIcons
            name="map-marker-radius"
            size={14}
            color="#2563eb"
          />
          <Text style={styles.wbText} numberOfLines={1}>
            {activeWorkbase?.name || "Global"}
          </Text>
          <MaterialCommunityIcons
            name="chevron-down"
            size={12}
            color="#2563eb"
          />
        </View>
      </TouchableOpacity>

      {/* 🎯 RIGHT: PROFILE ANCHOR */}
      <View style={styles.rightCol}>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{role}</Text>
        </View>

        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => setMenuVisible(true)}
        >
          <Text style={styles.initialsText}>{initials}</Text>
        </TouchableOpacity>
      </View>

      {/* 🏛️ USER MENU MODAL */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
      >
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.modalBackdrop}>
            <View style={styles.menuBox}>
              <MenuOption
                icon="cog"
                label="Settings"
                onPress={() => {
                  closeMenu();
                  router.push("/admin/user/user-settings");
                }}
              />
              <View style={styles.divider} />
              <MenuOption
                icon="logout"
                label="Sign Out"
                color="#ef4444"
                onPress={async () => {
                  closeMenu();
                  await signout?.();
                }}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 🏛️ WORKBASE SELECTION MODAL */}
      <Modal
        visible={wbModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeWbModal}
      >
        <TouchableWithoutFeedback onPress={closeWbModal}>
          <View style={styles.modalBackdrop}>
            <View style={styles.wbModalBox}>
              <Text style={styles.modalHeader}>
                {isSPU ? "Sovereign Jurisdiction Select" : "Assigned Workbases"}
              </Text>
              <ScrollView bounces={false}>
                {availableJurisdictions.map((wb) => (
                  <TouchableOpacity
                    key={wb.id}
                    style={[
                      styles.wbOption,
                      activeWorkbase?.id === wb.id && styles.wbOptionActive,
                    ]}
                    onPress={() => handleWorkbaseChange(wb)}
                  >
                    <MaterialCommunityIcons
                      name={
                        activeWorkbase?.id === wb.id
                          ? "check-circle"
                          : "circle-outline"
                      }
                      size={20}
                      color={
                        activeWorkbase?.id === wb.id ? "#2563eb" : "#94a3b8"
                      }
                    />
                    <Text
                      style={[
                        styles.wbOptionText,
                        activeWorkbase?.id === wb.id &&
                          styles.wbOptionTextActive,
                      ]}
                    >
                      {wb.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const MenuOption = ({ icon, label, onPress, color = "#475569" }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <MaterialCommunityIcons name={icon} size={20} color={color} />
    <Text style={[styles.menuItemText, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    paddingTop: 45,
    paddingBottom: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    zIndex: 10,
  },
  leftCol: { flex: 1.2 },
  tabTitle: { fontSize: 18, fontWeight: "900", color: "#1e293b" },
  centerCol: { flex: 2, alignItems: "center" },
  wbBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  wbText: { fontSize: 14, fontWeight: "800", color: "#2563eb" },
  rightCol: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  roleBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  roleText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#64748b",
    letterSpacing: 0.5,
  },
  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: { color: "#fff", fontSize: 13, fontWeight: "900" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuBox: {
    position: "absolute",
    top: 90,
    right: 16,
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: { fontSize: 14, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 4 },
  wbModalBox: {
    backgroundColor: "#fff",
    width: "85%",
    maxHeight: "50%",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    elevation: 20,
  },
  modalHeader: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: "center",
  },
  wbOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
    gap: 12,
  },
  wbOptionActive: { backgroundColor: "#eff6ff" },
  wbOptionText: { fontSize: 15, fontWeight: "700", color: "#475569" },
  wbOptionTextActive: { color: "#2563eb" },
});
