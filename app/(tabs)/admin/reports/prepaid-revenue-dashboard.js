import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";

import { useGetSalesMonthlyByLmAndYmQuery } from "@/src/redux/salesApi";

import GroupedByMonthPanel from "../../../../src/features/reports/prepaidRevenue/dashboard/GroupedByMonthPanel";
import MonthlySalesPerGroupPanel from "../../../../src/features/reports/prepaidRevenue/dashboard/MonthlySalesPerGroupPanel";
import TotalsRevenuesScreen from "../../../../src/features/reports/prepaidRevenue/dashboard/TotalsRevenuesScreen";

const LOW_SALES = new Set(["GR0", "GR1", "GR3"]);

function safeParseGroups(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x;
  try {
    const v = JSON.parse(String(x));
    return Array.isArray(v) ? v : [];
  } catch {
    if (String(x).includes(","))
      return String(x)
        .split(",")
        .map((s) => s.trim());
    return [String(x)];
  }
}

function formatZarFromCents(cents) {
  const rands = Number(cents || 0) / 100 || 0;
  return rands.toLocaleString("en-ZA", { style: "currency", currency: "ZAR" });
}

function MeterRow({ item, rightLabel }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "900", color: "#111827" }}>
          {String(item.meterNo)}
        </Text>
        <Text style={{ color: "#6B7280" }}>
          {String(item.salesGroupId)} • purchases:{" "}
          {Number(item.purchasesCount || 0)}
        </Text>
      </View>

      <Text style={{ fontWeight: "900", color: "#111827" }}>{rightLabel}</Text>
    </View>
  );
}

export default function PrepaidRevenueDashboardScreen() {
  const router = useRouter();
  const { lmPcode, ymNormalized, groups, meterNoFilter } =
    useLocalSearchParams();

  const lm = String(lmPcode || "").trim();
  const ym = String(ymNormalized || "").trim();
  const selectedGroups = useMemo(() => safeParseGroups(groups), [groups]);
  const meterPrefix = String(meterNoFilter || "").trim();

  // ✅ This reads from RTKQ store cache.
  // ✅ Your endpoint returns KV rows if present and does ZERO Firestore reads in that case.
  const {
    data: rows = [],
    isFetching,
    isError,
    error,
  } = useGetSalesMonthlyByLmAndYmQuery(
    { lmPcode: lm, ym },
    { skip: !lm || !ym },
  );

  const filtered = useMemo(() => {
    let out = rows;

    if (selectedGroups?.length) {
      const set = new Set(selectedGroups);
      out = out.filter((r) => set.has(r.salesGroupId));
    }

    if (meterPrefix) {
      out = out.filter((r) => String(r.meterNo || "").startsWith(meterPrefix));
    }

    return out;
  }, [rows, selectedGroups, meterPrefix]);

  const stats = useMemo(() => {
    const totalMeters = rows.length;

    let totalRevenueC = 0;
    const counts = { GR0: 0, GR1: 0, GR2: 0, GR3: 0, GR4: 0, GR5: 0 };
    const revenue = { GR0: 0, GR1: 0, GR2: 0, GR3: 0, GR4: 0, GR5: 0 };

    for (const r of filtered) {
      const g = String(r.salesGroupId || "GR0");
      const amt = Number(r.amountTotalC || 0);
      totalRevenueC += amt;
      counts[g] = (counts[g] || 0) + 1;
      revenue[g] = (revenue[g] || 0) + amt;
    }

    const activeGroups = Array.isArray(selectedGroups) ? selectedGroups : [];
    const isAll = activeGroups.length === 0;

    const selectedGroupsCount = isAll
      ? rows.length
      : activeGroups.reduce(
          (sum, g) => sum + Number(counts[String(g).trim()] || 0),
          0,
        );

    const selectedGroupsPct = rows.length
      ? selectedGroupsCount / rows.length
      : 0;

    // WOD candidates: low-sales meters (respect meterPrefix; ignore selectedGroups so planning always sees low-sales)
    const wodCandidates = rows
      .filter((r) => LOW_SALES.has(String(r.salesGroupId)))
      .filter((r) =>
        meterPrefix ? String(r.meterNo || "").startsWith(meterPrefix) : true,
      );

    const groupRows = ["GR0", "GR1", "GR2", "GR3", "GR4", "GR5"].map((id) => ({
      id,
      qty: counts[id] || 0,
      revenueC: revenue[id] || 0,
      share: totalRevenueC ? (revenue[id] || 0) / totalRevenueC : 0,
    }));

    return {
      totalMeters,
      totalRevenueC,
      avgPerMeterC: totalMeters ? Math.round(totalRevenueC / totalMeters) : 0,
      selectedGroupsCount,
      selectedGroupsPct,
      groupRows,
      wodCandidatesCount: wodCandidates.length,
    };
  }, [filtered, rows, meterPrefix]);

  const lists = useMemo(() => {
    const base = filtered || [];

    const topBuyers = [...base]
      .sort((a, b) => Number(b.amountTotalC || 0) - Number(a.amountTotalC || 0))
      .slice(0, 10);

    const bottomBuyers = base
      .filter((r) => Number(r.amountTotalC || 0) > 0)
      .sort((a, b) => Number(a.amountTotalC || 0) - Number(b.amountTotalC || 0))
      .slice(0, 10);

    const priorityRank = (g) =>
      g === "GR0" ? 0 : g === "GR1" ? 1 : g === "GR3" ? 2 : 9;

    const lowSalesPriority = rows
      .filter((r) => ["GR0", "GR1", "GR3"].includes(String(r.salesGroupId)))
      .filter((r) =>
        meterPrefix ? String(r.meterNo || "").startsWith(meterPrefix) : true,
      )
      .sort((a, b) => {
        const ga = String(a.salesGroupId || "GR0");
        const gb = String(b.salesGroupId || "GR0");
        const pr = priorityRank(ga) - priorityRank(gb);
        if (pr !== 0) return pr;

        const pa =
          Number(a.purchasesCount || 0) - Number(b.purchasesCount || 0);
        if (pa !== 0) return pa;

        return Number(a.amountTotalC || 0) - Number(b.amountTotalC || 0);
      })
      .slice(0, 25); // show 25 as a working set

    return { topBuyers, bottomBuyers, lowSalesPriority };
  }, [filtered, rows, meterPrefix]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: "900", color: "#111827" }}>
          Dashboard
        </Text>
        <Text style={{ color: "#6B7280" }}>
          {lm} • {ym} • store-driven
        </Text>

        {isFetching && (
          <Text style={{ color: "#9CA3AF" }}>Loading (cache-first)…</Text>
        )}

        {isError && (
          <Text style={{ color: "#B91C1C" }}>
            Error: {error?.message || "Failed to load monthly rows"}
          </Text>
        )}

        {/* KPI strip */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <Text style={{ color: "#6B7280", fontWeight: "700" }}>
              Total Sales
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "900" }}>
              {formatZarFromCents(stats.totalRevenueC)}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <Text style={{ color: "#6B7280", fontWeight: "700" }}>
              Total Meters
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "900" }}>
              {stats.totalMeters.toLocaleString("en-ZA")}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <Text style={{ color: "#6B7280", fontWeight: "700" }}>
              Avg / Meter
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "900" }}>
              {formatZarFromCents(stats.avgPerMeterC)}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <Text style={{ color: "#6B7280", fontWeight: "700" }}>
              {Array.isArray(selectedGroups) && selectedGroups.length
                ? selectedGroups.join(", ")
                : "ALL (GR0–GR5)"}
            </Text>
            <Text style={{ fontSize: 18, fontWeight: "900" }}>
              {Number(stats.selectedGroupsCount || 0).toLocaleString("en-ZA")}
            </Text>
          </View>
        </View>

        {/* <View
          style={{
            padding: 12,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            backgroundColor: "#fff",
          }}
        >
          <Text
            style={{ fontWeight: "900", color: "#111827", marginBottom: 6 }}
          >
            Top 10 Buyers
          </Text>

          {lists.topBuyers.map((x) => (
            <MeterRow
              key={x.id || `${x.meterNo}_${x.ym}`}
              item={x}
              rightLabel={formatZarFromCents(x.amountTotalC)}
            />
          ))}
        </View> */}

        {/* <View
          style={{
            padding: 12,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            backgroundColor: "#fff",
          }}
        >
          <Text
            style={{ fontWeight: "900", color: "#111827", marginBottom: 6 }}
          >
            Bottom 10 Buyers (but &gt; 0)
          </Text>

          {lists.bottomBuyers.map((x) => (
            <MeterRow
              key={x.id || `${x.meterNo}_${x.ym}`}
              item={x}
              rightLabel={formatZarFromCents(x.amountTotalC)}
            />
          ))}
        </View>

        <View
          style={{
            padding: 12,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            backgroundColor: "#F9FAFB",
          }}
        >
          <Text
            style={{ fontWeight: "900", color: "#111827", marginBottom: 6 }}
          >
            Low Sales Priority (WOD feeder)
          </Text>

          <Text style={{ color: "#6B7280", marginBottom: 8 }}>
            Order: GR0 → GR1 → GR3 • then lowest purchases, lowest amount
          </Text>

          {lists.lowSalesPriority.map((x) => (
            <MeterRow
              key={x.id || `${x.meterNo}_${x.ym}`}
              item={x}
              rightLabel={formatZarFromCents(x.amountTotalC)}
            />
          ))}
        </View> */}

        {/* <View style={{ marginTop: 12 }}>
          <CreateWodBatchBtn
            onPress={() => {
              router.push({
                pathname:
                  "/(tabs)/admin/reports/prepaid-revenue-wod-batch-confirm",
                params: {
                  lmPcode: String(lmPcode || ""),
                  ymNormalized: String(ymNormalized || ""),
                  groups: JSON.stringify(["GR0", "GR1", "GR3"]), // fixed for low-sales WODs
                  meterNoFilter: String(meterNoFilter || ""),
                  // demo default batch size (change later in confirm screen)
                  batchSize: "200",
                },
              });
            }}
          />
        </View> */}

        {/* Next: graphs using gifted-charts with stats.groupRows */}

        <TotalsRevenuesScreen lmPcode={lmPcode} />

        <MonthlySalesPerGroupPanel rows={rows} />

        <GroupedByMonthPanel lmPcode={lmPcode} />
      </View>
    </ScrollView>
  );
}
