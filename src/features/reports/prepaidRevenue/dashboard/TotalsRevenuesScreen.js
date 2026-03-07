import { useGetSalesMonthlyLmByLmAndYmsQuery } from "@/src/redux/salesApi";
import { useMemo } from "react";
import { Text, View } from "react-native";
import { BarChart, PieChart } from "react-native-gifted-charts";

function formatZarFromCents(cents) {
  const rands = Number(cents || 0) / 100 || 0;
  return rands.toLocaleString("en-ZA", { style: "currency", currency: "ZAR" });
}

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
  return `${monthNames[mi]} ${y}`;
}

export default function TotalsRevenuesScreen({ lmPcode }) {
  const lm = String(lmPcode || "").trim();

  // ✅ store-driven via RTKQ hook (endpoint may use KV internally, UI does not)
  const { data = [], isFetching } = useGetSalesMonthlyLmByLmAndYmsQuery(
    { lmPcode: lm, yms: [] },
    { skip: !lm },
  );

  const items = useMemo(() => {
    const rows = (data || [])
      .map((d) => ({
        ym: String(d.ym || "").trim(),
        amountTotalC: Number(d.amountTotalC || 0),
        metersCount: Number(d.metersCount || 0),
        purchasesCount: Number(d.purchasesCount || 0),
      }))
      .filter((x) => x.ym);

    // newest -> oldest
    rows.sort((a, b) => (a.ym < b.ym ? 1 : -1));
    return rows;
  }, [data]);

  // Bar chart: older -> newer
  const barData = useMemo(() => {
    const asc = [...items].reverse();
    return asc.map((x) => ({
      value: x.amountTotalC / 100, // rands for chart
      label: x.ym.slice(5), // "09" compact
      frontColor: "#111827",
    }));
  }, [items]);

  // Pie chart: last 6 months share
  const pieData = useMemo(() => {
    const last6 = items.slice(0, 6);
    const colors = [
      "#111827",
      "#374151",
      "#6B7280",
      "#9CA3AF",
      "#D1D5DB",
      "#E5E7EB",
    ];
    return last6.map((x, idx) => ({
      value: x.amountTotalC,
      color: colors[idx % colors.length],
      text: ymToLabel(x.ym),
    }));
  }, [items]);

  return (
    <View style={{ gap: 12 }}>
      {/* Header */}
      <View style={{ gap: 4 }}>
        <Text style={{ fontSize: 16, fontWeight: "900", color: "#111827" }}>
          Total Revenues By Month
        </Text>

        <Text style={{ color: "#6B7280" }}>
          {isFetching ? "Loading…" : `${items.length} months`}
        </Text>
      </View>

      {/* TABLE */}
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
              width: 160,
              textAlign: "right",
              color: "#6B7280",
              fontWeight: "900",
            }}
          >
            Total Revenue
          </Text>
        </View>

        {items.slice(0, 12).map((x) => (
          <View
            key={x.ym}
            style={{
              flexDirection: "row",
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#F3F4F6",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "800", color: "#111827" }}>
                {ymToLabel(x.ym)}
              </Text>
              <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
                meters: {x.metersCount.toLocaleString("en-ZA")} • purchases:{" "}
                {x.purchasesCount.toLocaleString("en-ZA")}
              </Text>
            </View>

            <Text
              style={{
                width: 160,
                textAlign: "right",
                fontWeight: "900",
                color: "#111827",
              }}
            >
              {formatZarFromCents(x.amountTotalC)}
            </Text>
          </View>
        ))}
      </View>

      {/* BAR CHART */}
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
          Revenue Trend (Monthly)
        </Text>

        <BarChart
          data={barData}
          height={190}
          barWidth={22}
          spacing={12}
          roundedTop
          hideRules
          xAxisThickness={1}
          yAxisThickness={0}
          noOfSections={4}
          yAxisTextStyle={{ color: "#9CA3AF" }}
          xAxisLabelTextStyle={{
            color: "#6B7280",
            fontWeight: "800",
            fontSize: 10,
          }}
        />
      </View>

      {/* PIE CHART */}
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
          Share of Last 6 Months
        </Text>

        <View style={{ alignItems: "center" }}>
          <PieChart
            data={pieData}
            donut
            radius={70}
            innerRadius={46}
            strokeWidth={1}
            strokeColor="#fff"
          />
          <Text style={{ marginTop: 10, color: "#6B7280" }}>
            Revenue distribution (last 6 months)
          </Text>
        </View>
      </View>
    </View>
  );
}
