// /app/(tabs)/admin/reports/ward-registry.js

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import ReportsHeader from "../../../../components/ReportsHeader";
import SyncDataCard from "../../../../components/SyncDataCard";
import { db, functions } from "../../../../src/firebase";
import { useAuth } from "../../../../src/hooks/useAuth";

export default function WardRegistryScreen() {
  const [isStartingSync, setIsStartingSync] = useState(false);
  const [latestJob, setLatestJob] = useState(null);
  const [rows, setRows] = useState([]);
  const [jobError, setJobError] = useState("");
  const [rowsError, setRowsError] = useState("");

  const [activeTab, setActiveTab] = useState("LIST");
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [showSyncData, setShowSyncData] = useState(true);
  const lastDisplayedJobRef = useRef(null);

  const { isSPU, isADM, isMNG, isSPV, workbases, activeWorkbase } = useAuth();

  const activeLmPcode = activeWorkbase?.id || null;

  const visibleRows = useMemo(() => {
    if (!activeLmPcode) return [];

    const scopedRows = rows.filter(
      (row) => row?.localMunicipality?.pcode === activeLmPcode,
    );

    if (isSPU || isADM) {
      return scopedRows;
    }

    if (isMNG || isSPV) {
      const allowedLmPcodes = new Set(
        (workbases || []).map((item) => item?.id).filter(Boolean),
      );

      return scopedRows.filter((row) =>
        allowedLmPcodes.has(row?.localMunicipality?.pcode),
      );
    }

    return [];
  }, [rows, activeLmPcode, isSPU, isADM, isMNG, isSPV, workbases]);

  const isSyncRunning =
    latestJob?.status === "QUEUED" ||
    latestJob?.status === "RUNNING" ||
    latestJob?.status === "PENDING" ||
    latestJob?.status === "PROCESSING";

  const isSyncBusy = isStartingSync || isSyncRunning;

  useEffect(() => {
    if (isSyncRunning) {
      setShowSyncData(true);
    }
  }, [isSyncRunning]);

  const handleStartSync = useCallback(async () => {
    if (isStartingSync || isSyncRunning) return;

    try {
      setIsStartingSync(true);
      setJobError("");

      const startWardRegistrySync = httpsCallable(
        functions,
        "startWardRegistrySyncCallable",
      );

      const result = await startWardRegistrySync();

      console.log("WardRegistry -- sync started", result?.data);
    } catch (error) {
      console.log("WardRegistry -- sync start error", error);
      setJobError(error?.message || "Failed to start sync");
    } finally {
      setIsStartingSync(false);
    }
  }, [isStartingSync, isSyncRunning]);

  const handleSyncIconPress = useCallback(async () => {
    if (isSyncBusy) {
      setShowSyncData(true);
      return;
    }

    setShowSyncData(true);
    await handleStartSync();
  }, [isSyncBusy, handleStartSync]);

  useEffect(() => {
    const jobsQuery = query(
      collection(db, "registry_jobs"),
      where("type", "==", "WARD_REGISTRY_SYNC"),
      orderBy("metadata.createdAt", "desc"),
      limit(1),
    );

    const unsubscribe = onSnapshot(
      jobsQuery,
      (snapshot) => {
        const doc = snapshot.docs[0];
        const nextJob = doc ? { id: doc.id, ...doc.data() } : null;

        if (!nextJob) {
          setLatestJob(null);
          lastDisplayedJobRef.current = null;
          setJobError("");
          return;
        }

        const prevJob = lastDisplayedJobRef.current;
        const statusChanged = prevJob?.status !== nextJob?.status;

        const prevProcessed =
          Number(prevJob?.progress?.processed ?? prevJob?.processedLms ?? 0) ||
          0;

        const nextProcessed =
          Number(nextJob?.progress?.processed ?? nextJob?.processedLms ?? 0) ||
          0;

        const processedJump = Math.abs(nextProcessed - prevProcessed) >= 1;

        const completedNow =
          nextJob?.status === "COMPLETED" || nextJob?.status === "FAILED";

        const shouldUpdateUi =
          !prevJob || statusChanged || processedJump || completedNow;

        if (shouldUpdateUi) {
          setLatestJob(nextJob);
          lastDisplayedJobRef.current = nextJob;
        }

        setJobError("");
      },
      (error) => {
        console.log("WardRegistry -- jobs listener error", error);
        setJobError(error?.message || "Failed to read sync job");
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!activeLmPcode) {
      setRows([]);
      return;
    }

    const rowsQuery = query(
      collection(db, "registry_wards"),
      where("localMunicipality.pcode", "==", activeLmPcode),
      orderBy("ward.number", "asc"),
    );

    const unsubscribe = onSnapshot(
      rowsQuery,
      (snapshot) => {
        const nextRows = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setRows(nextRows);
        setRowsError("");
      },
      (error) => {
        console.log("WardRegistry -- rows listener error", error);
        setRowsError(error?.message || "Failed to read ward rows");
      },
    );

    return unsubscribe;
  }, [activeLmPcode]);

  const lastSyncLabel = useMemo(() => {
    const completedAt =
      latestJob?.metadata?.updatedAt || latestJob?.completedAt;

    if (!completedAt) return "Last sync: NAv";

    try {
      const date =
        typeof completedAt?.toDate === "function"
          ? completedAt.toDate()
          : new Date(completedAt);

      return `Last sync: ${date.toLocaleString()}`;
    } catch (error) {
      return "Last sync: NAv";
    }
  }, [latestJob]);

  const formatUpdatedAt = (updatedAt) => {
    if (!updatedAt) return "NAv";

    try {
      const date =
        typeof updatedAt?.toDate === "function"
          ? updatedAt.toDate()
          : new Date(updatedAt);

      return date.toLocaleString();
    } catch (error) {
      return "NAv";
    }
  };

  const renderRow = useCallback(({ item }) => {
    const updatedLabel = formatUpdatedAt(item?.metadata?.updatedAt);

    return (
      <View style={styles.tableRow}>
        <Text style={[styles.td, styles.colWard]}>
          {item?.ward?.name || "NAv"}
        </Text>

        <Text style={[styles.td, styles.colSmall]}>
          {item?.counts?.formalErfs || 0}
        </Text>

        <Text style={[styles.td, styles.colSmall]}>
          {item?.counts?.informalErfs || 0}
        </Text>

        <Text style={[styles.td, styles.colSmall]}>
          {item?.counts?.premises || 0}
        </Text>

        <Text style={[styles.td, styles.colSmall]}>
          {item?.counts?.electricityMeters || 0}
        </Text>

        <Text style={[styles.td, styles.colSmall]}>
          {item?.counts?.waterMeters || 0}
        </Text>

        <Text style={[styles.td, styles.colSmall]}>
          {item?.counts?.totalMeters || 0}
        </Text>

        <Text style={[styles.td, styles.colSmall]}>
          {item?.counts?.trns || 0}
        </Text>

        <Text
          style={[
            styles.td,
            styles.colMedium,
            item?.status?.isOperationallyActive
              ? styles.activeText
              : styles.inactiveText,
          ]}
        >
          {item?.status?.isOperationallyActive ? "Active" : "Inactive"}
        </Text>

        <Text style={[styles.td, styles.colUpdated]}>{updatedLabel}</Text>
      </View>
    );
  }, []);

  const renderEmpty = () => {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No ward registry rows yet.</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ReportsHeader
        total={visibleRows.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenFilters={() => setShowFilterModal(true)}
        showStats={false}
        showExports={false}
        syncData={true}
        isSyncRunning={isSyncRunning}
        setShowSyncData={setShowSyncData}
      />

      <SyncDataCard
        visible={showSyncData}
        status={latestJob?.status || "NAv"}
        lastSyncLabel={lastSyncLabel}
        activeLmPcode={activeLmPcode}
        isSyncBusy={isSyncBusy}
        isStartingSync={isStartingSync}
        jobError={jobError}
        rowsError={rowsError}
        onSyncPress={handleSyncIconPress}
        onClose={() => setShowSyncData(false)}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={styles.tableWrap}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colWard]}>Ward</Text>
            <Text style={[styles.th, styles.colSmall]}>Formal</Text>
            <Text style={[styles.th, styles.colSmall]}>Informal</Text>
            <Text style={[styles.th, styles.colSmall]}>Premises</Text>

            <View style={[styles.thIconWrap, styles.colSmall]}>
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={16}
                color="#f59e0b"
              />
            </View>

            <View style={[styles.thIconWrap, styles.colSmall]}>
              <MaterialCommunityIcons name="water" size={16} color="#2563eb" />
            </View>

            <Text style={[styles.th, styles.colSmall]}>Tot Meters</Text>
            <Text style={[styles.th, styles.colSmall]}>TRNs</Text>
            <Text style={[styles.th, styles.colMedium]}>Active</Text>
            <Text style={[styles.th, styles.colUpdated]}>Updated</Text>
          </View>

          <FlashList
            data={visibleRows}
            renderItem={renderRow}
            keyExtractor={(item) => item?.id}
            estimatedItemSize={52}
            ListEmptyComponent={renderEmpty}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  tableWrap: {
    minWidth: 900,
    paddingHorizontal: 12,
    paddingBottom: 16,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 10,
  },

  tableRow: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    minHeight: 52,
    alignItems: "center",
  },

  th: {
    fontSize: 11,
    fontWeight: "900",
    color: "#0f172a",
    paddingHorizontal: 8,
  },

  td: {
    fontSize: 11,
    color: "#334155",
    paddingHorizontal: 8,
  },

  thIconWrap: {
    justifyContent: "center",
    alignItems: "center",
  },

  colWard: {
    width: 120,
  },

  colSmall: {
    width: 80,
  },

  colMedium: {
    width: 90,
  },

  colUpdated: {
    width: 170,
  },

  activeText: {
    color: "#16a34a",
    fontWeight: "800",
  },

  inactiveText: {
    color: "#dc2626",
    fontWeight: "800",
  },

  emptyState: {
    paddingVertical: 24,
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
  },

  emptyStateText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "700",
  },
});
