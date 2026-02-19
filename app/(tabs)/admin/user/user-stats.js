import { useAuth } from "@/src/hooks/useAuth";
import { useGetTrnsByLmPcodeQuery } from "@/src/redux/trnsApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  endOfDay,
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  isYesterday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, Modal, Portal, Provider, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UserStatsReport() {
  const { user, activeWorkbase } = useAuth();

  // 🛰️ State Management
  const [filterMode, setFilterMode] = useState("THIS MONTH");
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [tempDate, setTempDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // 🛰️ Data Fetching
  const { data: allTrns = [], isLoading } = useGetTrnsByLmPcodeQuery({
    lmPcode: activeWorkbase?.id || "ZA1048",
  });

  const productionData = useMemo(() => {
    const now = new Date();

    const getTrnDate = (t) => {
      const rawDate =
        t.accessData?.metadata?.updated?.at || t.metadata?.created?.at;
      const dateString = rawDate?.__time__ || rawDate;
      return dateString ? new Date(dateString) : null;
    };

    const checkNoAccess = (access) => {
      const val = access?.hasAccess;
      return val === false || val === "false" || val === "no";
    };

    const myTrns = allTrns.filter((t) => {
      const isMyTrn =
        t.accessData?.metadata?.updated?.byUid === user?.uid ||
        t.metadata?.created?.byUid === user?.uid;
      if (!isMyTrn) return false;

      const trnDate = getTrnDate(t);
      if (!trnDate) return false;

      if (filterMode === "TODAY") return isSameDay(trnDate, now);
      if (filterMode === "YESTERDAY") return isYesterday(trnDate);
      if (filterMode === "THIS WEEK")
        return isWithinInterval(trnDate, {
          start: startOfWeek(now),
          end: endOfWeek(now),
        });

      if (filterMode.startsWith("DATE:")) {
        const selectedDate = new Date(filterMode.replace("DATE:", ""));
        return isWithinInterval(trnDate, {
          start: startOfDay(selectedDate),
          end: endOfDay(selectedDate),
        });
      }

      return isWithinInterval(trnDate, {
        start: startOfMonth(now),
        end: endOfDay(now),
      });
    });

    return [
      {
        id: "na",
        label: "No Access",
        rate: 20,
        count: myTrns.filter((t) => checkNoAccess(t.accessData?.access)).length,
      },
      {
        id: "disc",
        label: "Meter Discoveries",
        rate: 25,
        count: myTrns.filter(
          (t) =>
            !checkNoAccess(t.accessData?.access) &&
            t.accessData?.trnType === "METER_DISCOVERY",
        ).length,
      },
      {
        id: "insp",
        label: "Meter Inspections",
        rate: 45,
        count: myTrns.filter(
          (t) => t.accessData?.trnType === "METER_INSPECTION",
        ).length,
      },
      {
        id: "inst",
        label: "Installations",
        rate: 90,
        count: myTrns.filter((t) => t.accessData?.trnType === "INSTALLATION")
          .length,
      },
      {
        id: "disco",
        label: "Disconnections",
        rate: 80,
        count: myTrns.filter((t) => t.accessData?.trnType === "DISCONNECTION")
          .length,
      },
      {
        id: "reco",
        label: "Reconnections",
        rate: 80,
        count: myTrns.filter((t) => t.accessData?.trnType === "RECONNECTION")
          .length,
      },
    ];
  }, [allTrns, user?.uid, filterMode]);

  const grandTotal = productionData.reduce(
    (acc, curr) => acc + curr.count * curr.rate,
    0,
  );

  if (isLoading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );

  return (
    <Provider>
      <SafeAreaView style={styles.container} edges={["left", "right"]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>User Trns Stats</Text>
            <TouchableOpacity
              style={styles.dateBadge}
              onPress={() => setMenuVisible(true)}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialCommunityIcons
                  name="calendar-search"
                  size={14}
                  color="#475569"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.dateText}>{filterMode}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 📊 ORIGINAL TABLE START */}
          <View style={styles.table}>
            <View style={styles.rowHeader}>
              <Text style={[styles.col, { flex: 2.5 }]}>Task Type</Text>
              <Text style={[styles.col, { flex: 1, textAlign: "center" }]}>
                Total
              </Text>
              <Text style={[styles.col, { flex: 1, textAlign: "center" }]}>
                Rate
              </Text>
              <Text style={[styles.col, { flex: 1.2, textAlign: "right" }]}>
                Amount
              </Text>
            </View>

            {productionData.map((item) => (
              <View key={item.id} style={styles.row}>
                <Text style={[styles.cell, { flex: 2.5 }]}>{item.label}</Text>
                <Text style={[styles.cell, { flex: 1, textAlign: "center" }]}>
                  {item.count}
                </Text>
                <Text
                  style={[
                    styles.cell,
                    { flex: 1, textAlign: "center", color: "#64748b" },
                  ]}
                >
                  R{item.rate}
                </Text>
                <Text
                  style={[
                    styles.cell,
                    { flex: 1.2, textAlign: "right", fontWeight: "900" },
                  ]}
                >
                  R{item.count * item.rate}
                </Text>
              </View>
            ))}

            <View style={styles.footer}>
              <View>
                <Text style={styles.footerText}>ESTIMATED EARNINGS</Text>
                <Text style={styles.activeWorkbaseText}>
                  {activeWorkbase?.name || "Global iREPS"}
                </Text>
              </View>
              <Text style={styles.totalValue}>R {grandTotal}</Text>
            </View>
          </View>
          {/* 📊 ORIGINAL TABLE END */}

          <TouchableOpacity style={styles.pdfBtn} onPress={() => {}}>
            <MaterialCommunityIcons
              name="file-pdf-box"
              size={24}
              color="#fff"
            />
            <Text style={styles.pdfBtnText}>DOWNLOAD PDF PAYSLIP</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            * This is an automated production estimate. Final disbursements
            subject to approval.
          </Text>
        </ScrollView>

        {/* 🛡️ SOVEREIGN PAPER MODAL */}
        <Portal>
          <Modal
            visible={isMenuVisible}
            onDismiss={() => setMenuVisible(false)}
            contentContainerStyle={styles.modalStyle}
          >
            <Text style={styles.modalTitle}>Select Window</Text>
            <View style={styles.modalGrid}>
              {["TODAY", "YESTERDAY", "THIS WEEK", "THIS MONTH"].map((mode) => (
                <Button
                  key={mode}
                  mode={filterMode === mode ? "contained" : "outlined"}
                  onPress={() => {
                    setFilterMode(mode);
                    setMenuVisible(false);
                  }}
                  style={styles.modalBtn}
                >
                  {mode}
                </Button>
              ))}
            </View>

            <View style={styles.customDateContainer}>
              <TextInput
                label="Manual Date (YYYY-MM-DD)"
                value={tempDate}
                onChangeText={setTempDate}
                mode="outlined"
                dense
                style={{ flex: 1, backgroundColor: "#fff" }}
              />
              <Button
                mode="contained"
                onPress={() => {
                  setFilterMode(`DATE:${tempDate}`);
                  setMenuVisible(false);
                }}
                style={{ marginLeft: 8, justifyContent: "center" }}
              >
                GO
              </Button>
            </View>
          </Modal>
        </Portal>
      </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: "900", color: "#1e293b" },
  dateBadge: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dateText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
  },
  table: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 4,
  },
  rowHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderColor: "#cbd5e1",
  },
  col: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748b",
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: "center",
  },
  cell: { fontSize: 13, color: "#334155", fontWeight: "600" },
  footer: {
    backgroundColor: "#1e293b",
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: { fontSize: 10, fontWeight: "900", color: "#94a3b8" },
  activeWorkbaseText: {
    fontSize: 9,
    color: "#38bdf8",
    fontWeight: "700",
    marginTop: 2,
  },
  totalValue: { fontSize: 24, fontWeight: "900", color: "#38bdf8" },
  pdfBtn: {
    marginTop: 24,
    backgroundColor: "#2563eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  pdfBtnText: { color: "#fff", fontSize: 14, fontWeight: "900" },
  disclaimer: {
    marginTop: 20,
    fontSize: 10,
    color: "#94a3b8",
    textAlign: "center",
    fontStyle: "italic",
  },
  modalStyle: {
    backgroundColor: "white",
    padding: 24,
    margin: 20,
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1e293b",
    marginBottom: 20,
    textAlign: "center",
  },
  modalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  modalBtn: { width: "45%", borderRadius: 8 },
  customDateContainer: {
    flexDirection: "row",
    marginTop: 20,
    alignItems: "center",
  },
});
