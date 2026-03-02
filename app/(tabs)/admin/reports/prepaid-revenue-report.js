// app/(tabs)/reports/prepaidRevenue/index.js  (or wherever your screen lives)
import { skipToken } from "@reduxjs/toolkit/query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import AtomicListPanel from "../../../../src/features/reports/prepaidRevenue/AtomicListPanel";
import MeterSearchBox from "../../../../src/features/reports/prepaidRevenue/MeterSearchBox";
import MonthlyListPanel from "../../../../src/features/reports/prepaidRevenue/MonthlyListPanel";
import MonthlyFilterModal from "../../../../src/features/reports/prepaidRevenue/months/MonthlyFilterModal";
import {
  getDefaultLastNMonths,
  ymToLabel,
} from "../../../../src/features/reports/prepaidRevenue/months/monthUtils";
import RevenueGroupsRow from "../../../../src/features/reports/prepaidRevenue/RevenueGroupsRow";
import { useAuth } from "../../../../src/hooks/useAuth";
import { setNewTrns } from "../../../../src/redux/newTrnsSlice";
import {
  useGetSalesAtomicLimitedQuery,
  useGetSalesMonthlyByLmAndYmsQuery,
  useGetSalesMonthlyLmByLmAndYmsQuery,
  useGetSalesMonthlyLmGroupsByLmAndYmQuery,
} from "../../../../src/redux/salesApi";

function normalizeYms(yms) {
  if (!Array.isArray(yms)) return [];
  return Array.from(new Set(yms)).sort().reverse(); // newest first
}

/*START ********************************
Wiring Group Filters on Atomic
*/
function normalizeMeter(s) {
  return String(s || "")
    .replace(/\s+/g, "")
    .trim();
}

/*END ********************************
Wiring Group Filters on Atomic
*/

export default function PrepaidRevenueReportScreen() {
  const [mode, setMode] = useState("MONTHLY");

  const router = useRouter();
  const dispatch = useDispatch();

  // Revenue Groups
  // inside component:
  const [activeGroup, setActiveGroup] = useState("ALL");
  const [meterSearch, setMeterSearch] = useState("");

  // monthly filter state
  const [monthModalOpen, setMonthModalOpen] = useState(false);
  const [selectedYms, setSelectedYms] = useState([]); // string[]

  // GET USER DATA
  const { activeWorkbaseId, ready } = useAuth();
  const lmPcode = activeWorkbaseId || null;
  console.log(`lmPcode`, lmPcode);
  console.log(`ready`, ready);
  console.log(`activeWorkbaseId`, activeWorkbaseId);

  /* =====================================================
     ATOMIC
  ===================================================== */
  const atomicArgs =
    mode === "ATOMIC" && ready && lmPcode ? { lmPcode, limit: 200 } : skipToken;
  // console.log(`atomicArgs`, atomicArgs);

  const atomic = useGetSalesAtomicLimitedQuery(atomicArgs);
  // console.log(`atomic`, atomic);

  const filteredAtomicItems = useMemo(() => {
    const q = normalizeMeter(meterSearch);
    const rows = atomic.data || [];

    return rows.filter((it) => {
      if (!q) return true;
      return normalizeMeter(it?.meterNo).startsWith(q);
    });
  }, [atomic.data, meterSearch]);

  /* =====================================================
     MONTHLY_LM (available months + KPI source)
  ===================================================== */

  const monthlyLmArgs = ready && lmPcode ? { lmPcode, yms: null } : skipToken;
  console.log(`monthlyLmArgs?.length`, monthlyLmArgs?.length);

  const monthlyLm = useGetSalesMonthlyLmByLmAndYmsQuery(monthlyLmArgs);
  console.log(`monthlyLm?.length`, monthlyLm?.length);

  // 1) Always derive availableYms from monthlyLm (safe default [])
  const availableYms = useMemo(() => {
    return (monthlyLm.data || []).map((x) => x.ym).filter(Boolean);
  }, [monthlyLm.data]);

  // 2) Default 3 months from whatever is available
  const default3 = useMemo(() => {
    return getDefaultLastNMonths(availableYms, 3);
  }, [availableYms]);

  // 3) IMPORTANT: init selectedYms ONCE when data arrives
  const didInitMonthsRef = useRef(false);

  useEffect(() => {
    if (didInitMonthsRef.current) return;
    if (availableYms.length === 0) return;

    setSelectedYms(default3);
    didInitMonthsRef.current = true;
  }, [availableYms.length, default3]);

  /* =====================================================
     MONTHLY (meter × month) driven by selectedYms
  ===================================================== */

  const normSelectedYms = useMemo(
    () => normalizeYms(selectedYms),
    [selectedYms],
  );

  const activeYm = useMemo(() => {
    return normSelectedYms.length ? normSelectedYms[0] : null;
  }, [normSelectedYms]);

  const monthlyMetersArgs =
    ready && lmPcode && normSelectedYms.length > 0
      ? { lmPcode, yms: normSelectedYms } // ✅ up to 3 months
      : skipToken;

  const monthlyMeters = useGetSalesMonthlyByLmAndYmsQuery(monthlyMetersArgs);
  // console.log(`monthlyMeters`, monthlyMeters);

  const filteredMonthlyItems = useMemo(() => {
    const rows = monthlyMeters.data || [];
    const q = normalizeMeter(meterSearch);

    return rows.filter((r) => {
      // 1) group filter (salesGroupId exists on conlog_sales_monthly)
      if (activeGroup && activeGroup !== "ALL") {
        if (String(r.salesGroupId || "").toUpperCase() !== activeGroup)
          return false;
      }

      // 2) meter search filter (prefix match)
      if (!q) return true;
      return normalizeMeter(r.meterNo).startsWith(q);
    });
  }, [monthlyMeters.data, activeGroup, meterSearch]);

  /* =====================================================
     KPI (FOR NOW: based on MONTHLY_LM docs)
     NOTE: Later you’ll tie KPI totals to selectedYms.
  ===================================================== */

  // ✅ Replace ONLY your current `kpis = useMemo(() => { ... })` with this version.
  // It makes KPIs reflect `selectedYms` (NOT last 24 months).

  const kpis = useMemo(() => {
    const docs = monthlyLm?.data || [];

    // If user hasn't selected months yet, fall back to default3 (or empty)
    const ymsToUse =
      Array.isArray(selectedYms) && selectedYms.length > 0
        ? selectedYms
        : default3 || [];

    // Fast membership check
    const ymSet = new Set(ymsToUse);

    // Only months in the active filter
    const filtered = docs
      .filter((d) => d?.ym && ymSet.has(d.ym))
      // make sure "latest" inside selection is first
      .sort((a, b) => (a.ym < b.ym ? 1 : -1));

    // Total Sales: sum across selected months
    let totalCents = 0;
    for (const d of filtered) totalCents += Number(d?.amountTotalC || 0);

    // Total Meters:
    // Use metersCount from the latest selected month (most realistic KPI)
    const latestMetersCount = filtered[0]?.metersCount ?? 0;

    return {
      totalSalesZar: `R ${(totalCents / 100).toFixed(2)}`,
      totalMeters: Number(latestMetersCount || 0),

      // placeholders for next steps
      visibleMeters: 0,
      invisibleMeters: 0,
      buckets: { gr1: 0, gr2: 0, gr3: 0, gr4: 0 },
    };
  }, [monthlyLm?.data, selectedYms, default3]);
  // console.log("KPI ymsToUse", selectedYms?.length ? selectedYms : default3);

  /* =====================================================
     CREATE NEW TRNS (navigation only for now)
  ===================================================== */

  const onPressTrns = () => {
    // Ensure we are in MONTHLY mode (UI)
    if (mode !== "MONTHLY") setMode("MONTHLY");

    // If user hasn't selected months yet, open the month picker
    if (!Array.isArray(selectedYms) || selectedYms.length === 0) {
      setMonthModalOpen(true);
      return;
    }

    const rows = filteredMonthlyItems || [];

    const byMeter = new Map();
    for (const r of rows) {
      const meterNo = String(r.meterNo || "").trim();
      if (!meterNo) continue;

      const prev = byMeter.get(meterNo) || {
        meterNo,
        purchasesCount: 0,
        amountTotalC: 0,
      };
      prev.purchasesCount += Number(r.purchasesCount || 0);
      prev.amountTotalC += Number(r.amountTotalC || 0);
      byMeter.set(meterNo, prev);
    }

    const candidates = Array.from(byMeter.values()).sort(
      (a, b) => (b.amountTotalC || 0) - (a.amountTotalC || 0),
    );

    dispatch(
      setNewTrns({
        candidates,
        context: {
          lmPcode,
          yms: selectedYms,
          group: activeGroup,
          meterNoFilter: meterSearch,
        },
      }),
    );

    router.push("/(tabs)/admin/reports/create-trns-confirm");
  };

  /* =====================================================
     GROUP STATS
  ===================================================== */

  const monthlyGroupsArgs =
    ready && lmPcode && activeYm ? { lmPcode, ym: activeYm } : skipToken;

  const monthlyGroups =
    useGetSalesMonthlyLmGroupsByLmAndYmQuery(monthlyGroupsArgs);

  const groupStats = useMemo(() => {
    // base scaffold (always show all pills)
    const out = {
      ALL: { metersCount: 0, amountTotalC: 0 },
      GR0: { metersCount: 0, amountTotalC: 0 },
      GR1: { metersCount: 0, amountTotalC: 0 },
      GR2: { metersCount: 0, amountTotalC: 0 },
      GR3: { metersCount: 0, amountTotalC: 0 },
      GR4: { metersCount: 0, amountTotalC: 0 },
      GR5: { metersCount: 0, amountTotalC: 0 },
    };

    // 1) Fill GR1..GR5 from lm-month-groups docs
    const groupDocs = monthlyGroups?.data || [];
    for (const d of groupDocs) {
      const key = String(d?.salesGroupId || "").toUpperCase();
      if (!out[key]) continue;

      out[key] = {
        metersCount: Number(d?.metersCount || 0),
        amountTotalC: Number(d?.amountTotalC || 0),
      };
    }

    // 2) Fill ALL from lm-month totals (authoritative)
    // monthlyLm.data is last 24 months; pick the active month doc.
    const lmDocs = monthlyLm?.data || [];
    const lmThisMonth = lmDocs.find((d) => d?.ym === activeYm);

    out.ALL = {
      metersCount: Number(lmThisMonth?.metersCount || 0),
      amountTotalC: Number(lmThisMonth?.amountTotalC || 0),
    };

    return out;
  }, [monthlyGroups?.data, monthlyLm?.data, activeYm]);

  useEffect(() => {
    // optional UX guard: when switching modes, clear filters
    setMeterSearch("");
    if (mode !== "MONTHLY") setMonthModalOpen(false);
  }, [mode]);

  useEffect(() => {
    console.log("monthlyLmArgs", monthlyLmArgs);
  }, [monthlyLmArgs]);

  useEffect(() => {
    console.log("monthlyMetersArgs", monthlyMetersArgs);
  }, [monthlyMetersArgs]);

  useEffect(() => {
    console.log("monthlyLm", {
      isLoading: monthlyLm.isLoading,
      isFetching: monthlyLm.isFetching,
      isError: monthlyLm.isError,
      error: monthlyLm.error?.message || monthlyLm.error,
      size: Array.isArray(monthlyLm.data) ? monthlyLm.data.length : null,
      first: Array.isArray(monthlyLm.data) ? monthlyLm.data[0] : null,
    });
  }, [
    monthlyLm.isLoading,
    monthlyLm.isFetching,
    monthlyLm.isError,
    monthlyLm.error,
    monthlyLm.data,
  ]);

  useEffect(() => {
    console.log("monthlyMeters", {
      args: monthlyMetersArgs,
      isLoading: monthlyMeters.isLoading,
      isFetching: monthlyMeters.isFetching,
      isError: monthlyMeters.isError,
      error: monthlyMeters.error?.message || monthlyMeters.error,
      size: Array.isArray(monthlyMeters.data)
        ? monthlyMeters.data.length
        : null,
      first: Array.isArray(monthlyMeters.data) ? monthlyMeters.data[0] : null,
    });
  }, [
    monthlyMetersArgs,
    monthlyMeters.isLoading,
    monthlyMeters.isFetching,
    monthlyMeters.isError,
    monthlyMeters.error,
    monthlyMeters.data,
  ]);

  /* =====================================================
     UI GUARD
  ===================================================== */
  if (!ready || !lmPcode) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff", padding: 16 }}>
        <Text style={{ color: "#6B7280" }}>Loading workbase…..</Text>
      </SafeAreaView>
    );
  }

  const indexBuilding =
    typeof monthlyMeters?.error === "string" &&
    monthlyMeters.error.toLowerCase().includes("index") &&
    monthlyMeters.error.toLowerCase().includes("building");

  if (indexBuilding) {
    return <Text>Building Firestore index… refresh in a minute.</Text>;
  }

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        {/* HEADER ONLY */}
        <View
          style={{
            paddingHorizontal: 16,
            // paddingTop: 12,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#E5E7EB",
          }}
        >
          {/* Title */}

          {/* Mode ATOMIC / MONTHLY / NEW TRNS */}
          <View style={{ flexDirection: "row", gap: 5 }}>
            <ModeButton
              label="Atomic"
              active={mode === "ATOMIC"}
              onPress={() => setMode("ATOMIC")}
            />
            <MonthModeButton
              active={mode === "MONTHLY"}
              selectedYms={selectedYms}
              onPress={() => {
                setMode("MONTHLY");
                setMonthModalOpen(true);
              }}
            />
            <TrnsButton label="New Trns" onPress={() => onPressTrns()} />
          </View>

          {/* GROUPS + SEARCH ROW */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 12,
              gap: 8,
            }}
          >
            {mode === "MONTHLY" ? (
              <View style={{ flex: 1 }}>
                <RevenueGroupsRow
                  activeGroup={activeGroup}
                  onChangeGroup={(g) => {
                    setActiveGroup(g);
                    setMeterSearch("");
                  }}
                  groupStats={groupStats}
                  showAmounts={false}
                />
              </View>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            <MeterSearchBox value={meterSearch} onChangeText={setMeterSearch} />
          </View>

          {/* KPI row */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <KpiCard title="Total Sales" value={kpis.totalSalesZar} />
            <KpiCard title="Total Meters" value={String(kpis.totalMeters)} />
          </View>
        </View>

        {/* BODY */}
        <View style={{ flex: 1 }}>
          {mode === "ATOMIC" ? (
            <AtomicListPanel
              items={filteredAtomicItems}
              isLoading={atomic.isLoading}
              isError={atomic.isError}
              error={atomic.error}
              onRetry={() => atomic.refetch?.()}
              onEndReached={null}
              isFetchingMore={false}
              hasMore={false}
            />
          ) : (
            <MonthlyListPanel
              docs={filteredMonthlyItems} // ✅ CHANGE (was monthlyMeters.data)
              selectedYms={selectedYms}
              isLoading={monthlyMeters.isLoading}
              isError={monthlyMeters.isError}
              error={monthlyMeters.error}
              onRetry={() => monthlyMeters.refetch?.()}
              activeGroup={activeGroup}
              meterSearch={meterSearch}
            />
          )}
        </View>
      </SafeAreaView>

      <MonthlyFilterModal
        visible={monthModalOpen}
        onClose={() => setMonthModalOpen(false)}
        availableYms={availableYms}
        value={selectedYms}
        onChange={setSelectedYms}
      />
    </>
  );
}

/* ---------- tiny local components ---------- */

const ACTIVE_BLUE = "#2563EB"; // blue-600
const INACTIVE_BG = "#F3F4F6";
const ACTIVE_BG = "#EFF6FF"; // blue-50
const BORDER_GRAY = "#D1D5DB";

function ModeButton({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active ? ACTIVE_BG : INACTIVE_BG,
        borderWidth: active ? 2 : 1, // ✅ thick when active
        borderColor: active ? ACTIVE_BLUE : BORDER_GRAY, // ✅ blue when active
      }}
    >
      <Text
        style={{
          color: active ? ACTIVE_BLUE : "#111827",
          fontWeight: "900",
          fontSize: 12,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function TrnsButton({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        // flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 10,
        marginHorizontal: 5,
        borderRadius: 12,
        alignItems: "center",
        backgroundColor: active ? "#E5E7EB" : "#F3F4F6",
        borderWidth: 1,
        borderColor: "#D1D5DB",
      }}
    >
      <Text style={{ color: "#111827", fontWeight: "800", fontSize: 12 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function KpiCard({ title, value }) {
  return (
    <View
      style={{
        flex: 1,
        padding: 12,
        borderRadius: 14,
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#E5E7EB",
      }}
    >
      <Text style={{ color: "#6B7280", fontSize: 11 }}>{title}</Text>
      <Text
        style={{
          color: "#111827",
          fontSize: 16,
          fontWeight: "900",
          marginTop: 6,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function MonthModeButton({ active, selectedYms, onPress }) {
  const label = selectedYms?.length
    ? `${selectedYms.map(ymToLabel).join(", ")}`
    : "Select month(s)";

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active ? ACTIVE_BG : INACTIVE_BG,
        borderWidth: active ? 2 : 1, // ✅ thick when active
        borderColor: active ? ACTIVE_BLUE : BORDER_GRAY, // ✅ blue when active
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          color: active ? ACTIVE_BLUE : "#111827",
          fontWeight: "900",
          fontSize: 12,
        }}
      >
        {label}
      </Text>

      {/* Optional tiny helper line (only when active) */}
      {active ? (
        <Text
          style={{
            marginTop: 2,
            fontSize: 10,
            fontWeight: "800",
            color: "#6B7280",
          }}
        >
          MONTHLY
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}
