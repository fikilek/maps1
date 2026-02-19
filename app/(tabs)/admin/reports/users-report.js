import { useGetUsersQuery } from "@/src/redux/usersApi";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import LmPremiseReportHeader from "./components/LmPremiseReportHeader";
import UserRow from "./components/UserRow";

export default function UsersReport() {
  const { data: users = [], isLoading } = useGetUsersQuery();
  const [activeTab, setActiveTab] = useState("LIST");
  const [selectedSpId, setSelectedSpId] = useState("ALL");

  // 🕵️ DATA INTELLIGENCE: Filter by Country and SP
  const filteredUsers = useMemo(() => {
    // 🌍 Global Logic: Filter by Country (e.g., ZA)
    // In production, this countryId comes from the Admin's own profile
    const countryCode = "ZA";

    return users.filter((u) => {
      const matchesCountry = u.parents?.countryId === countryCode || true; // Fallback for legacy docs
      const matchesSp =
        selectedSpId === "ALL" ||
        u.employment?.serviceProvider?.id === selectedSpId;

      return matchesCountry && matchesSp;
    });
  }, [users, selectedSpId]);

  // 🛰️ EXTRACT UNIQUE SPs FOR FILTERING
  const availableSps = useMemo(() => {
    const spMap = new Map();
    users.forEach((u) => {
      const sp = u.employment?.serviceProvider;
      if (sp?.id) spMap.set(sp.id, sp.name);
    });
    return Array.from(spMap.entries()).map(([id, name]) => ({ id, name }));
  }, [users]);

  if (isLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );

  return (
    <View style={styles.container}>
      <LmPremiseReportHeader
        total={filteredUsers.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        // These would be handled by the header's filter modal
        availableSps={availableSps}
        onSpFilter={setSelectedSpId}
      />

      <View style={styles.tableHeader}>
        <Text style={[styles.col, { flex: 2 }]}>User / Profile</Text>
        <Text style={[styles.col, { flex: 0.8 }]}>Role</Text>
        <Text style={[styles.col, { flex: 1.5 }]}>Service Provider</Text>
        <Text style={[styles.col, { flex: 1, textAlign: "right" }]}>
          Status
        </Text>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <UserRow user={item} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  tableHeader: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 2,
    borderColor: "#e2e8f0",
  },
  col: {
    fontSize: 9,
    fontWeight: "900",
    color: "#64748b",
    textTransform: "uppercase",
  },
});
