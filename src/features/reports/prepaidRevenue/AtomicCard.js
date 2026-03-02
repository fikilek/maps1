import { memo, useMemo } from "react";
import { Text, View } from "react-native";

function centsToZar(cents) {
  const n = Number(cents || 0) / 100;
  return `R ${n.toFixed(2)}`;
}

function fmtTxTime(txAtISO) {
  if (!txAtISO) return "—";
  return txAtISO.slice(0, 19).replace("T", " ");
}

function AtomicCardBase({ item }) {
  const amount = useMemo(
    () => centsToZar(item?.amountTotalC),
    [item?.amountTotalC],
  );
  const cost = useMemo(() => centsToZar(item?.costC), [item?.costC]);
  const vat = useMemo(() => centsToZar(item?.vatC), [item?.vatC]);

  return (
    <View
      style={{
        padding: 12,
        borderRadius: 14,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E7EB",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#111827", fontWeight: "900", fontSize: 14 }}>
            {item?.meterNo || "—"}
          </Text>
          <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 2 }}>
            LM: {item?.lmPcode || "—"} • YM: {item?.ym || "—"}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: "#111827", fontWeight: "900", fontSize: 14 }}>
            {amount}
          </Text>
          <Text style={{ color: "#6B7280", fontSize: 11, marginTop: 2 }}>
            {fmtTxTime(item?.txAtISO)}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
        <MiniStat label="Cost" value={cost} />
        <MiniStat label="VAT" value={vat} />
        <MiniStat label="Currency" value={item?.currency || "ZAR"} />
      </View>

      <Text style={{ color: "#9CA3AF", fontSize: 10, marginTop: 10 }}>
        atomicId: {item?.atomicId || item?.id || "—"}
      </Text>
    </View>
  );
}

function MiniStat({ label, value }) {
  return (
    <View
      style={{
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 12,
        backgroundColor: "#F9FAFB",
        borderWidth: 1,
        borderColor: "#E5E7EB",
      }}
    >
      <Text style={{ color: "#6B7280", fontSize: 10 }}>{label}</Text>
      <Text
        style={{
          color: "#111827",
          fontSize: 12,
          fontWeight: "800",
          marginTop: 2,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export default memo(AtomicCardBase);
