// /app/(tabs)/admin/reports/lm-premise-report.js
import { useWarehouse } from "@/src/context/WarehouseContext";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import LmPremiseReportHeader from "./components/LmPremiseReportHeader";
import { ReportRow } from "./components/ReportRow";
// import { ReportRow } from "./components/ReportRow"; // Flattened row component

export default function LmPremiseReport() {
  const { filtered, all } = useWarehouse();
  const [activeTab, setActiveTab] = useState("LIST");

  // 🕵️ DATA FLATTENING: One row per meter
  const reportData = useMemo(() => {
    const list = [];
    const premises = filtered?.prems || [];

    premises.forEach((p) => {
      const meterIds = [
        ...(p.services?.electricityMeters || []),
        ...(p.services?.waterMeters || []),
      ];

      if (meterIds.length > 0) {
        meterIds.forEach((mId) => {
          const meter = all?.asts?.find((a) => a.id === mId);
          list.push({ ...p, meter, rowKey: `${p.id}-${mId}` });
        });
      } else {
        // Still add the premise even if no meters exist
        list.push({ ...p, meter: null, rowKey: p.id });
      }
    });
    return list;
  }, [filtered?.prems, all?.asts]);

  return (
    <View style={styles.container}>
      <LmPremiseReportHeader
        total={reportData.length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <FlatList
        data={reportData}
        keyExtractor={(item) => item.rowKey}
        renderItem={({ item }) => <ReportRow item={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});
