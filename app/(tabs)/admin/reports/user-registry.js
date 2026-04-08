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
import { useGetUsersQuery } from "@/src/redux/usersApi";
// import { useGetServiceProvidersQuery } from "@/src/redux/serviceProvidersApi";

import ReportsHeader from "../../../../components/ReportsHeader";
import { useGetServiceProvidersQuery } from "../../../../src/redux/spApi";

export default function UserRegistry() {
  const { data: users = [], isLoading } = useGetUsersQuery();
  const { data: serviceProviders = [] } = useGetServiceProvidersQuery();
  const insets = useSafeAreaInsets();

  const { profile, isSPU, isADM, isMNG, isSPV } = useAuth();

  const [activeTab, setActiveTab] = useState("LIST");
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [filters, setFilters] = useState({
    role: "ALL",
    spId: "ALL",
    accountStatus: "ALL",
    onboardingStatus: "ALL",
  });

  const [sortBy, setSortBy] = useState(null); // "role" | "sp" | null
  const [sortDirection, setSortDirection] = useState("asc");

  const visibleUsers = useMemo(() => {
    return applyAccessFilter({
      users,
      serviceProviders,
      authProfile: profile,
      isSPU,
      isADM,
      isMNG,
      isSPV,
    });
  }, [users, serviceProviders, profile, isSPU, isADM, isMNG, isSPV]);

  const filteredUsers = useMemo(() => {
    return applyUserRegistryFilters(visibleUsers, filters);
  }, [visibleUsers, filters]);

  const sortedUsers = useMemo(() => {
    return applyUserRegistrySorting(filteredUsers, sortBy, sortDirection);
  }, [filteredUsers, sortBy, sortDirection]);

  const availableSps = useMemo(() => {
    const spMap = new Map();

    visibleUsers.forEach((user) => {
      const sp = user?.employment?.serviceProvider;
      if (sp?.id) {
        spMap.set(sp.id, sp.name || "NAv");
      }
    });

    return Array.from(spMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [visibleUsers]);

  const availableRoles = useMemo(() => {
    return Array.from(
      new Set(visibleUsers.map((u) => u?.employment?.role).filter(Boolean)),
    ).sort();
  }, [visibleUsers]);

  const availableAccountStatuses = useMemo(() => {
    return Array.from(
      new Set(visibleUsers.map((u) => u?.accountStatus).filter(Boolean)),
    ).sort();
  }, [visibleUsers]);

  const availableOnboardingStatuses = useMemo(() => {
    return Array.from(
      new Set(visibleUsers.map((u) => u?.onboarding?.status).filter(Boolean)),
    ).sort();
  }, [visibleUsers]);

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
      role: "ALL",
      spId: "ALL",
      accountStatus: "ALL",
      onboardingStatus: "ALL",
    });
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ReportsHeader
        total={sortedUsers.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenFilters={() => setShowFilterModal(true)}
        showStats={false}
        showExports={false}
        syncData={false}
      />

      {/* Table header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.col, { flex: 2 }]}>USER</Text>

        <Pressable
          style={[styles.sortableCol, { flex: 0.8 }]}
          onPress={() => handleSort("role")}
        >
          <Text style={styles.col}>ROLE</Text>
          <MaterialCommunityIcons
            name={getSortIcon(sortBy, sortDirection, "role")}
            size={14}
            color="#64748b"
            style={styles.sortIcon}
          />
        </Pressable>

        <Pressable
          style={[styles.sortableCol, { flex: 1.3 }]}
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

        <Text style={[styles.col, { flex: 1, textAlign: "center" }]}>
          ACCOUNT
        </Text>

        <Text style={[styles.col, { flex: 1.2, textAlign: "right" }]}>
          ONBOARDING
        </Text>
      </View>

      <FlatList
        data={sortedUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <UserRow user={item} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      {/* Filter modal */}
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
            <Text style={styles.modalTitle}>Filter User Registry</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <FilterSection title="Role">
                <FilterChip
                  key="role-ALL"
                  label="ALL"
                  active={filters.role === "ALL"}
                  onPress={() =>
                    setFilters((prev) => ({ ...prev, role: "ALL" }))
                  }
                />
                {availableRoles.map((role) => (
                  <FilterChip
                    key={role}
                    label={role}
                    active={filters.role === role}
                    onPress={() => setFilters((prev) => ({ ...prev, role }))}
                  />
                ))}
              </FilterSection>

              <FilterSection title="SP">
                <FilterChip
                  key="sp-ALL"
                  label="ALL"
                  active={filters.spId === "ALL"}
                  onPress={() =>
                    setFilters((prev) => ({ ...prev, spId: "ALL" }))
                  }
                />
                {availableSps.map((sp) => (
                  <FilterChip
                    key={sp.id}
                    label={sp.name}
                    active={filters.spId === sp.id}
                    onPress={() =>
                      setFilters((prev) => ({ ...prev, spId: sp.id }))
                    }
                  />
                ))}
              </FilterSection>

              <FilterSection title="Account Status">
                <FilterChip
                  key="account-ALL"
                  label="ALL"
                  active={filters.accountStatus === "ALL"}
                  onPress={() =>
                    setFilters((prev) => ({
                      ...prev,
                      accountStatus: "ALL",
                    }))
                  }
                />
                {availableAccountStatuses.map((status) => (
                  <FilterChip
                    key={status}
                    label={status}
                    active={filters.accountStatus === status}
                    onPress={() =>
                      setFilters((prev) => ({
                        ...prev,
                        accountStatus: status,
                      }))
                    }
                  />
                ))}
              </FilterSection>

              <FilterSection title="Onboarding Status">
                <FilterChip
                  key="onboarding-ALL"
                  label="ALL"
                  active={filters.onboardingStatus === "ALL"}
                  onPress={() =>
                    setFilters((prev) => ({
                      ...prev,
                      onboardingStatus: "ALL",
                    }))
                  }
                />
                {availableOnboardingStatuses.map((status) => (
                  <FilterChip
                    key={status}
                    label={status}
                    active={filters.onboardingStatus === status}
                    onPress={() =>
                      setFilters((prev) => ({
                        ...prev,
                        onboardingStatus: status,
                      }))
                    }
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
    </View>
  );
}

/* ---------------- USER ROW ---------------- */

function UserRow({ user }) {
  const fullName =
    user?.profile?.displayName ||
    [user?.profile?.name, user?.profile?.surname].filter(Boolean).join(" ") ||
    "NAv";

  const email = user?.profile?.email || "NAv";
  const role = user?.employment?.role || "NAv";
  const spName = user?.employment?.serviceProvider?.name || "NAv";
  const accountStatus = user?.accountStatus || "NAv";
  const onboardingStatus = user?.onboarding?.status || "NAv";

  return (
    <View style={styles.row}>
      <View style={[styles.cell, { flex: 2 }]}>
        <Text style={styles.primaryText} numberOfLines={1}>
          {fullName}
        </Text>
        <Text style={styles.secondaryText} numberOfLines={1}>
          {email}
        </Text>
      </View>

      <View style={[styles.cell, { flex: 0.8 }]}>
        <Text style={styles.primaryText} numberOfLines={1}>
          {role}
        </Text>
      </View>

      <View style={[styles.cell, { flex: 1.3 }]}>
        <Text style={styles.primaryText} numberOfLines={1}>
          {spName}
        </Text>
      </View>

      <View style={[styles.cell, styles.centerCell, { flex: 1 }]}>
        <StatusPill label={accountStatus} type="account" />
      </View>

      <View style={[styles.cell, styles.rightCell, { flex: 1.2 }]}>
        <StatusPill label={onboardingStatus} type="onboarding" />
      </View>
    </View>
  );
}

/* ---------------- FILTER UI ---------------- */

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

/* ---------------- STATUS HELPERS ---------------- */

function StatusPill({ label, type }) {
  const normalizedLabel = label || "NAv";

  const pillStyle =
    type === "account"
      ? getAccountStatusStyle(normalizedLabel)
      : getOnboardingStatusStyle(normalizedLabel);

  return (
    <View style={[styles.pill, pillStyle.container]}>
      <Text style={[styles.pillText, pillStyle.text]} numberOfLines={1}>
        {normalizedLabel}
      </Text>
    </View>
  );
}

function getAccountStatusStyle(status) {
  switch (status) {
    case "ACTIVE":
      return {
        container: styles.pillGreen,
        text: styles.pillGreenText,
      };
    case "PENDING":
      return {
        container: styles.pillAmber,
        text: styles.pillAmberText,
      };
    case "DISABLED":
    case "SUSPENDED":
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

function getOnboardingStatusStyle(status) {
  switch (status) {
    case "COMPLETED":
      return {
        container: styles.pillGreen,
        text: styles.pillGreenText,
      };
    case "PENDING":
    case "AWAITING_APPROVAL":
      return {
        container: styles.pillAmber,
        text: styles.pillAmberText,
      };
    case "REJECTED":
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

/* ---------------- DATA HELPERS ---------------- */

function getSortIcon(sortBy, sortDirection, column) {
  if (sortBy !== column) return "swap-vertical";
  return sortDirection === "asc" ? "arrow-up" : "arrow-down";
}

function applyUserRegistryFilters(users, filters) {
  return users.filter((user) => {
    const role = user?.employment?.role || "NAv";
    const spId = user?.employment?.serviceProvider?.id || "NAv";
    const accountStatus = user?.accountStatus || "NAv";
    const onboardingStatus = user?.onboarding?.status || "NAv";

    const matchesRole = filters.role === "ALL" || role === filters.role;
    const matchesSp = filters.spId === "ALL" || spId === filters.spId;
    const matchesAccountStatus =
      filters.accountStatus === "ALL" ||
      accountStatus === filters.accountStatus;
    const matchesOnboardingStatus =
      filters.onboardingStatus === "ALL" ||
      onboardingStatus === filters.onboardingStatus;

    return (
      matchesRole &&
      matchesSp &&
      matchesAccountStatus &&
      matchesOnboardingStatus
    );
  });
}

function applyUserRegistrySorting(users, sortBy, sortDirection) {
  if (!sortBy) return users;

  const sorted = [...users].sort((a, b) => {
    let aValue = "";
    let bValue = "";

    if (sortBy === "role") {
      aValue = a?.employment?.role || "";
      bValue = b?.employment?.role || "";
    }

    if (sortBy === "sp") {
      aValue = a?.employment?.serviceProvider?.name || "";
      bValue = b?.employment?.serviceProvider?.name || "";
    }

    return aValue.localeCompare(bValue);
  });

  if (sortDirection === "desc") {
    sorted.reverse();
  }

  return sorted;
}

function applyAccessFilter({
  users,
  serviceProviders,
  authProfile,
  isSPU,
  isADM,
  isMNG,
  isSPV,
}) {
  if (isSPU || isADM) {
    return users;
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

    return users.filter((user) => {
      const userSpId = user?.employment?.serviceProvider?.id;
      return allowedSpIds.includes(userSpId);
    });
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

  topActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },

  actionBtnText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#2563eb",
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#fff",
  },

  cell: {
    justifyContent: "center",
    paddingRight: 8,
  },

  centerCell: {
    alignItems: "center",
  },

  rightCell: {
    alignItems: "flex-end",
  },

  primaryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },

  secondaryText: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
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
    fontSize: 7,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  pillGreen: {
    backgroundColor: "#dcfce7",
  },
  pillGreenText: {
    color: "#166534",
  },

  pillAmber: {
    backgroundColor: "#fef3c7",
  },
  pillAmberText: {
    color: "#92400e",
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

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "flex-end",
  },

  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    maxHeight: "80%",
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 12,
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

  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
});

// import { useGetUsersQuery } from "@/src/redux/usersApi";
// import { useMemo, useState } from "react";
// import {
//   ActivityIndicator,
//   FlatList,
//   StyleSheet,
//   Text,
//   View,
// } from "react-native";
// import ReportsHeader from "../../../../components/ReportsHeader";
// import UserRow from "../../../../components/UserRow";

// export default function UsersReport() {
//   const { data: users = [], isLoading } = useGetUsersQuery();
//   const [activeTab, setActiveTab] = useState("LIST");
//   const [selectedSpId, setSelectedSpId] = useState("ALL");

//   // 🕵️ DATA INTELLIGENCE: Filter by Country and SP
//   const filteredUsers = useMemo(() => {
//     // 🌍 Global Logic: Filter by Country (e.g., ZA)
//     // In production, this countryId comes from the Admin's own profile
//     const countryCode = "ZA";

//     return users.filter((u) => {
//       const matchesCountry = u.parents?.countryId === countryCode || true; // Fallback for legacy docs
//       const matchesSp =
//         selectedSpId === "ALL" ||
//         u.employment?.serviceProvider?.id === selectedSpId;

//       return matchesCountry && matchesSp;
//     });
//   }, [users, selectedSpId]);

//   // 🛰️ EXTRACT UNIQUE SPs FOR FILTERING
//   const availableSps = useMemo(() => {
//     const spMap = new Map();
//     users.forEach((u) => {
//       const sp = u.employment?.serviceProvider;
//       if (sp?.id) spMap.set(sp.id, sp.name);
//     });
//     return Array.from(spMap.entries()).map(([id, name]) => ({ id, name }));
//   }, [users]);

//   if (isLoading)
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#2563eb" />
//       </View>
//     );

//   return (
//     <View style={styles.container}>
//       <ReportsHeader
//         total={filteredUsers.length}
//         activeTab={activeTab}
//         onTabChange={setActiveTab}
//         // These would be handled by the header's filter modal
//         availableSps={availableSps}
//         onSpFilter={setSelectedSpId}
//       />

//       <View style={styles.tableHeader}>
//         <Text style={[styles.col, { flex: 2 }]}>User / Profile</Text>
//         <Text style={[styles.col, { flex: 0.8 }]}>Role</Text>
//         <Text style={[styles.col, { flex: 1.5 }]}>Service Provider</Text>
//         <Text style={[styles.col, { flex: 1, textAlign: "right" }]}>
//           Status
//         </Text>
//       </View>

//       <FlatList
//         data={filteredUsers}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => <UserRow user={item} />}
//         contentContainerStyle={{ paddingBottom: 40 }}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#fff" },
//   center: { flex: 1, justifyContent: "center", alignItems: "center" },
//   tableHeader: {
//     flexDirection: "row",
//     padding: 12,
//     backgroundColor: "#f8fafc",
//     borderBottomWidth: 2,
//     borderColor: "#e2e8f0",
//   },
//   col: {
//     fontSize: 9,
//     fontWeight: "900",
//     color: "#64748b",
//     textTransform: "uppercase",
//   },
// });
