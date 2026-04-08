import DateRangeModal from "@/components/DateRangeModal";
import ReportsHeader from "@/components/ReportsHeader";
import { useAuth } from "@/src/hooks/useAuth";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../../../src/firebase";

export default function NoAccessReport() {
  const { profile } = useAuth();

  const lmPcode = profile?.access?.activeWorkbase?.id || null;
  const lmName = profile?.access?.activeWorkbase?.name || "Municipality";

  const [activeTab, setActiveTab] = useState("LIST");
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showDateModal, setShowDateModal] = useState(false);
  const [activeDateRange, setActiveDateRange] = useState({
    label: "ALL TIME",
    start: null,
    end: null,
  });

  useEffect(() => {
    if (!lmPcode) {
      setRows([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const reportRef = collection(db, "report_trn_no_access");
    const reportQuery = query(
      reportRef,
      where("parents.lmPcode", "==", lmPcode),
      orderBy("trn.updatedAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      reportQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const item = doc.data();

          return {
            id: item?.id || doc.id,
            activityDate: item?.activityDate || "NAv",
            erfNo: item?.erf?.no || "NAv",
            address: item?.premise?.address || "NAv",
            reason: item?.access?.reason || "NAv",
            agent: item?.user?.name || "NAv",
            timestamp: item?.trn?.updatedAt || item?.trn?.createdAt || "NAv",
            wardPcode: item?.parents?.wardPcode || "NAv",
          };
        });

        setRows(data);
        setIsLoading(false);
      },
      (error) => {
        console.log("no-access-report snapshot error", error);
        setRows([]);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [lmPcode]);

  const normalizeDay = (value) => {
    if (!value) return null;

    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return date.toISOString().slice(0, 10);
  };

  const isWithinDateRange = (activityDate, start, end) => {
    const day = normalizeDay(activityDate);
    const startDay = normalizeDay(start);
    const endDay = normalizeDay(end);

    if (!day) return false;
    if (!startDay && !endDay) return true;
    if (startDay && day < startDay) return false;
    if (endDay && day > endDay) return false;

    return true;
  };

  const naReportData = useMemo(() => {
    const filtered = rows.filter((item) =>
      isWithinDateRange(
        item?.activityDate,
        activeDateRange?.start,
        activeDateRange?.end,
      ),
    );

    return [...filtered].sort((a, b) => {
      const aTime =
        a?.timestamp && a.timestamp !== "NAv" ? new Date(a.timestamp) : 0;
      const bTime =
        b?.timestamp && b.timestamp !== "NAv" ? new Date(b.timestamp) : 0;

      return bTime - aTime;
    });
  }, [rows, activeDateRange]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>
          Loading {lmName} no access report...
        </Text>
      </View>
    );
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
        <Text style={styles.emptySub}>
          Please select a municipality in the header.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ReportsHeader
        total={naReportData.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowDateModal(true)}
        >
          <MaterialCommunityIcons
            name="calendar-range"
            size={16}
            color="#2563eb"
          />
          <Text style={styles.filterBtnText}>{activeDateRange.label}</Text>
        </TouchableOpacity>

        {activeDateRange.label !== "ALL TIME" && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() =>
              setActiveDateRange({
                label: "ALL TIME",
                start: null,
                end: null,
              })
            }
          >
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.col, { flex: 1 }]}>Erf</Text>
        <Text style={[styles.col, { flex: 2 }]}>Address</Text>
        <Text style={[styles.col, { flex: 2 }]}>Reason / Friction</Text>
        <Text style={[styles.col, { flex: 1.5 }]}>Agent</Text>
      </View>

      <FlatList
        data={naReportData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={[styles.cell, { flex: 1, fontWeight: "800" }]}>
              {item.erfNo}
            </Text>

            <View style={{ flex: 2 }}>
              <Text style={styles.adrText} numberOfLines={1}>
                {item.address}
              </Text>
              <Text style={styles.timeText}>
                {item.activityDate !== "NAv"
                  ? item.activityDate
                  : item.timestamp && item.timestamp !== "NAv"
                    ? new Date(item.timestamp).toLocaleDateString()
                    : "NAv"}
              </Text>
            </View>

            <View style={[styles.reasonBadge, { flex: 2 }]}>
              <Text style={styles.reasonText} numberOfLines={2}>
                {item.reason}
              </Text>
            </View>

            <View style={styles.agentWrap}>
              <MaterialCommunityIcons
                name="account-hard-hat"
                size={14}
                color="#64748b"
              />
              <Text style={styles.agentText} numberOfLines={1}>
                {item?.agent?.split?.(" ")?.[0] || "NAv"}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name="calendar-remove-outline"
              size={40}
              color="#94a3b8"
            />
            <Text style={styles.emptyText}>
              No No Access events found for {activeDateRange.label} in {lmName}.
            </Text>
          </View>
        }
      />

      <DateRangeModal
        visible={showDateModal}
        onClose={() => setShowDateModal(false)}
        onSelect={(range) => setActiveDateRange(range)}
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
    padding: 20,
  },

  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontWeight: "600",
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#475569",
    marginTop: 12,
  },

  emptySub: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 4,
  },

  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },

  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },

  filterBtnText: {
    color: "#2563eb",
    fontWeight: "700",
    fontSize: 12,
  },

  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },

  clearBtnText: {
    color: "#64748b",
    fontWeight: "700",
    fontSize: 12,
  },

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

  row: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },

  cell: {
    fontSize: 11,
    color: "#1e293b",
  },

  adrText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#334155",
  },

  timeText: {
    fontSize: 9,
    color: "#94a3b8",
  },

  reasonBadge: {
    backgroundColor: "#fff1f2",
    padding: 6,
    borderRadius: 4,
    marginRight: 8,
  },

  reasonText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#e11d48",
  },

  agentWrap: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  agentText: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "600",
  },

  empty: {
    padding: 60,
    alignItems: "center",
  },

  emptyText: {
    marginTop: 10,
    color: "#64748b",
    fontWeight: "600",
    textAlign: "center",
  },
});
