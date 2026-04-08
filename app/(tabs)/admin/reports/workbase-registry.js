// /app/(tabs)/admin/reports/workbase-registry.js

import { FlashList } from "@shopify/flash-list";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import ReportsHeader from "../../../../components/ReportsHeader";
import SyncDataCard from "../../../../components/SyncDataCard";
import { db, functions } from "../../../../src/firebase";
import { useAuth } from "../../../../src/hooks/useAuth";

export default function WorkbaseRegistryScreen() {
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
    if (isSPU || isADM) {
      return rows;
    }

    if (isMNG || isSPV) {
      const allowedLmPcodes = new Set(
        (workbases || []).map((item) => item?.id).filter(Boolean),
      );

      return rows.filter((row) => allowedLmPcodes.has(row?.lmPcode));
    }

    return [];
  }, [rows, isSPU, isADM, isMNG, isSPV, workbases]);

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

      const startWorkbaseRegistrySync = httpsCallable(
        functions,
        "startWorkbaseRegistrySyncCallable",
      );

      const result = await startWorkbaseRegistrySync();

      console.log("WorkbaseRegistry -- sync started", result?.data);
    } catch (error) {
      console.log("WorkbaseRegistry -- sync start error", error);
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

        const prevProcessed = Number(prevJob?.processedLms || 0);
        const nextProcessed = Number(nextJob?.processedLms || 0);

        const processedJump = Math.abs(nextProcessed - prevProcessed) >= 3;

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
        console.log("WorkbaseRegistry -- jobs listener error", error);
        setJobError(error?.message || "Failed to read sync job");
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const rowsQuery = query(
      collection(db, "registry_workbases"),
      orderBy("lmName", "asc"),
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
        console.log("WorkbaseRegistry -- rows listener error", error);
        setRowsError(error?.message || "Failed to read workbase rows");
      },
    );

    return unsubscribe;
  }, []);

  const lastSyncLabel = useMemo(() => {
    const completedAt =
      latestJob?.completedAt || latestJob?.metadata?.updatedAt;

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
        <Text style={[styles.td, styles.colProvince]}>
          {item?.provinceName || "NAv"}
        </Text>

        <Text style={[styles.td, styles.colDistrict]}>
          {item?.districtName || "NAv"}
        </Text>

        <Text style={[styles.td, styles.colLm]}>
          {item?.lmName || "NAv"} ({item?.lmPcode || "NAv"})
        </Text>

        <Text style={[styles.td, styles.colSmall]}>{item?.wardCount || 0}</Text>

        <Text style={[styles.td, styles.colSmall]}>
          {item?.formalErfCount || 0}
        </Text>

        <Text style={[styles.td, styles.colSmall]}>
          {item?.informalErfCount || 0}
        </Text>

        <Text style={[styles.td, styles.colSmall]}>
          {item?.premiseCount || 0}
        </Text>

        <Text style={[styles.td, styles.colSmall]}>
          {item?.meterCount || 0}
        </Text>

        <Text style={[styles.td, styles.colSmall]}>{item?.trnCount || 0}</Text>

        <Text
          style={[
            styles.td,
            styles.colMedium,
            item?.isOperationallyActive
              ? styles.activeText
              : styles.inactiveText,
          ]}
        >
          {item?.isOperationallyActive ? "Active" : "Inactive"}
        </Text>

        <Text style={[styles.td, styles.colUpdated]}>{updatedLabel}</Text>
      </View>
    );
  }, []);

  const renderEmpty = () => {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>
          No workbase registry rows yet.
        </Text>
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
            <Text style={[styles.th, styles.colProvince]}>Province</Text>
            <Text style={[styles.th, styles.colDistrict]}>District</Text>
            <Text style={[styles.th, styles.colLm]}>LM</Text>
            <Text style={[styles.th, styles.colSmall]}>Wards</Text>
            <Text style={[styles.th, styles.colSmall]}>Formal</Text>
            <Text style={[styles.th, styles.colSmall]}>Informal</Text>
            <Text style={[styles.th, styles.colSmall]}>Premises</Text>
            <Text style={[styles.th, styles.colSmall]}>Meters</Text>
            <Text style={[styles.th, styles.colSmall]}>TRNs</Text>
            <Text style={[styles.th, styles.colMedium]}>Active</Text>
            <Text style={[styles.th, styles.colUpdated]}>Updated</Text>
          </View>

          <FlashList
            data={visibleRows}
            keyExtractor={(item) => item.id}
            renderItem={renderRow}
            estimatedItemSize={52}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={styles.listContent}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8fafc",
  },

  tableWrap: {
    minWidth: 1180,
    flex: 1,
  },

  listContent: {
    paddingBottom: 24,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginBottom: 6,
  },

  tableRow: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginBottom: 6,
  },

  th: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },

  td: {
    fontSize: 12,
    color: "#334155",
  },

  colProvince: {
    width: 110,
    marginRight: 8,
  },

  colDistrict: {
    width: 110,
    marginRight: 8,
  },

  colLm: {
    width: 190,
    marginRight: 8,
  },

  colSmall: {
    width: 80,
    marginRight: 8,
  },

  colMedium: {
    width: 90,
    marginRight: 8,
  },

  colUpdated: {
    width: 170,
    marginRight: 8,
  },

  activeText: {
    color: "#166534",
    fontWeight: "600",
  },

  inactiveText: {
    color: "#991b1b",
    fontWeight: "600",
  },

  emptyState: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },

  emptyStateText: {
    color: "#64748b",
  },
});
