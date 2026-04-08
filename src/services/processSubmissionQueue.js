import NetInfo from "@react-native-community/netinfo";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

import {
  getSubmissionQueue,
  markSubmissionQueueItemFailed,
  markSubmissionQueueItemSuccess,
  markSubmissionQueueItemSyncing,
} from "../utils/submissionQueue";

let isQueueProcessing = false;

export const processSubmissionQueue = async ({
  agentUid = "SYSTEM",
  agentName = "SYSTEM",
}) => {
  if (isQueueProcessing) {
    return {
      success: false,
      message: "Queue processing already in progress",
    };
  }

  isQueueProcessing = true;

  try {
    const netState = await NetInfo.fetch();

    const isOnline = netState.isConnected && netState.isInternetReachable;

    if (!isOnline) {
      return {
        success: false,
        message: "Device offline",
      };
    }

    const queue = await getSubmissionQueue();

    const pendingItems = queue.filter((item) => item?.status === "PENDING");

    if (!pendingItems.length) {
      return {
        success: true,
        message: "No pending queue items",
      };
    }

    const storage = getStorage();
    const functions = getFunctions();
    const callable = httpsCallable(functions, "onMeterDiscoveryCallable");

    for (const item of pendingItems) {
      try {
        await markSubmissionQueueItemSyncing(item.id, agentUid, agentName);

        const payload = item?.payload || {};
        const originalMedia = Array.isArray(payload?.media)
          ? payload.media
          : [];

        const syncedMedia = await Promise.all(
          originalMedia.map(async (mediaItem) => {
            if (mediaItem?.uri && !mediaItem?.url) {
              const folder =
                payload?.accessData?.access?.hasAccess === "yes"
                  ? `${payload?.meterType}_meters`
                  : "no_access";

              const fileName = `${payload?.accessData?.erfId}_${mediaItem?.tag}_${Date.now()}.jpg`;

              const storageRef = ref(storage, `meters/${folder}/${fileName}`);

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

        const callableResponse = await callable(finalPayload);

        const result = callableResponse?.data || {};

        if (!result?.success) {
          await markSubmissionQueueItemFailed(
            item.id,
            {
              code: result?.code || "SYNC_FAILED",
              message: result?.message || "Submission sync failed",
              trnId: result?.trnId || "NAv",
            },
            agentUid,
            agentName,
          );

          continue;
        }

        await markSubmissionQueueItemSuccess(
          item.id,
          {
            code: result?.code || "SUCCESS",
            message: result?.message || "Synced successfully",
            trnId: result?.trnId || finalPayload?.id || "NAv",
          },
          agentUid,
          agentName,
        );
      } catch (error) {
        console.log("processSubmissionQueue -- item failed", item?.id, error);

        await markSubmissionQueueItemFailed(
          item.id,
          {
            code: "SYNC_FAILED",
            message: error?.message || "Sync failed",
            trnId: "NAv",
          },
          agentUid,
          agentName,
        );
      }
    }

    return {
      success: true,
      message: "Queue processed",
    };
  } catch (error) {
    console.log("processSubmissionQueue error:", error);

    return {
      success: false,
      message: error?.message || "Queue processing failed",
    };
  } finally {
    isQueueProcessing = false;
  }
};
