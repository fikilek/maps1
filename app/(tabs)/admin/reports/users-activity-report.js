import DateRangeModal from "@/components/DateRangeModal";
import GraphsView from "@/components/GraphsView";
import UserTrnsReportHeader from "@/components/UserTrnsReportHeader";
import { useAuth } from "@/src/hooks/useAuth";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import { db } from "../../../../src/firebase";

export default function UsersTrnsReport() {
  const { profile } = useAuth();

  const lmPcode = profile?.access?.activeWorkbase?.id || null;
  const lmName = profile?.access?.activeWorkbase?.name || "Municipality";

  const [activeView, setActiveView] = useState("TABLE");
  const [showDateModal, setShowDateModal] = useState(false);

  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!lmPcode) {
      setRows([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const reportRef = collection(db, "report_trn_user_activity");
    const reportQuery = query(
      reportRef,
      where("parents.lmPcode", "==", lmPcode),
    );

    const unsubscribe = onSnapshot(
      reportQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const item = doc.data();

          return {
            id: item?.id || doc.id,
            name: item?.user?.name || "NAv",
            team: item?.user?.teamName || "NAv",
            sp: item?.user?.serviceProviderName || "NAv",

            total: item?.counts?.totalTrns || 0,
            noAccess: item?.counts?.noAccessTrns || 0,
            discoveries: item?.counts?.meterDiscoveryTrns || 0,
            installations: item?.counts?.meterInstallationTrns || 0,
            disconnections: item?.counts?.meterDisconnectionTrns || 0,
            reconnections: item?.counts?.meterReconnectionTrns || 0,
            inspections: item?.counts?.meterInspectionTrns || 0,
            removals: item?.counts?.meterRemovalTrns || 0,
          };
        });

        setRows(data);
        setIsLoading(false);
      },
      (error) => {
        console.log("user activity snapshot error", error);
        setRows([]);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [lmPcode]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [rows]);

  const totals = useMemo(() => {
    return sortedRows.reduce(
      (acc, u) => ({
        total: acc.total + u.total,
        noAccess: acc.noAccess + u.noAccess,
        discoveries: acc.discoveries + u.discoveries,
        installations: acc.installations + u.installations,
        disconnections: acc.disconnections + u.disconnections,
        reconnections: acc.reconnections + u.reconnections,
        inspections: acc.inspections + u.inspections,
        removals: acc.removals + u.removals,
      }),
      {
        total: 0,
        noAccess: 0,
        discoveries: 0,
        installations: 0,
        disconnections: 0,
        reconnections: 0,
        inspections: 0,
        removals: 0,
      },
    );
  }, [sortedRows]);

  if (isLoading) {
    return <ActivityIndicator style={{ flex: 1 }} color="#2563eb" />;
  }

  if (!lmPcode) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons
          name="map-marker-off"
          size={48}
          color="#cbd5e1"
        />
        <Text style={styles.emptyTitle}>No Workbase Selected</Text>
        <Text style={styles.emptySub}>Please select a municipality first.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <UserTrnsReportHeader
        totalValue={sortedRows.length}
        type="USERS"
        activeView={activeView}
        selectedDateLabel="ALL TIME"
        onOpenDateFilter={() => setShowDateModal(true)}
        onToggleView={() => setActiveView("TABLE")}
        onShowGraphs={() => setActiveView("GRAPHS")}
        onDownload={() => console.log("Export user activity")}
      />

      {activeView === "TABLE" ? (
        <ScrollView horizontal>
          <View>
            <View style={styles.header}>
              <Text style={[styles.col, { width: 150 }]}>NAME</Text>
              <Text style={[styles.col, { width: 120 }]}>TEAM</Text>
              <Text style={[styles.col, { width: 120 }]}>SP</Text>

              {[
                "NO ACCESS",
                "DISCOVERY",
                "INSTALL",
                "DISCON",
                "RECON",
                "INSPECT",
                "REMOVAL",
              ].map((h) => (
                <Text key={h} style={[styles.col, styles.numCol]}>
                  {h}
                </Text>
              ))}
            </View>

            <FlatList
              data={sortedRows}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <Text style={[styles.cell, { width: 150 }]}>{item.name}</Text>

                  <Text style={[styles.cell, { width: 120 }]}>{item.team}</Text>

                  <Text style={[styles.cell, { width: 120 }]}>{item.sp}</Text>

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
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text>No user activity found for {lmName}</Text>
                </View>
              }
            />
          </View>
        </ScrollView>
      ) : (
        <GraphsView data={sortedRows} totals={totals} />
      )}

      <DateRangeModal
        visible={showDateModal}
        onClose={() => setShowDateModal(false)}
        onSelect={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 2,
    borderColor: "#cbd5e1",
  },

  col: {
    padding: 12,
    fontSize: 9,
    fontWeight: "900",
    color: "#475569",
  },

  numCol: {
    width: 85,
    textAlign: "center",
  },

  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    backgroundColor: "#ffffff",
  },

  cell: {
    padding: 12,
    fontSize: 11,
    color: "#1e293b",
  },

  numCell: {
    width: 85,
    textAlign: "center",
    fontWeight: "700",
    color: "#0f172a",
  },

  emptyList: {
    padding: 40,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 10,
    color: "#1e293b",
  },

  emptySub: {
    fontSize: 14,
    color: "#94a3b8",
  },
});
