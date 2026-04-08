import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ActivityIndicator, Surface, Text } from "react-native-paper";
import QueueItemCard from "../../../../components/QueueItemCard";
import { useAuth } from "../../../../src/hooks/useAuth";
import { processSubmissionQueue } from "../../../../src/services/processSubmissionQueue";
import {
  clearSubmissionQueue,
  getSubmissionQueue,
  removeSubmissionQueueItem,
} from "../../../../src/utils/submissionQueue";

export default function SubmissionQueueScreen() {
  const { user, profile } = useAuth();

  const [queueItems, setQueueItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const agentUid = user?.uid || "SYSTEM";
  const agentName = profile?.profile?.displayName || "SYSTEM";

  const loadQueue = useCallback(async () => {
    try {
      const queue = await getSubmissionQueue();
      setQueueItems(Array.isArray(queue) ? queue : []);
    } catch (error) {
      console.log("SubmissionQueueScreen -- loadQueue error", error);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadQueue();
    setRefreshing(false);
  }, [loadQueue]);

  const handleClearQueue = async () => {
    Alert.alert(
      "Clear Queue",
      "Are you sure you want to remove all queue items?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            await clearSubmissionQueue();
            await loadQueue();
            setBusy(false);
          },
        },
      ],
    );
  };

  const handleRemoveItem = async (queueItemId) => {
    Alert.alert("Remove Item", "Remove this queue item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          await removeSubmissionQueueItem(queueItemId);
          await loadQueue();
          setBusy(false);
        },
      },
    ]);
  };

  const handleProcessQueue = async () => {
    setBusy(true);
    await processSubmissionQueue({
      agentUid,
      agentName,
    });
    await loadQueue();
    setBusy(false);
  };

  useState(() => {
    loadQueue();
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: "Submission Queue",
          headerTitleStyle: { fontSize: 16, fontWeight: "900" },
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Surface style={styles.headerCard} elevation={1}>
          <Text style={styles.headerTitle}>Offline Submission Queue</Text>
          <Text style={styles.headerSub}>Total Items: {queueItems.length}</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#0f172a" }]}
              onPress={handleRefresh}
              disabled={busy}
            >
              <MaterialCommunityIcons name="refresh" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Refresh</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: "#2563eb", opacity: busy ? 0.7 : 1 },
              ]}
              onPress={handleProcessQueue}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialCommunityIcons name="sync" size={18} color="#fff" />
              )}
              <Text style={styles.actionBtnText}>
                {busy ? "Syncing..." : "Sync Now"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#dc2626" }]}
              onPress={handleClearQueue}
              disabled={busy}
            >
              <MaterialCommunityIcons name="delete" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </Surface>

        {queueItems.length === 0 ? (
          <Surface style={styles.emptyCard} elevation={1}>
            <Text style={styles.emptyText}>No queue items found.</Text>
          </Surface>
        ) : (
          queueItems.map((item) => (
            <QueueItemCard
              key={item.id}
              item={item}
              busy={busy}
              onRemove={handleRemoveItem}
            />
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  content: {
    padding: 12,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
  },
  headerSub: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0f172a",
  },
  statusBadge: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
  },
  label: {
    fontSize: 11,
    fontWeight: "900",
    color: "#475569",
    marginTop: 8,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 13,
    color: "#0f172a",
    marginTop: 2,
  },
  itemActionsRow: {
    flexDirection: "row",
    marginTop: 14,
  },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  smallBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
});
