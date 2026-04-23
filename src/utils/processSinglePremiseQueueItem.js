import NetInfo from "@react-native-community/netinfo";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

import {
  getPremiseQueueItemById,
  markPremiseQueueItemFailed,
  markPremiseQueueItemSuccess,
  markPremiseQueueItemSyncing,
} from "./premiseSubmissionQueue";

export const processSinglePremiseQueueItem = async (
  queueItemId,
  { agentUid = "SYSTEM", agentName = "SYSTEM" } = {},
) => {
  try {
    const netState = await NetInfo.fetch();
    const isOnline = netState.isConnected && netState.isInternetReachable;

    if (!isOnline) {
      return { success: false, message: "Device offline" };
    }

    const item = await getPremiseQueueItemById(queueItemId);

    if (!item) {
      return { success: false, message: "Queue item not found" };
    }

    if (item.status === "SUCCESS") {
      return { success: true, message: "Already synced" };
    }

    await markPremiseQueueItemSyncing(queueItemId);

    const payload = item?.payload || {};
    const storage = getStorage();

    /* -------------------------------------------
       1. Upload media if needed
    ------------------------------------------- */
    const syncedMedia = await Promise.all(
      (payload?.media || []).map(async (mediaItem) => {
        if (mediaItem?.uri && !mediaItem?.url) {
          const fileName = `${payload?.id}_${mediaItem?.tag}_${Date.now()}.jpg`;

          const storageRef = ref(
            storage,
            `premises/${payload?.id}/${fileName}`,
          );

          const response = await fetch(mediaItem.uri);
          const blob = await response.blob();

          await uploadBytes(storageRef, blob);

          const downloadUrl = await getDownloadURL(storageRef);

          const { uri, ...cleanItem } = mediaItem;

          return {
            ...cleanItem,
            url: downloadUrl,
          };
        }

        return mediaItem;
      }),
    );

    const finalPayload = {
      ...payload,
      media: syncedMedia,
    };

    /* -------------------------------------------
       2. Call backend
    ------------------------------------------- */
    const functions = getFunctions();
    const callable = httpsCallable(functions, "onPremiseCreateCallable");

    const response = await callable(finalPayload);
    const result = response?.data || {};

    /* -------------------------------------------
       3. Handle result
    ------------------------------------------- */
    if (!result?.success) {
      await markPremiseQueueItemFailed(queueItemId, {
        code: result?.code || "FAILED",
        message: result?.message || "Sync failed",
        premiseId: "NAv",
      });

      return { success: false, message: result?.message };
    }

    await markPremiseQueueItemSuccess(queueItemId, {
      code: result?.code || "SUCCESS",
      message: result?.message || "Synced successfully",
      premiseId: result?.premiseId || finalPayload?.id,
    });

    return { success: true };
  } catch (error) {
    console.log("processSinglePremiseQueueItem error:", error);

    await markPremiseQueueItemFailed(queueItemId, {
      code: "FAILED",
      message: error?.message || "Sync failed",
      premiseId: "NAv",
    });

    return { success: false, message: error?.message };
  }
};
