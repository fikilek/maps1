import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  collection,
  limit as firestoreLimit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";

const BGO_STREAM_LIMIT = 200;

const BGO_RELEASE_STATES = {
  WAITING: "WAITING_BATCH_ACCEPTANCE",
  RELEASED: "RELEASED_TO_EXECUTION",
  REJECTED: "BATCH_REJECTED",
};

const EMPTY_BGO_BUCKET_DATA = {
  buckets: [],
  summary: {
    total: 0,
    waiting: 0,
    released: 0,
    rejected: 0,
    cancelled: 0,
  },
  meta: {
    source: "BGO_BUCKET_STREAM",
    updatedAt: null,
    streamLimit: BGO_STREAM_LIMIT,
  },
};

function normalizeUpper(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function cleanText(value, fallback = "NAv") {
  const clean = String(value || "").trim();
  return clean || fallback;
}

function readFirstString(...values) {
  for (const value of values) {
    const clean = String(value || "").trim();
    if (clean) return clean;
  }

  return "";
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getCreatedAt(batch = {}) {
  return batch?.metadata?.createdAt || batch?.createdAt || null;
}

function getUpdatedAt(batch = {}) {
  return batch?.metadata?.updatedAt || batch?.updatedAt || getCreatedAt(batch);
}

function getAgeSeconds(value) {
  const ms = toMillis(value);
  if (!ms) return 0;
  return Math.max(Math.floor((Date.now() - ms) / 1000), 0);
}

function normalizeTarget(target = {}) {
  return {
    type: normalizeUpper(target?.type),
    id: String(target?.id || "").trim(),
    name: cleanText(target?.name || target?.title || target?.id),
  };
}

function getBatchTarget(batch = {}) {
  const assignmentTargets = safeArray(batch?.assignment?.targets);
  const firstAssignmentTarget = assignmentTargets[0] || null;

  return normalizeTarget(
    firstAssignmentTarget ||
      batch?.target ||
      batch?.bgo?.target ||
      batch?.refs?.target ||
      {},
  );
}

function getTargetText(target = {}) {
  if (!target?.type || !target?.id) return "NAv";
  return `${target.type}: ${target.name || target.id}`;
}

function normalizeGeofenceRef(ref = {}) {
  const id = String(ref?.id || ref?.geofenceId || ref?.geoFenceId || "").trim();
  const name = String(ref?.name || ref?.label || ref?.description || id).trim();

  if (!id) {
    return {
      id: "NAv",
      name: "NAv",
    };
  }

  return {
    id,
    name: name || id,
  };
}

function getBatchGeofenceRef(batch = {}) {
  const geofenceRefs = safeArray(batch?.geofenceRefs);

  return normalizeGeofenceRef(
    batch?.geofenceRef ||
      batch?.bgo?.geofenceRef ||
      batch?.geofence ||
      batch?.refs?.geofenceRef ||
      geofenceRefs[0] ||
      {},
  );
}

function getBatchTrnType(batch = {}) {
  return normalizeUpper(
    batch?.operationType ||
      batch?.accessData?.trnType ||
      batch?.bgo?.trnType ||
      batch?.assignment?.instruction?.code ||
      batch?.trnType ||
      "",
  );
}

function getBatchTrnCode(batch = {}) {
  return normalizeUpper(
    batch?.trnCode ||
      batch?.operationCode ||
      batch?.bgo?.trnCode ||
      batch?.summary?.trnCode ||
      "",
  );
}

function getTrnTypeLabel(trnType = "") {
  switch (normalizeUpper(trnType)) {
    case "METER_INSPECTION":
      return "Bulk Inspection Batch";
    case "METER_DISCONNECTION":
      return "Bulk Disconnection Batch";
    case "METER_RECONNECTION":
      return "Bulk Reconnection Batch";
    case "METER_REMOVAL":
      return "Bulk Removal Batch";
    case "METER_READING":
      return "Bulk Meter Reading Batch";
    case "METER_DISCOVERY":
      return "Bulk Discovery Batch";
    case "METER_INSTALLATION":
      return "Bulk Installation Batch";
    default:
      return trnType || "Bulk Geofence Batch";
  }
}

function getBatchWorkflowState(batch = {}) {
  return normalizeUpper(batch?.workflow?.state || batch?.workflowState);
}

function getBatchReleaseState(batch = {}) {
  return normalizeUpper(batch?.bgo?.releaseState || batch?.releaseState);
}

function getBatchTrnIds(batch = {}) {
  return [
    ...new Set(
      [
        ...safeArray(batch?.trnIds),
        ...safeArray(batch?.refs?.trnIds),
        ...safeArray(batch?.bgo?.trnIds),
        ...safeArray(batch?.childTrnIds),
      ]
        .map((id) => String(id || "").trim())
        .filter(Boolean),
    ),
  ];
}

function readNumber(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }

  return 0;
}

function getBatchCounts(batch = {}, trnIds = []) {
  const summary = batch?.summary || {};
  const counts = batch?.counts || {};
  const bgoSummary = batch?.bgo?.summary || {};
  const workflowState = getBatchWorkflowState(batch);
  const releaseState = getBatchReleaseState(batch);

  const total = readNumber(
    summary?.totalTrns,
    summary?.totalTrnsCreated,
    summary?.trnCount,
    summary?.rowCount,
    summary?.totalRows,
    counts?.totalTrns,
    counts?.totalTrnsCreated,
    counts?.trnCount,
    counts?.rowCount,
    bgoSummary?.totalTrns,
    bgoSummary?.totalTrnsCreated,
    bgoSummary?.trnCount,
    bgoSummary?.rowCount,
    batch?.totalTrns,
    batch?.trnCount,
    batch?.rowCount,
    trnIds.length,
  );

  const waitingFromData = readNumber(
    summary?.waitingCount,
    summary?.waiting,
    summary?.totalWaitingBatchAcceptance,
    counts?.waitingCount,
    counts?.waiting,
    counts?.totalWaitingBatchAcceptance,
    bgoSummary?.waitingCount,
    bgoSummary?.waiting,
    bgoSummary?.totalWaitingBatchAcceptance,
  );

  const waiting =
    releaseState === BGO_RELEASE_STATES.WAITING
      ? waitingFromData || total
      : 0;

  const completed = readNumber(
    summary?.completedCount,
    summary?.completed,
    summary?.totalCompleted,
    counts?.completedCount,
    counts?.completed,
    counts?.totalCompleted,
    bgoSummary?.completedCount,
    bgoSummary?.completed,
    bgoSummary?.totalCompleted,
  );

  const inProgress = readNumber(
    summary?.inProgressCount,
    summary?.inProgress,
    summary?.totalInProgress,
    counts?.inProgressCount,
    counts?.inProgress,
    counts?.totalInProgress,
    bgoSummary?.inProgressCount,
    bgoSummary?.inProgress,
    bgoSummary?.totalInProgress,
  );

  const rejectedFromData = readNumber(
    summary?.rejectedCount,
    summary?.rejected,
    summary?.totalRejected,
    counts?.rejectedCount,
    counts?.rejected,
    counts?.totalRejected,
    bgoSummary?.rejectedCount,
    bgoSummary?.rejected,
    bgoSummary?.totalRejected,
  );

  const rejected =
    workflowState === "REJECTED" || releaseState === BGO_RELEASE_STATES.REJECTED
      ? rejectedFromData || total
      : rejectedFromData;

  const cancelled = readNumber(
    summary?.cancelledCount,
    summary?.cancelled,
    summary?.totalCancelled,
    counts?.cancelledCount,
    counts?.cancelled,
    counts?.totalCancelled,
    bgoSummary?.cancelledCount,
    bgoSummary?.cancelled,
    bgoSummary?.totalCancelled,
  );

  const acceptedFromData = readNumber(
    summary?.acceptedCount,
    summary?.accepted,
    summary?.totalAccepted,
    summary?.totalReleased,
    counts?.acceptedCount,
    counts?.accepted,
    counts?.totalAccepted,
    counts?.totalReleased,
    bgoSummary?.acceptedCount,
    bgoSummary?.accepted,
    bgoSummary?.totalAccepted,
    bgoSummary?.totalReleased,
  );

  const accepted =
    workflowState === "ACCEPTED" && releaseState === BGO_RELEASE_STATES.RELEASED
      ? acceptedFromData ||
        Math.max(total - inProgress - completed - rejected - cancelled, 0)
      : acceptedFromData;

  return {
    total,
    waiting,
    accepted,
    inProgress,
    completed,
    rejected,
    cancelled,
  };
}

function getIssuedBy(batch = {}) {
  return {
    uid: cleanText(batch?.metadata?.createdByUid || batch?.issuedBy?.uid, null),
    name: cleanText(
      batch?.metadata?.createdByUser ||
        batch?.issuedBy?.name ||
        batch?.assignment?.issuedByUser,
    ),
  };
}

function normalizeBgoBucket(batch = {}) {
  const id = batch?.id || "NAv";
  const trnType = getBatchTrnType(batch);
  const trnCode = getBatchTrnCode(batch);
  const workflowState = getBatchWorkflowState(batch);
  const releaseState = getBatchReleaseState(batch);
  const target = getBatchTarget(batch);
  const geofenceRef = getBatchGeofenceRef(batch);
  const trnIds = getBatchTrnIds(batch);
  const counts = getBatchCounts(batch, trnIds);
  const createdAt = getCreatedAt(batch);
  const updatedAt = getUpdatedAt(batch);

  return {
    id,
    bucketType: "BGOB",
    itemKind: "BGO_BATCH",
    title: getTrnTypeLabel(trnType),
    subtitle: geofenceRef?.name || "Bulk Geofence Batch",
    trnType,
    trnCode,
    trnTypeLabel: getTrnTypeLabel(trnType),

    workflowState,
    releaseState,
    hiddenUntilBatchAccepted: batch?.bgo?.hiddenUntilBatchAccepted === true,

    target,
    targetText: getTargetText(target),
    geofenceRef,
    geofenceName: geofenceRef?.name || "NAv",
    geofenceId: geofenceRef?.id || "NAv",

    counts,
    totalTrns: counts.total,
    childTrnIds: trnIds,

    tcId: readFirstString(batch?.tcId, batch?.bgo?.tcId, batch?.refs?.tcId),
    tcUploadId: readFirstString(
      batch?.tcUploadId,
      batch?.bgo?.tcUploadId,
      batch?.refs?.tcUploadId,
      batch?.tcId,
    ),

    issuedBy: getIssuedBy(batch),
    issuedAt: createdAt,
    updatedAt,
    ageSeconds: getAgeSeconds(createdAt),

    permissions: {
      canAccept:
        workflowState === "ISSUED" &&
        releaseState === BGO_RELEASE_STATES.WAITING,
      canReject:
        workflowState === "ISSUED" &&
        releaseState === BGO_RELEASE_STATES.WAITING,
      canViewTrns:
        workflowState === "ACCEPTED" &&
        releaseState === BGO_RELEASE_STATES.RELEASED,
      canReverseAcceptance:
        workflowState === "ACCEPTED" &&
        releaseState === BGO_RELEASE_STATES.RELEASED,
    },

    raw: batch,
  };
}

function buildBgoBucketData({ batches = [], streamLimit = BGO_STREAM_LIMIT }) {
  const buckets = batches
    .map(normalizeBgoBucket)
    .sort(
      (a, b) =>
        toMillis(b.updatedAt || b.issuedAt) -
        toMillis(a.updatedAt || a.issuedAt),
    );

  const summary = buckets.reduce(
    (acc, bucket) => {
      acc.total += 1;

      if (bucket.releaseState === BGO_RELEASE_STATES.WAITING) {
        acc.waiting += 1;
      } else if (bucket.releaseState === BGO_RELEASE_STATES.RELEASED) {
        acc.released += 1;
      } else if (bucket.releaseState === BGO_RELEASE_STATES.REJECTED) {
        acc.rejected += 1;
      } else if (bucket.workflowState === "CANCELLED") {
        acc.cancelled += 1;
      }

      return acc;
    },
    {
      total: 0,
      waiting: 0,
      released: 0,
      rejected: 0,
      cancelled: 0,
    },
  );

  return {
    buckets,
    summary,
    meta: {
      source: "BGO_BUCKET_STREAM",
      updatedAt: new Date().toISOString(),
      streamLimit,
    },
  };
}

export const bgoApi = createApi({
  reducerPath: "bgoApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["BGO"],
  endpoints: (builder) => ({
    getBgoBuckets: builder.query({
      queryFn() {
        return { data: EMPTY_BGO_BUCKET_DATA };
      },

      async onCacheEntryAdded(
        args = {},
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribeBgoBatches = () => {};

        try {
          await cacheDataLoaded;

          const streamLimit = Number(args?.limit || BGO_STREAM_LIMIT);

          const bgoBatchQuery = query(
            collection(db, "bgo_batches"),
            orderBy("metadata.createdAt", "desc"),
            firestoreLimit(streamLimit),
          );

          unsubscribeBgoBatches = onSnapshot(
            bgoBatchQuery,
            (snapshot) => {
              const batches = snapshot.docs.map((docSnap) => ({
                id: docSnap.id,
                ...docSnap.data(),
              }));

              updateCachedData(() =>
                buildBgoBucketData({
                  batches,
                  streamLimit,
                }),
              );
            },
            (error) => {
              console.error("❌ [BGO_BUCKET_STREAM_ERROR]:", error);
            },
          );
        } catch (error) {
          console.error("❌ [BGO_BUCKET_STREAM_SETUP_ERROR]:", error);
        }

        await cacheEntryRemoved;
        unsubscribeBgoBatches();
      },
      providesTags: ["BGO"],
    }),

    acceptRejectBgoBatch: builder.mutation({
      async queryFn(payload) {
        try {
          const callable = httpsCallable(
            functions,
            "onAcceptRejectBgoBatchCallable",
          );

          const result = await callable(payload);
          const data = result?.data || {};

          if (!data?.success) {
            return {
              error: {
                code: data?.code || "ACCEPT_REJECT_BGO_BATCH_FAILED",
                message:
                  data?.message || "Could not accept/reject BGO batch.",
                data,
              },
            };
          }

          return { data };
        } catch (error) {
          console.log("acceptRejectBgoBatch ERROR", error);

          return {
            error: {
              code: error?.code || "ACCEPT_REJECT_BGO_BATCH_ERROR",
              message:
                error?.message ||
                "Unexpected error accepting/rejecting BGO batch.",
              error,
            },
          };
        }
      },
      invalidatesTags: ["BGO"],
    }),

    reverseBgoBatchAcceptance: builder.mutation({
      async queryFn(payload) {
        try {
          const callable = httpsCallable(
            functions,
            "onReverseBgoBatchAcceptanceCallable",
          );

          const result = await callable(payload);
          const data = result?.data || {};

          if (!data?.success) {
            return {
              error: {
                code: data?.code || "REVERSE_BGO_ACCEPTANCE_FAILED",
                message:
                  data?.message || "Could not reverse BGO batch acceptance.",
                data,
              },
            };
          }

          return { data };
        } catch (error) {
          console.log("reverseBgoBatchAcceptance ERROR", error);

          return {
            error: {
              code: error?.code || "REVERSE_BGO_ACCEPTANCE_ERROR",
              message:
                error?.message ||
                "Unexpected error reversing BGO batch acceptance.",
              error,
            },
          };
        }
      },
      invalidatesTags: ["BGO"],
    }),
  }),
});

export const {
  useGetBgoBucketsQuery,
  useAcceptRejectBgoBatchMutation,
  useReverseBgoBatchAcceptanceMutation,
} = bgoApi;
