import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useGeo } from "../../../../src/context/GeoContext";
import { useWarehouse } from "../../../../src/context/WarehouseContext";
import { useGetSalesAtomicByMeterNoQuery } from "../../../../src/redux/salesApi";
import {
  addMonthsToYm,
  buildCalendarViewModel,
  getMonthLabel,
  getYmFromDate,
} from "../../../../src/utils/astReportCalendarUtils";
import {
  buildReportContext,
  findReportAstById,
  findReportErfById,
  findReportPremiseById,
  getReportErfId,
  getReportPremiseId,
  getSaleUpdatedAt,
  getTrnMeterNo,
  getTrnUpdatedAt,
  normalizeMeterNo,
} from "../../../../src/utils/astReportUtils";

const getSaleAmountR = (sale) => {
  const cents = Number(sale?.amountTotalC);
  if (Number.isNaN(cents)) return 0;
  return cents / 100;
};

const formatEventTime = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "NAv";

  return d.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const formatDayLabel = (dateKey) => {
  const d = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "NAv";

  return d.toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getTrnTypeLabel = (trn) => {
  const raw =
    trn?.accessData?.trnType ||
    trn?.trnType ||
    trn?.type ||
    trn?.derived?.trnType ||
    "TRN";

  return String(raw).replaceAll("_", " ");
};

const getTrnSubtitle = (trn) => {
  const user =
    trn?.metadata?.updatedByUser ||
    trn?.metadata?.createdByUser ||
    trn?.metadata?.updatedByUser ||
    trn?.metadata?.createdByUser ||
    "NAv";

  const detail =
    trn?.ast?.anomalies?.anomaly ||
    trn?.anomalies?.anomaly ||
    trn?.notes ||
    "Field operation";

  return `${formatEventTime(getTrnUpdatedAt(trn))} • ${user} • ${detail}`;
};

const mapTrnToCalendarEvent = (trn, index) => ({
  id: trn?.id || `TRN_${index}`,
  source: "TRN",
  title: getTrnTypeLabel(trn),
  subtitle: getTrnSubtitle(trn),
  updatedAt: getTrnUpdatedAt(trn),
  raw: trn,
});

const mapSaleToCalendarEvent = (sale, index) => ({
  id: sale?.id || sale?.txnId || `SALE_${index}`,
  source: "SALE",
  title: `R${getSaleAmountR(sale).toFixed(2)} Purchase`,
  subtitle: `${formatEventTime(getSaleUpdatedAt(sale))} • ${sale?.currency || "ZAR"} • Atomic Sales`,
  updatedAt: getSaleUpdatedAt(sale),
  raw: sale,
});

function ControlChip({ label, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function FixedCalendarHeader({
  reportContext,
  anchorYm,
  onPrev,
  onNext,
  viewMode,
  setViewMode,
}) {
  return (
    <View style={styles.fixedHeaderWrap}>
      <View style={styles.headerCard}>
        <View style={styles.topStatusRow}>
          <View style={styles.okBadge}>
            <Text style={styles.okBadgeText}>Meter Ok</Text>
          </View>

          <View style={styles.visibilityBadge}>
            <Text style={styles.visibilityBadgeText}>
              {reportContext?.visibility || "NAv"}
            </Text>
          </View>
        </View>

        <Text style={styles.meterNoText}>
          {reportContext?.meterNo || "NAv"}
        </Text>

        <View style={styles.geoMetaRow}>
          <View style={styles.geoPill}>
            <Text style={styles.addressText}>
              {reportContext?.premiseAddress || "NAv"}
            </Text>
          </View>
          <View style={styles.geoPill}>
            <Text style={styles.geoPillText}>
              {reportContext?.wardNo !== "NAv"
                ? `W${reportContext?.wardNo}`
                : reportContext?.wardPcode || "NAv"}
            </Text>
          </View>

          <View style={styles.geoPill}>
            <Text style={styles.geoPillText}>
              {reportContext?.erfNo !== "NAv"
                ? `ERF ${reportContext?.erfNo}`
                : "ERF NAv"}
            </Text>
          </View>
        </View>

        <View style={styles.astIdWrapper}>
          <Text style={styles.astIdText}>
            AST ID: {reportContext?.astId || "NAv"}
          </Text>
        </View>
      </View>

      <View style={styles.commandCard}>
        <View style={styles.monthNavRow}>
          <Pressable onPress={onPrev} style={styles.navBtn}>
            <MaterialCommunityIcons
              name="chevron-left"
              size={24}
              color="#0F172A"
            />
          </Pressable>

          <Text style={styles.monthNavTitle}>{getMonthLabel(anchorYm)}</Text>

          <Pressable onPress={onNext} style={styles.navBtn}>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#0F172A"
            />
          </Pressable>
        </View>

        <View style={styles.viewModeRow}>
          <ControlChip
            label="Grid View"
            active={viewMode === "grid"}
            onPress={() => setViewMode("grid")}
          />
          <ControlChip
            label="List View"
            active={viewMode === "list"}
            onPress={() => setViewMode("list")}
          />
          <ControlChip
            label="Dense View"
            active={viewMode === "dense"}
            onPress={() => setViewMode("dense")}
          />
        </View>
      </View>
    </View>
  );
}

function CalendarEventRow({ event }) {
  const isSale = event?.source === "SALE";

  return (
    <View style={styles.eventRow}>
      <View
        style={[
          styles.eventDot,
          { backgroundColor: isSale ? "#10B981" : "#2563EB" },
        ]}
      />
      <View style={styles.eventBody}>
        <Text style={styles.eventTitle}>{event?.title || "NAv"}</Text>
        <Text style={styles.eventSubtitle}>{event?.subtitle || "NAv"}</Text>
      </View>
    </View>
  );
}

function ListMonthBlock({ month }) {
  return (
    <View style={styles.monthBlock}>
      <Text style={styles.monthBlockTitle}>{month?.monthLabel || "NAv"}</Text>

      {(month?.days || []).map((day) => (
        <View key={day.dateKey} style={styles.dayCard}>
          <View style={styles.dayHeaderRow}>
            <Text style={styles.dayHeaderText}>
              {formatDayLabel(day.dateKey)}
            </Text>
            <Text
              style={[
                styles.dayHeaderBadge,
                day?.hasActivity && styles.dayHeaderBadgeActive,
              ]}
            >
              {day?.hasActivity
                ? `${day.events.length} event(s)`
                : "No activity"}
            </Text>
          </View>

          {day?.hasActivity ? (
            (day.events || []).map((event) => (
              <CalendarEventRow key={event.id} event={event} />
            ))
          ) : (
            <Text style={styles.noActivityText}>No activity</Text>
          )}
        </View>
      ))}
    </View>
  );
}

function DenseMonthBlock({ month }) {
  return (
    <View style={styles.monthBlock}>
      <Text style={styles.monthBlockTitle}>{month?.monthLabel || "NAv"}</Text>

      {(month?.days || []).length === 0 ? (
        <View style={styles.dayCard}>
          <Text style={styles.noActivityText}>No activity</Text>
        </View>
      ) : (
        (month?.days || []).map((day) => (
          <View key={day.dateKey} style={styles.dayCard}>
            <View style={styles.dayHeaderRow}>
              <Text style={styles.dayHeaderText}>
                {formatDayLabel(day.dateKey)}
              </Text>
              <Text
                style={[styles.dayHeaderBadge, styles.dayHeaderBadgeActive]}
              >
                {day.events.length} event(s)
              </Text>
            </View>

            {(day.events || []).map((event) => (
              <CalendarEventRow key={event.id} event={event} />
            ))}
          </View>
        ))
      )}
    </View>
  );
}

function GridDayCell({ day }) {
  return (
    <View
      style={[
        styles.gridDayCell,
        !day?.inCurrentMonth && styles.gridDayCellMuted,
      ]}
    >
      <Text
        style={[
          styles.gridDayNumber,
          !day?.inCurrentMonth && styles.gridDayNumberMuted,
        ]}
      >
        {day?.dayNumber || ""}
      </Text>

      {day?.hasActivity ? (
        <View style={styles.gridBadge}>
          <Text style={styles.gridBadgeText}>{day.events.length}</Text>
        </View>
      ) : (
        <View style={styles.gridBadgeGhost} />
      )}
    </View>
  );
}

function GridMonthBlock({ month }) {
  return (
    <View style={styles.monthBlock}>
      <Text style={styles.monthBlockTitle}>{month?.monthLabel || "NAv"}</Text>

      <View style={styles.weekdayRow}>
        {weekdayLabels.map((label) => (
          <View key={label} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{label}</Text>
          </View>
        ))}
      </View>

      {(month?.weeks || []).map((week, weekIndex) => (
        <View key={`${month.ym}_${weekIndex}`} style={styles.gridWeekRow}>
          {week.map((day) => (
            <GridDayCell key={day.dateKey} day={day} />
          ))}
        </View>
      ))}
    </View>
  );
}

export default function CalendarScreen() {
  const { id, astNo } = useLocalSearchParams();
  const { all } = useWarehouse();
  const { activeWard, activeLm } = useGeo();

  const [viewMode, setViewMode] = useState("list");
  const [anchorYm, setAnchorYm] = useState(getYmFromDate(new Date()));

  const selectedAst = useMemo(() => {
    return findReportAstById(all?.meters || [], id);
  }, [all?.meters, id]);

  const premiseId = useMemo(() => {
    return getReportPremiseId(selectedAst);
  }, [selectedAst]);

  const premise = useMemo(() => {
    return findReportPremiseById(all?.prems || [], premiseId);
  }, [all?.prems, premiseId]);

  const erfId = useMemo(() => {
    return getReportErfId(selectedAst, premise);
  }, [selectedAst, premise]);

  const erf = useMemo(() => {
    return findReportErfById(all?.erfs || [], erfId);
  }, [all?.erfs, erfId]);

  const reportContext = useMemo(() => {
    return buildReportContext({
      ast: selectedAst,
      premise,
      erf,
      activeWard,
      activeLm,
      params: { id, astNo },
    });
  }, [selectedAst, premise, erf, activeWard, activeLm, id, astNo]);

  const { data: sales = [] } = useGetSalesAtomicByMeterNoQuery(
    reportContext?.meterNo,
    {
      skip: !reportContext?.meterNo || reportContext?.meterNo === "NAv",
    },
  );

  const relatedTrns = useMemo(() => {
    const meterNo = normalizeMeterNo(reportContext?.meterNo);
    if (!meterNo || meterNo === "NAv") return [];

    return (all?.trns || []).filter((trn) => getTrnMeterNo(trn) === meterNo);
  }, [all?.trns, reportContext?.meterNo]);

  const calendarEvents = useMemo(() => {
    const trnEvents = relatedTrns.map(mapTrnToCalendarEvent);
    const saleEvents = (sales || []).map(mapSaleToCalendarEvent);

    return [...trnEvents, ...saleEvents].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [relatedTrns, sales]);

  const calendarViewModel = useMemo(() => {
    return buildCalendarViewModel({
      events: calendarEvents,
      anchorYm,
      viewMode,
    });
  }, [calendarEvents, anchorYm, viewMode]);

  const handlePrevMonth = () => {
    setAnchorYm((prev) => addMonthsToYm(prev, -1));
  };

  const handleNextMonth = () => {
    setAnchorYm((prev) => addMonthsToYm(prev, 1));
  };

  if (!selectedAst) {
    return (
      <View style={styles.centered}>
        <Text style={styles.statusTitle}>Calendar not found</Text>
        <Text style={styles.statusText}>
          We could not find the selected meter report context.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FixedCalendarHeader
        reportContext={reportContext}
        anchorYm={calendarViewModel.anchorYm}
        onPrev={handlePrevMonth}
        onNext={handleNextMonth}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {(calendarViewModel?.months || []).map((month) => {
          if (viewMode === "grid") {
            return <GridMonthBlock key={month.ym} month={month} />;
          }

          if (viewMode === "dense") {
            return <DenseMonthBlock key={month.ym} month={month} />;
          }

          return <ListMonthBlock key={month.ym} month={month} />;
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F8FAFC",
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  statusText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
  },

  fixedHeaderWrap: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#F8FAFC",
  },
  headerCard: {
    backgroundColor: "#E1ECFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#98B0D0",
    padding: 16,
    marginBottom: 10,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 3,
    textAlign: "center",
  },
  meterNoText: {
    marginTop: 4,
    fontSize: 28,
    fontWeight: "900",
    color: "#334155",
    textAlign: "center",
  },
  geoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  geoRowText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 10,
    flexWrap: "wrap",
  },
  metaText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569",
  },

  commandCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
  },
  monthNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  monthNavTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },

  viewRow: {
    marginTop: 12,
  },
  controlLabel: {
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipActive: {
    backgroundColor: "#E0F2FE",
    borderColor: "#7DD3FC",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
  },
  chipTextActive: {
    color: "#0F172A",
  },

  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },

  monthBlock: {
    marginTop: 6,
    marginBottom: 14,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  monthBlockTitle: {
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },

  dayCard: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  dayHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 6,
  },
  dayHeaderText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: "#1E293B",
  },
  dayHeaderBadge: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
  },
  dayHeaderBadgeActive: {
    color: "#0F766E",
  },
  noActivityText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
  },

  eventRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 6,
  },
  eventDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  eventBody: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  eventSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },

  weekdayRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
  },

  gridWeekRow: {
    flexDirection: "row",
  },
  gridDayCell: {
    flex: 1,
    minHeight: 64,
    margin: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    padding: 6,
  },
  gridDayCellMuted: {
    opacity: 0.45,
  },
  gridDayNumber: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
  },
  gridDayNumberMuted: {
    color: "#64748B",
  },
  gridBadge: {
    alignSelf: "flex-start",
    marginTop: 8,
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "#DBEAFE",
  },
  gridBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#1D4ED8",
    textAlign: "center",
  },
  gridBadgeGhost: {
    marginTop: 8,
    height: 20,
  },

  topStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  okBadge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  okBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
  },
  visibilityBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  visibilityBadgeText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#166534",
  },
  geoMainRow: {
    marginTop: 8,
    alignItems: "center",
  },
  geoMetaRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    flexWrap: "wrap",
  },
  geoPill: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  geoPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#334155",
  },
  viewModeRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  astIdText: {
    fontSize: 10,
  },

  astIdWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
});
