// /app/(tabs)/admin/reports/users-trns-report.js
import { useGetTrnsByCountryCodeQuery } from "@/src/redux/trnsApi";
import { useGetUsersQuery } from "@/src/redux/usersApi";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Divider, Surface, Text } from "react-native-paper";
import DateRangeModal from "../../../../components/DateRangeModal";
import GraphsView from "./components/GraphsView";
import UserTrnsReportHeader from "./components/UserTrnsReportHeader";

export default function UsersTrnsReport() {
  const country = { id: "ZA", name: "South Africa" };
  // 🛡️ View Control State
  const [activeView, setActiveView] = useState("TABLE"); // 'TABLE' or 'GRAPHS'

  // 🕵️ Toggle Handlers
  const handleShowTable = () => setActiveView("TABLE");
  const handleShowGraphs = () => setActiveView("GRAPHS");

  const [showDateModal, setShowDateModal] = useState(false); // 🛡️ The Gatekeeper
  const [activeDateRange, setActiveDateRange] = useState({
    label: "ALL TIME",
    startDate: null,
    endDate: null,
  });

  const { data: users = [], isLoading: l1 } = useGetUsersQuery();
  const { data: globalTrns = [], isLoading: l2 } =
    useGetTrnsByCountryCodeQuery(country);

  // 🛡️ Filter States (Pure React)
  const [activeFilter, setActiveFilter] = useState({
    type: null,
    value: "ALL",
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [filterType, setFilterType] = useState(null); // 'team', 'sp', or 'role'

  const filterOptions = useMemo(() => {
    const teams = [
      "Sovereign Alpha",
      "Obsidian Delta",
      "Vanguard 7",
      "Eagle Eye",
    ]; // Keep your fictitious list for now
    const sps = [
      "ALL",
      ...new Set(
        users.map((u) => u.employment?.serviceProvider?.name).filter(Boolean),
      ),
    ];

    return { teams: ["ALL", ...teams], sps };
  }, [users]);

  const processedData = useMemo(() => {
    const teams = [
      "Sovereign Alpha",
      "Obsidian Delta",
      "Vanguard 7",
      "Eagle Eye",
    ];

    // 🛰️ STEP 1: Filter Transactions by Date
    const filteredTrns = globalTrns.filter((trn) => {
      // 🎯 FIX: Use .start (matches the utility) instead of .startDate
      if (!activeDateRange.start) return true;

      const trnDate = new Date(
        trn.accessData?.metadata?.created?.at || 0,
      ).getTime();
      const start = new Date(activeDateRange.start).getTime();
      const end = activeDateRange.end
        ? new Date(activeDateRange.end).getTime()
        : new Date().getTime();

      return trnDate >= start && trnDate <= end;
    });

    // 🛰️ STEP 2: Aggregation
    const aggregated = users.map((user, index) => {
      const userTrns = filteredTrns.filter(
        (t) => t.accessData?.metadata?.created?.byUid === user.uid,
      );
      const typeCount = (val) =>
        userTrns.filter((t) => t.accessData?.trnType === val).length;

      return {
        uid: user.uid,
        name: `${user.profile?.surname || ""} ${user.profile?.name || ""}`.toUpperCase(),
        team: teams[index % teams.length],
        sp: user.employment?.serviceProvider?.name || "N/A",
        role: user.employment?.role || "AGENT",
        noAccess: userTrns.filter(
          (t) => t.accessData?.access?.hasAccess === "no",
        ).length,
        discoveries: typeCount("METER_DISCOVERY"),
        installations: typeCount("METER_INSTALLATION"),
        disconnections: typeCount("METER_DISCONNECTION"),
        reconnections: typeCount("METER_RECONNECTION"),
        inspections: typeCount("METER_INSPECTION"),
        removals: typeCount("METER_REMOVAL"),
      };
    });

    // 🛰️ STEP 3: Multi-Filter (Team & SP)
    return aggregated.filter((u) => {
      const matchTeam =
        activeFilter.type === "team"
          ? activeFilter.value === "ALL" || u.team === activeFilter.value
          : true;
      const matchSP =
        activeFilter.type === "sp"
          ? activeFilter.value === "ALL" || u.sp === activeFilter.value
          : true;

      // 🏛️ If you want both filters to work together, use:
      return matchTeam && matchSP;

      // For now, sticking to your current structure:
      // if (activeFilter.type === "team" && activeFilter.value !== "ALL")
      //   return u.team === activeFilter.value;
      // if (activeFilter.type === "sp" && activeFilter.value !== "ALL")
      //   return u.sp === activeFilter.value;
      // return true;
    });
  }, [users, globalTrns, activeDateRange, activeFilter]);

  const totals = useMemo(() => {
    return processedData.reduce(
      (acc, u) => ({
        noAccess: acc.noAccess + u.noAccess,
        discoveries: acc.discoveries + u.discoveries,
        installations: acc.installations + u.installations,
        disconnections: acc.disconnections + u.disconnections,
        reconnections: acc.reconnections + u.reconnections,
        inspections: acc.inspections + u.inspections,
        removals: acc.removals + u.removals,
      }),
      {
        noAccess: 0,
        discoveries: 0,
        installations: 0,
        disconnections: 0,
        reconnections: 0,
        inspections: 0,
        removals: 0,
      },
    );
  }, [processedData]);

  const openFilter = (type) => {
    setFilterType(type);
    setModalVisible(true);
  };

  if (l1 || l2)
    return <ActivityIndicator style={{ flex: 1 }} color="#2563eb" />;

  return (
    <View style={styles.container}>
      <UserTrnsReportHeader
        totalUsers={users.length}
        activeView={activeView} // 🛰️ Pass current state
        selectedDateLabel={activeDateRange.label}
        onOpenDateFilter={() => setShowDateModal(true)}
        onToggleView={handleShowTable} // ✅ Sets view to TABLE
        onShowGraphs={handleShowGraphs} // ✅ Sets view to GRAPHS
        onDownload={() => {
          /* 🚧 Next Mission: Export logic */
          console.log("Preparing Sovereign Export...");
        }}
      />

      {activeView === "TABLE" ? (
        <ScrollView horizontal persistentScrollbar>
          <View>
            {/* 🏛️ HEADER */}
            <View style={styles.tableHeader}>
              <View style={[styles.headerCell, { width: 140 }]}>
                <Text style={styles.headerText}>DISPLAY NAME</Text>
              </View>
              <TouchableOpacity
                onPress={() => openFilter("team")}
                style={[styles.headerCell, styles.filterHeader, { width: 120 }]}
              >
                <Text style={styles.headerText}>TEAM ▽</Text>
                <Text style={styles.activeFilter}>
                  {activeFilter.type === "team" ? activeFilter.value : "ALL"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => openFilter("sp")}
                style={[styles.headerCell, styles.filterHeader, { width: 100 }]}
              >
                <Text style={styles.headerText}>SP ▽</Text>
                <Text style={styles.activeFilter}>
                  {activeFilter.type === "sp" ? activeFilter.value : "ALL"}
                </Text>
              </TouchableOpacity>

              {[
                "NO ACCESS",
                "DISCOVERY",
                "INSTALL",
                "DISCON",
                "RECON",
                "INSPECT",
                "REMOVAL",
              ].map((h) => (
                <View key={h} style={[styles.headerCell, styles.numCol]}>
                  <Text style={styles.headerText}>{h}</Text>
                </View>
              ))}
            </View>

            {/* 🏛️ ROWS */}
            <FlatList
              data={processedData}
              keyExtractor={(item) => item.uid}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <View
                    style={[
                      styles.cell,
                      { width: 140, backgroundColor: "#fdfdfd" },
                    ]}
                  >
                    <Text style={styles.userName}>{item.name}</Text>
                  </View>
                  <View style={[styles.cell, { width: 120 }]}>
                    <Text style={styles.teamText}>{item.team}</Text>
                  </View>
                  <View style={[styles.cell, { width: 100 }]}>
                    <Text style={styles.spText}>{item.sp}</Text>
                  </View>
                  <Text style={[styles.cell, styles.numCell]}>
                    {item.noAccess}
                  </Text>
                  <Text style={[styles.cell, styles.numCell]}>
                    {item.discoveries}
                  </Text>
                  <Text style={[styles.cell, styles.numCell]}>
                    {item.installations}
                  </Text>
                  <Text style={[styles.cell, styles.numCell]}>
                    {item.disconnections}
                  </Text>
                  <Text style={[styles.cell, styles.numCell]}>
                    {item.reconnections}
                  </Text>
                  <Text style={[styles.cell, styles.numCell]}>
                    {item.inspections}
                  </Text>
                  <Text style={[styles.cell, styles.numCell]}>
                    {item.removals}
                  </Text>
                </View>
              )}
            />
          </View>
        </ScrollView>
      ) : (
        <GraphsView data={processedData} totals={totals} />
      )}

      {/* 🛡️ DATE MODAL (Hidden until triggered) */}
      <DateRangeModal
        visible={showDateModal}
        onClose={() => setShowDateModal(false)}
        onSelect={(range) => setActiveDateRange(range)}
      />

      {/* 🛡️ PURE REACT MODAL (NO JITTER) */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Surface style={styles.modalContent} elevation={5}>
            <Text style={styles.modalTitle}>
              SELECT {filterType?.toUpperCase()}
            </Text>
            <Divider style={{ marginBottom: 10 }} />
            <TouchableOpacity
              onPress={() => {
                setActiveFilter({ type: null, value: "ALL" });
                setModalVisible(false);
              }}
              style={styles.optionBtn}
            >
              <Text>SHOW ALL</Text>
            </TouchableOpacity>
            {/* Map options based on filterType... simplified for brevity */}

            {/* 🛡️ DYNAMIC MODAL CONTENT */}
            {filterType === "team"
              ? filterOptions.teams.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => {
                      setActiveFilter({ type: "team", value: opt });
                      setModalVisible(false);
                    }}
                    style={styles.optionBtn}
                  >
                    <Text
                      style={{
                        color:
                          activeFilter.value === opt ? "#2563eb" : "#1e293b",
                      }}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))
              : filterOptions.sps.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => {
                      setActiveFilter({ type: "sp", value: opt });
                      setModalVisible(false);
                    }}
                    style={styles.optionBtn}
                  >
                    <Text
                      style={{
                        color:
                          activeFilter.value === opt ? "#2563eb" : "#1e293b",
                      }}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}

            {/* {filterType === "team" &&
              [
                "Sovereign Alpha",
                "Obsidian Delta",
                "Vanguard 7",
                "Eagle Eye",
              ].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => {
                    setActiveFilter({ type: "team", value: opt });
                    setModalVisible(false);
                  }}
                  style={styles.optionBtn}
                >
                  <Text>{opt}</Text>
                </TouchableOpacity>
              ))} */}
          </Surface>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 2,
    borderColor: "#cbd5e1",
  },
  headerCell: {
    padding: 12,
    justifyContent: "center",
    borderRightWidth: 1,
    borderColor: "#e2e8f0",
  },
  headerText: { fontSize: 9, fontWeight: "900", color: "#475569" },
  filterHeader: { backgroundColor: "#e2e8f0" },
  activeFilter: { fontSize: 8, color: "#2563eb", fontWeight: "bold" },
  numCol: { width: 85, alignItems: "center" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#f1f5f9" },
  cell: {
    padding: 12,
    justifyContent: "center",
    borderRightWidth: 1,
    borderColor: "#f1f5f9",
  },
  numCell: {
    width: 85,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#1e293b",
  },
  userName: { fontSize: 10, fontWeight: "bold", color: "#1e293b" },
  teamText: { fontSize: 10, color: "#64748b" },
  spText: { fontSize: 10, color: "#94a3b8" },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontWeight: "900",
    fontSize: 12,
    marginBottom: 10,
    color: "#64748b",
  },
  optionBtn: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
});
