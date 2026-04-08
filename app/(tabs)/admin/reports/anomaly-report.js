import { useGeo } from "@/src/context/GeoContext";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import DateRangeModal from "../../../../components/DateRangeModal";
import { ExportIntelligenceModal } from "../../../../components/ExportModal";
import UserTrnsReportHeader from "../../../../components/UserTrnsReportHeader";
import { db } from "../../../../src/firebase";

export default function AnomalyReport() {
  const { geoState } = useGeo();
  const lmPcode = geoState?.selectedLm?.id;
  const lmName = geoState?.selectedLm?.name || "Municipality";

  const [activeView, setActiveView] = useState("TABLE");
  const [showDateModal, setShowDateModal] = useState(false);
  const [activeDateRange, setActiveDateRange] = useState({
    label: "ALL TIME",
    start: null,
    end: null,
  });

  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!lmPcode) {
      setRows([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const reportRef = collection(db, "report_trn_anomaly");
    const reportQuery = query(
      reportRef,
      where("parents.lmPcode", "==", lmPcode),
    );

    const unsubscribe = onSnapshot(
      reportQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const item = doc.data();

          const anomalyName = item?.anomaly?.name || "NAv";
          const anomalyDetail = item?.anomaly?.detail || "NAv";

          return {
            id: item?.id || doc.id,
            activityDate: item?.activityDate || "NAv",
            type: `${anomalyName.toUpperCase()} - ${anomalyDetail.toUpperCase()}`,
            count: item?.counts?.trns || 0,
            updatedAt: item?.metadata?.updatedAt || "NAv",
          };
        });

        setRows(data);
        setIsLoading(false);
      },
      (error) => {
        console.log("anomaly-report snapshot error", error);
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

  const processedData = useMemo(() => {
    const filtered = rows.filter((item) =>
      isWithinDateRange(
        item?.activityDate,
        activeDateRange?.start,
        activeDateRange?.end,
      ),
    );

    return [...filtered].sort((a, b) => {
      if ((b?.count || 0) !== (a?.count || 0)) {
        return (b?.count || 0) - (a?.count || 0);
      }

      return (a?.type || "").localeCompare(b?.type || "");
    });
  }, [rows, activeDateRange]);

  const totalCount = useMemo(() => {
    return processedData.reduce((sum, item) => sum + (item.count || 0), 0);
  }, [processedData]);

  const handleExport = async () => {
    try {
      const timestamp = new Date().toISOString().split("T")[0];

      const exportRows = (processedData || []).map(
        (item) => `"${item.type}",${item.count}`,
      );
      const csvContent = ["ANOMALY TYPE & DETAIL,COUNT", ...exportRows].join(
        "\n",
      );

      const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
      const now = new Date();
      const timeString = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
      const fileName = `Anomaly_Report_${lmName}_${timestamp}_${timeString}.csv`;
      const fileUri = `${baseDir}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: `Export ${lmName} Anomaly Intelligence`,
        });
      }

      setIsExportModalVisible(false);
    } catch (error) {
      console.error("❌ ANOMALY_EXPORT_FAILED:", error);
      alert("Export Error: " + error.message);
    }
  };

  if (isLoading) {
    return <ActivityIndicator style={{ flex: 1 }} color="#2563eb" />;
  }

  return (
    <View style={styles.container}>
      <UserTrnsReportHeader
        totalValue={totalCount}
        type="ANOMALIES"
        activeView={activeView}
        selectedDateLabel={activeDateRange.label}
        onOpenDateFilter={() => setShowDateModal(true)}
        onToggleView={() => setActiveView("TABLE")}
        onShowGraphs={() => setActiveView("GRAPHS")}
        onDownload={() => setIsExportModalVisible(true)}
      />

      <View style={{ flex: 1 }}>
        <View style={styles.tableHeader}>
          <View style={styles.typeHeaderCell}>
            <Text style={styles.headerText}>ANOMALY IDENTIFIER</Text>
          </View>
          <View style={styles.countHeaderCell}>
            <Text style={styles.headerText}>COUNT</Text>
          </View>
        </View>

        <FlatList
          data={processedData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.typeCell}>
                <Text style={styles.anomalyName}>{item.type}</Text>
                <Text style={styles.dateText}>{item.activityDate}</Text>
              </View>
              <View style={styles.countCell}>
                <Text style={styles.numCellText}>{item.count}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>
                No anomaly groups found for {activeDateRange.label} in {lmName}.
              </Text>
            </View>
          }
        />
      </View>

      <DateRangeModal
        visible={showDateModal}
        onClose={() => setShowDateModal(false)}
        onSelect={(range) => setActiveDateRange(range)}
      />

      <ExportIntelligenceModal
        visible={isExportModalVisible}
        onClose={() => setIsExportModalVisible(false)}
        onExport={handleExport}
      />
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

  typeHeaderCell: {
    flex: 4,
    padding: 12,
    borderRightWidth: 1,
    borderColor: "#e2e8f0",
  },

  countHeaderCell: {
    flex: 1,
    padding: 12,
    alignItems: "center",
  },

  headerText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#475569",
    letterSpacing: 1,
  },

  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    backgroundColor: "#fff",
  },

  typeCell: {
    flex: 4,
    padding: 15,
    backgroundColor: "#fdfdfd",
    borderRightWidth: 1,
    borderColor: "#f1f5f9",
  },

  countCell: {
    flex: 1,
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
  },

  numCellText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#2563eb",
  },

  anomalyName: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1e293b",
    flexWrap: "wrap",
  },

  dateText: {
    marginTop: 4,
    fontSize: 9,
    color: "#94a3b8",
  },

  emptyWrap: {
    padding: 40,
    alignItems: "center",
  },

  emptyText: {
    color: "#64748b",
    fontWeight: "600",
    textAlign: "center",
  },
});
