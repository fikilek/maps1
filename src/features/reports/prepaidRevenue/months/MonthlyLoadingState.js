import { View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";

export const MonthlyLoadingState = ({
  ym,
  lmPcode,
  status,
  isFetching,
  cachedCount,
}) => {
  return (
    <View
      style={{
        flex: 1,
        paddingTop: 24,
        alignItems: "center",
        paddingHorizontal: 16,
      }}
    >
      <ActivityIndicator />
      <Text style={{ marginTop: 12, color: "#111827", fontWeight: "900" }}>
        Loading {ym || "month"}…
      </Text>

      <Text style={{ marginTop: 6, color: "#6B7280", textAlign: "center" }}>
        Workbase: {lmPcode || "-"}
      </Text>

      <Text style={{ marginTop: 6, color: "#6B7280", textAlign: "center" }}>
        This month can contain thousands of meters. First load may take longer.
      </Text>

      <View
        style={{
          marginTop: 12,
          alignSelf: "stretch",
          borderWidth: 1,
          borderColor: "#E5E7EB",
          borderRadius: 12,
          padding: 12,
        }}
      >
        <Text style={{ color: "#111827", fontWeight: "800" }}>
          Status: {String(status || "-")}
        </Text>
        <Text style={{ marginTop: 4, color: "#6B7280" }}>
          Fetching: {isFetching ? "Yes" : "No"}
        </Text>
        <Text style={{ marginTop: 4, color: "#6B7280" }}>
          Cached rows available now: {Number(cachedCount || 0)}
        </Text>
      </View>

      {cachedCount > 0 ? (
        <Text style={{ marginTop: 10, color: "#059669", fontWeight: "800" }}>
          Showing cached results while refreshing…
        </Text>
      ) : null}
    </View>
  );
};
