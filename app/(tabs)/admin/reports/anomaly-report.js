import { useGeo } from "@/src/context/GeoContext";
import { useGetTrnsByLmPcodeQuery } from "@/src/redux/trnsApi";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import DateRangeModal from "../../../../components/DateRangeModal";
import { ExportIntelligenceModal } from "./components/ExportModal";
import UserTrnsReportHeader from "./components/UserTrnsReportHeader";

export default function AnomalyReport() {
  const { geoState } = useGeo();
  const lmPcode = geoState?.selectedLm?.id;

  const [activeView, setActiveView] = useState("TABLE");
  const [showDateModal, setShowDateModal] = useState(false);
  const [activeDateRange, setActiveDateRange] = useState({
    label: "ALL TIME",
    start: null,
    end: null,
  });

  const [isExportModalVisible, setIsExportModalVisible] = useState(false);

  const handleExport = async () => {
    try {
      const timestamp = new Date().toISOString().split("T")[0];
      const lmName = geoState?.selectedLm?.name || "Municipality";

      const rows = (processedData || []).map(
        (item) => `"${item.type}",${item.count}`,
      );
      const csvContent = ["ANOMALY TYPE & DETAIL,COUNT", ...rows].join("\n");

      const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
      const now = new Date();
      const timeString = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
      const fileName = `Anomaly_Report_${lmName}_${timestamp}_${timeString}.csv`;
      const fileUri = `${baseDir}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      const isAvailable = await Sharing.shareAsync(fileUri, {
        mimeType: "text/csv",
        dialogTitle: `Export ${lmName} Anomaly Intelligence`,
      });

      setIsExportModalVisible(false);
    } catch (error) {
      console.error("❌ ANOMALY_EXPORT_FAILED:", error);
      alert("Export Error: " + error.message);
    }
  };

  const { data: rawTrns = [], isLoading } = useGetTrnsByLmPcodeQuery(
    { lmPcode },
    { skip: !lmPcode },
  );

  const processedData = useMemo(() => {
    const elecTrns = rawTrns.filter((t) => {
      const isElec = t.meterType === "electricity";
      if (!isElec) return false;

      if (!activeDateRange.start) return true;
      const trnDate = new Date(
        t.accessData?.metadata?.created?.at || 0,
      ).getTime();
      const start = new Date(activeDateRange.start).getTime();
      const end = activeDateRange.end
        ? new Date(activeDateRange.end).getTime()
        : new Date().getTime();

      return trnDate >= start && trnDate <= end;
    });

    const groups = {};
    elecTrns.forEach((trn) => {
      // 🎯 Schema Match: ast.anomalies.anomaly & anomalyDetail
      const type = trn.ast?.anomalies?.anomaly;
      const detail = trn.ast?.anomalies?.anomalyDetail;

      if (
        !type ||
        type.toLowerCase() === "none" ||
        type.toLowerCase() === "no anomaly"
      )
        return;

      const groupKey = `${type.toUpperCase()} - ${detail?.toUpperCase() || "NO DETAIL"}`;

      if (!groups[groupKey]) {
        groups[groupKey] = { id: groupKey, type: groupKey, count: 0 };
      }
      groups[groupKey].count += 1;
    });

    return Object.values(groups).sort((a, b) => b.count - a.count);
  }, [rawTrns, activeDateRange]);

  if (isLoading)
    return <ActivityIndicator style={{ flex: 1 }} color="#2563eb" />;

  return (
    <View style={styles.container}>
      <UserTrnsReportHeader
        totalValue={processedData.reduce((sum, item) => sum + item.count, 0)}
        type="ANOMALIES"
        activeView={activeView}
        selectedDateLabel={activeDateRange.label}
        onOpenDateFilter={() => setShowDateModal(true)}
        onToggleView={() => setActiveView("TABLE")}
        onShowGraphs={() => setActiveView("GRAPHS")}
        onDownload={() => setIsExportModalVisible(true)}
      />

      {/* 🏛️ NO MORE HORIZONTAL SCROLL - CONTENT FITS SCREEN */}
      <View style={{ flex: 1 }}>
        {/* TABLE HEADER */}
        <View style={styles.tableHeader}>
          <View style={styles.typeHeaderCell}>
            <Text style={styles.headerText}>ANOMALY IDENTIFIER</Text>
          </View>
          <View style={styles.countHeaderCell}>
            <Text style={styles.headerText}>COUNT</Text>
          </View>
        </View>

        {/* DATA ROWS */}
        <FlatList
          data={processedData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.typeCell}>
                <Text style={styles.anomalyName}>{item.type}</Text>
              </View>
              <View style={styles.countCell}>
                <Text style={styles.numCellText}>{item.count}</Text>
              </View>
            </View>
          )}
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
  // 🛰️ Flex 4 for the description gives it 80% of space
  typeHeaderCell: {
    flex: 4,
    padding: 12,
    borderRightWidth: 1,
    borderColor: "#e2e8f0",
  },
  // 🛰️ Flex 1 for count gives it 20% of space
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
    flexWrap: "wrap", // 🛰️ Ensures text wraps to next line if too long
  },
});
