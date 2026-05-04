import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Formik } from "formik";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Divider,
  Modal,
  Portal,
  RadioButton,
  Surface,
  Text,
  TextInput,
} from "react-native-paper";
import { array, object, string } from "yup";

import { httpsCallable } from "firebase/functions";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

import { IrepsFormActions } from "../../../components/forms/IrepsFormActions";
import IrepsSelectWithOther, {
  isSelectWithOtherFilled,
  normalizeSelectWithOtherValue,
  selectWithOtherToText,
} from "../../../components/IrepsSelectWithOther";
import { IrepsMedia } from "../../../components/media/IrepsMedia";
import { ScreenLock } from "../../../components/SceenLock";
import { useWarehouse } from "../../../src/context/WarehouseContext";
import { functions } from "../../../src/firebase";
import { useAuth } from "../../../src/hooks/useAuth";
import { useIrepsLookupOptions } from "../../../src/hooks/useIrepsLookupOptions";
import { useGetServiceProvidersQuery } from "../../../src/redux/spApi";
import {
  addSubmissionQueueItem,
  getSubmissionQueueItemById,
  removeSubmissionQueueItem,
  updateSubmissionQueueItem,
} from "../../../src/utils/submissionQueue";

const EMPTY_SELECT_WITH_OTHER = {
  code: "",
  label: "",
  otherText: "",
};

function makeEmptySelectWithOther() {
  return { ...EMPTY_SELECT_WITH_OTHER };
}

function buildMeterReconnectionTrnId({ wardPcode, erfNo, meterType }) {
  const ts = Date.now();

  const safeWardPcode = String(wardPcode || "NAv")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 12);

  const safeErfNo = String(erfNo || "NAv")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 12);

  const typeCode =
    meterType === "water" ? "WTR" : meterType === "electricity" ? "ELC" : "NA";

  return `TRN_MRCN_${ts}_${typeCode}_${safeWardPcode}_${safeErfNo}`;
}

function withSubmitTimeout(promise, timeoutMs = 15000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => {
        reject(new Error("SUBMISSION_TIMEOUT"));
      }, timeoutMs),
    ),
  ]);
}

function removeUndefined(value) {
  return JSON.parse(
    JSON.stringify(value, (_key, item) => (item === undefined ? null : item)),
  );
}

function toLatLng(value) {
  if (!value) return null;

  if (Array.isArray(value) && value.length === 2) {
    return { lat: Number(value[0]), lng: Number(value[1]) };
  }

  if (value?.lat != null && value?.lng != null) {
    return { lat: Number(value.lat), lng: Number(value.lng) };
  }

  if (value?.latitude != null && value?.longitude != null) {
    return { lat: Number(value.latitude), lng: Number(value.longitude) };
  }

  return null;
}

function getPremiseAddress(premise, astDoc) {
  const premiseAddress =
    `${premise?.address?.strNo || ""} ${premise?.address?.strName || ""} ${
      premise?.address?.strType || ""
    }`.trim();

  return premiseAddress || astDoc?.accessData?.premise?.address || "NAv";
}

function getPropertyType(premise, astDoc) {
  const propType =
    `${premise?.propertyType?.type || ""} ${premise?.propertyType?.name || ""} ${
      premise?.propertyType?.unitNo || ""
    }`.trim();

  return propType || astDoc?.accessData?.premise?.propertyType || "NAv";
}

function resolveMncServiceProvider(spId, allServiceProviders, visited = []) {
  if (!spId || visited.includes(spId)) return null;

  const sp = allServiceProviders.find((s) => s.id === spId);
  if (!sp) return null;

  const isMnc = (sp.clients || []).some(
    (c) => c.clientType === "LM" && c.relationshipType === "MNC",
  );

  if (isMnc) {
    return {
      id: sp.id,
      name: sp?.profile?.tradingName || sp.id,
    };
  }

  const parent = (sp.clients || []).find(
    (c) => c.clientType === "SP" && c.relationshipType === "SUBC",
  );

  if (!parent?.id) {
    return {
      id: sp.id,
      name: sp?.profile?.tradingName || sp.id,
    };
  }

  return resolveMncServiceProvider(parent.id, allServiceProviders, [
    ...visited,
    spId,
  ]);
}

function textToOtherSelectValue(text) {
  const clean = String(text || "").trim();

  if (!clean) return makeEmptySelectWithOther();

  return {
    code: "OTHER",
    label: "Other",
    otherText: clean,
  };
}

function normalizeInstructionValue(value) {
  if (!value) return makeEmptySelectWithOther();

  if (typeof value === "string") {
    return textToOtherSelectValue(value);
  }

  if (value?.code !== undefined || value?.otherText !== undefined) {
    return normalizeSelectWithOtherValue(value);
  }

  if (value?.text) {
    return textToOtherSelectValue(value.text);
  }

  return makeEmptySelectWithOther();
}

function normalizeNoReadingReasonValue(value) {
  if (!value) return makeEmptySelectWithOther();

  if (typeof value === "string") {
    return textToOtherSelectValue(value);
  }

  if (value?.code !== undefined || value?.otherText !== undefined) {
    return normalizeSelectWithOtherValue(value);
  }

  return makeEmptySelectWithOther();
}

function buildBackendReconnectionPayload(reconnection = {}) {
  return {
    instruction: {
      text: selectWithOtherToText(reconnection?.instruction),
    },

    supplyReconnected: {
      answer: reconnection?.supplyReconnected?.answer || "",
      notes: reconnection?.supplyReconnected?.notes || "",
    },

    meterReading: {
      reading: String(reconnection?.meterReading?.reading || ""),
      noReadingReason: selectWithOtherToText(
        reconnection?.meterReading?.noReadingReason,
      ),
    },
  };
}

const ReconnectionSchema = object().shape({
  reconnection: object().shape({
    instruction: object()
      .shape({
        code: string().notRequired(),
        label: string().notRequired(),
        otherText: string().notRequired(),
      })
      .test(
        "reconnection-instruction-required",
        "Reconnection instruction is required",
        function (value) {
          return isSelectWithOtherFilled(value);
        },
      ),

    supplyReconnected: object().shape({
      answer: string().oneOf(["yes", "no"]).required("Required"),
      notes: string().when("answer", {
        is: "no",
        then: (s) => s.trim().required("Notes required when answer is no"),
        otherwise: (s) => s.notRequired(),
      }),
    }),

    meterReading: object().shape({
      reading: string().test(
        "reading-or-reason",
        "Meter reading or no-reading reason is required",
        function (value) {
          const noReadingReason = this.parent?.noReadingReason;

          return (
            !!String(value || "").trim() ||
            isSelectWithOtherFilled(noReadingReason)
          );
        },
      ),

      noReadingReason: object()
        .shape({
          code: string().notRequired(),
          label: string().notRequired(),
          otherText: string().notRequired(),
        })
        .test(
          "reason-or-reading",
          "No-reading reason is required when no meter reading is captured",
          function (value) {
            const reading = this.parent?.reading;

            return (
              !!String(reading || "").trim() || isSelectWithOtherFilled(value)
            );
          },
        ),
    }),
  }),

  media: array()
    .of(object())
    .test(
      "reconnection-evidence",
      "Reconnection evidence missing",
      function (value) {
        const reconnection = this.parent?.reconnection || {};
        const meterReading = String(
          reconnection?.meterReading?.reading || "",
        ).trim();

        if (!value?.some((m) => m.tag === "reconnectionInstructionEvidence")) {
          return this.createError({
            message: "Reconnection instruction evidence required",
          });
        }

        if (
          reconnection?.supplyReconnected?.answer === "yes" &&
          !value?.some((m) => m.tag === "reconnectionEvidence")
        ) {
          return this.createError({
            message: "Reconnection evidence required",
          });
        }

        if (
          meterReading &&
          !value?.some((m) => m.tag === "reconnectionMeterReadingEvidence")
        ) {
          return this.createError({
            message: "Reconnection meter reading evidence required",
          });
        }

        return true;
      },
    ),
});

const YesNoQuestion = ({
  title,
  description,
  value,
  notes,
  answerPath,
  notesPath,
  setFieldValue,
  errorText,
  children,
}) => {
  return (
    <Surface style={styles.questionCard} elevation={1}>
      <View style={styles.questionHeader}>
        <Text style={styles.questionTitle}>{title}</Text>
        <Text style={styles.questionDescription}>{description}</Text>
      </View>

      <RadioButton.Group
        value={value}
        onValueChange={(nextValue) => setFieldValue(answerPath, nextValue)}
      >
        <View style={styles.radioRow}>
          <TouchableOpacity
            style={[
              styles.radioChoice,
              value === "yes" && styles.radioChoiceYes,
            ]}
            onPress={() => setFieldValue(answerPath, "yes")}
          >
            <RadioButton value="yes" />
            <Text style={styles.radioText}>YES</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.radioChoice, value === "no" && styles.radioChoiceNo]}
            onPress={() => setFieldValue(answerPath, "no")}
          >
            <RadioButton value="no" />
            <Text style={styles.radioText}>NO</Text>
          </TouchableOpacity>
        </View>
      </RadioButton.Group>

      {value === "no" && (
        <TextInput
          mode="outlined"
          label="Reason / Notes"
          value={notes}
          onChangeText={(text) => setFieldValue(notesPath, text)}
          multiline
          numberOfLines={3}
          style={styles.notesInput}
        />
      )}

      <View style={styles.questionEvidenceSlot}>{children}</View>

      {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}
    </Surface>
  );
};

export default function FormMeterReconnection() {
  const {
    astId: astIdRaw,
    premiseId: premiseIdRaw,
    action: actionRaw,
    queueItemId: queueItemIdRaw,
  } = useLocalSearchParams();

  const astId = Array.isArray(astIdRaw) ? astIdRaw[0] : astIdRaw;
  const premiseId = Array.isArray(premiseIdRaw)
    ? premiseIdRaw[0]
    : premiseIdRaw;
  const queueItemId = Array.isArray(queueItemIdRaw)
    ? queueItemIdRaw[0]
    : queueItemIdRaw;

  const action = useMemo(() => {
    try {
      return actionRaw ? JSON.parse(actionRaw) : {};
    } catch (_error) {
      return {};
    }
  }, [actionRaw]);

  const router = useRouter();
  const { all } = useWarehouse();
  const { profile, user } = useAuth();
  const { data: allServiceProviders = [] } = useGetServiceProvidersQuery();

  const [editQueueItem, setEditQueueItem] = useState(undefined);
  const [inProgress, setInProgress] = useState(false);
  const [initialEligible, setInitialEligible] = useState(null);

  const [submitOutcome, setSubmitOutcome] = useState({
    visible: false,
    type: null,
    title: "",
    message: "",
    goBackOnContinue: true,
  });

  const agentUid = user?.uid || "unknown_uid";
  const agentName = profile?.profile?.displayName || "Field Agent";

  useEffect(() => {
    let mounted = true;

    const loadEditQueueItem = async () => {
      if (!queueItemId) {
        if (mounted) setEditQueueItem(null);
        return;
      }

      const queueItem = await getSubmissionQueueItemById(queueItemId);

      if (mounted) {
        setEditQueueItem(queueItem || null);
      }
    };

    loadEditQueueItem();

    return () => {
      mounted = false;
    };
  }, [queueItemId]);

  const isEditMode = !!queueItemId;

  const astDoc = useMemo(() => {
    const id = astId || action?.astId;
    if (!id) return null;

    return (all?.meters || []).find((meter) => meter?.id === id) || null;
  }, [all?.meters, astId, action?.astId]);

  const premise = useMemo(() => {
    const id =
      premiseId || astDoc?.accessData?.premise?.id || action?.premiseId || null;

    if (!id) return null;

    return (all?.prems || []).find((p) => p?.id === id) || null;
  }, [all?.prems, premiseId, astDoc?.accessData?.premise?.id, action]);

  const astData = astDoc?.ast?.astData || {};
  const meter = astData?.meter || {};
  const meterNo = astData?.astNo || action?.meterNo || "NAv";
  const meterType = astDoc?.meterType || action?.meterType || "NAv";
  const meterKind = String(meter?.type || "NAv").toLowerCase();
  const currentStatus = String(
    astDoc?.status?.state || "UNKNOWN",
  ).toUpperCase();

  const parents = astDoc?.accessData?.parents || premise?.parents || {};
  const wardPcode = parents?.wardPcode || "NAv";
  const lmPcode = parents?.lmPcode || "NAv";
  const erfNo = astDoc?.accessData?.erfNo || premise?.erfNo || "NAv";

  const premiseAddress = getPremiseAddress(premise, astDoc);
  const propType = getPropertyType(premise, astDoc);

  const fallbackGps =
    toLatLng(astDoc?.ast?.location?.gps) ||
    toLatLng(premise?.geometry?.centroid) ||
    null;

  const trnId = useMemo(
    () =>
      buildMeterReconnectionTrnId({
        wardPcode,
        erfNo,
        meterType,
      }),
    [wardPcode, erfNo, meterType],
  );

  useEffect(() => {
    if (initialEligible !== null) return;
    if (!astDoc?.id) return;

    const firstStatus = String(astDoc?.status?.state || "").toUpperCase();

    if (!firstStatus) return;

    setInitialEligible(firstStatus === "DISCONNECTED");
  }, [initialEligible, astDoc?.id, astDoc?.status?.state]);

  const isEligible = initialEligible === true;

  const userSpId = profile?.employment?.serviceProvider?.id;

  const serviceProvider = useMemo(() => {
    const resolvedMnc = resolveMncServiceProvider(
      userSpId,
      allServiceProviders,
    );

    return (
      resolvedMnc || {
        id: userSpId || "NAv",
        name: profile?.employment?.serviceProvider?.name || "NAv",
      }
    );
  }, [
    userSpId,
    allServiceProviders,
    profile?.employment?.serviceProvider?.name,
  ]);

  const reconnectionInstructionLookup = useIrepsLookupOptions(
    "METER_RECONNECTION_INSTRUCTION",
  );

  const noReadingReasonLookup = useIrepsLookupOptions(
    "METER_NO_READING_REASON",
  );

  function buildTrnSystemFields() {
    return {
      erfId: astDoc?.accessData?.erfId || premise?.erfId || "NAv",
      erfNo: astDoc?.accessData?.erfNo || premise?.erfNo || "NAv",
      trnType: "METER_RECONNECTION",

      parents: {
        countryPcode: parents?.countryPcode || "NAv",
        provincePcode: parents?.provincePcode || "NAv",
        dmPcode: parents?.dmPcode || "NAv",
        lmPcode: parents?.lmPcode || "NAv",
        wardPcode: parents?.wardPcode || "NAv",
      },

      premise: {
        id: astDoc?.accessData?.premise?.id || premise?.id || "NAv",
        address: premiseAddress || "NAv",
        propertyType: propType || "NAv",
      },
    };
  }

  function buildReconnectionFailureMessage(values, result) {
    const reasons = [];

    if (values?.reconnection?.supplyReconnected?.answer !== "yes") {
      reasons.push("Supply reconnection was not confirmed.");
    }

    const reasonText = reasons.length
      ? reasons.map((reason) => `• ${reason}`).join("\n")
      : "• Reconnection rules were not fully satisfied.";

    return [
      "The reconnection TRN was submitted and saved for audit, but the meter was not moved to CONNECTED.",
      "",
      "Reason:",
      reasonText,
      "",
      `AST status: ${result?.astStatusAfter || currentStatus}`,
      "",
      "This submitted form cannot be modified.",
      "A new reconnection form must be completed and submitted.",
    ].join("\n");
  }

  function getInitialValues() {
    const editPayload = editQueueItem?.payload || null;

    if (editPayload) {
      return {
        ...editPayload,
        reconnection: {
          ...editPayload?.reconnection,
          instruction: normalizeInstructionValue(
            editPayload?.reconnection?.instruction,
          ),
          meterReading: {
            ...editPayload?.reconnection?.meterReading,
            reading: editPayload?.reconnection?.meterReading?.reading || "",
            noReadingReason: normalizeNoReadingReasonValue(
              editPayload?.reconnection?.meterReading?.noReadingReason,
            ),
          },
        },
      };
    }

    return {
      id: trnId,

      accessData: {
        access: {
          hasAccess: "yes",
          reason: "NAv",
        },
      },

      ast: {
        astData: {
          astId: astDoc?.id || astId || "NAv",
          astNo: astData?.astNo || "NAv",
          astManufacturer: astData?.astManufacturer || "NAv",
          astName: astData?.astName || "NAv",
          meter: {
            type: meter?.type || "NAv",
            category: meter?.category || "NAv",
          },
        },
      },

      reconnection: {
        instruction: makeEmptySelectWithOther(),

        supplyReconnected: {
          answer: "",
          notes: "",
        },

        meterReading: {
          reading: "",
          noReadingReason: makeEmptySelectWithOther(),
        },
      },

      assignment: {
        instruction: {
          code: "METER_RECONNECTION",
          text: "Reconnect meter supply and confirm the supply has been made good again",
          notes: "",
          mediaRequired: true,
        },

        createdFor: {
          type: "USER",
          id: agentUid,
          name: agentName,
        },

        acceptedRejectedAt: null,
        acceptedRejectedUid: null,
        acceptedRejectedUser: null,
        rejectReason: "",

        cancelledAt: null,
        cancelledByUid: null,
        cancelledByUser: null,
        cancelReason: "",
      },

      meterType,

      media: [],

      status: {
        state: astDoc?.status?.state || "UNKNOWN",
        id: astDoc?.status?.id || lmPcode || "NAv",
        detail: astDoc?.status?.detail || lmPcode || "NAv",
      },
    };
  }

  const actionInit = useMemo(
    () => getInitialValues(),
    [
      editQueueItem,
      trnId,
      astDoc?.id,
      astId,
      astData?.astNo,
      astData?.astManufacturer,
      astData?.astName,
      meter?.type,
      meter?.category,
      meterType,
      agentUid,
      agentName,
      lmPcode,
      astDoc?.status?.state,
      astDoc?.status?.id,
      astDoc?.status?.detail,
    ],
  );

  const handleSubmitReconnection = async (values) => {
    if (!astDoc?.id) {
      Alert.alert("Error", "AST data not found.");
      return;
    }

    if (!isEligible) {
      Alert.alert(
        "Not Eligible",
        "Only DISCONNECTED meters can be reconnected.",
      );
      return;
    }

    const baseSystemFields = buildTrnSystemFields();

    let cleanPayload = removeUndefined({
      id: values.id,

      accessData: {
        ...baseSystemFields,
        access: values.accessData.access,
      },

      ast: values.ast,
      reconnection: buildBackendReconnectionPayload(values.reconnection),
      assignment: values.assignment,
      meterType: values.meterType,
      media: values.media || [],
      status: values.status,
      serviceProvider,
    });

    const saveDraftToQueue = async (messageTitle, messageBody) => {
      const nextContext = {
        trnType: "METER_RECONNECTION",
        astId: astDoc?.id || "NAv",
        meterNo: values?.ast?.astData?.astNo || "NAv",
        meterType: cleanPayload?.meterType || "NAv",
        erfId: baseSystemFields?.erfId || "NAv",
        erfNo: baseSystemFields?.erfNo || "NAv",
        premiseId: baseSystemFields?.premise?.id || "NAv",
        lmPcode: lmPcode || "NAv",
        wardPcode: wardPcode || "NAv",
      };

      let queueResult = null;

      if (queueItemId) {
        const existingSync = editQueueItem?.sync || {
          attempts: 0,
          lastAttemptAt: "NAv",
          nextRetryAt: "NAv",
        };

        queueResult = await updateSubmissionQueueItem(
          queueItemId,
          {
            payload: cleanPayload,
            context: nextContext,
            status: "PENDING",
            result: {
              success: false,
              code: "NAv",
              message: "NAv",
              trnId: "NAv",
            },
            sync: {
              ...existingSync,
              nextRetryAt: "NAv",
            },
          },
          agentUid,
          agentName,
        );
      } else {
        queueResult = await addSubmissionQueueItem({
          formType: "METER_RECONNECTION",
          payload: cleanPayload,
          context: nextContext,
          createdByUid: agentUid,
          createdByUser: agentName,
        });
      }

      if (!queueResult?.success) {
        Alert.alert(
          "Draft Save Failed",
          "Failed to save reconnection draft locally.",
        );
        return false;
      }

      setSubmitOutcome({
        visible: true,
        type: "savedLocally",
        title: messageTitle || "SAVED LOCALLY",
        message: messageBody,
        goBackOnContinue: true,
      });

      return true;
    };

    try {
      setInProgress(true);

      const netState = await NetInfo.fetch();
      const isOnline = netState.isConnected && netState.isInternetReachable;

      if (!isOnline) {
        await saveDraftToQueue(
          "Saved Offline",
          "No internet connection. This reconnection TRN was saved locally.",
        );

        setInProgress(false);
        return;
      }

      const storage = getStorage();

      const syncedMedia = await Promise.all(
        (values?.media || []).map(async (item) => {
          if (item.uri && !item.url) {
            const fileName = `${baseSystemFields.erfId}_${item.tag}_${Date.now()}.jpg`;
            const storageRef = ref(
              storage,
              `meters/lifecycle/reconnection/${fileName}`,
            );

            const response = await fetch(item.uri);
            const blob = await response.blob();

            await uploadBytes(storageRef, blob);

            const downloadUrl = await getDownloadURL(storageRef);

            const { uri, ...cleanItem } = item;
            return {
              ...cleanItem,
              url: downloadUrl,
            };
          }

          const { uri, ...cleanItem } = item || {};
          return cleanItem;
        }),
      );

      cleanPayload = {
        ...cleanPayload,
        media: syncedMedia,
      };

      const onMeterLifecycleTrnCallable = httpsCallable(
        functions,
        "onMeterLifecycleTrnCallable",
      );

      let result = null;

      try {
        const callableResult = await withSubmitTimeout(
          onMeterLifecycleTrnCallable(cleanPayload),
          15000,
        );

        result = callableResult?.data || {};
      } catch (error) {
        if (error?.message === "SUBMISSION_TIMEOUT") {
          await saveDraftToQueue(
            "Saved Locally",
            "The submission is taking too long. Your reconnection data has been saved locally.",
          );

          setInProgress(false);
          return;
        }

        setInProgress(false);

        Alert.alert(
          "Submission Failed",
          error?.message || "Meter reconnection submission failed.",
        );

        return;
      }

      if (!result?.success) {
        setInProgress(false);

        Alert.alert(
          "Submission Failed",
          result?.message || "Meter reconnection submission failed.",
        );

        return;
      }

      if (queueItemId) {
        await removeSubmissionQueueItem(queueItemId);
      }

      setInProgress(false);

      if (
        result?.astStatusChanged === true &&
        result?.astStatusAfter === "CONNECTED"
      ) {
        setSubmitOutcome({
          visible: true,
          type: "success",
          title: "METER RECONNECTED",
          message:
            "The reconnection TRN was submitted and the meter was moved to CONNECTED.",
          goBackOnContinue: true,
        });

        return;
      }

      setSubmitOutcome({
        visible: true,
        type: "reconnectionFailed",
        title: "RECONNECTION DID NOT PASS",
        message: buildReconnectionFailureMessage(values, result),
        goBackOnContinue: true,
      });
    } catch (error) {
      console.error("Reconnection Submission Error:", error);
      Alert.alert("Error", error?.message || "Submission failed");
      setInProgress(false);
    }
  };

  const confirmCancel = () => {
    Alert.alert(
      "Cancel Reconnection Form?",
      "This reconnection form has not been submitted. If you cancel now, the captured data will be lost.",
      [
        {
          text: "STAY",
          style: "cancel",
        },
        {
          text: "CANCEL FORM",
          style: "destructive",
          onPress: () => router.back(),
        },
      ],
    );
  };

  if (isEditMode && editQueueItem === undefined) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loaderText}>Loading draft...</Text>
      </View>
    );
  }

  if (isEditMode && editQueueItem === null) {
    return (
      <View style={styles.loaderWrap}>
        <Text style={styles.loaderText}>Draft not found.</Text>
      </View>
    );
  }

  if (!astDoc || initialEligible === null) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loaderText}>Loading meter...</Text>
      </View>
    );
  }

  if (initialEligible === false) {
    return (
      <ScrollView style={styles.container}>
        <Stack.Screen
          options={{
            title: "Reconnect Meter",
            headerTitleStyle: { fontSize: 14, fontWeight: "900" },
          }}
        />

        <Surface style={styles.notEligibleCard} elevation={2}>
          <MaterialCommunityIcons
            name="lock-alert-outline"
            size={42}
            color="#f59e0b"
          />

          <Text style={styles.notEligibleTitle}>
            Meter Not Eligible For Reconnection
          </Text>

          <Text style={styles.notEligibleText}>
            Only DISCONNECTED meters can be reconnected.
          </Text>

          <Divider style={{ width: "100%", marginVertical: 16 }} />

          <Text style={styles.summaryLine}>Status: {currentStatus}</Text>
          <Text style={styles.summaryLine}>Meter Type: {meterType}</Text>
          <Text style={styles.summaryLine}>Meter Kind: {meterKind}</Text>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>GO BACK</Text>
          </TouchableOpacity>
        </Surface>
      </ScrollView>
    );
  }

  return (
    <>
      <ScreenLock
        visible={inProgress}
        title="RECONNECTION"
        status="Securing lifecycle transaction..."
      />

      <Formik
        initialValues={actionInit}
        onSubmit={handleSubmitReconnection}
        validationSchema={ReconnectionSchema}
        enableReinitialize={true}
        validateOnMount={true}
        validateOnChange={true}
      >
        {({
          values,
          setFieldValue,
          handleSubmit,
          resetForm,
          validateForm,
          errors,
          isValid,
        }) => {
          const reconnectionErrors = errors?.reconnection || {};

          return (
            <ScrollView
              style={styles.container}
              contentContainerStyle={{ paddingBottom: 50 }}
            >
              <Stack.Screen
                options={{
                  title: `Reconnect ${meterNo}`,
                  headerTitleStyle: { fontSize: 14, fontWeight: "900" },
                  headerLeft: () => (
                    <TouchableOpacity
                      onPress={confirmCancel}
                      style={{ marginLeft: 10, padding: 5 }}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name="arrow-left"
                        size={24}
                        color="#1e293b"
                      />
                    </TouchableOpacity>
                  ),
                  headerRight: () => (
                    <View style={{ marginRight: 15 }}>
                      <Text style={styles.headerStatus}>{currentStatus}</Text>
                    </View>
                  ),
                }}
              />

              <Surface style={styles.card} elevation={1}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons
                    name="counter"
                    size={18}
                    color="#16a34a"
                  />
                  <Text style={styles.sectionTitle}>Meter Summary</Text>
                </View>

                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Meter No</Text>
                    <Text style={styles.summaryValue}>{meterNo}</Text>
                  </View>

                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Manufacturer</Text>
                    <Text style={styles.summaryValue}>
                      {astData?.astManufacturer || "NAv"}
                    </Text>
                  </View>

                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Model</Text>
                    <Text style={styles.summaryValue}>
                      {astData?.astName || "NAv"}
                    </Text>
                  </View>

                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Meter Type</Text>
                    <Text style={styles.summaryValue}>{meterType}</Text>
                  </View>

                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Meter Kind</Text>
                    <Text style={styles.summaryValue}>{meterKind}</Text>
                  </View>

                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Current Status</Text>
                    <Text style={styles.summaryValue}>{currentStatus}</Text>
                  </View>
                </View>

                <Divider style={{ marginVertical: 12 }} />

                <View style={styles.addressRow}>
                  <MaterialCommunityIcons
                    name="map-marker-outline"
                    size={16}
                    color="#64748b"
                  />
                  <Text style={styles.addressText}>
                    ERF {erfNo} • {premiseAddress}
                  </Text>
                </View>
              </Surface>

              <Surface style={styles.card} elevation={1}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons
                    name="text-box-check-outline"
                    size={18}
                    color="#16a34a"
                  />
                  <Text style={styles.sectionTitle}>
                    Reconnection Instruction
                  </Text>
                </View>

                <IrepsSelectWithOther
                  label="Reconnection Instruction"
                  placeholder="Select reconnection instruction"
                  options={reconnectionInstructionLookup.options}
                  includeOther={
                    reconnectionInstructionLookup.allowOther ?? true
                  }
                  otherCode={reconnectionInstructionLookup.otherCode || "OTHER"}
                  otherLabel={
                    reconnectionInstructionLookup.otherLabel || "Other"
                  }
                  loading={
                    reconnectionInstructionLookup.isLoading ||
                    reconnectionInstructionLookup.isFetching
                  }
                  value={values?.reconnection?.instruction}
                  onChange={(nextValue) =>
                    setFieldValue("reconnection.instruction", nextValue)
                  }
                  errorText={
                    typeof reconnectionErrors?.instruction === "string"
                      ? reconnectionErrors.instruction
                      : ""
                  }
                />

                <IrepsMedia
                  name="media"
                  tag="reconnectionInstructionEvidence"
                  agentName={agentName}
                  agentUid={agentUid}
                  fallbackGps={fallbackGps}
                  required={true}
                />

                {typeof errors?.media === "string" &&
                  errors.media.toLowerCase().includes("instruction") && (
                    <Text style={styles.errorText}>{errors.media}</Text>
                  )}
              </Surface>

              <Surface style={styles.card} elevation={1}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons
                    name="power-plug-outline"
                    size={18}
                    color="#16a34a"
                  />
                  <Text style={styles.sectionTitle}>Reconnection Checks</Text>
                </View>

                <YesNoQuestion
                  title="Supply reconnected"
                  description="Confirm that supply was made good again."
                  value={values?.reconnection?.supplyReconnected?.answer}
                  notes={values?.reconnection?.supplyReconnected?.notes}
                  answerPath="reconnection.supplyReconnected.answer"
                  notesPath="reconnection.supplyReconnected.notes"
                  setFieldValue={setFieldValue}
                  errorText={
                    reconnectionErrors?.supplyReconnected?.answer ||
                    reconnectionErrors?.supplyReconnected?.notes
                  }
                >
                  <IrepsMedia
                    name="media"
                    tag="reconnectionEvidence"
                    agentName={agentName}
                    agentUid={agentUid}
                    fallbackGps={fallbackGps}
                    required={
                      values?.reconnection?.supplyReconnected?.answer === "yes"
                    }
                  />
                </YesNoQuestion>

                <Surface style={styles.questionCard} elevation={1}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionTitle}>Meter reading</Text>
                    <Text style={styles.questionDescription}>
                      Enter the meter reading. If no reading is available,
                      provide the reason.
                    </Text>
                  </View>

                  <TextInput
                    mode="outlined"
                    label="Meter Reading"
                    value={values?.reconnection?.meterReading?.reading}
                    onChangeText={(text) =>
                      setFieldValue(
                        "reconnection.meterReading.reading",
                        text.replace(/[^\d.]/g, ""),
                      )
                    }
                    keyboardType="numeric"
                    style={styles.readingInput}
                  />

                  <IrepsSelectWithOther
                    label="No Reading Reason"
                    placeholder="Select reason"
                    options={noReadingReasonLookup.options}
                    includeOther={noReadingReasonLookup.allowOther ?? true}
                    otherCode={noReadingReasonLookup.otherCode || "OTHER"}
                    otherLabel={noReadingReasonLookup.otherLabel || "Other"}
                    loading={
                      noReadingReasonLookup.isLoading ||
                      noReadingReasonLookup.isFetching
                    }
                    value={values?.reconnection?.meterReading?.noReadingReason}
                    onChange={(nextValue) =>
                      setFieldValue(
                        "reconnection.meterReading.noReadingReason",
                        nextValue,
                      )
                    }
                    errorText={
                      reconnectionErrors?.meterReading?.noReadingReason
                    }
                  />

                  <View style={styles.questionEvidenceSlot}>
                    <IrepsMedia
                      name="media"
                      tag="reconnectionMeterReadingEvidence"
                      agentName={agentName}
                      agentUid={agentUid}
                      fallbackGps={fallbackGps}
                      required={
                        !!String(
                          values?.reconnection?.meterReading?.reading || "",
                        ).trim()
                      }
                    />
                  </View>

                  {!!(
                    reconnectionErrors?.meterReading?.reading ||
                    reconnectionErrors?.meterReading?.noReadingReason
                  ) && (
                    <Text style={styles.errorText}>
                      {reconnectionErrors?.meterReading?.reading ||
                        reconnectionErrors?.meterReading?.noReadingReason}
                    </Text>
                  )}
                </Surface>

                {typeof errors?.media === "string" && (
                  <Text style={styles.errorText}>{errors.media}</Text>
                )}
              </Surface>

              <IrepsFormActions
                resetLabel="RESET"
                submitLabel="SUBMIT RECONNECTION"
                canSubmit={isValid}
                loading={inProgress}
                onReset={() => {
                  Alert.alert(
                    "Reset Form?",
                    "This will clear your changes and return the form to the state it had when it first loaded.",
                    [
                      {
                        text: "KEEP EDITING",
                        style: "cancel",
                      },
                      {
                        text: "RESET",
                        style: "destructive",
                        onPress: () => {
                          resetForm();

                          setTimeout(() => {
                            validateForm();
                          }, 0);
                        },
                      },
                    ],
                  );
                }}
                onSubmit={handleSubmit}
                disabledReason="Complete all required fields before submitting."
              />

              <Portal>
                <Modal
                  visible={submitOutcome.visible}
                  dismissable={false}
                  contentContainerStyle={[
                    styles.successModal,
                    submitOutcome.type === "reconnectionFailed" &&
                      styles.failedOutcomeModal,
                  ]}
                >
                  <View style={styles.successContent}>
                    <View
                      style={[
                        styles.successIconCircle,
                        submitOutcome.type === "reconnectionFailed" &&
                          styles.failedIconCircle,
                        submitOutcome.type === "savedLocally" &&
                          styles.savedLocallyIconCircle,
                      ]}
                    >
                      <Feather
                        name={
                          submitOutcome.type === "reconnectionFailed"
                            ? "alert-triangle"
                            : submitOutcome.type === "savedLocally"
                              ? "download-cloud"
                              : "check"
                        }
                        size={46}
                        color="#fff"
                      />
                    </View>

                    <Text
                      style={[
                        styles.successTitle,
                        submitOutcome.type === "reconnectionFailed" &&
                          styles.failedOutcomeTitle,
                      ]}
                    >
                      {submitOutcome.title}
                    </Text>

                    <Text style={styles.outcomeMessage}>
                      {submitOutcome.message}
                    </Text>

                    <TouchableOpacity
                      style={[
                        styles.continueBtn,
                        submitOutcome.type === "reconnectionFailed" &&
                          styles.failedContinueBtn,
                      ]}
                      onPress={() => {
                        const shouldGoBack = submitOutcome.goBackOnContinue;

                        setSubmitOutcome({
                          visible: false,
                          type: null,
                          title: "",
                          message: "",
                          goBackOnContinue: true,
                        });

                        if (shouldGoBack) {
                          router.back();
                        }
                      }}
                    >
                      <Text style={styles.continueBtnText}>CONTINUE</Text>
                    </TouchableOpacity>
                  </View>
                </Modal>
              </Portal>
            </ScrollView>
          );
        }}
      </Formik>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },

  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F8FAFC",
  },

  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
    fontWeight: "700",
    textAlign: "center",
  },

  headerStatus: {
    color: "#16a34a",
    fontSize: 12,
    fontWeight: "900",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    margin: 12,
    padding: 14,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#1E293B",
    textTransform: "uppercase",
  },

  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  summaryItem: {
    width: "48%",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  summaryLabel: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 4,
  },

  summaryValue: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "800",
  },

  addressRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  addressText: {
    marginLeft: 6,
    color: "#334155",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },

  questionCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  questionHeader: {
    marginBottom: 8,
  },

  questionTitle: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "900",
  },

  questionDescription: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 3,
  },

  radioRow: {
    flexDirection: "row",
    gap: 10,
  },

  radioChoice: {
    flex: 1,
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },

  radioChoiceYes: {
    borderColor: "#22C55E",
    backgroundColor: "#F0FDF4",
  },

  radioChoiceNo: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },

  radioText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#334155",
  },

  notesInput: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
  },

  readingInput: {
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
  },

  questionEvidenceSlot: {
    marginTop: 10,
  },

  errorText: {
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 6,
  },

  successModal: {
    backgroundColor: "white",
    padding: 30,
    margin: 40,
    borderRadius: 20,
    alignItems: "center",
  },

  successContent: {
    alignItems: "center",
    width: "100%",
  },

  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  savedLocallyIconCircle: {
    backgroundColor: "#2563EB",
  },

  successTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 1,
    textAlign: "center",
  },

  continueBtn: {
    marginTop: 22,
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },

  continueBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  notEligibleCard: {
    margin: 18,
    padding: 22,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },

  notEligibleTitle: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
  },

  notEligibleText: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },

  summaryLine: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "800",
    marginVertical: 2,
  },

  backButton: {
    marginTop: 20,
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  failedOutcomeModal: {
    borderWidth: 2,
    borderColor: "#F97316",
  },

  failedIconCircle: {
    backgroundColor: "#F97316",
  },

  failedOutcomeTitle: {
    color: "#9A3412",
  },

  outcomeMessage: {
    fontSize: 13,
    color: "#334155",
    marginTop: 12,
    textAlign: "left",
    lineHeight: 19,
    width: "100%",
    fontWeight: "600",
  },

  failedContinueBtn: {
    backgroundColor: "#F97316",
  },
});
