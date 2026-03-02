// src/features/reports/prepaidRevenue/MonthlyListPanel.js
import { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { ymToLabel } from "./months/monthUtils";

function normalizeMeter(s) {
  return String(s || "")
    .replace(/\s+/g, "")
    .trim();
}

/**
 * IMPORTANT:
 * - We support GR0 now (0 purchase / 0 total).
 * - This grouping is for TOTAL across selected months (max 3).
 *   If you later want "selected-month grouping", use docs' salesGroupId for activeYm.
 */
function getGroupFromTotalCents(totalCents) {
  const rands = Number(totalCents || 0) / 100;

  if (rands <= 0) return "GR0";
  if (rands <= 99.99) return "GR1";
  if (rands <= 299.99) return "GR2";
  if (rands <= 499.99) return "GR3";
  if (rands <= 999.99) return "GR4";
  return "GR5";
}

function formatZarFromCents(cents) {
  const v = (Number(cents || 0) / 100).toFixed(2);
  return `R ${v}`;
}

/**
 * MONTHLY LIST (Meter cards)
 *
 * Input docs are conlog_sales_monthly docs:
 * { lmPcode, meterNo, ym, purchasesCount, amountTotalC, salesGroupId?, ... }
 *
 * We aggregate by meterNo across selectedYms (max 3).
 */
function buildMeterCards(docs, selectedYms) {
  const yms = Array.isArray(selectedYms) ? selectedYms : [];
  const ymSet = new Set(yms);

  const byMeter = new Map();

  for (const d of docs || []) {
    const meterNo = String(d?.meterNo || "").trim();
    const ym = String(d?.ym || "").trim();
    if (!meterNo || !ym) continue;

    // ✅ Guard: if docs ever include months outside selection, ignore them
    if (yms.length && !ymSet.has(ym)) continue;

    if (!byMeter.has(meterNo)) {
      byMeter.set(meterNo, {
        meterNo,
        totalPurchases: 0,
        totalAmountC: 0,
        months: {}, // ym -> { purchasesCount, amountTotalC, salesGroupId? }
      });
    }

    const m = byMeter.get(meterNo);

    const purchases = Number(d?.purchasesCount || 0);
    const amountC = Number(d?.amountTotalC || 0);

    m.totalPurchases += purchases;
    m.totalAmountC += amountC;

    m.months[ym] = {
      ym,
      purchasesCount: purchases,
      amountTotalC: amountC,
      salesGroupId: String(d?.salesGroupId || "").toUpperCase() || null,
    };
  }

  // Convert to cards and align month columns to selectedYms order
  const cards = Array.from(byMeter.values()).map((m) => {
    const cols = yms.map((ym) => {
      const hit = m.months[ym] || null;
      return {
        ym,
        purchasesCount: hit?.purchasesCount || 0,
        amountTotalC: hit?.amountTotalC || 0,
      };
    });

    return {
      meterNo: m.meterNo,
      totalPurchases: m.totalPurchases,
      totalAmountC: m.totalAmountC,
      // ✅ Group based on TOTAL across selected months
      group3mId: getGroupFromTotalCents(m.totalAmountC),
      cols,
    };
  });

  return cards;
}

export default function MonthlyListPanel({
  docs,
  selectedYms,
  isLoading,
  isError,
  error,
  onRetry,
  activeGroup, // e.g. ALL, GR0..GR5
  meterSearch,
  sortKey,
}) {
  // ✅ Normalize month order: newest-first
  const normYms = useMemo(() => {
    const yms = Array.isArray(selectedYms) ? selectedYms : [];
    return Array.from(new Set(yms)).sort().reverse();
  }, [selectedYms]);

  const cards = useMemo(
    () => buildMeterCards(docs || [], normYms),
    [docs, normYms],
  );

  const sortedCards = useMemo(() => {
    const arr = [...cards];
    const key = sortKey || "AMOUNT_DESC";

    if (key === "AMOUNT_DESC")
      arr.sort((a, b) => Number(b.totalAmountC) - Number(a.totalAmountC));
    else if (key === "AMOUNT_ASC")
      arr.sort((a, b) => Number(a.totalAmountC) - Number(b.totalAmountC));
    else if (key === "PURCHASES_DESC")
      arr.sort((a, b) => Number(b.totalPurchases) - Number(a.totalPurchases));
    else if (key === "PURCHASES_ASC")
      arr.sort((a, b) => Number(a.totalPurchases) - Number(b.totalPurchases));
    else if (key === "METER_ASC")
      arr.sort((a, b) => String(a.meterNo).localeCompare(String(b.meterNo)));

    return arr;
  }, [cards, sortKey]);

  const visibleCards = useMemo(() => {
    const q = normalizeMeter(meterSearch);

    return (sortedCards || []).filter((c) => {
      // 1) Group filter based on TOTAL across selected months
      if (activeGroup && activeGroup !== "ALL") {
        if (c.group3mId !== activeGroup) return false;
      }

      // 2) Meter search (prefix)
      if (!q) return true;
      return normalizeMeter(c.meterNo).startsWith(q);
    });
  }, [sortedCards, activeGroup, meterSearch]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, paddingTop: 24, alignItems: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 10, color: "#6B7280" }}>
          Loading monthly…
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ color: "#B91C1C", fontWeight: "900" }}>
          Monthly failed to load
        </Text>
        <Text style={{ marginTop: 6, color: "#6B7280" }}>
          {String(error?.message || error || "Unknown error")}
        </Text>

        <Pressable
          onPress={onRetry}
          style={{
            marginTop: 14,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 12,
            backgroundColor: "#111827",
            alignSelf: "flex-start",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900" }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={visibleCards}
      keyExtractor={(x) => x.meterNo}
      contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
      ListEmptyComponent={
        <View style={{ padding: 16 }}>
          <Text style={{ color: "#6B7280" }}>No monthly meters yet.</Text>
        </View>
      }
      renderItem={({ item }) => <MonthMeterCard item={item} />}
    />
  );
}

function MonthMeterCard({ item }) {
  const cols = item.cols || [];
  const colCount = cols.length;

  return (
    <View
      style={{
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 12,
      }}
    >
      {/* TOP ROW (meter + purchases + total) */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text
          style={{ flex: 1, color: "#111827", fontWeight: "900", fontSize: 14 }}
        >
          {item.meterNo}
        </Text>

        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: "#F3F4F6",
            borderWidth: 1,
            borderColor: "#E5E7EB",
            marginRight: 10,
          }}
        >
          <Text style={{ color: "#111827", fontWeight: "900", fontSize: 11 }}>
            Purchases {item.totalPurchases}
          </Text>
        </View>

        <Text style={{ color: "#111827", fontWeight: "900", fontSize: 14 }}>
          {formatZarFromCents(item.totalAmountC)}
        </Text>
      </View>

      {/* MONTH COLUMNS */}
      <View
        style={{
          marginTop: 12,
          flexDirection: "row",
          gap: 10,
        }}
      >
        {cols.map((c) => {
          const label = `${ymToLabel(c.ym)} • Purch ${Number(
            c.purchasesCount || 0,
          )}`;

          return (
            <View
              key={c.ym}
              style={{
                flex: colCount ? 1 : undefined,
                padding: 10,
                borderRadius: 14,
                backgroundColor: "#F9FAFB",
                borderWidth: 1,
                borderColor: "#E5E7EB",
              }}
            >
              <Text
                style={{ color: "#6B7280", fontSize: 10, fontWeight: "800" }}
              >
                {label}
              </Text>
              <Text
                style={{
                  marginTop: 6,
                  color: "#111827",
                  fontSize: 12,
                  fontWeight: "900",
                }}
              >
                {formatZarFromCents(c.amountTotalC)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
