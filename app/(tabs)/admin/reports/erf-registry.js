// /app/(tabs)/admin/reports/erf-registry.js

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import ReportsHeader from "../../../../components/ReportsHeader";
import { db } from "../../../../src/firebase";
import { useAuth } from "../../../../src/hooks/useAuth";

export default function ErfRegistryScreen() {
  const [rows, setRows] = useState([]);
  const [rowsError, setRowsError] = useState("");

  const [activeTab, setActiveTab] = useState("LIST");
  const [showFilterModal, setShowFilterModal] = useState(false);

  const { isSPU, isADM, isMNG, isSPV, workbases, activeWorkbase } = useAuth();

  const activeLmPcode = activeWorkbase?.id || null;

  const visibleRows = useMemo(() => {
    if (!activeLmPcode) return [];

    const scopedRows = rows.filter(
      (row) => row?.geography?.lmPcode === activeLmPcode,
    );

    if (isSPU || isADM) {
      return scopedRows;
    }

    if (isMNG || isSPV) {
      const allowedLmPcodes = new Set(
        (workbases || []).map((item) => item?.id).filter(Boolean),
      );

      return scopedRows.filter((row) =>
        allowedLmPcodes.has(row?.geography?.lmPcode),
      );
    }

    return [];
  }, [rows, activeLmPcode, isSPU, isADM, isMNG, isSPV, workbases]);

  const sortedRows = useMemo(() => {
    return [...visibleRows].sort((a, b) => {
      const aTime = new Date(a?.metadata?.updatedAt || 0).getTime();
      const bTime = new Date(b?.metadata?.updatedAt || 0).getTime();
      return bTime - aTime;
    });
  }, [visibleRows]);

  useEffect(() => {
    if (!activeLmPcode) {
      setRows([]);
      return;
    }

    const rowsQuery = query(
      collection(db, "registry_erfs"),
      where("geography.lmPcode", "==", activeLmPcode),
      orderBy("erf.erfNo", "asc"),
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
        console.log("ErfRegistry -- rows listener error", error);
        setRowsError(error?.message || "Failed to read ERF rows");
      },
    );

    return unsubscribe;
  }, [activeLmPcode]);

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
        <Text style={[styles.td, styles.colErf]}>
          {item?.erf?.erfNo || "NAv"}
        </Text>

        <Text style={[styles.td, styles.colType]}>
          {item?.erf?.type || "NAv"}
        </Text>

        <Text style={[styles.td, styles.colWard]}>
          {item?.geography?.wardPcode || "NAv"}
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

        <Text style={[styles.td, styles.colSmall, styles.tot]}>
          {item?.counts?.totalMeters || 0}
        </Text>

        <Text style={[styles.td, styles.colSmall]}>
          {item?.counts?.trnsNa || 0}
        </Text>

        <Text style={[styles.td, styles.colSmall]}>
          {item?.counts?.trnsAccess || 0}
        </Text>

        <Text style={[styles.td, styles.colSmall, styles.tot]}>
          {item?.counts?.trnsTotal || 0}
        </Text>

        <Text style={[styles.td, styles.colUpdated]}>{updatedLabel}</Text>
      </View>
    );
  }, []);

  const renderEmpty = () => {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No ERF registry rows yet.</Text>
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
        syncData={false}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={styles.tableWrap}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colErf]}>ERF</Text>
            <Text style={[styles.th, styles.colType]}>Type</Text>
            <Text style={[styles.th, styles.colWard]}>Ward</Text>
            <Text style={[styles.th, styles.colSmall]}>Premises</Text>

            {/* Meters */}
            <View style={[styles.thIconWrap, styles.colSmall]}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialCommunityIcons
                  name="lightning-bolt"
                  size={16}
                  color="#f59e0b"
                />
                <Text style={[styles.textUtil]}>Elec</Text>
              </View>
            </View>

            <View style={[styles.thIconWrap, styles.colSmall]}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialCommunityIcons
                  name="water"
                  size={16}
                  color="#654dff"
                />
                <Text style={[styles.textUtil]}>Water</Text>
              </View>
            </View>
            <Text style={[styles.th, styles.colSmall]}>Tot Meters</Text>

            {/* TRNs */}
            <Text style={[styles.th, styles.colSmall]}>TRN NA</Text>
            <Text style={[styles.th, styles.colSmall]}>TRN Access</Text>
            <Text style={[styles.th, styles.colSmall]}>TRN Total</Text>

            <Text style={[styles.th, styles.colUpdated]}>Updated</Text>
          </View>

          <FlashList
            data={sortedRows}
            renderItem={renderRow}
            keyExtractor={(item) => item?.id}
            estimatedItemSize={52}
            ListEmptyComponent={renderEmpty}
          />
        </View>
      </ScrollView>

      {!!rowsError ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{rowsError}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  tableWrap: {
    minWidth: 860,
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

  textUtil: {
    fontSize: 11,
    fontWeight: "900",
    color: "#0f172a",
  },

  td: {
    fontSize: 11,
    color: "#334155",
    paddingHorizontal: 8,
  },

  colErf: {
    width: 110,
  },

  colType: {
    width: 90,
  },

  colWard: {
    width: 130,
  },

  colSmall: {
    width: 80,
  },

  colUpdated: {
    width: 170,
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

  errorWrap: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },

  errorText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "700",
  },
  tot: {
    fontWeight: "900",
    fontSize: 12,
  },
});
