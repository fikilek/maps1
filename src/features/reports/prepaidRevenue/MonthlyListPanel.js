// src/features/reports/prepaidRevenue/MonthlyListPanel.js
import React, { useCallback, useMemo } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { MonthlyLoadingState } from "./months/MonthlyLoadingState";
import { ymToLabel } from "./months/monthUtils";

function normalizeMeter(s) {
  return String(s || "")
    .replace(/\s+/g, "")
    .trim();
}

function normalizeGroupId(g) {
  const x = String(g || "")
    .trim()
    .toUpperCase();
  if (!x) return "GR0";
  if (
    x === "GR0" ||
    x === "GR1" ||
    x === "GR2" ||
    x === "GR3" ||
    x === "GR4" ||
    x === "GR5"
  )
    return x;
  return "GR0";
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

/**
 * MONTHLY MODE:
 * docs are conlog_sales_monthly docs for ONE month:
 * { lmPcode, meterNo, ym, purchasesCount, amountTotalC, salesGroupId }
 *
 * We build ONE card per meter for that month.
 */
function buildMonthlyCards(docs) {
  const safeDocs = Array.isArray(docs) ? docs : [];

  // If Firestore ever returns duplicates per meter/month (shouldn't),
  // we merge safely by meterNo.
  const byMeter = new Map();

  for (const d of safeDocs) {
    const meterNo = String(d?.meterNo || "").trim();
    if (!meterNo) continue;

    const purchases = Number(d?.purchasesCount || 0);
    const amountC = Number(d?.amountTotalC || 0);
    const salesGroupId = normalizeGroupId(d?.salesGroupId);
    const ym = String(d?.ym || "").trim();

    const existing = byMeter.get(meterNo);
    if (!existing) {
      byMeter.set(meterNo, {
        meterNo,
        ym,
        purchasesCount: purchases,
        amountTotalC: amountC,
        salesGroupId,
      });
    } else {
      // merge if duplicates (rare)
      existing.purchasesCount += purchases;
      existing.amountTotalC += amountC;
      // keep the "best" / non-empty group
      existing.salesGroupId = normalizeGroupId(
        existing.salesGroupId || salesGroupId,
      );
      existing.ym = existing.ym || ym;
    }
  }

  return Array.from(byMeter.values());
}

export default function MonthlyListPanel({
  docs,

  isLoading,
  isError,
  error,
  onRetry,

  // ✅ NEW: multi-select groups
  selectedGroups, // string[]; [] means ALL
  meterSearch,
  sortKey,
  onPressPurchases,

  // Loading state details
  activeYm,
  lmPcode,
  status,
  isFetching,
}) {
  const safeDocs = Array.isArray(docs) ? docs : [];
  const cachedCount = safeDocs.length;

  const cards = useMemo(() => buildMonthlyCards(safeDocs), [safeDocs]);

  // ✅ sort
  const sortedCards = useMemo(() => {
    const key = sortKey || "AMOUNT_ASC";
    const arr = [...cards];

    if (key === "AMOUNT_DESC")
      arr.sort((a, b) => b.amountTotalC - a.amountTotalC);
    else if (key === "AMOUNT_ASC")
      arr.sort((a, b) => a.amountTotalC - b.amountTotalC);
    else if (key === "PURCHASES_DESC")
      arr.sort((a, b) => b.purchasesCount - a.purchasesCount);
    else if (key === "PURCHASES_ASC")
      arr.sort((a, b) => a.purchasesCount - b.purchasesCount);
    else if (key === "METER_ASC")
      arr.sort((a, b) => String(a.meterNo).localeCompare(String(b.meterNo)));

    return arr;
  }, [cards, sortKey]);

  // ✅ filter (multi-select groups + meter prefix)
  const visibleCards = useMemo(() => {
    const q = normalizeMeter(meterSearch);
    const groups = Array.isArray(selectedGroups) ? selectedGroups : [];
    const hasGroupFilter = groups.length > 0;
    const groupSet = hasGroupFilter
      ? new Set(groups.map(normalizeGroupId))
      : null;

    return sortedCards.filter((c) => {
      if (hasGroupFilter) {
        const gid = normalizeGroupId(c.salesGroupId);
        if (!groupSet.has(gid)) return false;
      }
      if (!q) return true;
      return normalizeMeter(c.meterNo).startsWith(q);
    });
  }, [sortedCards, selectedGroups, meterSearch]);

  const renderItem = useCallback(
    ({ item }) => (
      <MonthMeterCard item={item} onPressPurchases={onPressPurchases} />
    ),
    [onPressPurchases],
  );

  const keyExtractor = useCallback((x) => x.meterNo, []);

  if (isLoading) {
    return (
      <MonthlyLoadingState
        ym={activeYm}
        lmPcode={lmPcode}
        status={status}
        isFetching={isFetching}
        cachedCount={cachedCount}
      />
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
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
      ListEmptyComponent={
        <View style={{ padding: 16 }}>
          <Text style={{ color: "#6B7280" }}>No monthly meters yet.</Text>
        </View>
      }
      // ✅ virtualization tuning for 15k rows
      initialNumToRender={18}
      maxToRenderPerBatch={18}
      updateCellsBatchingPeriod={50}
      windowSize={9}
      removeClippedSubviews={true}
    />
  );
}

const MonthMeterCard = React.memo(function MonthMeterCard({
  item,
  onPressPurchases,
}) {
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
      {/* TOP ROW */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text
          style={{ flex: 1, color: "#111827", fontWeight: "900", fontSize: 14 }}
        >
          {item.meterNo}
        </Text>

        <Pressable
          onPress={() => onPressPurchases?.(item.meterNo)}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: "#F3F4F6",
            borderWidth: 1,
            borderColor: "#E5E7EB",
            marginRight: 10,
          }}
          hitSlop={10}
        >
          <Text style={{ color: "#111827", fontWeight: "900", fontSize: 11 }}>
            Purchases {Number(item.purchasesCount || 0)}
          </Text>
        </Pressable>

        <Text style={{ color: "#111827", fontWeight: "900", fontSize: 14 }}>
          {formatZarFromCents(item.amountTotalC)}
        </Text>
      </View>

      {/* MONTH STRIP (single month only) */}
      <View style={{ marginTop: 12 }}>
        <View
          style={{
            padding: 10,
            borderRadius: 14,
            backgroundColor: "#F9FAFB",
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <Text style={{ color: "#6B7280", fontSize: 10, fontWeight: "800" }}>
            {ymToLabel(item.ym)} • Group {normalizeGroupId(item.salesGroupId)}
          </Text>
          <Text
            style={{
              marginTop: 6,
              color: "#111827",
              fontSize: 12,
              fontWeight: "900",
            }}
          >
            {formatZarFromCents(item.amountTotalC)}
          </Text>
        </View>
      </View>
    </View>
  );
});
