import { useAuth } from "@/src/hooks/useAuth";
import { useGetTrnsByLmPcodeQuery } from "@/src/redux/trnsApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isWithinInterval,
  isYesterday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
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
import { Provider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import DateWindowPicker from "../../../../components/DateWindowPicker";

export default function UserStatsReport() {
  const { user, activeWorkbase } = useAuth();
  const lmPcode = activeWorkbase?.id;

  const [dateFilter, setDateFilter] = useState({
    key: "THIS_CALENDAR_MONTH",
    label: "This Calendar Month",
  });

  const { data: allTrns = [], isLoading } = useGetTrnsByLmPcodeQuery(lmPcode, {
    skip: !lmPcode,
  });

  const productionData = useMemo(() => {
    const parseDateValue = (value) => {
      if (!value) return null;

      if (value?.seconds) return new Date(value.seconds * 1000);
      if (value?.__time__) return new Date(value.__time__);

      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const getTrnDate = (t) => {
      return (
        parseDateValue(t?.accessData?.metadata?.updatedAt) ||
        parseDateValue(t?.accessData?.metadata?.createdAt) ||
        parseDateValue(t?.metadata?.updatedAt) ||
        parseDateValue(t?.metadata?.createdAt) ||
        null
      );
    };

    const getOwnerUid = (t) => {
      return (
        t?.accessData?.metadata?.updatedByUid ||
        t?.accessData?.metadata?.createdByUid ||
        t?.metadata?.updatedByUid ||
        t?.metadata?.createdByUid ||
        null
      );
    };

    const checkNoAccess = (t) => {
      const val =
        t?.accessData?.access?.hasAccess ??
        t?.accessData?.hasAccess ??
        t?.access?.hasAccess;

      return val === false || val === "false" || val === "no";
    };

    const getTrnType = (t) => {
      return String(t?.accessData?.trnType || t?.trnType || "").toUpperCase();
    };

    const isTrnInSelectedWindow = (trnDate, selectedFilter) => {
      if (!trnDate || !selectedFilter?.key) return false;

      const now = new Date();

      if (selectedFilter.key === "TODAY") {
        return isSameDay(trnDate, now);
      }

      if (selectedFilter.key === "YESTERDAY") {
        return isYesterday(trnDate);
      }

      if (selectedFilter.key === "PAST_3_DAYS") {
        return isWithinInterval(trnDate, {
          start: startOfDay(subDays(now, 2)),
          end: endOfDay(now),
        });
      }

      if (selectedFilter.key === "PAST_5_DAYS") {
        return isWithinInterval(trnDate, {
          start: startOfDay(subDays(now, 4)),
          end: endOfDay(now),
        });
      }

      // Calendar week starting Sunday
      if (selectedFilter.key === "THIS_CALENDAR_WEEK") {
        return isWithinInterval(trnDate, {
          start: startOfWeek(now, { weekStartsOn: 0 }),
          end: endOfWeek(now, { weekStartsOn: 0 }),
        });
      }

      if (selectedFilter.key === "LAST_CALENDAR_WEEK") {
        const lastWeekRef = subDays(startOfWeek(now, { weekStartsOn: 0 }), 1);

        return isWithinInterval(trnDate, {
          start: startOfWeek(lastWeekRef, { weekStartsOn: 0 }),
          end: endOfWeek(lastWeekRef, { weekStartsOn: 0 }),
        });
      }

      if (selectedFilter.key === "THIS_CALENDAR_MONTH") {
        return isWithinInterval(trnDate, {
          start: startOfMonth(now),
          end: endOfMonth(now),
        });
      }

      if (selectedFilter.key === "LAST_CALENDAR_MONTH") {
        const lastMonthRef = subMonths(now, 1);

        return isWithinInterval(trnDate, {
          start: startOfMonth(lastMonthRef),
          end: endOfMonth(lastMonthRef),
        });
      }

      if (selectedFilter.key === "CUSTOM_RANGE") {
        const fromDate = new Date(`${selectedFilter?.from}T00:00:00`);
        const toDate = new Date(`${selectedFilter?.to}T23:59:59`);

        if (
          Number.isNaN(fromDate.getTime()) ||
          Number.isNaN(toDate.getTime())
        ) {
          return false;
        }

        return isWithinInterval(trnDate, {
          start: fromDate,
          end: toDate,
        });
      }

      return isWithinInterval(trnDate, {
        start: startOfMonth(now),
        end: endOfMonth(now),
      });
    };

    const myTrns = allTrns.filter((t) => {
      const ownerUid = getOwnerUid(t);
      if (!ownerUid || ownerUid !== user?.uid) return false;

      const trnDate = getTrnDate(t);
      if (!trnDate) return false;

      return isTrnInSelectedWindow(trnDate, dateFilter);
    });

    const noAccessTrns = myTrns.filter((t) => checkNoAccess(t));
    const productiveTrns = myTrns.filter((t) => !checkNoAccess(t));

    return [
      {
        id: "na",
        label: "No Access",
        rate: 20,
        count: noAccessTrns.length,
      },
      {
        id: "disc",
        label: "Meter Discoveries",
        rate: 25,
        count: productiveTrns.filter((t) => getTrnType(t) === "METER_DISCOVERY")
          .length,
      },
      {
        id: "insp",
        label: "Meter Inspections",
        rate: 45,
        count: productiveTrns.filter(
          (t) => getTrnType(t) === "METER_INSPECTION",
        ).length,
      },
      {
        id: "inst",
        label: "Installations",
        rate: 90,
        count: productiveTrns.filter(
          (t) =>
            getTrnType(t) === "INSTALLATION" ||
            getTrnType(t) === "METER_INSTALLATION",
        ).length,
      },
      {
        id: "disco",
        label: "Disconnections",
        rate: 80,
        count: productiveTrns.filter((t) => getTrnType(t) === "DISCONNECTION")
          .length,
      },
      {
        id: "reco",
        label: "Reconnections",
        rate: 80,
        count: productiveTrns.filter((t) => getTrnType(t) === "RECONNECTION")
          .length,
      },
    ];
  }, [allTrns, user?.uid, dateFilter]);

  const grandTotal = productionData.reduce(
    (acc, curr) => acc + curr.count * curr.rate,
    0,
  );

  const totalTrns = productionData.reduce((acc, item) => acc + item.count, 0);

  if (!lmPcode || isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <Provider>
      <SafeAreaView style={styles.container} edges={["left", "right"]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <Text style={styles.title}>User TRN Stats</Text>
              <Text style={styles.titleCount}>[{totalTrns}]</Text>
            </View>

            <DateWindowPicker value={dateFilter} onChange={setDateFilter} />
          </View>

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
              <Text style={styles.totalValue}>R{grandTotal}</Text>
            </View>
          </View>

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
    gap: 12,
  },

  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#1e293b",
  },

  titleCount: {
    fontSize: 16,
    fontWeight: "900",
    color: "#2563eb",
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

  cell: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "600",
  },

  footer: {
    backgroundColor: "#1e293b",
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  footerText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94a3b8",
  },

  activeWorkbaseText: {
    fontSize: 9,
    color: "#38bdf8",
    fontWeight: "700",
    marginTop: 2,
  },

  totalValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#38bdf8",
  },

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

  pdfBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },

  disclaimer: {
    marginTop: 20,
    fontSize: 10,
    color: "#94a3b8",
    textAlign: "center",
    fontStyle: "italic",
  },
});
