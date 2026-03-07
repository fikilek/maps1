import {
  useGetSalesMonthlyLmByLmAndYmsQuery,
  useGetSalesMonthlyLmGroupsByLmAndYmsQuery,
} from "@/src/redux/salesApi";
import { useMemo } from "react";
import { Text, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";

const GROUPS = ["GR0", "GR1", "GR2", "GR3", "GR4", "GR5"];

const GROUP_COLORS = {
  GR0: "#111827",
  GR1: "#2563EB",
  GR2: "#059669",
  GR3: "#D97706",
  GR4: "#DC2626",
  GR5: "#7C3AED",
};

function ymToLabel(ym) {
  const [y, m] = String(ym || "").split("-");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const mi = Math.max(1, Math.min(12, Number(m || 1))) - 1;
  return `${y} ${monthNames[mi]}`;
}

function formatZarFromCents(cents) {
  const rands = Number(cents || 0) / 100 || 0;
  return rands.toLocaleString("en-ZA", { style: "currency", currency: "ZAR" });
}

export default function GroupedByMonthPanel({ lmPcode, months = 6 }) {
  const lm = String(lmPcode || "").trim();

  const { data: lmTotals = [] } = useGetSalesMonthlyLmByLmAndYmsQuery(
    { lmPcode: lm, yms: [] },
    { skip: !lm },
  );

  const yms = useMemo(() => {
    const list = (lmTotals || [])
      .map((d) => String(d.ym || "").trim())
      .filter(Boolean)
      .sort()
      .reverse()
      .slice(0, months);

    return list.reverse(); // oldest -> newest
  }, [lmTotals, months]);

  const { data: groupDocs = [], isFetching } =
    useGetSalesMonthlyLmGroupsByLmAndYmsQuery(
      { lmPcode: lm, yms },
      { skip: !lm || yms.length === 0 },
    );

  // byGroup[group][ym] = { qty, revenueC }
  const byGroup = useMemo(() => {
    const out = {};
    for (const g of GROUPS) {
      out[g] = {};
      for (const ym of yms) out[g][ym] = { qty: 0, revenueC: 0 };
    }

    for (const d of groupDocs || []) {
      const ym = String(d.ym || "").trim();
      const g = String(d.salesGroupId || "").trim();
      if (!out[g] || !out[g][ym]) continue;

      out[g][ym].qty = Number(d.metersCount || 0);
      out[g][ym].revenueC = Number(d.amountTotalC || 0);
    }

    return out;
  }, [groupDocs, yms]);

  return (
    <View style={{ gap: 14 }}>
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 16, fontWeight: "900", color: "#111827" }}>
          Grouped By Month
        </Text>
        <Text style={{ color: "#6B7280" }}>
          {isFetching ? "Loading…" : `${yms.length} months`} • LM: {lm || "—"}
        </Text>
      </View>

      {GROUPS.map((g) => (
        <GroupSection
          key={g}
          groupId={g}
          color={GROUP_COLORS[g]}
          yms={yms}
          mapByYm={byGroup[g] || {}}
        />
      ))}
    </View>
  );
}

function GroupSection({ groupId, color, yms, mapByYm }) {
  const rows = useMemo(
    () =>
      yms.map((ym) => ({
        ym,
        qty: Number(mapByYm?.[ym]?.qty || 0),
        revenueC: Number(mapByYm?.[ym]?.revenueC || 0),
      })),
    [yms, mapByYm],
  );

  const qtyChart = useMemo(
    () =>
      rows.map((x) => ({
        label: x.ym.slice(5),
        value: x.qty,
        frontColor: color,
      })),
    [rows, color],
  );

  const revChart = useMemo(
    () =>
      rows.map((x) => ({
        label: x.ym.slice(5),
        value: x.revenueC / 100,
        frontColor: color,
      })),
    [rows, color],
  );

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 2,
            backgroundColor: color,
          }}
        />
        <Text style={{ fontSize: 14, fontWeight: "900", color: "#111827" }}>
          {groupId} — Grouped By Month
        </Text>
      </View>

      {/* Table */}
      <View
        style={{
          borderWidth: 1,
          borderColor: "#E5E7EB",
          borderRadius: 14,
          overflow: "hidden",
          backgroundColor: "#fff",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            paddingVertical: 10,
            paddingHorizontal: 12,
            backgroundColor: "#F9FAFB",
            borderBottomWidth: 1,
            borderBottomColor: "#E5E7EB",
          }}
        >
          <Text style={{ flex: 1, color: "#6B7280", fontWeight: "900" }}>
            Month
          </Text>
          <Text
            style={{
              width: 110,
              textAlign: "right",
              color: "#6B7280",
              fontWeight: "900",
            }}
          >
            Quantities
          </Text>
          <Text
            style={{
              width: 160,
              textAlign: "right",
              color: "#6B7280",
              fontWeight: "900",
            }}
          >
            Revenue
          </Text>
        </View>

        {rows.map((x) => (
          <View
            key={`${groupId}_${x.ym}`}
            style={{
              flexDirection: "row",
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#F3F4F6",
            }}
          >
            <Text style={{ flex: 1, fontWeight: "800", color: "#111827" }}>
              {ymToLabel(x.ym)}
            </Text>
            <Text
              style={{
                width: 110,
                textAlign: "right",
                fontWeight: "800",
                color: "#111827",
              }}
            >
              {x.qty.toLocaleString("en-ZA")}
            </Text>
            <Text
              style={{
                width: 160,
                textAlign: "right",
                fontWeight: "900",
                color: "#111827",
              }}
            >
              {formatZarFromCents(x.revenueC)}
            </Text>
          </View>
        ))}
      </View>

      {/* Chart: Quantities */}
      <View
        style={{
          padding: 12,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "#E5E7EB",
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ fontWeight: "900", color: "#111827", marginBottom: 8 }}>
          Quantities (Monthly)
        </Text>
        <BarChart
          data={qtyChart}
          height={180}
          barWidth={18}
          spacing={14}
          roundedTop
          hideRules
          yAxisThickness={1}
          xAxisThickness={1}
          yAxisTextStyle={{ color: "#6B7280", fontSize: 10 }}
          xAxisLabelTextStyle={{
            color: "#6B7280",
            fontWeight: "800",
            fontSize: 10,
          }}
          noOfSections={4}
        />
      </View>

      {/* Chart: Revenue */}
      <View
        style={{
          padding: 12,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "#E5E7EB",
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ fontWeight: "900", color: "#111827", marginBottom: 8 }}>
          Revenue (Monthly)
        </Text>
        <BarChart
          data={revChart}
          height={180}
          barWidth={18}
          spacing={14}
          roundedTop
          hideRules
          yAxisThickness={1}
          xAxisThickness={1}
          yAxisTextStyle={{ color: "#6B7280", fontSize: 10 }}
          xAxisLabelTextStyle={{
            color: "#6B7280",
            fontWeight: "800",
            fontSize: 10,
          }}
          noOfSections={4}
        />
      </View>
    </View>
  );
}
