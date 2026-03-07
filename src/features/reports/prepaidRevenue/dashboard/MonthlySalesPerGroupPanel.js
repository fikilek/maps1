import { useMemo } from "react";
import { Text, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";

const GROUP_ORDER = ["GR0", "GR1", "GR2", "GR3", "GR4", "GR5"];

function formatZarFromCents(cents) {
  const rands = Number(cents || 0) / 100 || 0;
  return rands.toLocaleString("en-ZA", {
    style: "currency",
    currency: "ZAR",
  });
}

function formatInt(n) {
  return Number(n || 0).toLocaleString("en-ZA");
}

export default function MonthlySalesPerGroupPanel({ rows = [] }) {
  const { groupRows, totalRevenueC } = useMemo(() => {
    const acc = {};
    for (const g of GROUP_ORDER) acc[g] = { qty: 0, revenueC: 0 };

    let totalC = 0;

    for (const r of rows) {
      const g = String(r.salesGroupId || "GR0").trim();
      const amt = Number(r.amountTotalC || 0);

      if (!acc[g]) acc[g] = { qty: 0, revenueC: 0 };

      acc[g].qty += 1;
      acc[g].revenueC += amt;

      totalC += amt;
    }

    const grs = GROUP_ORDER.map((g) => ({
      group: g,
      qty: acc[g]?.qty || 0,
      revenueC: acc[g]?.revenueC || 0,
    }));

    return {
      groupRows: grs,
      totalRevenueC: totalC,
    };
  }, [rows]);

  return (
    <View style={{ gap: 14 }}>
      <Text style={{ fontSize: 16, fontWeight: "900", color: "#111827" }}>
        Monthly Sales Per Group
      </Text>

      {/* GROUP RULES */}
      <View
        style={{
          borderWidth: 1,
          borderColor: "#E5E7EB",
          borderRadius: 14,
          backgroundColor: "#F9FAFB",
          padding: 12,
        }}
      >
        <Text style={{ fontWeight: "900", color: "#111827", marginBottom: 8 }}>
          Group Rules (Monthly)
        </Text>

        <View style={{ gap: 6 }}>
          {[
            { g: "GR0", b: "0", d: "No purchases / zero revenue" },
            { g: "GR1", b: "< 100", d: "Low sales" },
            { g: "GR2", b: "100 – 299", d: "Normal" },
            { g: "GR3", b: "300 – 499", d: "Medium" },
            { g: "GR4", b: "500 – 999", d: "High" },
            { g: "GR5", b: "≥ 1000", d: "Top buyers" },
          ].map((x) => (
            <View
              key={x.g}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <Text style={{ width: 55, fontWeight: "900", color: "#111827" }}>
                {x.g}
              </Text>
              <Text style={{ width: 90, color: "#374151" }}>{x.b}</Text>
              <Text style={{ flex: 1, color: "#6B7280" }}>{x.d}</Text>
            </View>
          ))}
        </View>

        <Text style={{ marginTop: 10, color: "#6B7280", fontSize: 12 }}>
          Note: For demo we classify using 1 month totals. Production will move
          to 3-month totals per meter.
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
          <Text style={{ width: 70, color: "#6B7280", fontWeight: "900" }}>
            Group
          </Text>
          <Text
            style={{
              flex: 1,
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

        {groupRows.map((x) => (
          <View
            key={x.group}
            style={{
              flexDirection: "row",
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#F3F4F6",
            }}
          >
            <Text style={{ width: 70, fontWeight: "900", color: "#111827" }}>
              {x.group}
            </Text>

            <Text
              style={{
                flex: 1,
                textAlign: "right",
                fontWeight: "800",
                color: "#111827",
              }}
            >
              {formatInt(x.qty)}
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

        <View
          style={{
            flexDirection: "row",
            paddingVertical: 10,
            paddingHorizontal: 12,
            backgroundColor: "#F9FAFB",
          }}
        >
          <Text style={{ width: 70, fontWeight: "900", color: "#111827" }}>
            Total
          </Text>
          <Text style={{ flex: 1 }} />
          <Text
            style={{
              width: 160,
              textAlign: "right",
              fontWeight: "900",
              color: "#111827",
            }}
          >
            {formatZarFromCents(totalRevenueC)}
          </Text>
        </View>
      </View>

      <GroupCharts groupRows={groupRows} />
    </View>
  );
}

const GROUP_COLORS = {
  GR0: "#111827",
  GR1: "#2563EB",
  GR2: "#059669",
  GR3: "#D97706",
  GR4: "#DC2626",
  GR5: "#7C3AED",
};

function GroupCharts({ groupRows = [] }) {
  const { qtyData, revData } = useMemo(() => {
    const qty = groupRows.map((x) => ({
      label: x.group,
      value: Number(x.qty || 0),
      frontColor: GROUP_COLORS[x.group] || "#111827",
    }));

    const rev = groupRows.map((x) => ({
      label: x.group,
      value: Number(x.revenueC || 0) / 100,
      frontColor: GROUP_COLORS[x.group] || "#111827",
    }));

    return { qtyData: qty, revData: rev };
  }, [groupRows]);

  const BAR_W = 22;
  const SPACING = 22;

  return (
    <View style={{ gap: 12 }}>
      {/* GRAPH 1: Quantities */}
      <View
        style={{
          padding: 12,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "#E5E7EB",
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ fontWeight: "900", marginBottom: 8 }}>
          Quantities by Group
        </Text>

        <BarChart
          data={qtyData}
          height={190}
          barWidth={BAR_W}
          spacing={SPACING}
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

      {/* GRAPH 2: Revenue */}
      <View
        style={{
          padding: 12,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "#E5E7EB",
          backgroundColor: "#fff",
        }}
      >
        <Text style={{ fontWeight: "900", marginBottom: 8 }}>
          Revenue by Group (ZAR)
        </Text>

        <BarChart
          data={revData}
          height={190}
          barWidth={BAR_W}
          spacing={SPACING}
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
