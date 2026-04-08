import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useGeo } from "../src/context/GeoContext";
import { useAuth } from "../src/hooks/useAuth";
import {
  useSignoutMutation,
  useUpdateProfileMutation,
} from "../src/redux/authApi";
import {
  useGetLmsByCountryQuery,
  useGetWardsByLocalMunicipalityQuery,
} from "../src/redux/geoApi";

export default function AppHeader({ title }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [wbModalVisible, setWbModalVisible] = useState(false);

  const [draftLm, setDraftLm] = useState(null);
  const [draftWard, setDraftWard] = useState(null);
  const [switchingScope, setSwitchingScope] = useState(false);

  const { geoState, setActiveWorkbaseWard } = useGeo();
  const { activeWorkbase, profile, user, isSPU } = useAuth();
  const [signout] = useSignoutMutation();
  const [updateProfile] = useUpdateProfileMutation();
  const router = useRouter();

  const countryId = "ZA";
  const { data: allLms = [] } = useGetLmsByCountryQuery(countryId, {
    skip: !isSPU,
  });

  const name = profile?.profile?.name || "";
  const surname = profile?.profile?.surname || "";
  const role = profile?.employment?.role || "USER";
  const initials =
    `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase() || "??";

  const availableJurisdictions = isSPU
    ? allLms
    : profile?.access?.workbases || [];

  const closeMenu = () => setMenuVisible(false);

  const closeWbModal = () => {
    setWbModalVisible(false);
  };

  function normalizeLm(wb) {
    if (!wb) return null;
    return {
      id: wb?.id || wb?.pcode || null,
      pcode: wb?.pcode || wb?.id || null,
      name: wb?.name || wb?.label || wb?.description || wb?.id || "Unknown LM",
      raw: wb,
    };
  }

  function normalizeWard(ward) {
    if (!ward) return null;
    return {
      id: ward?.id || ward?.pcode || null,
      pcode: ward?.pcode || ward?.id || null,
      name:
        ward?.name ||
        ward?.label ||
        ward?.description ||
        ward?.id ||
        "Unknown Ward",
      raw: ward,
    };
  }

  const normalizedJurisdictions = useMemo(() => {
    return (availableJurisdictions || [])
      .map(normalizeLm)
      .filter((x) => !!x?.id);
  }, [availableJurisdictions]);

  const currentLm = useMemo(() => {
    return normalizeLm(geoState?.selectedLm || activeWorkbase || null);
  }, [geoState?.selectedLm, activeWorkbase]);

  const currentWard = useMemo(() => {
    return normalizeWard(geoState?.selectedWard || null);
  }, [geoState?.selectedWard]);

  const selectedLmForModal = draftLm?.id || currentLm?.id || null;

  const { data: wardsList = [], isLoading: wardsLoading } =
    useGetWardsByLocalMunicipalityQuery(selectedLmForModal, {
      skip: !selectedLmForModal,
    });

  const wardOptions = useMemo(() => {
    const getWardNo = (ward) => {
      const text = String(ward?.name || "");
      const match = text.match(/\d+/);
      return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
    };

    return (wardsList || [])
      .map(normalizeWard)
      .filter((x) => !!x?.id)
      .sort((a, b) => getWardNo(a) - getWardNo(b));
  }, [wardsList]);

  useEffect(() => {
    if (!wbModalVisible) return;
    setDraftLm(currentLm || null);
    setDraftWard(currentWard || null);
  }, [wbModalVisible, currentLm?.id, currentWard?.id]);

  const scopeLabel = useMemo(() => {
    const lmName = currentLm?.name || "Global";
    const wardName = currentWard?.name || "No ward";
    return `${lmName} / ${wardName}`;
  }, [currentLm?.name, currentWard?.name]);

  const canConfirmScope =
    !!draftLm?.id && !!draftWard?.id && !wardsLoading && !switchingScope;

  const handleSelectLm = (lm) => {
    if (!lm?.id) return;
    if (draftLm?.id === lm.id) return;

    setDraftLm(lm);
    setDraftWard(null); // critical: ward must be chosen again for the new LM
  };

  const handleSelectWard = (ward) => {
    setDraftWard(ward);
  };

  const handleWorkbaseWardChange = async () => {
    if (!canConfirmScope) return;

    try {
      setSwitchingScope(true);

      const wbPointer = {
        id: draftLm.id,
        name: draftLm.name,
      };

      // 1. close modal immediately
      closeWbModal();

      // 2. update GeoContext immediately with complete scope
      setActiveWorkbaseWard({
        lm: draftLm.raw || draftLm,
        ward: draftWard.raw || draftWard,
      });

      // 3. navigate immediately
      router.replace("/(tabs)/erfs");

      // 4. persist active workbase pointer
      await updateProfile({
        uid: user.uid,
        updates: { "access.activeWorkbase": wbPointer },
      }).unwrap();
    } catch (err) {
      console.error("Workbase/Ward scope switch failed:", err);
    } finally {
      setSwitchingScope(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 🎯 LEFT: TITLE */}
      <View style={styles.leftCol}>
        <Text style={styles.tabTitle}>{title}</Text>
      </View>

      {/* 🎯 CENTER: LM / WARD SELECTOR */}
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
            {scopeLabel}
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

      {/* 🏛️ WORKBASE / WARD SELECTION MODAL */}
      <Modal
        visible={wbModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeWbModal}
      >
        <TouchableWithoutFeedback onPress={closeWbModal}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.scopeModalBox}>
                <Text style={styles.modalHeader}>
                  {isSPU
                    ? "iREPS Jurisdiction / Ward Select"
                    : "Assigned Workbase / Ward"}
                </Text>

                <View style={styles.scopeColumns}>
                  {/* LEFT COLUMN: LMS */}
                  <View style={styles.scopeColLeft}>
                    <Text style={styles.scopeColHeader}>WORKBASES</Text>

                    <ScrollView bounces={false}>
                      {normalizedJurisdictions.map((wb) => {
                        const active = draftLm?.id === wb.id;

                        return (
                          <TouchableOpacity
                            key={wb.id}
                            style={[
                              styles.scopeOption,
                              active && styles.scopeOptionActive,
                            ]}
                            onPress={() => handleSelectLm(wb)}
                          >
                            <MaterialCommunityIcons
                              name={
                                active ? "radiobox-marked" : "radiobox-blank"
                              }
                              size={20}
                              color={active ? "#2563eb" : "#94a3b8"}
                            />
                            <Text
                              style={[
                                styles.scopeOptionText,
                                active && styles.scopeOptionTextActive,
                              ]}
                              numberOfLines={1}
                            >
                              {wb.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>

                  {/* RIGHT COLUMN: WARDS */}
                  <View style={styles.scopeColRight}>
                    <Text style={styles.scopeColHeader}>WARDS</Text>

                    {!draftLm ? (
                      <View style={styles.scopeEmptyBox}>
                        <Text style={styles.scopeEmptyText}>
                          Select a workbase first
                        </Text>
                      </View>
                    ) : wardsLoading ? (
                      <View style={styles.scopeLoadingBox}>
                        <ActivityIndicator size="small" color="#2563eb" />
                        <Text style={styles.scopeEmptyText}>
                          Loading wards...
                        </Text>
                      </View>
                    ) : wardOptions.length === 0 ? (
                      <View style={styles.scopeEmptyBox}>
                        <Text style={styles.scopeEmptyText}>
                          No wards found for this workbase
                        </Text>
                      </View>
                    ) : (
                      <ScrollView bounces={false}>
                        {wardOptions.map((ward) => {
                          const active = draftWard?.id === ward.id;

                          return (
                            <TouchableOpacity
                              key={ward.id}
                              style={[
                                styles.scopeOption,
                                active && styles.scopeOptionActive,
                              ]}
                              onPress={() => handleSelectWard(ward)}
                            >
                              <MaterialCommunityIcons
                                name={
                                  active ? "radiobox-marked" : "radiobox-blank"
                                }
                                size={20}
                                color={active ? "#2563eb" : "#94a3b8"}
                              />
                              <Text
                                style={[
                                  styles.scopeOptionText,
                                  active && styles.scopeOptionTextActive,
                                ]}
                                numberOfLines={1}
                              >
                                {ward.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    )}
                  </View>
                </View>

                <View style={styles.scopeFooter}>
                  <Text style={styles.scopeSelectedText} numberOfLines={1}>
                    {draftLm?.name || "No workbase"} /{" "}
                    {draftWard?.name || "No ward"}
                  </Text>

                  <View style={styles.scopeBtnRow}>
                    <TouchableOpacity
                      style={styles.scopeCancelBtn}
                      onPress={closeWbModal}
                    >
                      <Text style={styles.scopeCancelBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.scopeConfirmBtn,
                        !canConfirmScope && styles.scopeConfirmBtnDisabled,
                      ]}
                      onPress={handleWorkbaseWardChange}
                      disabled={!canConfirmScope}
                    >
                      {switchingScope ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.scopeConfirmBtnText}>Confirm</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
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
    maxWidth: "100%",
  },
  wbText: { fontSize: 14, fontWeight: "800", color: "#2563eb", maxWidth: 170 },
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

  scopeModalBox: {
    backgroundColor: "#fff",
    width: "92%",
    maxHeight: "68%",
    borderRadius: 16,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 14,
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
  scopeColumns: {
    flexDirection: "row",
    gap: 12,
    minHeight: 280,
    maxHeight: 360,
  },
  scopeColLeft: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  scopeColRight: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  scopeColHeader: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94a3b8",
    letterSpacing: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  scopeOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginHorizontal: 6,
    marginTop: 6,
    gap: 12,
  },
  scopeOptionActive: { backgroundColor: "#eff6ff" },
  scopeOptionText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#475569",
    flex: 1,
  },
  scopeOptionTextActive: { color: "#2563eb" },
  scopeEmptyBox: {
    padding: 16,
    margin: 10,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
  },
  scopeLoadingBox: {
    padding: 16,
    margin: 10,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  scopeEmptyText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  scopeFooter: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 12,
  },
  scopeSelectedText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#334155",
    textAlign: "center",
    marginBottom: 12,
  },
  scopeBtnRow: {
    flexDirection: "row",
    gap: 10,
  },
  scopeCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  scopeCancelBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#475569",
  },
  scopeConfirmBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
  },
  scopeConfirmBtnDisabled: {
    backgroundColor: "#cbd5e1",
  },
  scopeConfirmBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
  },
});
