import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/src/hooks/useAuth";
import { useGetServiceProvidersQuery } from "@/src/redux/spApi";
import { useGetUsersQuery } from "@/src/redux/usersApi";

import ReportsHeader from "../../../../components/ReportsHeader";

export default function ServiceProviderRegistry() {
  const { data: serviceProviders = [], isLoading: loadingSps } =
    useGetServiceProvidersQuery();
  const { data: users = [], isLoading: loadingUsers } = useGetUsersQuery();

  const { profile, isSPU, isADM, isMNG, isSPV } = useAuth();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState("LIST");
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [filters, setFilters] = useState({
    type: "ALL",
    status: "ALL",
  });

  const [sortBy, setSortBy] = useState(null); // "sp" | "type" | "status" | null
  const [sortDirection, setSortDirection] = useState("asc");

  const [selectedUsersSp, setSelectedUsersSp] = useState(null);
  const [selectedSpClientsSp, setSelectedSpClientsSp] = useState(null);
  const [selectedLmClientsSp, setSelectedLmClientsSp] = useState(null);

  const visibleServiceProviders = useMemo(() => {
    return applyServiceProviderAccessFilter({
      serviceProviders,
      authProfile: profile,
      isSPU,
      isADM,
      isMNG,
      isSPV,
    });
  }, [serviceProviders, profile, isSPU, isADM, isMNG, isSPV]);

  const reportData = useMemo(() => {
    return visibleServiceProviders.map((sp) => {
      const spUsers = users.filter(
        (user) => user?.employment?.serviceProvider?.id === sp.id,
      );

      const spClients = (sp?.clients || []).filter(
        (client) => client?.clientType === "SP",
      );

      const lmClients = (sp?.clients || []).filter(
        (client) => client?.clientType === "LM",
      );

      return {
        id: sp.id,

        spName:
          sp?.profile?.tradingName || sp?.profile?.registeredName || "NAv",

        registrationNumber: sp?.profile?.registrationNumber || "NAv",

        userCount: spUsers.length,
        providerType: getSpType(sp),
        spClientCount: spClients.length,
        lmClientCount: lmClients.length,
        status: sp?.status || "NAv",
        subsCount: countDirectSubcs(sp, visibleServiceProviders),

        rawSp: sp,
        spUsers,
        spClients,
        lmClients,
      };
    });
  }, [visibleServiceProviders, users]);

  const filteredData = useMemo(() => {
    return applyServiceProviderRegistryFilters(reportData, filters);
  }, [reportData, filters]);

  const sortedData = useMemo(() => {
    return applyServiceProviderRegistrySorting(
      filteredData,
      sortBy,
      sortDirection,
    );
  }, [filteredData, sortBy, sortDirection]);

  const treeData = useMemo(() => {
    return buildServiceProviderTree(sortedData);
  }, [sortedData]);

  const availableTypes = useMemo(() => {
    return Array.from(
      new Set(reportData.map((item) => item.providerType).filter(Boolean)),
    ).sort();
  }, [reportData]);

  const availableStatuses = useMemo(() => {
    return Array.from(
      new Set(reportData.map((item) => item.status).filter(Boolean)),
    ).sort();
  }, [reportData]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(column);
    setSortDirection("asc");
  };

  const handleResetFilters = () => {
    setFilters({
      type: "ALL",
      status: "ALL",
    });
  };

  if (loadingSps || loadingUsers) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ReportsHeader
        total={sortedData.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenFilters={() => setShowFilterModal(true)}
        showStats={false}
        showExports={false}
        syncData={false}
      />

      {activeTab === "LIST" ? (
        <>
          <View style={styles.tableHeader}>
            <Pressable
              style={[styles.sortableCol, { flex: 2.2 }]}
              onPress={() => handleSort("sp")}
            >
              <Text style={styles.col}>SP</Text>
              <MaterialCommunityIcons
                name={getSortIcon(sortBy, sortDirection, "sp")}
                size={14}
                color="#64748b"
                style={styles.sortIcon}
              />
            </Pressable>

            <Text style={[styles.col, { flex: 0.8, textAlign: "center" }]}>
              USERS
            </Text>

            <Pressable
              style={[
                styles.sortableCol,
                { flex: 1.1, justifyContent: "center" },
              ]}
              onPress={() => handleSort("type")}
            >
              <Text style={[styles.col, { textAlign: "center" }]}>TYPE</Text>
              <MaterialCommunityIcons
                name={getSortIcon(sortBy, sortDirection, "type")}
                size={14}
                color="#64748b"
                style={styles.sortIcon}
              />
            </Pressable>

            <Text style={[styles.col, { flex: 1, textAlign: "center" }]}>
              SP CLIENTS
            </Text>

            <Text style={[styles.col, { flex: 1, textAlign: "center" }]}>
              LM CLIENTS
            </Text>

            <Pressable
              style={[
                styles.sortableCol,
                { flex: 0.9, justifyContent: "center" },
              ]}
              onPress={() => handleSort("status")}
            >
              <Text style={[styles.col, { textAlign: "center" }]}>STATUS</Text>
              <MaterialCommunityIcons
                name={getSortIcon(sortBy, sortDirection, "status")}
                size={14}
                color="#64748b"
                style={styles.sortIcon}
              />
            </Pressable>

            <Text style={[styles.col, { flex: 0.7, textAlign: "right" }]}>
              SUBS
            </Text>
          </View>

          <FlatList
            data={sortedData}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.row}>
                {/* SP */}
                <View style={{ flex: 2.2 }}>
                  <Text style={styles.spName} numberOfLines={1}>
                    {item.spName}
                  </Text>
                  <Text style={styles.regText} numberOfLines={1}>
                    REG: {item.registrationNumber}
                  </Text>
                </View>

                {/* USERS */}
                <Pressable
                  style={{ flex: 0.8, alignItems: "center" }}
                  onPress={() => setSelectedUsersSp(item)}
                >
                  <Text style={styles.countText}>{item.userCount}</Text>
                </Pressable>

                {/* TYPE */}
                <View style={{ flex: 1.1, alignItems: "center" }}>
                  <Text style={styles.typeText} numberOfLines={1}>
                    {item.providerType}
                  </Text>
                </View>

                {/* SP CLIENTS */}
                <Pressable
                  style={{ flex: 1, alignItems: "center" }}
                  onPress={() => setSelectedSpClientsSp(item)}
                >
                  <Text style={styles.countText}>{item.spClientCount}</Text>
                </Pressable>

                {/* LM CLIENTS */}
                <Pressable
                  style={{ flex: 1, alignItems: "center" }}
                  onPress={() => setSelectedLmClientsSp(item)}
                >
                  <Text style={styles.countText}>{item.lmClientCount}</Text>
                </Pressable>

                {/* STATUS */}
                <View style={{ flex: 0.9, alignItems: "center" }}>
                  <StatusPill label={item.status} />
                </View>

                {/* SUBS */}
                <View style={{ flex: 0.7, alignItems: "flex-end" }}>
                  <Text style={styles.countText}>{item.subsCount}</Text>
                </View>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.treeContainer}>
          {treeData.map((node) => renderTreeNode(node))}
        </ScrollView>
      )}

      {/* FILTER MODAL */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { paddingBottom: Math.max(insets.bottom, 16) + 16 },
            ]}
          >
            <Text style={styles.modalTitle}>
              Filter Service Provider Registry
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <FilterSection title="Type">
                <FilterChip
                  key="type-ALL"
                  label="ALL"
                  active={filters.type === "ALL"}
                  onPress={() =>
                    setFilters((prev) => ({ ...prev, type: "ALL" }))
                  }
                />
                {availableTypes.map((type) => (
                  <FilterChip
                    key={`type-${type}`}
                    label={type}
                    active={filters.type === type}
                    onPress={() => setFilters((prev) => ({ ...prev, type }))}
                  />
                ))}
              </FilterSection>

              <FilterSection title="Status">
                <FilterChip
                  key="status-ALL"
                  label="ALL"
                  active={filters.status === "ALL"}
                  onPress={() =>
                    setFilters((prev) => ({ ...prev, status: "ALL" }))
                  }
                />
                {availableStatuses.map((status) => (
                  <FilterChip
                    key={`status-${status}`}
                    label={status}
                    active={filters.status === status}
                    onPress={() => setFilters((prev) => ({ ...prev, status }))}
                  />
                ))}
              </FilterSection>
            </ScrollView>

            <View style={styles.modalActions}>
              <Button mode="outlined" onPress={handleResetFilters}>
                Reset
              </Button>
              <Button
                mode="contained"
                onPress={() => setShowFilterModal(false)}
              >
                Done
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* USERS MODAL */}
      <Modal
        visible={!!selectedUsersSp}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedUsersSp(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { paddingBottom: Math.max(insets.bottom, 16) + 16 },
            ]}
          >
            <Text style={styles.modalTitle}>
              Users - {selectedUsersSp?.spName || "NAv"}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {(selectedUsersSp?.spUsers || []).length === 0 ? (
                <Text style={styles.emptyText}>No users found.</Text>
              ) : (
                selectedUsersSp.spUsers.map((user) => {
                  const fullName =
                    user?.profile?.displayName ||
                    [user?.profile?.name, user?.profile?.surname]
                      .filter(Boolean)
                      .join(" ") ||
                    "NAv";

                  return (
                    <View key={user.id} style={styles.detailRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailPrimary}>{fullName}</Text>
                        <Text style={styles.detailSecondary}>
                          {user?.profile?.email || "NAv"}
                        </Text>
                      </View>

                      <View style={styles.detailRight}>
                        <Text style={styles.detailRole}>
                          {user?.employment?.role || "NAv"}
                        </Text>
                        <Text style={styles.detailSecondary}>
                          {user?.accountStatus || "NAv"} /{" "}
                          {user?.onboarding?.status || "NAv"}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button mode="contained" onPress={() => setSelectedUsersSp(null)}>
                Done
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* SP CLIENTS MODAL */}
      <Modal
        visible={!!selectedSpClientsSp}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSpClientsSp(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { paddingBottom: Math.max(insets.bottom, 16) + 16 },
            ]}
          >
            <Text style={styles.modalTitle}>
              SP Clients - {selectedSpClientsSp?.spName || "NAv"}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {(selectedSpClientsSp?.spClients || []).length === 0 ? (
                <Text style={styles.emptyText}>No SP clients found.</Text>
              ) : (
                selectedSpClientsSp.spClients.map((client, index) => (
                  <View
                    key={`${selectedSpClientsSp.id}-spclient-${client?.id || index}`}
                    style={styles.detailRow}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailPrimary}>
                        {client?.name || "NAv"}
                      </Text>
                      <Text style={styles.detailSecondary}>
                        {client?.id || "NAv"}
                      </Text>
                    </View>

                    <View style={styles.detailRight}>
                      <Text style={styles.detailRole}>
                        {client?.relationshipType || "NAv"}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                mode="contained"
                onPress={() => setSelectedSpClientsSp(null)}
              >
                Done
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* LM CLIENTS MODAL */}
      <Modal
        visible={!!selectedLmClientsSp}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedLmClientsSp(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { paddingBottom: Math.max(insets.bottom, 16) + 16 },
            ]}
          >
            <Text style={styles.modalTitle}>
              LM Clients - {selectedLmClientsSp?.spName || "NAv"}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {(selectedLmClientsSp?.lmClients || []).length === 0 ? (
                <Text style={styles.emptyText}>No LM clients found.</Text>
              ) : (
                selectedLmClientsSp.lmClients.map((client, index) => (
                  <View
                    key={`${selectedLmClientsSp.id}-lmclient-${client?.id || index}`}
                    style={styles.detailRow}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailPrimary}>
                        {client?.name || "NAv"}
                      </Text>
                      <Text style={styles.detailSecondary}>
                        {client?.id || "NAv"}
                      </Text>
                    </View>

                    <View style={styles.detailRight}>
                      <Text style={styles.detailRole}>
                        {client?.relationshipType || "NAv"}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                mode="contained"
                onPress={() => setSelectedLmClientsSp(null)}
              >
                Done
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  function renderTreeNode(node, depth = 0) {
    return (
      <View key={node.id}>
        <View
          style={[
            styles.treeCard,
            {
              marginLeft: depth * 20,
              borderLeftWidth: depth > 0 ? 4 : 0,
              borderLeftColor: "#2563eb",
            },
          ]}
        >
          <View style={styles.treeHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.treeTitleRow}>
                {depth > 0 && (
                  <MaterialCommunityIcons
                    name="subdirectory-arrow-right"
                    size={14}
                    color="#2563eb"
                    style={{ marginRight: 6 }}
                  />
                )}
                <Text style={styles.treeTitle}>{node.spName}</Text>
              </View>

              <Text style={styles.treeSubText}>
                TYPE: {node.providerType} • STATUS: {node.status}
              </Text>

              <Text style={styles.treeSubText}>
                USERS: {node.userCount} • SP CLIENTS: {node.spClientCount} • LM
                CLIENTS: {node.lmClientCount} • SUBS: {node.subsCount}
              </Text>
            </View>
          </View>
        </View>

        {node.children?.map((child) => renderTreeNode(child, depth + 1))}
      </View>
    );
  }
}

/* ---------------- HELPERS ---------------- */

function applyServiceProviderAccessFilter({
  serviceProviders,
  authProfile,
  isSPU,
  isADM,
  isMNG,
  isSPV,
}) {
  if (isSPU || isADM) {
    return serviceProviders;
  }

  const viewerSpId = authProfile?.employment?.serviceProvider?.id;

  if (!viewerSpId) {
    return [];
  }

  if (isMNG || isSPV) {
    const allowedSpIds = resolveVisibleServiceProviderIds(
      viewerSpId,
      serviceProviders,
    );

    return serviceProviders.filter((sp) => allowedSpIds.includes(sp.id));
  }

  return [];
}

function resolveVisibleServiceProviderIds(rootSpId, serviceProviders = []) {
  const allowed = new Set([rootSpId]);
  const queue = [rootSpId];

  while (queue.length > 0) {
    const currentSpId = queue.shift();

    serviceProviders.forEach((sp) => {
      const clients = sp?.clients || [];

      const isSubcOfCurrent = clients.some(
        (client) =>
          client?.clientType === "SP" &&
          client?.relationshipType === "SUBC" &&
          client?.id === currentSpId,
      );

      if (isSubcOfCurrent && !allowed.has(sp.id)) {
        allowed.add(sp.id);
        queue.push(sp.id);
      }
    });
  }

  return Array.from(allowed);
}

function getSpType(sp) {
  const clients = sp?.clients || [];

  const hasLmClients = clients.some((client) => client?.clientType === "LM");
  const hasSpClients = clients.some((client) => client?.clientType === "SP");

  if (hasLmClients && hasSpClients) return "BOTH";
  if (hasLmClients) return "MNC ONLY";
  if (hasSpClients) return "SUBC ONLY";
  return "NAv";
}

function countDirectSubcs(sp, allSps) {
  return allSps.filter((otherSp) =>
    (otherSp?.clients || []).some(
      (client) =>
        client?.clientType === "SP" &&
        client?.relationshipType === "SUBC" &&
        client?.id === sp.id,
    ),
  ).length;
}

function applyServiceProviderRegistryFilters(data, filters) {
  return data.filter((item) => {
    const matchesType =
      filters.type === "ALL" || item.providerType === filters.type;

    const matchesStatus =
      filters.status === "ALL" || item.status === filters.status;

    return matchesType && matchesStatus;
  });
}

function applyServiceProviderRegistrySorting(data, sortBy, sortDirection) {
  if (!sortBy) return data;

  const sorted = [...data].sort((a, b) => {
    let aValue = "";
    let bValue = "";

    if (sortBy === "sp") {
      aValue = a?.spName || "";
      bValue = b?.spName || "";
    }

    if (sortBy === "type") {
      aValue = a?.providerType || "";
      bValue = b?.providerType || "";
    }

    if (sortBy === "status") {
      aValue = a?.status || "";
      bValue = b?.status || "";
    }

    return aValue.localeCompare(bValue);
  });

  if (sortDirection === "desc") {
    sorted.reverse();
  }

  return sorted;
}

function buildServiceProviderTree(data) {
  const map = {};

  data.forEach((item) => {
    map[item.id] = { ...item, children: [] };
  });

  const tree = [];

  data.forEach((item) => {
    const parentClient = item?.rawSp?.clients?.find(
      (client) =>
        client?.clientType === "SP" &&
        client?.relationshipType === "SUBC" &&
        map[client?.id],
    );

    if (parentClient) {
      map[parentClient.id].children.push(map[item.id]);
    } else {
      tree.push(map[item.id]);
    }
  });

  return tree;
}

function getSortIcon(sortBy, sortDirection, column) {
  if (sortBy !== column) return "swap-vertical";
  return sortDirection === "asc" ? "arrow-up" : "arrow-down";
}

/* ---------------- SMALL UI HELPERS ---------------- */

function FilterSection({ title, children }) {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterSectionTitle}>{title}</Text>
      <View style={styles.filterChipsWrap}>{children}</View>
    </View>
  );
}

function FilterChip({ label, active, onPress }) {
  return (
    <Pressable
      style={[styles.filterChip, active && styles.filterChipActive]}
      onPress={onPress}
    >
      <Text
        style={[styles.filterChipText, active && styles.filterChipTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function StatusPill({ label }) {
  const normalizedLabel = label || "NAv";
  const pillStyle = getStatusStyle(normalizedLabel);

  return (
    <View style={[styles.pill, pillStyle.container]}>
      <Text style={[styles.pillText, pillStyle.text]} numberOfLines={1}>
        {normalizedLabel}
      </Text>
    </View>
  );
}

function getStatusStyle(status) {
  switch (status) {
    case "ACTIVE":
      return {
        container: styles.pillGreen,
        text: styles.pillGreenText,
      };
    case "INACTIVE":
      return {
        container: styles.pillRed,
        text: styles.pillRedText,
      };
    default:
      return {
        container: styles.pillGray,
        text: styles.pillGrayText,
      };
  }
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  tableHeader: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 2,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },

  col: {
    fontSize: 9,
    fontWeight: "900",
    color: "#64748b",
    textTransform: "uppercase",
  },

  sortableCol: {
    flexDirection: "row",
    alignItems: "center",
  },

  sortIcon: {
    marginLeft: 4,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    backgroundColor: "#fff",
  },

  spName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1e293b",
  },

  regText: {
    fontSize: 9,
    color: "#94a3b8",
    marginTop: 2,
  },

  countText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#2563eb",
  },

  typeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
    textAlign: "center",
  },

  pill: {
    minHeight: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    maxWidth: "100%",
  },

  pillText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  pillGreen: {
    backgroundColor: "#dcfce7",
  },
  pillGreenText: {
    color: "#166534",
  },

  pillRed: {
    backgroundColor: "#fee2e2",
  },
  pillRedText: {
    color: "#991b1b",
  },

  pillGray: {
    backgroundColor: "#e2e8f0",
  },
  pillGrayText: {
    color: "#475569",
  },

  treeContainer: {
    padding: 12,
    paddingBottom: 40,
  },

  treeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    marginBottom: 10,
  },

  treeHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  treeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  treeTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1e293b",
  },

  treeSubText: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 4,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "flex-end",
  },

  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 16,
    paddingHorizontal: 16,
    maxHeight: "80%",
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 12,
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  filterSection: {
    marginBottom: 18,
  },

  filterSectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    marginBottom: 8,
    textTransform: "uppercase",
  },

  filterChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    marginRight: 8,
    marginBottom: 8,
  },

  filterChipActive: {
    backgroundColor: "#dbeafe",
  },

  filterChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },

  filterChipTextActive: {
    color: "#1d4ed8",
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },

  detailPrimary: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1e293b",
  },

  detailSecondary: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 2,
  },

  detailRight: {
    alignItems: "flex-end",
    marginLeft: 12,
  },

  detailRole: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2563eb",
    textTransform: "uppercase",
  },

  emptyText: {
    fontSize: 12,
    color: "#64748b",
    paddingVertical: 8,
  },
});
