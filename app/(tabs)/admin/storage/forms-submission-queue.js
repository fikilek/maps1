import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
import { useGeo } from "../../../../src/context/GeoContext";
import { useAuth } from "../../../../src/hooks/useAuth";
import { processSubmissionQueue } from "../../../../src/services/processSubmissionQueue";
import {
  clearSubmissionQueue,
  getSubmissionQueue,
  removeSubmissionQueueItem,
} from "../../../../src/utils/submissionQueue";

const getQueueUpdatedAtMs = (item) => {
  const raw = item?.metadata?.updatedAt || item?.metadata?.createdAt || "";

  const ms = new Date(raw).getTime();

  return Number.isNaN(ms) ? 0 : ms;
};

export default function SubmissionQueueScreen() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { updateGeo } = useGeo();

  const [queueItems, setQueueItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const agentUid = user?.uid || "SYSTEM";
  const agentName = profile?.profile?.displayName || "SYSTEM";

  const loadQueue = useCallback(async () => {
    try {
      const queue = await getSubmissionQueue();

      const sortedQueue = (Array.isArray(queue) ? queue : []).sort(
        (a, b) => getQueueUpdatedAtMs(b) - getQueueUpdatedAtMs(a),
      );

      setQueueItems(sortedQueue);
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

  const handleEditItem = (item) => {
    const canEdit = item?.status === "PENDING" || item?.status === "FAILED";

    if (!canEdit) {
      Alert.alert(
        "Edit Not Allowed",
        "Only pending or failed queue items can be edited.",
      );
      return;
    }

    const hasAccess =
      item?.payload?.accessData?.access?.hasAccess === "no" ? "no" : "yes";

    const meterType = hasAccess === "no" ? "" : item?.payload?.meterType || "";

    const premiseId =
      item?.context?.premiseId ||
      item?.payload?.accessData?.premise?.id ||
      "NAv";

    router.push({
      pathname: "/(tabs)/premises/form",
      params: {
        premiseId,
        action: JSON.stringify({
          access: hasAccess,
          meterType,
        }),
        queueItemId: item?.id,
      },
    });
  };

  const handleOpenMapItem = (item) => {
    const gps = item?.payload?.ast?.location?.gps;

    if (typeof gps?.lat !== "number" || typeof gps?.lng !== "number") {
      Alert.alert(
        "Map Unavailable",
        "This draft does not have valid meter GPS coordinates.",
      );
      return;
    }

    const draftMeter = {
      id: item?.payload?.id || item?.id || "NAv",
      meterType: item?.payload?.meterType || item?.context?.meterType || "NAv",
      accessData: {
        ...(item?.payload?.accessData || {}),
        erfNo:
          item?.payload?.accessData?.erfNo || item?.context?.erfNo || "NAv",
        premise: {
          ...(item?.payload?.accessData?.premise || {}),
          address: item?.payload?.accessData?.premise?.address || "NAv",
        },
      },
      ast: {
        ...(item?.payload?.ast || {}),
        astData: {
          ...(item?.payload?.ast?.astData || {}),
          astNo:
            item?.payload?.ast?.astData?.astNo ||
            item?.context?.meterNo ||
            "NAv",
        },
        location: {
          ...(item?.payload?.ast?.location || {}),
          gps: {
            lat: gps.lat,
            lng: gps.lng,
          },
        },
      },
    };

    updateGeo({
      selectedErf: null,
      selectedPremise: null,
      selectedMeter: draftMeter,
      lastSelectionType: "METER",
    });

    router.push("/(tabs)/maps");
  };

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Meter Discovery Queue",
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
          <Text style={styles.headerTitle}>Offline Metter Discovery Forms</Text>
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
              onEdit={handleEditItem}
              onOpenMap={handleOpenMapItem}
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
});
