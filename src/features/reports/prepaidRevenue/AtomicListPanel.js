import { ActivityIndicator, FlatList, Text, View } from "react-native";
import AtomicCard from "./AtomicCard";

export default function AtomicListPanel({
  items,
  isLoading,
  isError,
  error,
  onRetry,
  onEndReached,
  isFetchingMore,
  hasMore,
}) {
  return (
    <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : (
        <FlatList
          data={items || []}
          keyExtractor={(item, idx) =>
            String(item?.atomicId || item?.id || `${idx}`)
          }
          contentContainerStyle={{ padding: 12, gap: 10 }}
          renderItem={({ item }) => <AtomicCard item={item} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingMore ? (
              <View style={{ paddingVertical: 14 }}>
                <ActivityIndicator />
              </View>
            ) : !hasMore ? (
              <View style={{ paddingVertical: 14 }}>
                <Text style={{ textAlign: "center", color: "#6B7280" }}>
                  End of list
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

/* ---------- tiny internal components ---------- */

function LoadingState() {
  return (
    <View style={{ padding: 16 }}>
      <ActivityIndicator />
      <Text style={{ marginTop: 10, color: "#6B7280" }}>
        Loading atomic sales…
      </Text>
    </View>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ color: "#991B1B", fontWeight: "800" }}>
        Failed to load atomic sales
      </Text>

      <Text style={{ marginTop: 8, color: "#6B7280" }}>
        {String(error?.message || error)}
      </Text>

      <Text
        onPress={onRetry}
        style={{ marginTop: 12, color: "#1D4ED8", fontWeight: "800" }}
      >
        Retry
      </Text>
    </View>
  );
}
