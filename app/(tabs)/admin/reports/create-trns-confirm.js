import { router } from "expo-router";
import { useMemo } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { clearNewTrns } from "../../../../src/redux/newTrnsSlice";

function formatZarFromCents(cents) {
  const v = Number(cents || 0) / 100;
  return `R ${v.toFixed(2)}`;
}

export default function CreateTrnsConfirmScreen() {
  const dispatch = useDispatch();

  const { trnsCandidates, context } = useSelector((s) => s.newTrns || {});
  const items = trnsCandidates || [];

  const totals = useMemo(() => {
    let totalC = 0;
    let totalPurchases = 0;
    for (const x of items) {
      totalC += Number(x.amountTotalC || 0);
      totalPurchases += Number(x.purchasesCount || 0);
    }
    return {
      meters: items.length,
      totalPurchases,
      totalSalesZar: formatZarFromCents(totalC),
    };
  }, [items]);

  const onCancel = () => {
    dispatch(clearNewTrns());
    router.back();
  };

  const onContinue = () => {
    // later: we’ll generate trns and allow dropping some meters.
    // for now: navigation only
    router.push("/(tabs)/admin/operations/workorders");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "900", color: "#111827" }}>
          Confirm TRNs to Create
        </Text>

        <Text style={{ marginTop: 6, fontSize: 12, color: "#6B7280" }}>
          LM: {context?.lmPcode || "—"} • Months:{" "}
          {context?.yms?.length ? context.yms.join(", ") : "—"}
        </Text>

        {/* KPIs */}
        <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
          <KpiCard title="Meters" value={String(totals.meters)} />
          <KpiCard title="Purchases" value={String(totals.totalPurchases)} />
          <KpiCard title="Total Sales" value={totals.totalSalesZar} />
        </View>
      </View>

      {/* List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.meterNo}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        ListEmptyComponent={
          <View style={{ paddingVertical: 20 }}>
            <Text style={{ color: "#6B7280" }}>
              No meters found. Go back and make sure MONTHLY has data.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={{
              padding: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              backgroundColor: "#F9FAFB",
              marginBottom: 10,
            }}
          >
            <Text style={{ fontWeight: "900", color: "#111827" }}>
              Meter: {item.meterNo}
            </Text>
            <Text style={{ marginTop: 4, color: "#374151", fontSize: 12 }}>
              Purchases: {item.purchasesCount} • Sales:{" "}
              {formatZarFromCents(item.amountTotalC)}
            </Text>
          </View>
        )}
      />

      {/* Footer actions */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          backgroundColor: "#fff",
          flexDirection: "row",
          gap: 10,
        }}
      >
        <ActionButton label="Cancel" tone="muted" onPress={onCancel} />
        <ActionButton label="Continue" tone="primary" onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}

/* ---------- tiny UI helpers ---------- */

function KpiCard({ title, value }) {
  return (
    <View
      style={{
        flex: 1,
        padding: 10,
        borderRadius: 14,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
      }}
    >
      <Text style={{ color: "#6B7280", fontSize: 10 }}>{title}</Text>
      <Text
        style={{
          color: "#111827",
          fontSize: 14,
          fontWeight: "900",
          marginTop: 4,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function ActionButton({ label, tone, onPress }) {
  const isPrimary = tone === "primary";
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: "center",
        backgroundColor: isPrimary ? "#111827" : "#F3F4F6",
        borderWidth: 1,
        borderColor: isPrimary ? "#111827" : "#E5E7EB",
      }}
    >
      <Text
        style={{ color: isPrimary ? "#fff" : "#111827", fontWeight: "900" }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
