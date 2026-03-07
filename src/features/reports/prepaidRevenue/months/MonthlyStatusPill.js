import { useMemo } from "react";
import { Text, View } from "react-native";
import { getMonthlyMetaFromKV } from "../../../../storage/salesMonthlyKV";

function fmtAgo(ms) {
  const n = Number(ms || 0);
  if (!n) return null;
  const diff = Date.now() - n;
  const s = Math.max(0, Math.floor(diff / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export default function MonthlyStatusPill({
  lmPcode,
  ym,
  isOnline,
  isFetching,
}) {
  const meta = useMemo(() => {
    if (!lmPcode || !ym) return null;
    return getMonthlyMetaFromKV(lmPcode, ym);
  }, [lmPcode, ym]);

  const label = (() => {
    if (!lmPcode || !ym) return "Pick a month";
    if (!isOnline && meta?.count)
      return `Offline • Cached ${meta.count.toLocaleString()}`;
    if (!isOnline) return "Offline • No cache";
    if (isFetching) return "Fetching live…";
    if (meta?.count)
      return `Cached ${meta.count.toLocaleString()} • ${fmtAgo(meta.savedAtMs) || "saved"}`;
    return "Live";
  })();

  return (
    <View
      style={{
        alignSelf: "flex-start",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: "#F3F4F6",
        borderWidth: 1,
        borderColor: "#E5E7EB",
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: "900", color: "#111827" }}>
        {label}
      </Text>
    </View>
  );
}
