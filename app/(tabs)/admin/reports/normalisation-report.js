import { useGeo } from "@/src/context/GeoContext";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

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
import DateRangeModal from "../../../../components/DateRangeModal";
import { ExportIntelligenceModal } from "../../../../components/ExportModal";
import UserTrnsReportHeader from "../../../../components/UserTrnsReportHeader";
import { db } from "../../../../src/firebase";

export default function NormalisationReport() {
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

    const reportRef = collection(db, "report_trn_normalisation");
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
            action: item?.normalisation?.actions?.join(" + ") || "NAv",
            count: item?.counts?.trns || 0,
            updatedAt: item?.metadata?.updatedAt || "NAv",
          };
        });

        setRows(data);
        setIsLoading(false);
      },
      (error) => {
        console.log("normalisation-report snapshot error", error);
        setRows([]);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [lmPcode]);

  const processedData = useMemo(() => {
    return [...rows].sort((a, b) => {
      if ((b?.count || 0) !== (a?.count || 0)) {
        return (b?.count || 0) - (a?.count || 0);
      }

      return (a?.action || "").localeCompare(b?.action || "");
    });
  }, [rows]);

  const totalRows = useMemo(() => processedData.length, [processedData]);

  const handleExport = async () => {
    try {
      const timestamp = new Date().toISOString().split("T")[0];

      const rows = (processedData || []).map(
        (item) => `"${item.action}",${item.count}`,
      );

      const csvContent = ["NORMALISATION ACTION GROUP,COUNT", ...rows].join(
        "\n",
      );

      const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;

      const now = new Date();
      const timeString = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
      const fileName = `Normalisation_Report_${lmName}_${timestamp}_${timeString}.csv`;

      const fileUri = `${baseDir}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, csvContent);

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: `Export ${lmName} Intelligence`,
        });
      }

      setIsExportModalVisible(false);
    } catch (error) {
      console.error("❌ NORMALISATION_EXPORT_FAILED:", error);
      alert("Export Error: " + error.message);
    }
  };

  if (isLoading) {
    return <ActivityIndicator style={{ flex: 1 }} color="#2563eb" />;
  }

  return (
    <View style={styles.container}>
      <UserTrnsReportHeader
        totalValue={totalRows}
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
          <View style={styles.tableHeader}>
            <View style={[styles.headerCell, { width: 280 }]}>
              <Text style={styles.headerText}>NORMALISATION ACTION</Text>
            </View>
            <View style={[styles.headerCell, styles.numCol]}>
              <Text style={styles.headerText}>COUNT</Text>
            </View>
          </View>

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
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>
                  No normalisation groups found for {lmName}.
                </Text>
              </View>
            }
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

  numCol: {
    width: 100,
    alignItems: "center",
  },

  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    backgroundColor: "#fff",
  },

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

  actionName: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1e293b",
  },

  emptyWrap: {
    padding: 40,
    alignItems: "center",
  },

  emptyText: {
    color: "#64748b",
    fontWeight: "600",
  },
});
