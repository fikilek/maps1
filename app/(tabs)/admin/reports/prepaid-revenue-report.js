// app/(tabs)/reports/prepaidRevenue/index.js
// ✅ ATOMIC DROPPED
// ✅ MONTHLY = single month
// ✅ 3MONTHLY placeholder only (no logic yet)

import NetInfo from "@react-native-community/netinfo";
import { skipToken } from "@reduxjs/toolkit/query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useDispatch } from "react-redux";

import AtomicPurchasesModal from "../../../../components/AtomicPurchasesModal";
import DashboardBtn from "../../../../src/features/reports/prepaidRevenue/dashboard/DashboardBtn";
import MeterSearchBox from "../../../../src/features/reports/prepaidRevenue/MeterSearchBox";
import MonthlyListPanel from "../../../../src/features/reports/prepaidRevenue/MonthlyListPanel";
import MonthlyFilterModal from "../../../../src/features/reports/prepaidRevenue/months/MonthlyFilterModal";
import MonthlyStatusPill from "../../../../src/features/reports/prepaidRevenue/months/MonthlyStatusPill";
import {
  getDefaultLastNMonths,
  ymToLabel,
} from "../../../../src/features/reports/prepaidRevenue/months/monthUtils";
import RevenueGroupsRow from "../../../../src/features/reports/prepaidRevenue/RevenueGroupsRow";
import { useAuth } from "../../../../src/hooks/useAuth";
import { useDebouncedValue } from "../../../../src/hooks/useDebouncedValue";
import { setNewTrns } from "../../../../src/redux/newTrnsSlice";
import {
  useGetSalesMonthlyByLmAndYmQuery,
  useGetSalesMonthlyLmByLmAndYmsQuery,
  useGetSalesMonthlyLmGroupsByLmAndYmQuery,
} from "../../../../src/redux/salesApi";
import { getMonthlyFromKV } from "../../../../src/storage/salesMonthlyKV";

function normalizeMeter(s) {
  return String(s || "")
    .replace(/\s+/g, "")
    .trim();
}

function formatZarFromCents(cents) {
  const rands = Number(cents || 0) / 100;
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rands);
}

function formatInt(n) {
  return new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 0 }).format(
    Number(n || 0),
  );
}

function normalizeYm(ym) {
  const s = String(ym || "").trim();
  const m = s.match(/^(\d{4})-(\d{1,2})$/); // allows 2026-2 or 2026-02
  if (!m) return s;
  const year = m[1];
  const month = m[2].padStart(2, "0");
  return `${year}-${month}`;
}

/* ---------- tiny local components ---------- */

const ACTIVE_BLUE = "#2563EB";
const INACTIVE_BG = "#F3F4F6";
const ACTIVE_BG = "#EFF6FF";
const BORDER_GRAY = "#D1D5DB";

function ModeButton({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1.6,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: active ? ACTIVE_BG : INACTIVE_BG,
        borderWidth: active ? 2 : 1,
        borderColor: active ? ACTIVE_BLUE : BORDER_GRAY,
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

function MonthModeButton({ active, selectedYm, onPress }) {
  const label = selectedYm ? ymToLabel(selectedYm) : "Select month";

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
        borderWidth: active ? 2 : 1,
        borderColor: active ? ACTIVE_BLUE : BORDER_GRAY,
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

export default function PrepaidRevenueReportScreen() {
  const [mode, setMode] = useState("MONTHLY"); // "MONTHLY" | "3MONTHLY"

  const router = useRouter();
  const params = useLocalSearchParams();
  console.log(`params`, params);
  const dispatch = useDispatch();

  // Revenue Groups + Search (MONTHLY only)
  const [selectedGroups, setSelectedGroups] = useState([]); // [] = ALL
  const [meterSearch, setMeterSearch] = useState("");
  const meterSearchDebounced = useDebouncedValue(meterSearch, 250);
  const isDebouncing = meterSearch !== meterSearchDebounced;

  // Month picker
  const [monthModalOpen, setMonthModalOpen] = useState(false);

  // ✅ SINGLE MONTH selection
  const [selectedYm, setSelectedYm] = useState(null); // "YYYY-MM" | null

  // 👇 NEW: allow month to come from Sales Sync
  useEffect(() => {
    if (!params?.ym) return;

    const normalized = normalizeYm(params.ym);
    if (!normalized) return;

    setSelectedYm(normalized);
  }, [params?.ym]);

  // USER
  const { activeWorkbaseId, ready } = useAuth();
  const lmPcode = activeWorkbaseId || null;

  /* =====================================================
     ONLINE
  ===================================================== */

  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setIsOnline(Boolean(state.isConnected && state.isInternetReachable));
    });
    return unsub;
  }, []);

  /* =====================================================
     ON PURCHAES
  ===================================================== */

  const [atomicOpen, setAtomicOpen] = useState(false);
  const [atomicMeterNo, setAtomicMeterNo] = useState(null);

  const onPressPurchases = (meterNo) => {
    setAtomicMeterNo(meterNo);
    setAtomicOpen(true);
  };

  /* =====================================================
     SORTIG
  ===================================================== */

  const [sortKey, setSortKey] = useState("AMOUNT_ASC");

  /* =====================================================
     MONTHLY_LM (available months + KPI source)
  ===================================================== */
  const monthlyLmArgs = ready && lmPcode ? { lmPcode, yms: null } : skipToken;
  const monthlyLm = useGetSalesMonthlyLmByLmAndYmsQuery(monthlyLmArgs);

  const availableYms = useMemo(() => {
    return (monthlyLm.data || []).map((x) => x.ym).filter(Boolean);
  }, [monthlyLm.data]);

  const default1 = useMemo(() => {
    const arr = getDefaultLastNMonths(availableYms, 1);
    return arr?.[0] || null;
  }, [availableYms]);

  const didInitMonthRef = useRef(false);
  useEffect(() => {
    if (didInitMonthRef.current) return;

    const routeYm = normalizeYm(params?.ym);
    if (routeYm) {
      didInitMonthRef.current = true;
      return;
    }

    if (!default1) return;

    setSelectedYm(default1);
    didInitMonthRef.current = true;
  }, [default1, params?.ym]);

  // const didInitMonthRef = useRef(false);
  // useEffect(() => {
  //   if (didInitMonthRef.current) return;
  //   if (!default1) return;

  //   setSelectedYm(default1);
  //   didInitMonthRef.current = true;
  // }, [default1]);

  /* =====================================================
     MONTHLY METERS (single month)
  ===================================================== */
  const activeYm = selectedYm || null;
  const ymNormalized = normalizeYm(activeYm);

  // ✅ CACHE CHECK (SOURCE OF TRUTH)
  const monthCache = useMemo(() => {
    if (!lmPcode || !ymNormalized) return null;
    return getMonthlyFromKV(lmPcode, ymNormalized);
  }, [lmPcode, ymNormalized]);

  const hasMonthCached =
    Array.isArray(monthCache?.rows) && monthCache.rows.length > 0;

  const monthlyMetersArgs =
    ready && lmPcode && ymNormalized && hasMonthCached
      ? { lmPcode, ym: ymNormalized }
      : skipToken;

  // const monthlyMetersArgs =
  //   ready && lmPcode && ymNormalized
  //     ? { lmPcode, ym: ymNormalized }
  //     : skipToken;

  useEffect(() => {
    if (!ready || !lmPcode || !ymNormalized) return;

    if (!hasMonthCached) {
      router.push({
        pathname: "/(tabs)/admin/storage/sales-sync",
        params: {
          lmPcode,
          ym: ymNormalized,
        },
      });
    }
  }, [ready, lmPcode, ymNormalized, hasMonthCached]);

  const monthlyMeters = useGetSalesMonthlyByLmAndYmQuery(monthlyMetersArgs);

  const requestedYm = ymNormalized || null;
  const responseYmSample = monthlyMeters?.data?.[0]?.ym ?? null;

  // ✅ Only show rows if they belong to the selected month
  const docsForPanel =
    requestedYm && responseYmSample === requestedYm
      ? (monthlyMeters.data ?? [])
      : (monthlyMeters.currentData ?? []); // currentData is safest while changing args

  // ✅ If args changed and currentData is empty, treat as loading (prevents "No monthly meters yet" flicker)
  const isMonthSwitchLoading =
    !!requestedYm &&
    monthlyMeters.isFetching &&
    (!docsForPanel || docsForPanel.length === 0);

  const filteredMonthlyItems = useMemo(() => {
    const rows = monthlyMeters.currentData ?? monthlyMeters.data ?? [];
    const q = normalizeMeter(meterSearchDebounced);

    const groups = Array.isArray(selectedGroups) ? selectedGroups : [];
    const hasGroupFilter = groups.length > 0;
    const groupSet = hasGroupFilter
      ? new Set(groups.map((g) => String(g).toUpperCase()))
      : null;

    return rows.filter((r) => {
      if (hasGroupFilter) {
        const gid = String(r.salesGroupId || "GR0").toUpperCase();
        if (!groupSet.has(gid)) return false;
      }
      if (!q) return true;
      return normalizeMeter(r.meterNo).startsWith(q);
    });
  }, [
    monthlyMeters.currentData,
    monthlyMeters.data,
    selectedGroups,
    meterSearchDebounced,
  ]);
  // console.log(`filteredMonthlyItems`, filteredMonthlyItems);

  /* =====================================================
     KPI (single month, from MONTHLY_LM)
  ===================================================== */
  const kpis = useMemo(() => {
    const docs = monthlyLm?.data || [];
    if (!ymNormalized) return { totalSalesZar: "R 0.00", totalMeters: 0 };

    const d = docs.find((x) => x?.ym === ymNormalized);

    const totalCents = Number(d?.amountTotalC || 0);
    const metersCount = Number(d?.metersCount || 0);

    return {
      totalSalesZar: formatZarFromCents(totalCents),
      totalMeters: formatInt(metersCount),
    };
  }, [monthlyLm?.data, ymNormalized]);

  /* =====================================================
     GROUP STATS (per selected month)
  ===================================================== */
  const monthlyGroupsArgs =
    ready && lmPcode && ymNormalized
      ? { lmPcode, ym: ymNormalized }
      : skipToken;

  const monthlyGroups =
    useGetSalesMonthlyLmGroupsByLmAndYmQuery(monthlyGroupsArgs);

  const groupStats = useMemo(() => {
    const out = {
      ALL: { metersCount: 0, amountTotalC: 0 },
      GR0: { metersCount: 0, amountTotalC: 0 },
      GR1: { metersCount: 0, amountTotalC: 0 },
      GR2: { metersCount: 0, amountTotalC: 0 },
      GR3: { metersCount: 0, amountTotalC: 0 },
      GR4: { metersCount: 0, amountTotalC: 0 },
      GR5: { metersCount: 0, amountTotalC: 0 },
    };

    const groupDocs = monthlyGroups?.data || [];
    for (const d of groupDocs) {
      const key = String(d?.salesGroupId || "").toUpperCase();
      if (!out[key]) continue;
      out[key] = {
        metersCount: Number(d?.metersCount || 0),
        amountTotalC: Number(d?.amountTotalC || 0),
      };
    }

    const lmDocs = monthlyLm?.data || [];
    const lmThisMonth = lmDocs.find((d) => d?.ym === ymNormalized);

    out.ALL = {
      metersCount: Number(lmThisMonth?.metersCount || 0),
      amountTotalC: Number(lmThisMonth?.amountTotalC || 0),
    };

    return out;
  }, [monthlyGroups?.data, monthlyLm?.data, ymNormalized]);

  useEffect(() => {
    setSelectedGroups([]); // reset groups when month changes
    setMeterSearch("");
  }, [ymNormalized]);

  /* =====================================================
     NEW TRNS (MONTHLY only)
  ===================================================== */
  const onPressTrns = () => {
    if (mode !== "MONTHLY") setMode("MONTHLY");

    if (!ymNormalized) {
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
          ym: ymNormalized,
          groups: selectedGroups, // [] means ALL
          meterNoFilter: meterSearch,
        },
      }),
    );

    router.push("/(tabs)/admin/reports/create-trns-confirm");
  };

  useEffect(() => {
    // clear search when mode changes
    setMeterSearch("");
    if (mode !== "MONTHLY") setMonthModalOpen(false);
  }, [mode]);

  /* =====================================================
     UI GUARD
  ===================================================== */
  if (!ready || !lmPcode) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: 40,
          backgroundColor: "#fff",
          padding: 16,
        }}
      >
        <View style={{ gap: 10 }}>
          <Text style={{ color: "#515761" }}>User NOT Signed in</Text>
          <View style={{ backgroundColor: "#515761", height: 3 }} />
          <Text style={{ color: "#515761" }}>No Active Workbase</Text>
        </View>

        {/* <ActivityIndicator /> */}
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
        {/* HEADER */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: "#E5E7EB",
          }}
        >
          {/* Mode MONTHLY / 3MONTHLY / NEW TRNS */}
          <View style={{ flexDirection: "row", gap: 5 }}>
            <MonthModeButton
              active={mode === "MONTHLY"}
              selectedYm={ymNormalized}
              onPress={() => {
                setMode("MONTHLY");
                setMonthModalOpen(true);
              }}
            />

            <ModeButton
              label="3 MONTHLY"
              active={mode === "3MONTHLY"}
              onPress={() => setMode("3MONTHLY")}
            />

            <TrnsButton label="New Trns" onPress={() => onPressTrns()} />
          </View>

          {/* GROUPS + SEARCH ROW (MONTHLY only) */}
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
                  selectedGroups={selectedGroups}
                  onChangeSelectedGroups={(next) => {
                    setSelectedGroups(next);
                    setMeterSearch("");
                  }}
                  groupStats={groupStats}
                  showAmounts={false}
                />
              </View>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            {mode === "MONTHLY" ? (
              <MeterSearchBox
                value={meterSearch}
                onChangeText={setMeterSearch}
                isDebouncing={isDebouncing}
              />
            ) : null}
          </View>

          {/* KPI row */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "stretch",
              gap: 10,
            }}
          >
            <KpiCard title="Total Sales" value={kpis.totalSalesZar} />
            <KpiCard title="Total Meters" value={String(kpis.totalMeters)} />
            <DashboardBtn
              onPress={() => {
                router.push({
                  pathname: "/(tabs)/admin/reports/prepaid-revenue-dashboard",
                  params: {
                    lmPcode,
                    ymNormalized,
                    groups: selectedGroups || [],
                    meterNoFilter: meterSearch || "",
                  },
                });
              }}
            />
          </View>
        </View>
        <MonthlyStatusPill
          lmPcode={lmPcode}
          ym={ymNormalized}
          isOnline={isOnline}
          isFetching={monthlyMeters.isFetching}
        />
        {/* BODY */}
        <View style={{ flex: 1 }}>
          {mode === "3MONTHLY" ? (
            <View style={{ padding: 16 }}>
              <Text style={{ fontWeight: "900" }}>3MONTHLY</Text>
              <Text style={{ color: "#6B7280", marginTop: 6 }}>
                Not implemented yet. MONTHLY is now the production path.
              </Text>
            </View>
          ) : !hasMonthCached ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontWeight: "900" }}>
                Redirecting to Sales Sync...
              </Text>
            </View>
          ) : (
            <MonthlyListPanel
              docs={docsForPanel}
              activeYm={requestedYm}
              lmPcode={lmPcode}
              isLoading={isMonthSwitchLoading || monthlyMeters.isLoading}
              isFetching={monthlyMeters.isFetching}
              status={monthlyMeters.status}
              isError={monthlyMeters.isError}
              error={monthlyMeters.error}
              onRetry={monthlyMeters.refetch}
              selectedGroups={selectedGroups}
              meterSearch={meterSearchDebounced}
              sortKey={sortKey}
              onPressPurchases={onPressPurchases}
            />
          )}
        </View>
      </SafeAreaView>

      {/* Month picker: force SINGLE selection */}
      <MonthlyFilterModal
        visible={monthModalOpen}
        onClose={() => setMonthModalOpen(false)}
        availableYms={availableYms}
        value={ymNormalized ? [ymNormalized] : []}
        onChange={(yms) => setSelectedYm(yms?.[0] ?? null)}
        mode="MONTHLY"
      />

      <AtomicPurchasesModal
        visible={atomicOpen}
        onClose={() => setAtomicOpen(false)}
        isOnline={isOnline}
        lmPcode={lmPcode}
        ym={ymNormalized}
        meterNo={atomicMeterNo}
      />
    </>
  );
}
