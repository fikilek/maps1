import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { Formik } from "formik";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { object, string } from "yup";

import { useAuth } from "../../../../src/hooks/useAuth";
import {
  useAcceptRejectLifecycleInstructionMutation,
  useGetWmsLifecycleWorkItemsQuery,
} from "../../../../src/redux/lifecycleInstructionApi";
import {
  useAcceptRejectBgoBatchMutation,
  useGetBgoBucketsQuery,
  useReverseBgoBatchAcceptanceMutation,
} from "../../../../src/redux/bgoApi";
import { useGetTeamsQuery } from "../../../../src/redux/teamsApi";
import { removeSubmissionQueueItemsByInstructionTrnId } from "../../../../src/utils/submissionQueue";

const WMS_GROUPS = [
  {
    key: "METER_INSPECTION",
    title: "Inspections",
    short: "INSP",
    icon: "clipboard-search-outline",
  },
  {
    key: "METER_DISCONNECTION",
    title: "Disconnections",
    short: "DCN",
    icon: "power-plug-off-outline",
  },
  {
    key: "METER_RECONNECTION",
    title: "Reconnections",
    short: "RCN",
    icon: "power-plug-outline",
  },
  {
    key: "METER_REMOVAL",
    title: "Removals",
    short: "REM",
    icon: "countertop-outline",
  },
  {
    key: "METER_READING",
    title: "Meter Readings",
    short: "MREAD",
    icon: "counter",
  },
];

const STATE_FILTERS = [
  { key: "ALL", label: "All" },
  { key: "ISSUED", label: "Issued" },
  { key: "REASSIGNED", label: "Reassigned" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "COMPLETED", label: "Completed" },
  { key: "REJECTED", label: "Rejected" },
  { key: "CANCELLED", label: "Cancelled" },
];

const EXECUTION_ROUTES = {
  METER_INSPECTION: "/asts/inspection",
  METER_REMOVAL: "/asts/removal",
  METER_DISCONNECTION: "/asts/disconnection",
  METER_RECONNECTION: "/asts/reconnection",
  METER_READING: "/asts/meter-reading",
};

const RejectSchema = object().shape({
  rejectReason: string()
    .trim()
    .min(5, "Give a short but useful reason")
    .max(500, "Keep the reason below 500 characters")
    .required("Reject reason is required"),
});

function normalizeUpper(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function formatAge(seconds = 0) {
  const total = Number(seconds || 0);

  if (!total) return "NAv";

  const minutes = Math.floor(total / 60);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function formatDateTime(value) {
  if (!value) return "NAv";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "NAv";

  return date.toLocaleString();
}

function emptyCounts() {
  return {
    issued: 0,
    reassigned: 0,
    accepted: 0,
    rejected: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    total: 0,
  };
}

function countItems(items = []) {
  return items.reduce((acc, item) => {
    acc.total += 1;

    if (item.workflowState === "ISSUED") acc.issued += 1;
    if (item.workflowState === "REASSIGNED") acc.reassigned += 1;
    if (item.workflowState === "ACCEPTED") acc.accepted += 1;
    if (item.workflowState === "REJECTED") acc.rejected += 1;
    if (item.workflowState === "IN_PROGRESS") acc.inProgress += 1;
    if (item.workflowState === "COMPLETED") acc.completed += 1;
    if (item.workflowState === "CANCELLED") acc.cancelled += 1;

    return acc;
  }, emptyCounts());
}

function stateCount(items = [], state) {
  if (state === "ALL") return items.length;
  return items.filter((item) => item.workflowState === state).length;
}

function getStateBadgeStyle(state) {
  switch (normalizeUpper(state)) {
    case "ISSUED":
    case "REASSIGNED":
      return styles.badgeBlue;
    case "ACCEPTED":
    case "COMPLETED":
      return styles.badgeGreen;
    case "IN_PROGRESS":
      return styles.badgeOrange;
    case "REJECTED":
    case "CANCELLED":
      return styles.badgeRed;
    default:
      return styles.badgeMuted;
  }
}

function getStateBadgeTextStyle(state) {
  switch (normalizeUpper(state)) {
    case "ISSUED":
    case "REASSIGNED":
      return styles.badgeBlueText;
    case "ACCEPTED":
    case "COMPLETED":
      return styles.badgeGreenText;
    case "IN_PROGRESS":
      return styles.badgeOrangeText;
    case "REJECTED":
    case "CANCELLED":
      return styles.badgeRedText;
    default:
      return styles.badgeMutedText;
  }
}

function isPhotoMedia(media = {}) {
  const type = String(media?.type || media?.mimeType || "").toLowerCase();
  const url = getMediaUrl(media).toLowerCase();

  return (
    type.includes("image") ||
    url.includes(".jpg") ||
    url.includes(".jpeg") ||
    url.includes(".png") ||
    url.includes(".webp")
  );
}

function getBgoBatchIdFromItem(item = {}) {
  return (
    item?.raw?.bgo?.batchId ||
    item?.raw?.bucket?.batchId ||
    item?.bgo?.batchId ||
    item?.bucket?.batchId ||
    item?.batchId ||
    ""
  );
}

function isBgoChildItem(item = {}) {
  return Boolean(getBgoBatchIdFromItem(item));
}

function cleanId(value) {
  return String(value || "").trim();
}

function addCleanId(set, value) {
  const id = cleanId(value);
  if (id) set.add(id);
}

function getTeamMemberIds(team = {}) {
  const ids = new Set();

  if (Array.isArray(team?.memberUids)) {
    team.memberUids.forEach((uid) => addCleanId(ids, uid));
  }

  if (Array.isArray(team?.memberIds)) {
    team.memberIds.forEach((uid) => addCleanId(ids, uid));
  }

  if (Array.isArray(team?.userIds)) {
    team.userIds.forEach((uid) => addCleanId(ids, uid));
  }

  if (Array.isArray(team?.scope?.memberUserIds)) {
    team.scope.memberUserIds.forEach((uid) => addCleanId(ids, uid));
  }

  if (Array.isArray(team?.members)) {
    team.members.forEach((member) => {
      if (typeof member === "string") {
        addCleanId(ids, member);
        return;
      }

      addCleanId(ids, member?.uid);
      addCleanId(ids, member?.id);
      addCleanId(ids, member?.userId);
    });
  }

  if (Array.isArray(team?.users)) {
    team.users.forEach((member) => {
      if (typeof member === "string") {
        addCleanId(ids, member);
        return;
      }

      addCleanId(ids, member?.uid);
      addCleanId(ids, member?.id);
      addCleanId(ids, member?.userId);
    });
  }

  return [...ids];
}

function getActorTeamIds({ teams = [], actorUid }) {
  const uid = cleanId(actorUid);

  if (!uid) return [];

  return teams
    .filter((team) => getTeamMemberIds(team).includes(uid))
    .map((team) => cleanId(team?.id || team?.teamId))
    .filter(Boolean);
}

function getBgoBucketTarget(bucket = {}) {
  const assignmentTargets = Array.isArray(bucket?.raw?.assignment?.targets)
    ? bucket.raw.assignment.targets
    : [];

  const target =
    bucket?.target ||
    assignmentTargets[0] ||
    bucket?.raw?.target ||
    bucket?.raw?.bgo?.target ||
    {};

  return {
    type: normalizeUpper(target?.type || bucket?.raw?.bgo?.targetType),
    id: cleanId(target?.id || bucket?.raw?.bgo?.targetId),
    name: cleanId(target?.name || bucket?.raw?.bgo?.targetName),
  };
}

function canActorSeeBgoBucket({ bucket, actorUid, actorSpId, actorTeamIds }) {
  const target = getBgoBucketTarget(bucket);

  if (target.type === "USER") {
    return target.id === cleanId(actorUid);
  }

  if (target.type === "SP") {
    return target.id === cleanId(actorSpId);
  }

  if (target.type === "TEAM") {
    return actorTeamIds.includes(target.id);
  }

  return false;
}

function getBgoBucketStatusText(bucket = {}) {
  const workflowState = normalizeUpper(bucket?.workflowState);
  const releaseState = normalizeUpper(bucket?.releaseState);

  if (workflowState === "REJECTED" || releaseState === "BATCH_REJECTED") {
    return "Rejected";
  }

  if (workflowState === "CANCELLED") {
    return "Cancelled";
  }

  if (workflowState === "ACCEPTED" && releaseState === "RELEASED_TO_EXECUTION") {
    return "Accepted";
  }

  if (releaseState === "WAITING_BATCH_ACCEPTANCE") {
    return "Waiting Acceptance";
  }

  return workflowState || releaseState || "NAv";
}

function isExecutableWorkflowState(state) {
  return ["ACCEPTED", "IN_PROGRESS"].includes(normalizeUpper(state));
}

function isManagerRole(role) {
  const cleanRole = normalizeUpper(role);
  return ["SPU", "ADM", "MNG", "SPV"].includes(cleanRole);
}

function readFirstString(...values) {
  for (const value of values) {
    const clean = String(value || "").trim();
    if (clean) return clean;
  }

  return "";
}

function getServiceProviderRelationshipType(profile = {}) {
  return normalizeUpper(
    readFirstString(
      profile?.employment?.serviceProvider?.relationshipType,
      profile?.employment?.serviceProvider?.clientRelationshipType,
      profile?.employment?.relationshipType,
      profile?.serviceProvider?.relationshipType,
      profile?.serviceProvider?.clientRelationshipType,
    ),
  );
}

function isFieldWorkorderActor({ actorRole, profile }) {
  const cleanRole = normalizeUpper(actorRole);

  if (cleanRole === "FWR") return true;

  if (cleanRole !== "SPV") return false;

  const relationshipType = getServiceProviderRelationshipType(profile);

  // If the app profile knows this SPV is MNC-side, block this field screen.
  // Some current user profiles only carry role + serviceProvider id, so unknown
  // relationship remains allowed and the backend still performs final authority.
  if (relationshipType === "MNC") return false;

  return true;
}

function getActionErrorMessage(error = {}, fallback = "Action failed.") {
  return (
    error?.data?.message ||
    error?.message ||
    error?.error?.message ||
    fallback
  );
}

export default function WorkorderManagementSystem() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const actorUid = user?.uid || profile?.uid || null;
  const actorRole = profile?.employment?.role || profile?.role || "NAv";
  const actorSpId = profile?.employment?.serviceProvider?.id || null;
  const actorName =
    profile?.profile?.displayName || user?.email || actorUid || "NAv";

  const fieldWorkorderActor = isFieldWorkorderActor({ actorRole, profile });

  useEffect(() => {
    if (!actorUid || fieldWorkorderActor) return;

    Alert.alert(
      "WMS Access Blocked",
      "My Workorders is only available to FWR and SPV(SUBC) users.",
      [
        {
          text: "OK",
          onPress: () => {
            if (router?.canGoBack?.()) {
              router.back();
            }
          },
        },
      ],
    );
  }, [actorUid, actorRole, fieldWorkorderActor, router]);

  const {
    data: wmsData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetWmsLifecycleWorkItemsQuery(
    {
      actorUid,
      actorRole,
      actorSpId,
      actorName,
      limit: 500,
    },
    { skip: !fieldWorkorderActor },
  );

  const {
    data: bgoData,
    isLoading: isLoadingBgo,
    error: bgoError,
    refetch: refetchBgo,
  } = useGetBgoBucketsQuery(
    {
      actorUid,
      actorRole,
      actorSpId,
      actorName,
      limit: 200,
    },
    { skip: !fieldWorkorderActor },
  );

  const { data: teamsData = [] } = useGetTeamsQuery(undefined, {
    skip: !fieldWorkorderActor,
  });

  const [acceptRejectLifecycleInstruction, { isLoading: deciding }] =
    useAcceptRejectLifecycleInstructionMutation();

  const [acceptRejectBgoBatch, { isLoading: decidingBgo }] =
    useAcceptRejectBgoBatchMutation();

  const [reverseBgoBatchAcceptance, { isLoading: reversingBgo }] =
    useReverseBgoBatchAcceptanceMutation();

  const actionBusy = deciding || decidingBgo || reversingBgo;

  // My Workorders is now a field execution screen only.
  // Manager reversal must move to a manager control surface later.
  const managerActor = false;

  const [selectedBucket, setSelectedBucket] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [stateFilter, setStateFilter] = useState("ALL");
  const [rejectItem, setRejectItem] = useState(null);

  const allItems = useMemo(() => {
    return Array.isArray(wmsData?.items) ? wmsData.items : [];
  }, [wmsData?.items]);

  const individualItems = useMemo(() => {
    return allItems.filter(
      (item) => item.scopeBucket === "MY_WORK" && !isBgoChildItem(item),
    );
  }, [allItems]);

  const actorTeamIds = useMemo(() => {
    return getActorTeamIds({
      teams: Array.isArray(teamsData) ? teamsData : [],
      actorUid,
    });
  }, [teamsData, actorUid]);

  const bgoBuckets = useMemo(() => {
    const allBgoBuckets = Array.isArray(bgoData?.buckets)
      ? bgoData.buckets
      : [];

    return allBgoBuckets.filter((bucket) =>
      canActorSeeBgoBucket({
        bucket,
        actorUid,
        actorSpId,
        actorTeamIds,
      }),
    );
  }, [bgoData?.buckets, actorUid, actorSpId, actorTeamIds]);

  const groups = useMemo(() => {
    return WMS_GROUPS.map((group) => {
      const groupItems = individualItems.filter(
        (item) => item.trnType === group.key,
      );
      const counts = countItems(groupItems);

      return {
        ...group,
        total: groupItems.length,
        counts,
      };
    });
  }, [individualItems]);

  const individualBucket = useMemo(() => {
    const counts = countItems(individualItems);

    return {
      id: "INDVG",
      bucketType: "INDVG",
      itemKind: "INDIVIDUAL_BUCKET",
      title: "Individual Work Bucket",
      subtitle: "Individually issued lifecycle TRNs",
      trnTypeLabel: "Individual Work",
      workflowState: "ACTIVE",
      releaseState: "NAv",
      targetText: "Direct user work",
      geofenceName: "NAv",
      counts,
      totalTrns: individualItems.length,
      permissions: {
        canViewTrns: true,
        canAccept: false,
        canReject: false,
        canReverseAcceptance: false,
      },
    };
  }, [individualItems]);

  const bucketCards = useMemo(() => {
    return [individualBucket, ...bgoBuckets];
  }, [individualBucket, bgoBuckets]);

  const visibleItems = useMemo(() => {
    let baseItems = [];

    if (selectedBucket?.bucketType === "BGOB") {
      baseItems = allItems.filter(
        (item) => getBgoBatchIdFromItem(item) === selectedBucket.id,
      );
    } else if (selectedBucket?.bucketType === "INDVG" && selectedGroup?.key) {
      baseItems = individualItems.filter(
        (item) => item.trnType === selectedGroup.key,
      );
    }

    if (stateFilter === "ALL") return baseItems;

    return baseItems.filter((item) => item.workflowState === stateFilter);
  }, [allItems, individualItems, selectedBucket, selectedGroup, stateFilter]);

  const allVisibleBucketItems = useMemo(() => {
    if (selectedBucket?.bucketType === "BGOB") {
      return allItems.filter(
        (item) => getBgoBatchIdFromItem(item) === selectedBucket.id,
      );
    }

    if (selectedBucket?.bucketType === "INDVG" && selectedGroup?.key) {
      return individualItems.filter(
        (item) => item.trnType === selectedGroup.key,
      );
    }

    return [];
  }, [allItems, individualItems, selectedBucket, selectedGroup]);

  function openBucket(bucket) {
    if (bucket?.bucketType === "INDVG") {
      setSelectedBucket(bucket);
      setSelectedGroup(null);
      setStateFilter("ALL");
      return;
    }

    if (bucket?.bucketType === "BGOB") {
      if (!bucket?.permissions?.canViewTrns) {
        Alert.alert(
          "BGO Bucket Locked",
          "This BGO bucket must be accepted before its TRNs can be viewed for execution.",
        );
        return;
      }

      setSelectedBucket(bucket);
      setSelectedGroup(null);
      setStateFilter("ALL");
    }
  }

  function openGroup(group) {
    setSelectedGroup(group);
    setStateFilter("ALL");
  }

  function backToBuckets() {
    setSelectedBucket(null);
    setSelectedGroup(null);
    setStateFilter("ALL");
  }

  function backToIndividualGroups() {
    setSelectedGroup(null);
    setStateFilter("ALL");
  }

  async function submitDecision({ item, action, rejectReason = "" }) {
    if (!item?.id || actionBusy) return false;

    try {
      const result = await acceptRejectLifecycleInstruction({
        trnIds: [item.id],
        action,
        rejectReason: String(rejectReason || "").trim(),
      }).unwrap();

      Alert.alert(
        action === "ACCEPT" ? "Work Accepted" : "Work Rejected",
        result?.message ||
          (action === "ACCEPT"
            ? "Lifecycle work item accepted."
            : "Lifecycle work item rejected."),
      );

      return true;
    } catch (err) {
      console.log("WMS decision ERROR", err);

      Alert.alert(
        "Action Failed",
        err?.data?.message || err?.message || "Could not update work item.",
      );

      return false;
    }
  }

  async function submitBgoDecision({ bucket, action, rejectReason = "" }) {
    if (!bucket?.id || actionBusy) return false;

    try {
      const result = await acceptRejectBgoBatch({
        batchId: bucket.id,
        action,
        rejectReason: String(rejectReason || "").trim(),
      }).unwrap();

      if (result?.success === false) {
        throw {
          data: result,
          message: result?.message || "BGO action failed.",
        };
      }

      Alert.alert(
        action === "ACCEPT" ? "BGO Bucket Accepted" : "BGO Bucket Rejected",
        result?.message ||
          (action === "ACCEPT"
            ? "BGO bucket accepted and child TRNs released to execution."
            : "BGO bucket rejected."),
      );

      refetchBgo?.();
      refetch?.();

      return true;
    } catch (err) {
      console.log("BGO bucket decision ERROR", err);

      Alert.alert(
        "BGO Action Failed",
        getActionErrorMessage(err, "Could not update BGO bucket."),
      );

      return false;
    }
  }

  function handleAccept(item) {
    Alert.alert("Accept Work", `Accept ${item?.id || "this work item"}?`, [
      { text: "CANCEL", style: "cancel" },
      {
        text: "ACCEPT",
        onPress: () => submitDecision({ item, action: "ACCEPT" }),
      },
    ]);
  }

  function handleAcceptBgoBucket(bucket) {
    if (!fieldWorkorderActor) {
      Alert.alert(
        "WMS Access Blocked",
        "Only FWR and SPV(SUBC) users may accept BGO buckets from My Workorders.",
      );
      return;
    }

    Alert.alert(
      "Accept BGO Bucket",
      `Accept ${bucket?.title || "this BGO bucket"}? All child TRNs will become executable.`,
      [
        { text: "CANCEL", style: "cancel" },
        {
          text: "ACCEPT",
          onPress: () =>
            submitBgoDecision({ bucket, action: "ACCEPT" }),
        },
      ],
    );
  }

  function handleReverseBgoBucket(bucket) {
    Alert.alert(
      "Reverse BGO Acceptance",
      "This is online-only and will only work if no child TRN has started execution. Reverse this BGO bucket acceptance?",
      [
        { text: "CANCEL", style: "cancel" },
        {
          text: "REVERSE",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await reverseBgoBatchAcceptance({
                batchId: bucket.id,
                reason: "Manager reversed BGO acceptance before execution started",
              }).unwrap();

              if (result?.success === false) {
                throw {
                  data: result,
                  message: result?.message || "Reverse acceptance failed.",
                };
              }

              Alert.alert(
                "BGO Acceptance Reversed",
                result?.message || "BGO bucket acceptance was reversed.",
              );

              refetchBgo?.();
              refetch?.();
              backToBuckets();
            } catch (err) {
              console.log("BGO reverse acceptance ERROR", err);

              Alert.alert(
                "Reverse Failed",
                getActionErrorMessage(err, "Could not reverse BGO acceptance."),
              );
            }
          },
        },
      ],
    );
  }

  async function handleReject(values, helpers) {
    if (rejectItem?.itemKind === "BGO_BATCH") {
      if (!fieldWorkorderActor) {
        Alert.alert(
          "WMS Access Blocked",
          "Only FWR and SPV(SUBC) users may reject BGO buckets from My Workorders.",
        );
        helpers.setSubmitting(false);
        return;
      }

      const success = await submitBgoDecision({
        bucket: rejectItem,
        action: "REJECT",
        rejectReason: values.rejectReason,
      });

      helpers.setSubmitting(false);

      if (success) {
        helpers.resetForm();
        setRejectItem(null);
      }

      return;
    }

    const rejectedInstructionTrnId = rejectItem?.id || "NAv";

    const success = await submitDecision({
      item: rejectItem,
      action: "REJECT",
      rejectReason: values.rejectReason,
    });

    helpers.setSubmitting(false);

    if (success) {
      try {
        const mmkvRemoveResult =
          await removeSubmissionQueueItemsByInstructionTrnId(
            rejectedInstructionTrnId,
            {
              updatedByUid: actorUid || "SYSTEM",
              updatedByUser: actorName || "SYSTEM",
            },
          );

        console.log("WMS reject -- local MMKV cleanup result", {
          rejectedInstructionTrnId,
          removedCount: mmkvRemoveResult?.removedCount || 0,
          removedItemIds: mmkvRemoveResult?.removedItemIds || [],
          result: mmkvRemoveResult,
        });
      } catch (error) {
        console.log("WMS reject -- local MMKV cleanup error", {
          rejectedInstructionTrnId,
          code: error?.code,
          message: error?.message,
          stack: error?.stack,
          raw: error,
        });
      }

      helpers.resetForm();
      setRejectItem(null);
      refetch?.();
    }
  }

  function handleExecute(item) {
    if (!isExecutableWorkflowState(item?.workflowState)) {
      Alert.alert(
        "TRN Not Executable",
        "Only ACCEPTED or IN_PROGRESS work items can be opened for execution.",
      );
      return;
    }

    const pathname = EXECUTION_ROUTES[item?.trnType];

    if (!pathname) {
      Alert.alert(
        "Execution Route",
        "This work type can be issued and accepted, but execution is not enabled on this screen yet.",
      );
      return;
    }

    const instructionTrnId = item?.id || null;

    const sourceAstId =
      item?.raw?.ast?.astData?.astId || item?.raw?.astData?.astId || null;

    const premiseId =
      item?.premiseId || item?.raw?.accessData?.premise?.id || null;

    if (!instructionTrnId) {
      Alert.alert(
        "Work Item Not Ready",
        "This WMS item does not have a lifecycle instruction TRN id.",
      );
      return;
    }

    const action = {
      source: "WMS",

      // ✅ This is the accepted WMS work item / lifecycle instruction TRN.
      id: instructionTrnId,
      trnId: instructionTrnId,
      instructionTrnId,

      // ✅ This is only the referenced AST/installing TRN id used by backend AST updates.
      sourceAstId,
      astId: sourceAstId,

      trnType: item.trnType,
      premiseId,
      meterNo: item.meterNo,
      meterType: item.meterType,
      meterKind: item.meterKind,
      meterPreStatus: item.meterPreStatus,
      erfNo: item.erfNo,
      address: item.address,
      accessData: item?.raw?.accessData || null,
      ast: item?.raw?.ast || null,
      status: item?.raw?.status || null,
      assignment: item?.raw?.assignment || null,
      media: Array.isArray(item?.raw?.media) ? item.raw.media : [],
      officeInstruction: item?.raw?.assignment?.instruction || {
        code: item.trnType,
        text: item.assignment?.instructionText || "",
        notes: item.assignment?.instructionNotes || "",
        mediaRequired: false,
      },
      officeInstructionMedia: Array.isArray(item?.raw?.media)
        ? item.raw.media.filter((media) => media?.tag === "instructionMedia")
        : [],
      instructionText: item.assignment?.instructionText || "",
      instructionNotes: item.assignment?.instructionNotes || "",
      assignedTargetText: item.assignment?.targetText || "",
      issuedBy: item.issuedBy || null,
      serviceProvider: item.serviceProvider || null,
    };

    console.log("🧭 [WMS EXECUTE TAP]", {
      route: pathname,
      instructionTrnId,
      sourceAstId,
      premiseId,
      trnType: item?.trnType,
      meterNo: item?.meterNo,
    });

    router.push({
      pathname,
      params: {
        // ✅ Primary WMS execution id.
        trnId: instructionTrnId,
        instructionTrnId,

        // ✅ Asset reference, not the WMS work id.
        sourceAstId: sourceAstId || "",

        premiseId: premiseId || "",
        action: JSON.stringify(action),
        source: "WMS",
      },
    });
  }

  const showIndividualGroups =
    selectedBucket?.bucketType === "INDVG" && !selectedGroup;

  const showTrnDetail =
    selectedBucket?.bucketType === "BGOB" ||
    (selectedBucket?.bucketType === "INDVG" && selectedGroup);

  const detailTitle =
    selectedBucket?.bucketType === "BGOB"
      ? selectedBucket?.title || "BGO Bucket TRNs"
      : selectedGroup?.title || "My Allocated Work";

  const detailBackLabel =
    selectedBucket?.bucketType === "BGOB" ? "Buckets" : "Types";

  if (!fieldWorkorderActor) {
    return (
      <AccessDeniedWorkorders
        actorRole={actorRole}
        onBack={() => {
          if (router?.canGoBack?.()) {
            router.back();
          }
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <Stack.Screen
        options={{
          title: "Workorder Management System",
          headerTitleStyle: { fontSize: 15, fontWeight: "900" },
        }}
      />

      <View style={styles.headerCard}>
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons
            name="clipboard-list-outline"
            size={26}
            color="#ffffff"
          />
        </View>

        <View style={styles.headerMain}>
          <Text style={styles.headerTitle}>WMS</Text>
          <Text style={styles.headerSub}>My allocated lifecycle work</Text>
        </View>

        <View style={styles.headerCountBadge}>
          <Text style={styles.headerCountText}>{bucketCards.length}</Text>
        </View>
      </View>

      {!selectedBucket ? (
        <BucketLanding
          isLoading={isLoading || isLoadingBgo}
          error={error || bgoError}
          buckets={bucketCards}
          deciding={actionBusy}
          managerActor={managerActor}
          fieldWorkorderActor={fieldWorkorderActor}
          onOpenBucket={openBucket}
          onAcceptBgoBucket={handleAcceptBgoBucket}
          onRejectBgoBucket={setRejectItem}
          onReverseBgoBucket={handleReverseBgoBucket}
        />
      ) : showIndividualGroups ? (
        <GroupLanding
          isLoading={isLoading}
          error={error}
          groups={groups}
          onOpenGroup={openGroup}
          onBack={backToBuckets}
        />
      ) : showTrnDetail ? (
        <GroupDetail
          title={detailTitle}
          backLabel={detailBackLabel}
          stateFilter={stateFilter}
          setStateFilter={setStateFilter}
          allGroupItems={allVisibleBucketItems}
          items={visibleItems}
          deciding={actionBusy}
          onBack={
            selectedBucket?.bucketType === "BGOB"
              ? backToBuckets
              : backToIndividualGroups
          }
          onAccept={handleAccept}
          onReject={setRejectItem}
          onExecute={handleExecute}
        />
      ) : null}

      <RejectModal
        visible={Boolean(rejectItem)}
        item={rejectItem}
        busy={actionBusy}
        onClose={() => setRejectItem(null)}
        onSubmit={handleReject}
      />
    </SafeAreaView>
  );
}

function AccessDeniedWorkorders({ actorRole, onBack }) {
  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <Stack.Screen
        options={{
          title: "Workorder Management System",
          headerTitleStyle: { fontSize: 15, fontWeight: "900" },
        }}
      />

      <View style={styles.stateWrap}>
        <MaterialCommunityIcons
          name="lock-alert-outline"
          size={42}
          color="#dc2626"
        />

        <Text style={styles.stateTitle}>My Workorders is field-only</Text>
        <Text style={styles.stateText}>
          This screen is only available to FWR and SPV(SUBC) users. Current role: {actorRole || "NAv"}.
        </Text>

        <Pressable style={styles.accessBackButton} onPress={onBack}>
          <Text style={styles.accessBackButtonText}>GO BACK</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function BucketLanding({
  isLoading,
  error,
  buckets,
  deciding,
  managerActor,
  fieldWorkorderActor,
  onOpenBucket,
  onAcceptBgoBucket,
  onRejectBgoBucket,
  onReverseBgoBucket,
}) {
  if (isLoading) {
    return (
      <View style={styles.stateWrap}>
        <ActivityIndicator size="small" color="#2563eb" />
        <Text style={styles.stateText}>Loading your work buckets...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.stateWrap}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={36}
          color="#dc2626"
        />
        <Text style={styles.stateTitle}>Could not load WMS buckets</Text>
        <Text style={styles.stateText}>
          {error?.message || "Bucket stream failed."}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.sectionEyebrow}>Assigned Work Queue</Text>
      <Text style={styles.sectionTitle}>My Work Buckets</Text>

      <View style={styles.bucketList}>
        {buckets.map((bucket) => (
          <BucketCard
            key={bucket.id}
            bucket={bucket}
            deciding={deciding}
            managerActor={managerActor}
            fieldWorkorderActor={fieldWorkorderActor}
            onOpenBucket={onOpenBucket}
            onAcceptBgoBucket={onAcceptBgoBucket}
            onRejectBgoBucket={onRejectBgoBucket}
            onReverseBgoBucket={onReverseBgoBucket}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function BucketCard({
  bucket,
  deciding,
  managerActor,
  fieldWorkorderActor,
  onOpenBucket,
  onAcceptBgoBucket,
  onRejectBgoBucket,
  onReverseBgoBucket,
}) {
  const isIndividual = bucket?.bucketType === "INDVG";
  const isBgo = bucket?.bucketType === "BGOB";
  const counts = bucket?.counts || {};
  const statusText = isIndividual ? "Open" : getBgoBucketStatusText(bucket);
  const canView = bucket?.permissions?.canViewTrns === true;
  const canAccept = isBgo && bucket?.permissions?.canAccept === true;
  const canReject = isBgo && bucket?.permissions?.canReject === true;
  const acceptRejectDisabled = deciding || !fieldWorkorderActor;
  const canReverse =
    isBgo &&
    managerActor &&
    bucket?.permissions?.canReverseAcceptance === true &&
    Number(counts?.inProgress || 0) === 0 &&
    Number(counts?.completed || 0) === 0;

  return (
    <View style={styles.bucketCard}>
      <View style={styles.groupTopRow}>
        <View style={styles.groupIcon}>
          <MaterialCommunityIcons
            name={isIndividual ? "account-hard-hat-outline" : "map-marker-radius-outline"}
            size={23}
            color="#2563eb"
          />
        </View>

        <View style={styles.bucketStatusBadge}>
          <Text style={styles.bucketStatusText}>{statusText}</Text>
        </View>
      </View>

      <Text style={styles.groupTitle}>{bucket.title}</Text>
      <Text style={styles.groupSub}>{bucket.subtitle || bucket.geofenceName}</Text>

      <View style={styles.bucketMetaGrid}>
        <InfoLine
          icon="counter"
          label="Total TRNs"
          value={bucket.totalTrns || counts.total || 0}
        />

        <InfoLine
          icon="account-hard-hat-outline"
          label="Target"
          value={bucket.targetText || "NAv"}
        />

        {isBgo ? (
          <>
            <InfoLine
              icon="map-marker-outline"
              label="Geofence"
              value={bucket.geofenceName || "NAv"}
            />

            <InfoLine
              icon="clipboard-text-outline"
              label="TRN Type"
              value={bucket.trnTypeLabel || bucket.trnType || "NAv"}
            />

            <InfoLine
              icon="account-tie-outline"
              label="Issued By"
              value={bucket.issuedBy?.name || "NAv"}
            />

            <InfoLine
              icon="clock-outline"
              label="Age"
              value={formatAge(bucket.ageSeconds)}
            />
          </>
        ) : null}
      </View>

      <View style={styles.groupCounts}>
        <MiniCount
          label={isBgo ? "Waiting" : "Issued"}
          value={isBgo ? counts.waiting || 0 : counts.issued || 0}
        />
        <MiniCount label="Accepted" value={counts.accepted || 0} />
        <MiniCount label="Progress" value={counts.inProgress || 0} />
        <MiniCount label="Completed" value={counts.completed || 0} />
      </View>

      <View style={styles.actionsRow}>
        {canAccept ? (
          <Pressable
            style={[
              styles.actionBtn,
              styles.acceptBtn,
              acceptRejectDisabled && styles.actionDisabled,
            ]}
            onPress={() => onAcceptBgoBucket(bucket)}
            disabled={acceptRejectDisabled}
          >
            <Text style={styles.acceptBtnText}>ACCEPT</Text>
          </Pressable>
        ) : null}

        {canReject ? (
          <Pressable
            style={[
              styles.actionBtn,
              styles.rejectBtn,
              acceptRejectDisabled && styles.actionDisabled,
            ]}
            onPress={() => onRejectBgoBucket(bucket)}
            disabled={acceptRejectDisabled}
          >
            <Text style={styles.rejectBtnText}>REJECT</Text>
          </Pressable>
        ) : null}

        {canView ? (
          <Pressable
            style={[styles.actionBtn, styles.executeBtn]}
            onPress={() => onOpenBucket(bucket)}
            disabled={deciding}
          >
            <Text style={styles.executeBtnText}>VIEW TRNS</Text>
          </Pressable>
        ) : null}

        {canReverse ? (
          <Pressable
            style={[
              styles.actionBtn,
              styles.rejectWorkBtn,
              deciding && styles.actionDisabled,
            ]}
            onPress={() => onReverseBgoBucket(bucket)}
            disabled={deciding}
          >
            <Text style={styles.rejectWorkBtnText}>REVERSE</Text>
          </Pressable>
        ) : null}

        {!canAccept && !canReject && !canView && !canReverse ? (
          <View style={styles.noActionBox}>
            <MaterialCommunityIcons
              name="lock-check-outline"
              size={15}
              color="#64748b"
            />
            <Text style={styles.noActionText}>
              {isBgo
                ? "Bucket not open for execution."
                : "No TRNs in this bucket yet."}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function GroupLanding({ isLoading, error, groups, onOpenGroup, onBack }) {
  if (isLoading) {
    return (
      <View style={styles.stateWrap}>
        <ActivityIndicator size="small" color="#2563eb" />
        <Text style={styles.stateText}>Loading your allocated work...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.stateWrap}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={36}
          color="#dc2626"
        />
        <Text style={styles.stateTitle}>Could not load WMS</Text>
        <Text style={styles.stateText}>
          {error?.message || "Work stream failed."}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
    >
      <Pressable style={styles.backPill} onPress={onBack}>
        <MaterialCommunityIcons
          name="chevron-left"
          size={20}
          color="#0f172a"
        />
        <Text style={styles.backPillText}>Buckets</Text>
      </Pressable>

      <Text style={[styles.sectionEyebrow, { marginTop: 10 }]}>Individual Work</Text>
      <Text style={styles.sectionTitle}>Select TRN Type</Text>

      <View style={styles.groupGrid}>
        {groups.map((group) => (
          <Pressable
            key={group.key}
            style={styles.groupCard}
            onPress={() => onOpenGroup(group)}
          >
            <View style={styles.groupTopRow}>
              <View style={styles.groupIcon}>
                <MaterialCommunityIcons
                  name={group.icon}
                  size={23}
                  color="#2563eb"
                />
              </View>
              <View style={styles.groupTotalBadge}>
                <Text style={styles.groupTotalText}>{group.total || 0}</Text>
              </View>
            </View>

            <Text style={styles.groupTitle}>{group.title}</Text>
            <Text style={styles.groupSub}>Tap to open allocated TRNs</Text>

            <View style={styles.groupCounts}>
              <MiniCount label="Issued" value={group?.counts?.issued || 0} />
              <MiniCount
                label="Accepted"
                value={group?.counts?.accepted || 0}
              />
              <MiniCount
                label="Progress"
                value={group?.counts?.inProgress || 0}
              />
              <MiniCount
                label="Completed"
                value={group?.counts?.completed || 0}
              />
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function GroupDetail({
  title,
  backLabel = "Groups",
  stateFilter,
  setStateFilter,
  allGroupItems,
  items,
  deciding,
  onBack,
  onAccept,
  onReject,
  onExecute,
}) {
  return (
    <View style={styles.detailWrap}>
      <View style={styles.detailHeader}>
        <Pressable style={styles.backPill} onPress={onBack}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={20}
            color="#0f172a"
          />
          <Text style={styles.backPillText}>{backLabel}</Text>
        </Pressable>

        <View style={styles.detailTitleWrap}>
          <Text style={styles.sectionEyebrow}>My Allocated Work</Text>
          <Text style={styles.detailTitle}>{title}</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        style={styles.filterScroll}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {STATE_FILTERS.map((filter) => {
          const active = stateFilter === filter.key;
          const count = stateCount(allGroupItems, filter.key);

          return (
            <Pressable
              key={filter.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setStateFilter(filter.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  active && styles.filterChipTextActive,
                ]}
              >
                {filter.label}
              </Text>
              <Text
                style={[
                  styles.filterCountText,
                  active && styles.filterCountTextActive,
                ]}
              >
                {count}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {items.length === 0 ? (
          <View style={styles.emptyListCard}>
            <MaterialCommunityIcons
              name="clipboard-check-outline"
              size={35}
              color="#94a3b8"
            />
            <Text style={styles.stateTitle}>No allocated TRNs</Text>
            <Text style={styles.stateText}>
              Change filters or issue work directly to this FWR.
            </Text>
          </View>
        ) : (
          items.map((item) => (
            <WorkItemCard
              key={item.id}
              item={item}
              deciding={deciding}
              onAccept={onAccept}
              onReject={onReject}
              onExecute={onExecute}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function getMediaUrl(media = {}) {
  return (
    media?.url ||
    media?.downloadURL ||
    media?.downloadUrl ||
    media?.storageUrl ||
    media?.uri ||
    ""
  );
}

function getMediaLabel(media = {}, index = 0) {
  return (
    media?.label ||
    media?.name ||
    media?.fileName ||
    media?.filename ||
    media?.type ||
    `Instruction media ${index + 1}`
  );
}

function getInstructionMedia(item = {}) {
  const media = Array.isArray(item?.raw?.media) ? item.raw.media : [];

  return media.filter((mediaItem) => mediaItem?.tag === "instructionMedia");
}

function getInstructionMediaSummary(mediaItems = []) {
  if (!mediaItems.length) return "No instruction media";

  if (mediaItems.length === 1) return "1 instruction file";

  return `${mediaItems.length} instruction files`;
}

function getWorkItemMeterKind(item = {}) {
  return (
    item?.meterKind ||
    item?.raw?.ast?.astData?.meter?.type ||
    item?.raw?.astData?.meter?.type ||
    "NAv"
  );
}

function WorkItemCard({ item, deciding, onAccept, onReject, onExecute }) {
  const [instructionMediaVisible, setInstructionMediaVisible] = useState(false);

  const instructionMedia = getInstructionMedia(item);
  const hasInstructionMedia = instructionMedia.length > 0;
  const isAcceptedWorkItem = normalizeUpper(item?.workflowState) === "ACCEPTED";
  const isBgoWorkItem = isBgoChildItem(item);

  const canShowAccept = !isBgoWorkItem && item?.permissions?.canAccept === true;
  const canShowReject = !isBgoWorkItem && item?.permissions?.canReject === true;

  const canRejectAcceptedWork =
    !isBgoWorkItem &&
    item?.permissions?.canExecute === true &&
    isAcceptedWorkItem &&
    item?.permissions?.canReject !== true;

  return (
    <View style={styles.workCard}>
      <View style={styles.workHeader}>
        <View style={styles.workTypeIcon}>
          <MaterialCommunityIcons
            name="clipboard-text-outline"
            size={20}
            color="#2563eb"
          />
        </View>

        <View style={styles.workHeaderMain}>
          <Text style={styles.workTitle}>{item.trnTypeLabel}</Text>
          <Text style={styles.workId} numberOfLines={1} ellipsizeMode="middle">
            {item.id}
          </Text>
        </View>

        <View
          style={[styles.stateBadge, getStateBadgeStyle(item.workflowState)]}
        >
          <Text
            style={[
              styles.stateBadgeText,
              getStateBadgeTextStyle(item.workflowState),
            ]}
          >
            {String(item.workflowState || "NAv").replace("_", " ")}
          </Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <InfoLine icon="counter" label="Meter No" value={item.meterNo} />

        <InfoLine
          icon="countertop-outline"
          label="Meter Kind"
          value={getWorkItemMeterKind(item)}
        />

        <InfoLine
          icon="map-marker-outline"
          label="Address"
          value={item.address}
          fullWidth={true}
        />

        <InfoLine icon="home-city-outline" label="ERF No" value={item.erfNo} />

        <InfoLine
          icon="gauge"
          label="Meter Pre-Status"
          value={item.meterPreStatus}
        />

        <InfoLine
          icon="account-hard-hat-outline"
          label="Assigned Target"
          value={item.assignment?.targetText || "NAv"}
        />

        <InfoLine
          icon="account-tie-outline"
          label="Issued By"
          value={item.issuedBy?.name || "NAv"}
        />

        <InfoLine
          icon="clock-outline"
          label="Age"
          value={formatAge(item.ageSeconds)}
        />

        <Pressable
          style={[
            styles.instructionMediaLine,
            !hasInstructionMedia && styles.instructionMediaLineEmpty,
          ]}
          onPress={() => {
            if (!hasInstructionMedia) return;
            setInstructionMediaVisible(true);
          }}
          disabled={!hasInstructionMedia}
        >
          <MaterialCommunityIcons
            name={hasInstructionMedia ? "paperclip" : "paperclip-off"}
            size={16}
            color={hasInstructionMedia ? "#2563eb" : "#94a3b8"}
          />

          <View style={styles.instructionMediaLineMain}>
            <Text style={styles.infoLabel}>Instruction Media</Text>
            <Text
              style={[
                styles.instructionMediaLineValue,
                !hasInstructionMedia && styles.instructionMediaLineValueEmpty,
              ]}
            >
              {getInstructionMediaSummary(instructionMedia)}
            </Text>
          </View>

          {hasInstructionMedia ? (
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color="#2563eb"
            />
          ) : null}
        </Pressable>
      </View>

      {item.acceptedBy ? (
        <View style={styles.acceptedBadgeRow}>
          <MaterialCommunityIcons
            name="check-decagram"
            size={16}
            color="#16a34a"
          />
          <Text style={styles.acceptedBadgeText}>
            Accepted by {item.acceptedBy.name || "NAv"} •{" "}
            {formatDateTime(item.acceptedBy.at)}
          </Text>
        </View>
      ) : null}

      {item.rejectedBy ? (
        <View style={styles.rejectedBox}>
          <Text style={styles.rejectedTitle}>
            Rejected by {item.rejectedBy.name || "NAv"}
          </Text>
          <Text style={styles.rejectedText}>
            {item.rejectedBy.reason || "No reason captured."}
          </Text>
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        {canShowAccept ? (
          <Pressable
            style={[
              styles.actionBtn,
              styles.acceptBtn,
              deciding && styles.actionDisabled,
            ]}
            onPress={() => onAccept(item)}
            disabled={deciding}
          >
            <Text style={styles.acceptBtnText}>ACCEPT</Text>
          </Pressable>
        ) : null}

        {canShowReject ? (
          <Pressable
            style={[
              styles.actionBtn,
              styles.rejectBtn,
              deciding && styles.actionDisabled,
            ]}
            onPress={() => onReject(item)}
            disabled={deciding}
          >
            <Text style={styles.rejectBtnText}>REJECT</Text>
          </Pressable>
        ) : null}

        {item.permissions?.canExecute ? (
          <Pressable
            style={[styles.actionBtn, styles.executeBtn]}
            onPress={() => onExecute(item)}
            disabled={deciding}
          >
            <Text style={styles.executeBtnText}>EXECUTE</Text>
          </Pressable>
        ) : null}

        {canRejectAcceptedWork ? (
          <Pressable
            style={[
              styles.actionBtn,
              styles.rejectWorkBtn,
              deciding && styles.actionDisabled,
            ]}
            onPress={() => onReject(item)}
            disabled={deciding}
          >
            <Text style={styles.rejectWorkBtnText}>REJECT WORK</Text>
          </Pressable>
        ) : null}

        {!canShowAccept &&
        !canShowReject &&
        !item.permissions?.canExecute ? (
          <View style={styles.noActionBox}>
            <MaterialCommunityIcons
              name="lock-check-outline"
              size={15}
              color="#64748b"
            />
            <Text style={styles.noActionText}>
              No field action available in this state.
            </Text>
          </View>
        ) : null}
      </View>

      <InstructionMediaModal
        visible={instructionMediaVisible}
        mediaItems={instructionMedia}
        workItemId={item?.id}
        onClose={() => setInstructionMediaVisible(false)}
      />
    </View>
  );
}

function InstructionMediaModal({
  visible,
  mediaItems = [],
  workItemId,
  onClose,
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectedMedia = mediaItems[selectedIndex] || mediaItems[0] || null;
  const selectedUrl = getMediaUrl(selectedMedia);
  const selectedLabel = getMediaLabel(selectedMedia, selectedIndex);
  const selectedIsPhoto = isPhotoMedia(selectedMedia);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.instructionMediaSheet}>
          <View style={styles.modalHeader}>
            <View style={styles.modalIcon}>
              <MaterialCommunityIcons
                name="image-multiple-outline"
                size={22}
                color="#2563eb"
              />
            </View>

            <View style={styles.modalHeaderMain}>
              <Text style={styles.modalTitle}>Instruction Media</Text>
              <Text style={styles.modalSub}>{workItemId || "NAv"}</Text>
            </View>

            <Pressable style={styles.modalClose} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color="#0f172a" />
            </Pressable>
          </View>

          {mediaItems.length === 0 ? (
            <View style={styles.instructionMediaEmpty}>
              <MaterialCommunityIcons
                name="paperclip-off"
                size={30}
                color="#94a3b8"
              />
              <Text style={styles.stateTitle}>No instruction media</Text>
              <Text style={styles.stateText}>
                This work item has no office instruction media attached.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.instructionPhotoPreviewBox}>
                {selectedIsPhoto && selectedUrl ? (
                  <>
                    <Image
                      source={{ uri: selectedUrl }}
                      style={styles.instructionPhotoPreview}
                      resizeMode="contain"
                    />

                    <Text style={styles.instructionPhotoTitle}>
                      {selectedLabel}
                    </Text>
                  </>
                ) : (
                  <View style={styles.instructionPhotoUnsupported}>
                    <MaterialCommunityIcons
                      name="file-eye-outline"
                      size={38}
                      color="#94a3b8"
                    />

                    <Text style={styles.instructionPhotoUnsupportedTitle}>
                      Preview not enabled yet
                    </Text>

                    <Text style={styles.instructionPhotoUnsupportedText}>
                      Only instruction photos are previewed in this modal for
                      now.
                    </Text>
                  </View>
                )}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.instructionMediaThumbScroll}
                contentContainerStyle={styles.instructionMediaThumbRow}
              >
                {mediaItems.map((mediaItem, index) => {
                  const active = index === selectedIndex;
                  const label = getMediaLabel(mediaItem, index);
                  const url = getMediaUrl(mediaItem);
                  const isPhoto = isPhotoMedia(mediaItem);

                  return (
                    <Pressable
                      key={`${label}-${index}`}
                      style={[
                        styles.instructionMediaThumb,
                        active && styles.instructionMediaThumbActive,
                      ]}
                      onPress={() => setSelectedIndex(index)}
                    >
                      {isPhoto && url ? (
                        <Image
                          source={{ uri: url }}
                          style={styles.instructionMediaThumbImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <MaterialCommunityIcons
                          name="file-eye-outline"
                          size={18}
                          color={active ? "#ffffff" : "#2563eb"}
                        />
                      )}

                      <Text
                        numberOfLines={1}
                        style={[
                          styles.instructionMediaThumbText,
                          active && styles.instructionMediaThumbTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function InfoLine({ icon, label, value, fullWidth = false }) {
  return (
    <View style={[styles.infoLine, fullWidth && styles.infoLineFull]}>
      <MaterialCommunityIcons name={icon} size={15} color="#64748b" />

      <View style={styles.infoLineMain}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "NAv"}</Text>
      </View>
    </View>
  );
}

function MiniCount({ label, value }) {
  return (
    <View style={styles.miniCount}>
      <Text style={styles.miniCountValue}>{value}</Text>
      <Text style={styles.miniCountLabel}>{label}</Text>
    </View>
  );
}

function RejectModal({ visible, item, busy, onClose, onSubmit }) {
  const isBgoBucket = item?.itemKind === "BGO_BATCH";
  const isAcceptedWorkItem = normalizeUpper(item?.workflowState) === "ACCEPTED";
  const title = isBgoBucket
    ? "Reject BGO Bucket"
    : isAcceptedWorkItem
      ? "Reject Accepted Work"
      : "Reject Work Item";
  const placeholder = isBgoBucket
    ? "Explain why this BGO bucket cannot be accepted"
    : isAcceptedWorkItem
      ? "Explain why this accepted work item cannot be executed"
      : "Explain why this work item cannot be accepted";
  const submitText = isBgoBucket
    ? "REJECT BUCKET"
    : isAcceptedWorkItem
      ? "REJECT WORK"
      : "SUBMIT REJECTION";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <View style={styles.modalIcon}>
              <MaterialCommunityIcons
                name="close-octagon-outline"
                size={22}
                color="#dc2626"
              />
            </View>

            <View style={styles.modalHeaderMain}>
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={styles.modalSub}>{item?.id || "NAv"}</Text>
            </View>

            <Pressable
              style={styles.modalClose}
              onPress={onClose}
              disabled={busy}
            >
              <MaterialCommunityIcons name="close" size={22} color="#0f172a" />
            </Pressable>
          </View>

          <Formik
            initialValues={{ rejectReason: "" }}
            validationSchema={RejectSchema}
            enableReinitialize
            onSubmit={onSubmit}
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit,
              isSubmitting,
            }) => (
              <View>
                <Text style={styles.modalLabel}>Reject Reason</Text>
                <TextInput
                  value={values.rejectReason}
                  onChangeText={handleChange("rejectReason")}
                  onBlur={handleBlur("rejectReason")}
                  placeholder={placeholder}
                  placeholderTextColor="#94a3b8"
                  style={[
                    styles.rejectInput,
                    touched.rejectReason &&
                      errors.rejectReason &&
                      styles.rejectInputError,
                  ]}
                  editable={!busy && !isSubmitting}
                  multiline
                  textAlignVertical="top"
                />

                {touched.rejectReason && errors.rejectReason ? (
                  <Text style={styles.errorText}>{errors.rejectReason}</Text>
                ) : null}

                <View style={styles.modalActions}>
                  <Pressable
                    style={[styles.modalButton, styles.modalCancelButton]}
                    onPress={onClose}
                    disabled={busy || isSubmitting}
                  >
                    <Text style={styles.modalCancelText}>CANCEL</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.modalButton,
                      styles.modalRejectButton,
                      (busy || isSubmitting) && styles.actionDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={busy || isSubmitting}
                  >
                    {busy || isSubmitting ? (
                      <ActivityIndicator size="small" color="#7f1d1d" />
                    ) : (
                      <Text style={styles.modalRejectText}>{submitText}</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </Formik>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bucketList: {
    gap: 10,
  },
  bucketCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
  },
  bucketStatusBadge: {
    borderRadius: 999,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  bucketStatusText: {
    color: "#1d4ed8",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  bucketMetaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 9,
    marginBottom: 10,
  },
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  headerCard: {
    margin: 12,
    marginBottom: 8,
    backgroundColor: "#0f172a",
    borderRadius: 18,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
  },
  headerMain: {
    flex: 1,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },
  headerSub: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  headerCountBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  headerCountText: {
    color: "#166534",
    fontSize: 13,
    fontWeight: "900",
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 28,
  },
  sectionEyebrow: {
    color: "#2563eb",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  sectionTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10,
  },
  groupGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  groupCard: {
    width: "48%",
    minHeight: 174,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
  },
  groupTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  groupIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  groupTotalBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  groupTotalText: {
    color: "#166534",
    fontSize: 13,
    fontWeight: "900",
  },
  groupTitle: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "900",
  },
  groupSub: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
    marginBottom: 10,
  },
  groupCounts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  miniCount: {
    width: "47%",
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 6,
  },
  miniCountValue: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "900",
  },
  miniCountLabel: {
    color: "#64748b",
    fontSize: 8,
    fontWeight: "900",
    textTransform: "uppercase",
    marginTop: 1,
  },
  detailWrap: {
    flex: 1,
  },
  detailHeader: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backPill: {
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 9,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
  },
  backPillText: {
    color: "#0f172a",
    fontSize: 11,
    fontWeight: "900",
  },
  detailTitleWrap: {
    flex: 1,
  },
  detailTitle: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "900",
  },

  filterScroll: {
    flexGrow: 0,
    maxHeight: 34,
    marginBottom: 6,
  },

  filterRow: {
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 2,
    gap: 6,
    alignItems: "center",
  },

  filterChip: {
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 9,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    alignSelf: "center",
  },

  filterChipActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },

  filterChipText: {
    color: "#475569",
    fontSize: 10,
    fontWeight: "900",
    lineHeight: 12,
  },

  filterChipTextActive: {
    color: "#ffffff",
  },

  filterCountText: {
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
    color: "#64748b",
    fontSize: 9,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 17,
  },

  filterCountTextActive: {
    backgroundColor: "#334155",
    color: "#e2e8f0",
  },

  workCard: {
    backgroundColor: "#ffffff",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    marginBottom: 10,
  },
  workHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 11,
  },
  workTypeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  workHeaderMain: {
    flex: 1,
  },
  workTitle: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "900",
  },
  workId: {
    color: "#64748b",
    fontSize: 7,
    fontWeight: "800",
    marginTop: 2,
    lineHeight: 10,
  },
  stateBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  stateBadgeText: {
    fontSize: 8,
    fontWeight: "900",
  },
  badgeBlue: { backgroundColor: "#dbeafe" },
  badgeBlueText: { color: "#1d4ed8" },
  badgeGreen: { backgroundColor: "#dcfce7" },
  badgeGreenText: { color: "#166534" },
  badgeOrange: { backgroundColor: "#ffedd5" },
  badgeOrangeText: { color: "#c2410c" },
  badgeRed: { backgroundColor: "#fee2e2" },
  badgeRedText: { color: "#991b1b" },
  badgeMuted: { backgroundColor: "#f1f5f9" },
  badgeMutedText: { color: "#475569" },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  infoLine: {
    width: "48%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 9,
    paddingVertical: 8,
  },

  infoLineFull: {
    width: "100%",
  },
  infoLineMain: {
    flex: 1,
  },
  infoLabel: {
    color: "#64748b",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  infoValue: {
    color: "#0f172a",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 1,
    lineHeight: 16,
  },
  acceptedBadgeRow: {
    marginTop: 10,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 12,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  acceptedBadgeText: {
    flex: 1,
    color: "#166534",
    fontSize: 11,
    fontWeight: "800",
  },
  rejectedBox: {
    marginTop: 10,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 8,
  },
  rejectedTitle: {
    color: "#991b1b",
    fontSize: 11,
    fontWeight: "900",
  },
  rejectedText: {
    color: "#7f1d1d",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
    lineHeight: 15,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptBtn: {
    backgroundColor: "#86efac",
  },
  acceptBtnText: {
    color: "#14532d",
    fontSize: 11,
    fontWeight: "900",
  },
  rejectBtn: {
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  rejectBtnText: {
    color: "#991b1b",
    fontSize: 11,
    fontWeight: "900",
  },
  rejectWorkBtn: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  rejectWorkBtnText: {
    color: "#c2410c",
    fontSize: 11,
    fontWeight: "900",
  },
  executeBtn: {
    backgroundColor: "#0f172a",
  },
  executeBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
  },
  actionDisabled: {
    opacity: 0.55,
  },
  noActionBox: {
    flex: 1,
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  noActionText: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },
  stateWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
    gap: 8,
  },
  stateTitle: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  stateText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 17,
  },
  emptyListCard: {
    minHeight: 220,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    gap: 7,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.48)",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 56,
  },
  modalSheet: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 14,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  modalIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeaderMain: {
    flex: 1,
  },
  modalTitle: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "900",
  },
  modalSub: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2,
  },
  modalClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalLabel: {
    color: "#334155",
    fontSize: 11,
    fontWeight: "900",
    marginBottom: 6,
  },
  rejectInput: {
    minHeight: 104,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    paddingHorizontal: 11,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: "700",
  },
  rejectInputError: {
    borderColor: "#ef4444",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 6,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  modalButton: {
    minHeight: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButton: {
    flex: 0.75,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
  },
  modalRejectButton: {
    flex: 1.4,
    backgroundColor: "#fecaca",
  },
  modalCancelText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "900",
  },
  modalRejectText: {
    color: "#7f1d1d",
    fontSize: 12,
    fontWeight: "900",
  },

  instructionMediaLine: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 9,
    paddingVertical: 9,
  },

  instructionMediaLineEmpty: {
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },

  instructionMediaLineMain: {
    flex: 1,
  },

  instructionMediaLineValue: {
    color: "#1d4ed8",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 1,
  },

  instructionMediaLineValueEmpty: {
    color: "#94a3b8",
  },

  instructionMediaSheet: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 14,
    maxHeight: "72%",
  },

  instructionMediaList: {
    maxHeight: 360,
  },

  instructionMediaListContent: {
    gap: 9,
    paddingBottom: 8,
  },

  instructionMediaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    padding: 10,
  },

  instructionMediaItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },

  instructionMediaItemMain: {
    flex: 1,
  },

  instructionMediaItemTitle: {
    color: "#0f172a",
    fontSize: 12,
    fontWeight: "900",
  },

  instructionMediaItemSub: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },

  instructionMediaEmpty: {
    minHeight: 170,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    padding: 16,
  },

  instructionPhotoPreviewBox: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    minHeight: 320,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },

  instructionPhotoPreview: {
    width: "100%",
    height: 280,
    borderRadius: 12,
    backgroundColor: "#020617",
  },

  instructionPhotoTitle: {
    marginTop: 9,
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },

  instructionPhotoUnsupported: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    gap: 8,
  },

  instructionPhotoUnsupportedTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "center",
  },

  instructionPhotoUnsupportedText: {
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 16,
  },

  instructionMediaThumbScroll: {
    marginTop: 10,
    flexGrow: 0,
  },

  instructionMediaThumbRow: {
    gap: 8,
    paddingBottom: 2,
  },

  instructionMediaThumb: {
    minWidth: 108,
    maxWidth: 150,
    minHeight: 44,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  instructionMediaThumbActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },

  instructionMediaThumbImage: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: "#dbeafe",
  },

  instructionMediaThumbText: {
    flex: 1,
    color: "#1d4ed8",
    fontSize: 10,
    fontWeight: "900",
  },

  instructionMediaThumbTextActive: {
    color: "#ffffff",
  },

  accessBackButton: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    marginTop: 8,
  },

  accessBackButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
});
