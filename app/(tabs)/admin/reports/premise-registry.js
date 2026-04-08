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

export default function PremiseRegistryScreen() {
  const [rows, setRows] = useState([]);
  const [rowsError, setRowsError] = useState("");

  const [activeTab, setActiveTab] = useState("LIST");
  const [showFilterModal, setShowFilterModal] = useState(false);

  const { isSPU, isADM, isMNG, isSPV, workbases, activeWorkbase } = useAuth();

  const activeLmPcode = activeWorkbase?.id || null;

  const visibleRows = useMemo(() => {
    if (!activeLmPcode) return [];

    const scopedRows = rows.filter(
      (row) => row?.parents?.lmPcode === activeLmPcode,
    );

    if (isSPU || isADM) {
      return scopedRows;
    }

    if (isMNG || isSPV) {
      const allowedLmPcodes = new Set(
        (workbases || []).map((item) => item?.id).filter(Boolean),
      );

      return scopedRows.filter((row) =>
        allowedLmPcodes.has(row?.parents?.lmPcode),
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
      collection(db, "registry_premises"),
      where("parents.lmPcode", "==", activeLmPcode),
      orderBy("metadata.updatedAt", "desc"),
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
        console.log("PremiseRegistry -- rows listener error", error);
        setRowsError(error?.message || "Failed to read premise rows");
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

  const getAddressLabel = (address) => {
    const strNo = address?.strNo || "";
    const strName = address?.strName || "";
    const strType = address?.strType || "";

    const full = `${strNo} ${strName} ${strType}`.trim();
    return full || "NAv";
  };

  const renderRow = useCallback(({ item }) => {
    const updatedLabel = formatUpdatedAt(item?.metadata?.updatedAt);
    const addressLabel = getAddressLabel(item?.address);

    return (
      <View style={styles.tableRow}>
        <Text style={[styles.td, styles.colAddress]}>{addressLabel}</Text>

        <Text style={[styles.td, styles.colErf]}>{item?.erfNo || "NAv"}</Text>

        {/* Property type */}
        <Text style={[styles.td, styles.colType]}>
          {item?.propertyType?.type || "NAv"}
        </Text>

        <Text style={[styles.td, styles.colType]}>
          {item?.propertyType?.name || "NAv"}
        </Text>

        <Text style={[styles.td, styles.colType]}>
          {item?.propertyType?.unitNo || "NAv"}
        </Text>

        <Text style={[styles.td, styles.colOcc]}>
          {item?.occupancy?.status || "NAv"}
        </Text>

        <Text style={[styles.td, styles.colWard]}>
          {item?.parents?.wardPcode || "NAv"}
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

        <Text style={[styles.td, styles.colUpdated]}>{updatedLabel}</Text>
      </View>
    );
  }, []);

  const renderEmpty = () => {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No premise registry rows yet.</Text>
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
            <Text style={[styles.th, styles.colAddress]}>Address</Text>
            <Text style={[styles.th, styles.colErf]}>ERF</Text>

            <Text style={[styles.th, styles.colType]}>Type</Text>
            <Text style={[styles.th, styles.colName]}>Name</Text>
            <Text style={[styles.th, styles.colUnitNo]}>Unit No</Text>

            <Text style={[styles.th, styles.colOcc]}>Occupancy</Text>
            <Text style={[styles.th, styles.colWard]}>Ward</Text>

            <View style={[styles.thIconWrap, styles.colSmall]}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialCommunityIcons
                  name="lightning-bolt"
                  size={16}
                  color="#f59e0b"
                />
                <Text style={styles.textUtil}>Elec</Text>
              </View>
            </View>

            <View style={[styles.thIconWrap, styles.colSmall]}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialCommunityIcons
                  name="water"
                  size={16}
                  color="#654dff"
                />
                <Text style={styles.textUtil}>Water</Text>
              </View>
            </View>

            <Text style={[styles.th, styles.colSmall]}>Tot Meters</Text>
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
    minWidth: 980,
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

  thIconWrap: {
    paddingHorizontal: 8,
    justifyContent: "center",
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

  colAddress: {
    width: 140,
  },

  colErf: {
    width: 70,
  },

  colType: {
    width: 110,
  },
  colName: {
    width: 110,
  },
  colUnitNo: {
    width: 60,
  },

  colOcc: {
    width: 110,
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
