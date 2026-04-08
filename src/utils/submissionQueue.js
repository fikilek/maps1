import { createMMKV } from "react-native-mmkv";

const SUBMISSION_QUEUE_STORAGE_KEY = "submission_queue_items";

const submissionQueueStorage = createMMKV({
  id: "ireps-submission-queue-storage",
});

const nowIso = () => new Date().toISOString();

const generateQueueId = () => {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `QUEUE_${Date.now()}_${random}`;
};

const safeArray = (value) => {
  return Array.isArray(value) ? value : [];
};

const readQueueFromStorage = () => {
  try {
    const raw = submissionQueueStorage.getString(SUBMISSION_QUEUE_STORAGE_KEY);

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    return safeArray(parsed);
  } catch (error) {
    console.log("readQueueFromStorage error:", error);
    return [];
  }
};

const writeQueueToStorage = (queueItems) => {
  try {
    submissionQueueStorage.set(
      SUBMISSION_QUEUE_STORAGE_KEY,
      JSON.stringify(safeArray(queueItems)),
    );

    return { success: true };
  } catch (error) {
    console.log("writeQueueToStorage error:", error);
    return {
      success: false,
      error,
    };
  }
};

export const getSubmissionQueue = async () => {
  return readQueueFromStorage();
};

export const getSubmissionQueueItemById = async (queueItemId) => {
  const queue = readQueueFromStorage();
  return queue.find((item) => item?.id === queueItemId) || null;
};

export const addSubmissionQueueItem = async ({
  formType = "NAv",
  payload = {},
  context = {},
  createdByUid = "SYSTEM",
  createdByUser = "SYSTEM",
}) => {
  try {
    const queue = readQueueFromStorage();
    const timestamp = nowIso();

    const newQueueItem = {
      id: generateQueueId(),
      formType,
      status: "PENDING",

      payload,

      result: {
        success: false,
        code: "NAv",
        message: "NAv",
        trnId: "NAv",
      },

      context: {
        meterNo: context?.meterNo || "NAv",
        meterType: context?.meterType || "NAv",
        erfId: context?.erfId || "NAv",
        erfNo: context?.erfNo || "NAv",
        premiseId: context?.premiseId || "NAv",
        lmPcode: context?.lmPcode || "NAv",
        wardPcode: context?.wardPcode || "NAv",
      },

      sync: {
        attempts: 0,
        lastAttemptAt: "NAv",
        nextRetryAt: "NAv",
      },

      metadata: {
        createdAt: timestamp,
        createdByUid,
        createdByUser,
        updatedAt: timestamp,
        updatedByUid: createdByUid,
        updatedByUser: createdByUser,
      },
    };

    const updatedQueue = [newQueueItem, ...queue];
    const saveResult = writeQueueToStorage(updatedQueue);

    if (!saveResult?.success) {
      return {
        success: false,
        message: "Failed to save queue item locally",
        queueItem: null,
      };
    }

    return {
      success: true,
      message: "Queue item saved locally",
      queueItem: newQueueItem,
    };
  } catch (error) {
    console.log("addSubmissionQueueItem error:", error);

    return {
      success: false,
      message: error?.message || "Failed to add queue item",
      queueItem: null,
    };
  }
};

export const updateSubmissionQueueItem = async (
  queueItemId,
  updates = {},
  updatedByUid = "SYSTEM",
  updatedByUser = "SYSTEM",
) => {
  try {
    const queue = readQueueFromStorage();

    const updatedQueue = queue.map((item) => {
      if (item?.id !== queueItemId) return item;

      return {
        ...item,
        ...updates,
        metadata: {
          ...item?.metadata,
          updatedAt: nowIso(),
          updatedByUid,
          updatedByUser,
        },
      };
    });

    const saveResult = writeQueueToStorage(updatedQueue);

    if (!saveResult?.success) {
      return {
        success: false,
        message: "Failed to update queue item locally",
        queueItem: null,
      };
    }

    return {
      success: true,
      message: "Queue item updated locally",
      queueItem: updatedQueue.find((item) => item?.id === queueItemId) || null,
    };
  } catch (error) {
    console.log("updateSubmissionQueueItem error:", error);

    return {
      success: false,
      message: error?.message || "Failed to update queue item",
      queueItem: null,
    };
  }
};

export const markSubmissionQueueItemSyncing = async (
  queueItemId,
  updatedByUid = "SYSTEM",
  updatedByUser = "SYSTEM",
) => {
  const existingItem = await getSubmissionQueueItemById(queueItemId);
  const attempts = existingItem?.sync?.attempts || 0;

  return await updateSubmissionQueueItem(
    queueItemId,
    {
      status: "SYNCING",
      sync: {
        ...(existingItem?.sync || {}),
        attempts: attempts + 1,
        lastAttemptAt: nowIso(),
        nextRetryAt: "NAv",
      },
    },
    updatedByUid,
    updatedByUser,
  );
};

export const markSubmissionQueueItemSuccess = async (
  queueItemId,
  result = {},
  updatedByUid = "SYSTEM",
  updatedByUser = "SYSTEM",
) => {
  return await updateSubmissionQueueItem(
    queueItemId,
    {
      status: "SUCCESS",
      result: {
        success: true,
        code: result?.code || "SUCCESS",
        message: result?.message || "Synced successfully",
        trnId: result?.trnId || "NAv",
      },
    },
    updatedByUid,
    updatedByUser,
  );
};

export const markSubmissionQueueItemFailed = async (
  queueItemId,
  result = {},
  updatedByUid = "SYSTEM",
  updatedByUser = "SYSTEM",
) => {
  return await updateSubmissionQueueItem(
    queueItemId,
    {
      status: "FAILED",
      result: {
        success: false,
        code: result?.code || "SYNC_FAILED",
        message: result?.message || "Sync failed",
        trnId: result?.trnId || "NAv",
      },
    },
    updatedByUid,
    updatedByUser,
  );
};

export const removeSubmissionQueueItem = async (queueItemId) => {
  try {
    const queue = readQueueFromStorage();

    const updatedQueue = queue.filter((item) => item?.id !== queueItemId);

    const saveResult = writeQueueToStorage(updatedQueue);

    if (!saveResult?.success) {
      return {
        success: false,
        message: "Failed to remove queue item locally",
      };
    }

    return {
      success: true,
      message: "Queue item removed locally",
    };
  } catch (error) {
    console.log("removeSubmissionQueueItem error:", error);

    return {
      success: false,
      message: error?.message || "Failed to remove queue item",
    };
  }
};

export const clearSubmissionQueue = async () => {
  try {
    submissionQueueStorage.remove(SUBMISSION_QUEUE_STORAGE_KEY);

    return {
      success: true,
      message: "Submission queue cleared",
    };
  } catch (error) {
    console.log("clearSubmissionQueue error:", error);

    return {
      success: false,
      message: error?.message || "Failed to clear submission queue",
    };
  }
};
