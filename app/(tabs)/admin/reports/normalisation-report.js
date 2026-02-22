import { useGeo } from "@/src/context/GeoContext";
import { useGetTrnsByLmPcodeQuery } from "@/src/redux/trnsApi";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import DateRangeModal from "../../../../components/DateRangeModal";
import { ExportIntelligenceModal } from "./components/ExportModal";
import UserTrnsReportHeader from "./components/UserTrnsReportHeader";

export default function NormalisationReport() {
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

      // 🏛️ 1. Build CSV
      const rows = (processedData || []).map(
        (item) => `"${item.action}",${item.count}`,
      );
      const csvContent = ["NORMALISATION ACTION GROUP,COUNT", ...rows].join(
        "\n",
      );

      // 🏛️ 2. The Legacy Path
      // In the legacy import, these properties are exactly where they used to be
      const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;

      // Add a precise timestamp to the filename to avoid overwriting previous strikes
      const now = new Date();
      const timeString = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
      const fileName = `Normalisation_Report_${lmName}_${timestamp}_${timeString}.csv`;

      const fileUri = `${baseDir}${fileName}`;

      // 🏛️ 3. The Physical Write (Legacy Strike)
      // This will no longer show the "Deprecated" alert
      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      // 🏛️ 4. Deploy
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: `Export ${lmName} Intelligence`,
        });
      }

      setIsExportModalVisible(false);
    } catch (error) {
      console.error("❌ LEGACY_STRIKE_FAILED:", error);
      alert("Export Error: " + error.message);
    }
  };

  // 📡 THE SOVEREIGN STREAMS
  const { data: rawTrns = [], isLoading } = useGetTrnsByLmPcodeQuery(
    { lmPcode },
    { skip: !lmPcode },
  );

  const processedData = useMemo(() => {
    // 🛰️ STEP 1: Filter Electricity Transactions for the current LM
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

    // 🛰️ STEP 2: The Logic Loop (The Sovereign Grouping)
    elecTrns.forEach((trn) => {
      const actions = trn.ast?.normalisation?.actionTaken || [];

      // Create a unique key by sorting and joining (e.g., "DISCONNECT + FINE ISSUED")
      const groupKey =
        actions.length > 0
          ? actions
              .slice()
              .sort()
              .map((a) => a.toUpperCase())
              .join(" + ")
          : "INSPECTION ONLY";

      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: groupKey,
          action: groupKey,
          count: 0,
        };
      }

      groups[groupKey].count += 1;
    });

    // 🛰️ STEP 3: Convert to Array & Sort by Count
    return Object.values(groups).sort((a, b) => b.count - a.count);
  }, [rawTrns, activeDateRange]);

  const totalElecTrns = useMemo(
    () => rawTrns.filter((t) => t.meterType === "electricity").length,
    [rawTrns],
  );

  if (isLoading)
    return <ActivityIndicator style={{ flex: 1 }} color="#2563eb" />;

  return (
    <View style={styles.container}>
      <UserTrnsReportHeader
        totalValue={totalElecTrns}
        type="TRNS"
        activeView={activeView}
        selectedDateLabel={activeDateRange.label}
        onOpenDateFilter={() => setShowDateModal(true)}
        onToggleView={() => setActiveView("TABLE")}
        onShowGraphs={() => setActiveView("GRAPHS")}
        onDownload={() => setIsExportModalVisible(true)}
      />

      <ScrollView horizontal persistentScrollbar>
        <View>
          {/* 🏛️ TABLE HEADER */}
          <View style={styles.tableHeader}>
            <View style={[styles.headerCell, { width: 280 }]}>
              <Text style={styles.headerText}>NORMALISATION ACTION</Text>
            </View>
            <View style={[styles.headerCell, styles.numCol]}>
              <Text style={styles.headerText}>COUNT</Text>
            </View>
          </View>

          {/* 🏛️ DATA ROWS */}
          <FlatList
            data={processedData}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <View
                  style={[
                    styles.cell,
                    { width: 280, backgroundColor: "#fdfdfd" },
                  ]}
                >
                  <Text style={styles.actionName}>{item.action}</Text>
                </View>
                <View style={[styles.cell, styles.numCol]}>
                  <Text style={[styles.numCellText, { color: "#2563eb" }]}>
                    {item.count}
                  </Text>
                </View>
              </View>
            )}
          />
        </View>
      </ScrollView>

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
  headerCell: {
    padding: 12,
    justifyContent: "center",
    borderRightWidth: 1,
    borderColor: "#e2e8f0",
  },
  headerText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#475569",
    letterSpacing: 1,
  },
  numCol: { width: 100, alignItems: "center" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#f1f5f9" },
  cell: {
    padding: 15,
    justifyContent: "center",
    borderRightWidth: 1,
    borderColor: "#f1f5f9",
  },
  numCellText: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    color: "#1e293b",
  },
  actionName: { fontSize: 10, fontWeight: "bold", color: "#1e293b" },
});
