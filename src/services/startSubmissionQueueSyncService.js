import NetInfo from "@react-native-community/netinfo";
import { processSubmissionQueue } from "./processSubmissionQueue";

// 🔒 sync guard (prevents parallel runs)
let isSyncInProgress = false;

export const startSubmissionQueueSyncService = ({
  agentUid = "SYSTEM",
  agentName = "SYSTEM",
} = {}) => {
  console.log("startSubmissionQueueSyncService -- started");

  const unsubscribe = NetInfo.addEventListener(async (state) => {
    const isOnline = state.isConnected && state.isInternetReachable;

    if (!isOnline) return;

    // 🔒 prevent duplicate runs
    if (isSyncInProgress) {
      console.log("Queue sync already in progress — skipping");
      return;
    }

    try {
      isSyncInProgress = true;

      console.log("Queue sync triggered (online)");

      await processSubmissionQueue({
        agentUid,
        agentName,
      });

      console.log("Queue sync completed");
    } catch (error) {
      console.log("Queue sync error:", error);
    } finally {
      isSyncInProgress = false;
    }
  });

  return unsubscribe; // allow cleanup if needed
};
