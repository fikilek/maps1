import NetInfo from "@react-native-community/netinfo";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

import {
  getPremiseQueue,
  markPremiseQueueItemFailed,
  markPremiseQueueItemSuccess,
  markPremiseQueueItemSyncing,
} from "../utils/premiseSubmissionQueue";

let isPremiseQueueProcessing = false;

export const processPremiseSubmissionQueue = async ({
  agentUid = "SYSTEM",
  agentName = "SYSTEM",
} = {}) => {
  if (isPremiseQueueProcessing) {
    return {
      success: false,
      message: "Premise queue processing already in progress",
    };
  }

  isPremiseQueueProcessing = true;

  try {
    const netState = await NetInfo.fetch();

    const isOnline = netState.isConnected && netState.isInternetReachable;

    if (!isOnline) {
      return {
        success: false,
        message: "Device offline",
      };
    }

    const queue = await getPremiseQueue();

    const pendingItems = queue.filter((item) => item?.status === "PENDING");

    if (!pendingItems.length) {
      return {
        success: true,
        message: "No pending premise queue items",
      };
    }

    const storage = getStorage();
    const functions = getFunctions();
    const callable = httpsCallable(functions, "onPremiseCreateCallable");

    for (const item of pendingItems) {
      try {
        await markPremiseQueueItemSyncing(item.id, agentUid, agentName);

        const payload = item?.payload || {};
        const originalMedia = Array.isArray(payload?.media)
          ? payload.media
          : [];

        const syncedMedia = await Promise.all(
          originalMedia.map(async (mediaItem) => {
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

        const callableResponse = await callable(finalPayload);
        const result = callableResponse?.data || {};

        if (!result?.success) {
          await markPremiseQueueItemFailed(
            item.id,
            {
              code: result?.code || "SYNC_FAILED",
              message: result?.message || "Premise sync failed",
              premiseId: result?.premiseId || "NAv",
            },
            agentUid,
            agentName,
          );

          continue;
        }

        const firestorePremiseId = result?.premiseId || "NAv";

        if (!firestorePremiseId || firestorePremiseId === "NAv") {
          await markPremiseQueueItemFailed(
            item.id,
            {
              code: "MISSING_FIRESTORE_PREMISE_ID",
              message:
                "Premise sync succeeded but no Firestore premise id was returned",
              premiseId: "NAv",
            },
            agentUid,
            agentName,
          );
          continue;
        }

        await markPremiseQueueItemSuccess(
          item.id,
          {
            code: result?.code || "SUCCESS",
            message: result?.message || "Premise synced successfully",
            premiseId: firestorePremiseId,
          },
          agentUid,
          agentName,
        );

        // await markPremiseQueueItemSuccess(
        //   item.id,
        //   {
        //     code: result?.code || "SUCCESS",
        //     message: result?.message || "Premise synced successfully",
        //     premiseId: result?.premiseId || finalPayload?.id || "NAv",
        //   },
        //   agentUid,
        //   agentName,
        // );
      } catch (error) {
        console.log(
          "processPremiseSubmissionQueue -- item failed",
          item?.id,
          error,
        );

        await markPremiseQueueItemFailed(
          item.id,
          {
            code: "SYNC_FAILED",
            message: error?.message || "Premise sync failed",
            premiseId: "NAv",
          },
          agentUid,
          agentName,
        );
      }
    }

    return {
      success: true,
      message: "Premise queue processed",
    };
  } catch (error) {
    console.log("processPremiseSubmissionQueue error:", error);

    return {
      success: false,
      message: error?.message || "Premise queue processing failed",
    };
  } finally {
    isPremiseQueueProcessing = false;
  }
};
