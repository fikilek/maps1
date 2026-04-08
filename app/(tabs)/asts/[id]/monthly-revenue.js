import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useGeo } from "../../../../src/context/GeoContext";
import { useWarehouse } from "../../../../src/context/WarehouseContext";
import { useGetSalesMonthlyByLmAndMeterNoQuery } from "../../../../src/redux/salesApi";
import {
  buildMonthlyRevenueMetrics,
  getMonthlyRevenueChartData,
  mapMonthlyRevenueRows,
  toCurrencyR,
} from "../../../../src/utils/astReportMonthlyRevenueUtils";
import {
  buildReportContext,
  findReportAstById,
  findReportErfById,
  findReportPremiseById,
  getReportErfId,
  getReportPremiseId,
} from "../../../../src/utils/astReportUtils";

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

function FixedRevenueHeader({ reportContext, viewMode, setViewMode }) {
  return (
    <View style={styles.fixedHeaderWrap}>
      <View style={styles.headerCard}>
        <View style={styles.topStatusRow}>
          <View style={styles.infoBadge}>
            <Text style={styles.infoBadgeText}>Monthly Revenue</Text>
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

        <View style={styles.geoRow}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={16}
            color="#475569"
          />
          <Text style={styles.geoRowText}>
            {reportContext?.premiseAddress || "NAv"}
          </Text>
        </View>

        <View style={styles.geoRow}>
          <MaterialCommunityIcons
            name="map-outline"
            size={16}
            color="#475569"
          />
          <Text style={styles.geoRowText}>
            {reportContext?.territoryLine || "NAv"}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            AST ID: {reportContext?.astId || "NAv"}
          </Text>
          <Text style={styles.metaText}>
            LM: {reportContext?.lmPcode || "NAv"}
          </Text>
        </View>
      </View>

      <View style={styles.commandCard}>
        <Text style={styles.controlLabel}>VIEW</Text>

        <View style={styles.chipRow}>
          <ControlChip
            label="Summary"
            active={viewMode === "summary"}
            onPress={() => setViewMode("summary")}
          />
          <ControlChip
            label="Chart"
            active={viewMode === "chart"}
            onPress={() => setViewMode("chart")}
          />
          <ControlChip
            label="Rows"
            active={viewMode === "rows"}
            onPress={() => setViewMode("rows")}
          />
        </View>
      </View>
    </View>
  );
}

function SummaryCard({ label, value, icon }) {
  return (
    <View style={styles.summaryCard}>
      <MaterialCommunityIcons
        name={icon || "chart-box"}
        size={20}
        color="#0F172A"
        style={styles.summaryIcon}
      />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function SummaryView({ metrics }) {
  return (
    <View style={styles.sectionWrap}>
      <View style={styles.summaryGrid}>
        <SummaryCard
          label="Latest Month"
          value={toCurrencyR(metrics?.latestMonthRevenue)}
          icon="cash"
        />
        <SummaryCard
          label="Best Month"
          value={toCurrencyR(metrics?.bestMonthRevenue)}
          icon="trophy-outline"
        />
        <SummaryCard
          label="Average Month"
          value={toCurrencyR(metrics?.averageMonthlyRevenue)}
          icon="chart-line"
        />
        <SummaryCard
          label="Active Months"
          value={String(metrics?.activeMonthsCount || 0)}
          icon="calendar-month-outline"
        />
        <SummaryCard
          label="Total Revenue"
          value={toCurrencyR(metrics?.totalMonthlyRevenue)}
          icon="cash-multiple"
        />
        <SummaryCard
          label="Purchases Count"
          value={String(metrics?.totalMonthlyPurchasesCount || 0)}
          icon="counter"
        />
      </View>
    </View>
  );
}

function SimpleRevenueChart({ chartData = [] }) {
  const maxValue = useMemo(() => {
    return Math.max(
      ...(chartData || []).map((x) => Number(x?.amountTotalR || 0)),
      0,
    );
  }, [chartData]);

  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>Monthly Revenue Trend</Text>

      {(chartData || []).length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No monthly revenue data</Text>
        </View>
      ) : (
        <View style={styles.chartCard}>
          {(chartData || []).map((item) => {
            const value = Number(item?.amountTotalR || 0);
            const heightPct =
              maxValue > 0 ? Math.max((value / maxValue) * 100, 4) : 4;

            return (
              <View key={item?.ym} style={styles.chartBarCol}>
                <Text style={styles.chartValueLabel}>{toCurrencyR(value)}</Text>

                <View style={styles.chartBarTrack}>
                  <View
                    style={[styles.chartBarFill, { height: `${heightPct}%` }]}
                  />
                </View>

                <Text style={styles.chartMonthLabel}>
                  {item?.monthLabel || item?.ym || "NAv"}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function RowsHeader() {
  return (
    <View style={styles.rowsHeader}>
      <Text style={[styles.rowsHeaderText, styles.colMonth]}>Month</Text>
      <Text style={[styles.rowsHeaderText, styles.colRevenue]}>Revenue</Text>
      <Text style={[styles.rowsHeaderText, styles.colCount]}>Count</Text>
      <Text style={[styles.rowsHeaderText, styles.colAvg]}>Avg</Text>
    </View>
  );
}

function RevenueRow({ row }) {
  return (
    <View style={styles.rowCard}>
      <Text style={[styles.rowText, styles.colMonth]}>
        {row?.monthLabel || "NAv"}
      </Text>
      <Text style={[styles.rowText, styles.colRevenue]}>
        {toCurrencyR(row?.amountTotalR)}
      </Text>
      <Text style={[styles.rowText, styles.colCount]}>
        {String(row?.purchasesCount || 0)}
      </Text>
      <Text style={[styles.rowText, styles.colAvg]}>
        {toCurrencyR(row?.avgPurchaseR)}
      </Text>
    </View>
  );
}

function RowsView({ rows = [] }) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>Monthly Revenue Rows</Text>

      {(rows || []).length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No monthly rows found</Text>
        </View>
      ) : (
        <View>
          <RowsHeader />
          {(rows || []).map((row) => (
            <RevenueRow key={row?.id || row?.ym} row={row} />
          ))}
        </View>
      )}
    </View>
  );
}

export default function MonthlyRevenueScreen() {
  const { id, astNo } = useLocalSearchParams();
  const { all } = useWarehouse();
  const { activeWard, activeLm } = useGeo();

  const [viewMode, setViewMode] = useState("summary");

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

  const { data: monthlyRaw = [], isLoading: loadingMonthly } =
    useGetSalesMonthlyByLmAndMeterNoQuery(
      {
        lmPcode: reportContext?.lmPcode,
        meterNo: reportContext?.meterNo,
      },
      {
        skip:
          !reportContext?.lmPcode ||
          reportContext?.lmPcode === "NAv" ||
          !reportContext?.meterNo ||
          reportContext?.meterNo === "NAv",
      },
    );

  const monthlyRows = useMemo(() => {
    return mapMonthlyRevenueRows(monthlyRaw || []);
  }, [monthlyRaw]);

  const monthlyMetrics = useMemo(() => {
    return buildMonthlyRevenueMetrics(monthlyRows);
  }, [monthlyRows]);

  const chartData = useMemo(() => {
    return getMonthlyRevenueChartData(monthlyRows);
  }, [monthlyRows]);

  if (!selectedAst) {
    return (
      <View style={styles.centered}>
        <Text style={styles.statusTitle}>Monthly Revenue not found</Text>
        <Text style={styles.statusText}>
          We could not find the selected meter report context.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FixedRevenueHeader
        reportContext={reportContext}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loadingMonthly ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading monthly revenue...</Text>
          </View>
        ) : viewMode === "chart" ? (
          <SimpleRevenueChart chartData={chartData} />
        ) : viewMode === "rows" ? (
          <RowsView rows={monthlyRows} />
        ) : (
          <SummaryView metrics={monthlyMetrics} />
        )}
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
  topStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  infoBadge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  infoBadgeText: {
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

  loadingCard: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 24,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
  },

  sectionWrap: {
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
  },
  summaryIcon: {
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },
  summaryLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },

  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    minHeight: 280,
  },
  chartBarCol: {
    flex: 1,
    alignItems: "center",
  },
  chartValueLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 8,
  },
  chartBarTrack: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  chartBarFill: {
    width: "100%",
    backgroundColor: "#60A5FA",
    borderRadius: 12,
  },
  chartMonthLabel: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    textAlign: "center",
  },

  rowsHeader: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#E2E8F0",
    borderRadius: 12,
    marginBottom: 8,
  },
  rowsHeaderText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#334155",
  },
  rowCard: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 8,
  },
  rowText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },

  colMonth: {
    flex: 1.4,
  },
  colRevenue: {
    flex: 1,
    textAlign: "right",
  },
  colCount: {
    flex: 0.8,
    textAlign: "right",
  },
  colAvg: {
    flex: 1,
    textAlign: "right",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 18,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94A3B8",
  },
});
