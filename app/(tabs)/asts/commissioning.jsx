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

import { IrepsMedia } from "../../../components/media/IrepsMedia";
import { ScreenLock } from "../../../components/SceenLock";
import { useWarehouse } from "../../../src/context/WarehouseContext";
import { functions } from "../../../src/firebase";
import { useAuth } from "../../../src/hooks/useAuth";
import { useGetServiceProvidersQuery } from "../../../src/redux/spApi";
import {
  addSubmissionQueueItem,
  getSubmissionQueueItemById,
  removeSubmissionQueueItem,
  updateSubmissionQueueItem,
} from "../../../src/utils/submissionQueue";

function buildMeterCommissioningTrnId({ wardPcode, erfNo, meterType }) {
  const ts = Date.now();

  const safeWardPcode = String(wardPcode || "NAv")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 12);

  const safeErfNo = String(erfNo || "NAv")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 12);

  const typeCode =
    meterType === "water" ? "WTR" : meterType === "electricity" ? "ELC" : "NA";

  return `TRN_MCOM_${ts}_${typeCode}_${safeWardPcode}_${safeErfNo}`;
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

const buildCommissioningSchema = (isPrepaidMeter) =>
  object().shape({
    commissioning: object().shape({
      vendingConfirmed: object().shape({
        answer: isPrepaidMeter
          ? string().oneOf(["yes", "no"]).required("Required")
          : string().notRequired(),
        notes: string().when("answer", {
          is: "no",
          then: (s) => s.trim().required("Notes required when answer is no"),
          otherwise: (s) => s.notRequired(),
        }),
      }),

      finalSwitchOnTested: object().shape({
        answer: string().oneOf(["yes", "no"]).required("Required"),
        notes: string().when("answer", {
          is: "no",
          then: (s) => s.trim().required("Notes required when answer is no"),
          otherwise: (s) => s.notRequired(),
        }),
      }),

      keypadIssued: object().shape({
        answer: isPrepaidMeter
          ? string().oneOf(["yes", "no"]).required("Required")
          : string().notRequired(),
        notes: string().when("answer", {
          is: "no",
          then: (s) => s.trim().required("Notes required when answer is no"),
          otherwise: (s) => s.notRequired(),
        }),
      }),
    }),

    media: array()
      .of(object())
      .test(
        "commissioning-evidence",
        "Commissioning evidence missing",
        function (value) {
          const commissioning = this.parent?.commissioning || {};

          const vendingAnswer = commissioning?.vendingConfirmed?.answer;
          const finalSwitchOnAnswer =
            commissioning?.finalSwitchOnTested?.answer;
          const keypadIssuedAnswer = commissioning?.keypadIssued?.answer;

          if (
            isPrepaidMeter &&
            vendingAnswer === "yes" &&
            !value?.some((m) => m.tag === "vendingEvidence")
          ) {
            return this.createError({
              message: "Vending evidence required",
            });
          }

          if (
            finalSwitchOnAnswer === "yes" &&
            !value?.some((m) => m.tag === "finalSwitchOnEvidence")
          ) {
            return this.createError({
              message: "Final switch-on evidence required",
            });
          }

          if (
            isPrepaidMeter &&
            keypadIssuedAnswer === "yes" &&
            !value?.some((m) => m.tag === "keypadIssuedEvidence")
          ) {
            return this.createError({
              message: "Keypad issued evidence required",
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

export default function FormMeterCommissioning() {
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
    type: null, // "success" | "commissioningFailed"
    title: "",
    message: "",
    goBackOnContinue: true,
  });

  function getCommissioningFailureReasons(values, isPrepaidMeter) {
    const reasons = [];

    if (
      isPrepaidMeter &&
      values?.commissioning?.vendingConfirmed?.answer !== "yes"
    ) {
      reasons.push("Vending was not confirmed.");
    }

    if (values?.commissioning?.finalSwitchOnTested?.answer !== "yes") {
      reasons.push("Final switch-on was not tested.");
    }

    if (
      isPrepaidMeter &&
      values?.commissioning?.keypadIssued?.answer !== "yes"
    ) {
      reasons.push("Keypad was not issued to the user.");
    }

    return reasons;
  }

  function buildCommissioningFailedMessage(values, result) {
    const reasons = getCommissioningFailureReasons(values, isPrepaidMeter);

    const reasonText = reasons.length
      ? reasons.map((reason) => `• ${reason}`).join("\n")
      : "• Commissioning rules were not fully satisfied.";

    return [
      "The commissioning TRN was submitted and saved for audit, but the meter was not moved to CONNECTED.",
      "",
      "Reason:",
      reasonText,
      "",
      `AST status: ${result?.astStatusAfter || "FIELD"}`,
      "",
      "This submitted form cannot be modified.",
      "A new commissioning form must be completed and submitted.",
    ].join("\n");
  }

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
      buildMeterCommissioningTrnId({
        wardPcode,
        erfNo,
        meterType,
      }),
    [wardPcode, erfNo, meterType],
  );

  const isPrepaidMeter = meterKind === "prepaid";

  const commissioningSchema = useMemo(
    () => buildCommissioningSchema(isPrepaidMeter),
    [isPrepaidMeter],
  );

  useEffect(() => {
    if (initialEligible !== null) return;
    if (!astDoc?.id) return;

    const firstStatus = String(astDoc?.status?.state || "").toUpperCase();
    const firstMeterType = String(
      astDoc?.meterType || action?.meterType || "",
    ).toLowerCase();

    if (!firstStatus || !firstMeterType) return;

    setInitialEligible(
      firstStatus === "FIELD" && firstMeterType === "electricity",
    );
  }, [
    initialEligible,
    astDoc?.id,
    astDoc?.status?.state,
    astDoc?.meterType,
    action?.meterType,
  ]);

  const isEligible = initialEligible === true;

  console.log(`isEligible`, isEligible);

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

  function buildTrnSystemFields() {
    return {
      erfId: astDoc?.accessData?.erfId || premise?.erfId || "NAv",
      erfNo: astDoc?.accessData?.erfNo || premise?.erfNo || "NAv",
      trnType: "METER_COMMISSIONING",

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

  function getInitialValues() {
    const editPayload = editQueueItem?.payload || null;
    if (editPayload) return editPayload;

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

      commissioning: {
        vendingConfirmed: {
          answer: "",
          notes: "",
        },
        finalSwitchOnTested: {
          answer: "",
          notes: "",
        },
        keypadIssued: {
          answer: "",
          notes: "",
        },
      },

      assignment: {
        instruction: {
          code: "METER_COMMISSIONING",
          text: "Confirm meter can vend and is ready for final switch-on",
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
        state: astDoc?.status?.state || "FIELD",
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

  const handleSubmitCommissioning = async (values) => {
    if (!astDoc?.id) {
      Alert.alert("Error", "AST data not found.");
      return;
    }

    if (!isEligible) {
      Alert.alert(
        "Not Eligible",
        "Only FIELD electricity meters can be commissioned.",
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
      commissioning: values.commissioning,
      assignment: values.assignment,
      meterType: values.meterType,
      media: values.media || [],
      status: values.status,
      serviceProvider,
    });

    const saveCommissioningDraftToQueue = async (messageTitle, messageBody) => {
      const nextContext = {
        trnType: "METER_COMMISSIONING",
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
          formType: "METER_COMMISSIONING",
          payload: cleanPayload,
          context: nextContext,
          createdByUid: agentUid,
          createdByUser: agentName,
        });
      }

      if (!queueResult?.success) {
        Alert.alert(
          "Draft Save Failed",
          "Failed to save commissioning draft locally.",
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
        await saveCommissioningDraftToQueue(
          "Saved Offline",
          "No internet connection. This commissioning TRN was saved locally.",
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
              `meters/lifecycle/commissioning/${fileName}`,
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
          await saveCommissioningDraftToQueue(
            "Saved Locally",
            "The submission is taking too long. Your commissioning data has been saved locally.",
          );

          setInProgress(false);
          return;
        }

        setInProgress(false);

        Alert.alert(
          "Submission Failed",
          error?.message || "Meter commissioning submission failed.",
        );

        return;
      }

      if (!result?.success) {
        setInProgress(false);

        Alert.alert(
          "Submission Failed",
          result?.message || "Meter commissioning submission failed.",
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
          title: "COMMISSIONING SUCCESSFUL",
          message:
            "The commissioning TRN was submitted and the meter status updated to CONNECTED.",
          goBackOnContinue: true,
        });

        return;
      }

      setSubmitOutcome({
        visible: true,
        type: "commissioningFailed",
        title: "COMMISSIONING DID NOT PASS",
        message: buildCommissioningFailedMessage(values, result),
        goBackOnContinue: true,
      });
    } catch (error) {
      console.error("Commissioning Submission Error:", error);
      Alert.alert("Error", error?.message || "Submission failed");
      setInProgress(false);
    }
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
            title: "Commission Meter",
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
            Meter Not Eligible For Commissioning
          </Text>

          <Text style={styles.notEligibleText}>
            Only FIELD electricity meters can be commissioned.
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
        title="COMMISSIONING"
        status="Securing lifecycle transaction..."
      />

      <Formik
        initialValues={actionInit}
        onSubmit={handleSubmitCommissioning}
        validationSchema={commissioningSchema}
        enableReinitialize={true}
        validateOnMount={true}
        validateOnChange={true}
      >
        {({ values, setFieldValue, handleSubmit, errors, isValid }) => {
          const commissioningErrors = errors?.commissioning || {};

          // console.log(`values`, JSON.stringify(values, null, 2));
          // console.log(`errors`, JSON.stringify(errors, null, 2));

          return (
            <ScrollView
              style={styles.container}
              contentContainerStyle={{ paddingBottom: 50 }}
            >
              <Stack.Screen
                options={{
                  title: `Commission ${meterNo}`,
                  headerTitleStyle: { fontSize: 14, fontWeight: "900" },
                  headerLeft: () => (
                    <TouchableOpacity
                      onPress={() => router.back()}
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
                    color="#2563eb"
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
                    <Text style={styles.summaryLabel}>Vending Type</Text>
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
                    name="clipboard-check-outline"
                    size={18}
                    color="#2563eb"
                  />
                  <Text style={styles.sectionTitle}>Commissioning Checks</Text>
                </View>

                {isPrepaidMeter && (
                  <YesNoQuestion
                    title="Confirm vending"
                    description="Confirm that the prepaid meter can accept a vending token."
                    value={values?.commissioning?.vendingConfirmed?.answer}
                    notes={values?.commissioning?.vendingConfirmed?.notes}
                    answerPath="commissioning.vendingConfirmed.answer"
                    notesPath="commissioning.vendingConfirmed.notes"
                    setFieldValue={setFieldValue}
                    errorText={
                      commissioningErrors?.vendingConfirmed?.answer ||
                      commissioningErrors?.vendingConfirmed?.notes
                    }
                  >
                    <IrepsMedia
                      name="media"
                      tag="vendingEvidence"
                      agentName={agentName}
                      agentUid={agentUid}
                      fallbackGps={fallbackGps}
                      required={
                        values?.commissioning?.vendingConfirmed?.answer ===
                        "yes"
                      }
                    />
                  </YesNoQuestion>
                )}

                <YesNoQuestion
                  title="Final switch-on tested"
                  description="Confirm the meter has been tested for final switch-on."
                  value={values?.commissioning?.finalSwitchOnTested?.answer}
                  notes={values?.commissioning?.finalSwitchOnTested?.notes}
                  answerPath="commissioning.finalSwitchOnTested.answer"
                  notesPath="commissioning.finalSwitchOnTested.notes"
                  setFieldValue={setFieldValue}
                  errorText={
                    commissioningErrors?.finalSwitchOnTested?.answer ||
                    commissioningErrors?.finalSwitchOnTested?.notes
                  }
                >
                  <IrepsMedia
                    name="media"
                    tag="finalSwitchOnEvidence"
                    agentName={agentName}
                    agentUid={agentUid}
                    fallbackGps={fallbackGps}
                    required={
                      values?.commissioning?.finalSwitchOnTested?.answer ===
                      "yes"
                    }
                  />
                </YesNoQuestion>

                {isPrepaidMeter && (
                  <YesNoQuestion
                    title="Keypad issued"
                    description="Confirm the user has been issued with the keypad."
                    value={values?.commissioning?.keypadIssued?.answer}
                    notes={values?.commissioning?.keypadIssued?.notes}
                    answerPath="commissioning.keypadIssued.answer"
                    notesPath="commissioning.keypadIssued.notes"
                    setFieldValue={setFieldValue}
                    errorText={
                      commissioningErrors?.keypadIssued?.answer ||
                      commissioningErrors?.keypadIssued?.notes
                    }
                  >
                    <IrepsMedia
                      name="media"
                      tag="keypadIssuedEvidence"
                      agentName={agentName}
                      agentUid={agentUid}
                      fallbackGps={fallbackGps}
                      required={
                        values?.commissioning?.keypadIssued?.answer === "yes"
                      }
                    />
                  </YesNoQuestion>
                )}
              </Surface>

              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.footerButton, styles.cancelButton]}
                  onPress={() => router.back()}
                >
                  <Text style={styles.cancelButtonText}>CANCEL</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.footerButton,
                    styles.submitButton,
                    (!isValid || inProgress) && styles.submitButtonDisabled,
                  ]}
                  disabled={!isValid || inProgress}
                  onPress={handleSubmit}
                >
                  {inProgress ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      SUBMIT COMMISSIONING
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <Portal>
                <Modal
                  visible={submitOutcome.visible}
                  dismissable={false}
                  contentContainerStyle={[
                    styles.successModal,
                    submitOutcome.type === "commissioningFailed" &&
                      styles.failedOutcomeModal,
                  ]}
                >
                  <View style={styles.successContent}>
                    <View
                      style={[
                        styles.successIconCircle,
                        submitOutcome.type === "commissioningFailed" &&
                          styles.failedIconCircle,
                      ]}
                    >
                      <Feather
                        name={
                          submitOutcome.type === "commissioningFailed"
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
                        submitOutcome.type === "commissioningFailed" &&
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
                        submitOutcome.type === "commissioningFailed" &&
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
    color: "#2563eb",
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

  // summaryGrid: {
  //   gap: 10,
  // },

  // summaryItem: {
  //   backgroundColor: "#F8FAFC",
  //   borderRadius: 10,
  //   padding: 10,
  //   borderWidth: 1,
  //   borderColor: "#E2E8F0",
  // },

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

  evidenceHint: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 8,
  },

  errorText: {
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 6,
  },

  footer: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 24,
  },

  footerButton: {
    minHeight: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  cancelButton: {
    flex: 0.8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },

  cancelButtonText: {
    color: "#475569",
    fontWeight: "900",
    fontSize: 12,
  },

  submitButton: {
    flex: 2,
    backgroundColor: "#2563EB",
  },

  submitButtonDisabled: {
    backgroundColor: "#94A3B8",
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 12,
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

  successTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 1,
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

  questionEvidenceSlot: {
    marginTop: 10,
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
