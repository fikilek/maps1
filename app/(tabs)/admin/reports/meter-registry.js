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

export default function MeterRegistryScreen() {
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
      collection(db, "registry_meters"),
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
        console.log("MeterRegistry -- rows listener error", error);
        setRowsError(error?.message || "Failed to read meter rows");
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

  const getMeterTypeLabel = (meterType) => {
    const value = String(meterType || "")
      .trim()
      .toLowerCase();

    if (!value) return "NAv";
    if (value === "electricity") return "Electricity";
    if (value === "water") return "Water";

    return meterType || "NAv";
  };

  const getVisibilityLabel = (visibility) => {
    const value = String(visibility || "")
      .trim()
      .toUpperCase();

    if (!value) return "NAv";
    if (value === "VISIBLE") return "VISIBLE";
    if (value === "INVISIBLE") return "INVISIBLE";

    return visibility || "NAv";
  };

  const getPropertyTypeLabel = (propertyType) => {
    if (!propertyType || propertyType === "NAv") return "NAv";

    if (typeof propertyType === "string") {
      return propertyType;
    }

    if (typeof propertyType === "object") {
      return (
        propertyType?.type || propertyType?.name || propertyType?.label || "NAv"
      );
    }

    return "NAv";
  };

  const renderRow = useCallback(({ item }) => {
    const updatedLabel = formatUpdatedAt(item?.metadata?.updatedAt);
    const meterTypeLabel = getMeterTypeLabel(item?.meterType);
    const visibilityLabel = getVisibilityLabel(item?.visibility);
    const propertyTypeLabel = getPropertyTypeLabel(item?.premisePropertyType);

    return (
      <View style={styles.tableRow}>
        <Text style={[styles.td, styles.colMeterNo]}>
          {item?.meterNo || "NAv"}
        </Text>

        <Text style={[styles.td, styles.colType]}>{meterTypeLabel}</Text>

        <Text style={[styles.td, styles.colVisibility]}>{visibilityLabel}</Text>

        <Text style={[styles.td, styles.colAddress]}>
          {item?.premiseAddress || "NAv"}
        </Text>

        <Text style={[styles.td, styles.colPropertyType]}>
          {propertyTypeLabel}
        </Text>

        <Text style={[styles.td, styles.colErf]}>{item?.erfNo || "NAv"}</Text>

        <Text style={[styles.td, styles.colWard]}>
          {item?.parents?.wardPcode || "NAv"}
        </Text>

        <Text style={[styles.td, styles.colUpdated]}>{updatedLabel}</Text>
      </View>
    );
  }, []);

  const renderEmpty = () => {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No meter registry rows yet.</Text>
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
            <Text style={[styles.th, styles.colMeterNo]}>Meter No</Text>

            <View style={[styles.thIconWrap, styles.colType]}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialCommunityIcons
                  name="counter"
                  size={16}
                  color="#475569"
                />
                <Text style={styles.textUtil}>Type</Text>
              </View>
            </View>

            <Text style={[styles.th, styles.colVisibility]}>Visibility</Text>

            <Text style={[styles.th, styles.colAddress]}>Premise Address</Text>
            <Text style={[styles.th, styles.colPropertyType]}>
              Property Type
            </Text>
            <Text style={[styles.th, styles.colErf]}>ERF</Text>
            <Text style={[styles.th, styles.colWard]}>Ward</Text>
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
    minWidth: 1140,
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
    borderBottomWidth: 0,
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
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    paddingHorizontal: 10,
  },

  td: {
    fontSize: 12,
    color: "#0f172a",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },

  thIconWrap: {
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  textUtil: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
  },

  colMeterNo: {
    width: 170,
  },

  colType: {
    width: 120,
  },

  colVisibility: {
    width: 110,
  },

  colAddress: {
    width: 240,
  },

  colPropertyType: {
    width: 150,
  },

  colErf: {
    width: 90,
  },

  colWard: {
    width: 130,
  },

  colUpdated: {
    width: 180,
  },

  emptyState: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },

  emptyStateText: {
    fontSize: 13,
    color: "#64748b",
  },

  errorWrap: {
    marginHorizontal: 12,
    marginTop: 8,
    padding: 10,
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
  },

  errorText: {
    fontSize: 12,
    color: "#b91c1c",
  },
});
