// src/features/reports/prepaidRevenue/RevenueGroupsRow.js
import { Pressable, ScrollView, Text, View } from "react-native";

const SALES_GROUPS = [
  { key: "ALL", label: "All", range: "" },
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
  active,
  onPress,
  isLast,
  amountTotalC,
  showAmount = false,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 10,
        backgroundColor: active ? "#111827" : "#F3F4F6",
        borderWidth: 1,
        borderColor: active ? "#111827" : "#E5E7EB",
        marginRight: isLast ? 0 : 8,
        minWidth: 48,
      }}
    >
      {/* Top row: label only */}
      <Text
        style={{
          fontSize: 12,
          fontWeight: "900",
          color: active ? "#FFFFFF" : "#111827",
          lineHeight: 14,
        }}
      >
        {label}
      </Text>

      {/* Bottom row: range + optional amount */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {!!range && (
          <Text
            style={{
              fontSize: 9,
              fontWeight: "600",
              color: active ? "#E5E7EB" : "#6B7280",
              lineHeight: 11,
            }}
            numberOfLines={1}
          >
            {range}
          </Text>
        )}

        {showAmount && typeof amountTotalC === "number" && (
          <Text
            style={{
              fontSize: 9,
              fontWeight: "800",
              color: active ? "#E5E7EB" : "#6B7280",
              lineHeight: 11,
            }}
            numberOfLines={1}
          >
            R {formatZarCompactFromCents(amountTotalC)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// function GroupPill({
//   label,
//   range,
//   active,
//   onPress,
//   isLast,
//   count,
//   amountTotalC,
//   showAmount = false,
// }) {
//   return (
//     <Pressable
//       onPress={onPress}
//       style={{
//         paddingVertical: 8,
//         paddingHorizontal: 8,
//         borderRadius: 10,
//         backgroundColor: active ? "#111827" : "#F3F4F6",
//         borderWidth: 1,
//         borderColor: active ? "#111827" : "#E5E7EB",
//         marginRight: isLast ? 0 : 8,
//         minWidth: 48,
//       }}
//     >
//       {/* Top row: label + count badge */}
//       <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
//         <Text
//           style={{
//             fontSize: 12,
//             fontWeight: "900",
//             color: active ? "#FFFFFF" : "#111827",
//             lineHeight: 14,
//           }}
//         >
//           {label}
//         </Text>

//         {typeof count === "number" && (
//           <View
//             style={{
//               paddingHorizontal: 6,
//               paddingVertical: 2,
//               borderRadius: 999,
//               backgroundColor: active ? "#FFFFFF" : "#E5E7EB",
//             }}
//           >
//             <Text
//               style={{
//                 fontSize: 10,
//                 fontWeight: "900",
//                 color: "#111827",
//                 lineHeight: 12,
//               }}
//             >
//               {formatCompact(count)}
//             </Text>
//           </View>
//         )}
//       </View>

//       {/* Bottom row: range + optional amount */}
//       <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
//         {!!range && (
//           <Text
//             style={{
//               fontSize: 9,
//               fontWeight: "600",
//               color: active ? "#E5E7EB" : "#6B7280",
//               lineHeight: 11,
//             }}
//             numberOfLines={1}
//           >
//             {range}
//           </Text>
//         )}

//         {showAmount && typeof amountTotalC === "number" && (
//           <Text
//             style={{
//               fontSize: 9,
//               fontWeight: "800",
//               color: active ? "#E5E7EB" : "#6B7280",
//               lineHeight: 11,
//             }}
//             numberOfLines={1}
//           >
//             R {formatZarCompactFromCents(amountTotalC)}
//           </Text>
//         )}
//       </View>
//     </Pressable>
//   );
// }

/**
 * Props:
 * - activeGroup: "ALL" | "GR1"..."GR5"
 * - onChangeGroup: (groupKey) => void
 * - groupStats (optional):
 *   { GR1:{metersCount,amountTotalC}, ... ALL:{...} }
 * - showAmounts (optional boolean)
 */
export default function RevenueGroupsRow({
  activeGroup,
  onChangeGroup,
  groupStats,
  showAmounts,
}) {
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
        {SALES_GROUPS.map((g, idx) => {
          const stat = groupStats?.[g.key];
          return (
            <GroupPill
              key={g.key}
              label={g.label}
              range={g.range}
              active={activeGroup === g.key}
              onPress={() => onChangeGroup?.(g.key)}
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
    </View>
  );
}
