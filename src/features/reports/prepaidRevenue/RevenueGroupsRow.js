// src/features/reports/prepaidRevenue/RevenueGroupsRow.js
import { Pressable, ScrollView, Text, View } from "react-native";

const SALES_GROUPS = [
  { key: "GR0", label: "G0", range: "No sales" },
  { key: "GR1", label: "G1", range: "<99" },
  { key: "GR2", label: "G2", range: "100–299" },
  { key: "GR3", label: "G3", range: "300–499" },
  { key: "GR4", label: "G4", range: "500–999" },
  { key: "GR5", label: "G5", range: "≥1000" },
];

function formatCompact(n) {
  const x = Number(n || 0);
  if (x >= 1_000_000) return `${(x / 1_000_000).toFixed(1)}M`;
  if (x >= 1_000) return `${(x / 1_000).toFixed(1)}k`;
  return String(Math.trunc(x));
}

function formatZarCompactFromCents(cents) {
  const r = Number(cents || 0) / 100;
  if (r >= 1_000_000) return `${(r / 1_000_000).toFixed(1)}M`;
  if (r >= 1_000) return `${(r / 1_000).toFixed(1)}k`;
  return `${r.toFixed(0)}`;
}

function GroupPill({
  label,
  range,
  selected,
  onPress,
  isLast,
  count,
  amountTotalC,
  showAmount = false,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "stretch",
        borderRadius: 12,
        overflow: "hidden", // key to make it look like 1 piece
        borderWidth: 1,
        borderColor: selected ? "#111827" : "#E5E7EB",
        backgroundColor: selected ? "#111827" : "#F3F4F6",
        marginRight: isLast ? 0 : 8,
        minWidth: 120,
      }}
    >
      {/* LEFT: checkbox block (square-ish like spreadsheet) */}
      <View
        style={{
          width: 36,
          justifyContent: "center",
          alignItems: "center",
          borderRightWidth: 1,
          borderRightColor: selected ? "#111827" : "#E5E7EB",
          backgroundColor: selected ? "#111827" : "#FFFFFF",
        }}
      >
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 4,
            borderWidth: 2,
            borderColor: selected ? "#FFFFFF" : "#111827",
            backgroundColor: selected ? "#FFFFFF" : "transparent",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {selected ? (
            <Text style={{ fontSize: 12, fontWeight: "900", color: "#111827" }}>
              ✓
            </Text>
          ) : null}
        </View>
      </View>

      {/* RIGHT: label/count (top) + range/amount (bottom) */}
      <View style={{ paddingVertical: 8, paddingHorizontal: 10, flex: 1 }}>
        {/* Top row */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "900",
              color: selected ? "#FFFFFF" : "#111827",
              lineHeight: 14,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {label}
          </Text>

          {typeof count === "number" && (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
                backgroundColor: selected ? "#FFFFFF" : "#E5E7EB",
                marginLeft: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "900",
                  color: "#111827",
                  lineHeight: 12,
                }}
              >
                {formatCompact(count)}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom row */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {!!range && (
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: selected ? "#E5E7EB" : "#6B7280",
                lineHeight: 12,
              }}
              numberOfLines={1}
            >
              {range}
            </Text>
          )}

          {showAmount && typeof amountTotalC === "number" && (
            <Text
              style={{
                fontSize: 10,
                fontWeight: "800",
                color: selected ? "#E5E7EB" : "#6B7280",
                lineHeight: 12,
              }}
              numberOfLines={1}
            >
              R {formatZarCompactFromCents(amountTotalC)}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function ClearPill({ onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 10,
        backgroundColor: "#FEF2F2",
        borderWidth: 1,
        borderColor: "#FCA5A5",
        marginRight: 8,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "900", color: "#991B1B" }}>
        Clear
      </Text>
      <Text style={{ fontSize: 9, fontWeight: "700", color: "#B91C1C" }}>
        All groups
      </Text>
    </Pressable>
  );
}

/**
 * MONTHLY Groups Row (multi-select)
 *
 * Props:
 * - selectedGroups: string[]    // e.g. ["GR0","GR1"] ; [] means ALL
 * - onChangeSelectedGroups: (next: string[]) => void
 * - groupStats (optional):
 *   { GR0:{metersCount,amountTotalC}, ... GR5:{...} }
 * - showAmounts (optional boolean)
 */
export default function RevenueGroupsRow({
  selectedGroups = [],
  onChangeSelectedGroups,
  groupStats,
  showAmounts,
}) {
  const selectedSet = new Set(selectedGroups || []);
  const hasSelection = selectedSet.size > 0;

  const toggle = (key) => {
    const next = new Set(selectedSet);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChangeSelectedGroups?.(Array.from(next));
  };

  const clear = () => onChangeSelectedGroups?.([]);

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: "row",
          alignItems: "center",
          paddingRight: 6,
        }}
        style={{ flex: 1 }}
      >
        {hasSelection && <ClearPill onPress={clear} />}

        {SALES_GROUPS.map((g, idx) => {
          const stat = groupStats?.[g.key];
          return (
            <GroupPill
              key={g.key}
              label={g.label}
              range={g.range}
              selected={selectedSet.has(g.key)}
              onPress={() => toggle(g.key)}
              isLast={idx === SALES_GROUPS.length - 1}
              count={
                typeof stat?.metersCount === "number"
                  ? stat.metersCount
                  : undefined
              }
              amountTotalC={
                typeof stat?.amountTotalC === "number"
                  ? stat.amountTotalC
                  : undefined
              }
              showAmount={Boolean(showAmounts)}
            />
          );
        })}
      </ScrollView>

      {/* Optional: tiny status text (if you want it) */}
      {/* <Text style={{ fontSize: 11, color: "#6B7280", marginLeft: 8 }}>
        {hasSelection ? `${selectedGroups.join(", ")}` : "ALL"}
      </Text> */}
    </View>
  );
}
