import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location"; // Ensure this is imported at the to
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
  Divider,
  Modal,
  Portal,
  RadioButton,
  Surface,
  Text,
} from "react-native-paper";
import { array, object, string } from "yup";

// Firebase & Redux
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { ElectricitySections } from "../../../components/forms/ElectricitySections";
import { WaterSections } from "../../../components/forms/WaterSections";
import { IrepsMedia } from "../../../components/media/IrepsMedia";
import { ScreenLock } from "../../../components/SceenLock";
import { useGeo } from "../../context/GeoContext";
import { getSafeCoords } from "../../context/MapContext";
import { useWarehouse } from "../../context/WarehouseContext";
import { useAuth } from "../../hooks/useAuth";
import { useGetSettingsQuery } from "../../redux/settingsApi";
import { useAddTrnMutation } from "../../redux/trnsApi";
import { ForensicFooter } from "./ForensicFooter";

const NA_REASONS = [
  "Locked Gate / No Key",
  "Vicious Dogs",
  "Refused Entry by Occupant",
  "Dangerous Environment / Safety Risk",
  "Meter Box Vandalized / Unreadable",
  "Obstructed (Overgrown/Debris)",
  "House Demolished",
  "Meter Buried/Obscured",
  "Property Vacant",
];

// --- MAIN FORM COMPONENT ---
export default function FormMeterDiscovery() {
  // console.log(`FormMeterDiscovery ----mounted`);
  const {
    premiseId,
    address,
    erfNo,
    action: actionRaw,
  } = useLocalSearchParams();

  const action = (() => {
    try {
      return actionRaw
        ? JSON.parse(actionRaw)
        : { access: "no", meterType: "" };
    } catch (e) {
      return { access: "no", meterType: "" };
    }
  })();

  const auth = useAuth();
  const router = useRouter();
  const { all } = useWarehouse();
  const { data: settings } = useGetSettingsQuery();
  const [addTrn, { isLoading: isTrnLoading }] = useAddTrnMutation();
  const [liveLocation, setLiveLocation] = useState(null);
  const { geoState } = useGeo();
  const activeErf = geoState?.selectedErf;

  const [inProgress, setInProgress] = useState(false);

  const agentUid = auth?.user?.uid || "unknown_uid";
  const agentName = auth?.profile?.profile?.displayName || "Field Agent";

  const premise = all.prems.find((p) => p.id === premiseId);
  const currentLmPcode = premise?.metadata?.lmPcode || "UNKNOWN";
  // const premiseGeo = premise?.geometry;
  // const landingPoint = {
  //   latitude: premise?.geometry?.centroid[0],
  //   longitude: premise?.geometry?.centroid[1],
  // };
  const landingPoint = premise?.geometry?.centroid;
  console.log(`FormPremise ----landingPoint`, landingPoint);

  // 🎯 THE SOVEREIGN EXTRACTION
  const parents = premise?.parents || {};
  // console.log(`parents`, parents);
  const lmId = parents?.lmId || currentLmPcode;
  const districtId = parents?.dmId || "UNKNOWN";
  const provinceId = parents?.provinceId || "UNKNOWN";
  const countryId = parents?.countryId || "ZA";

  const [modalVisible, setModalVisible] = useState(false);
  const timestamp = new Date().toISOString();

  const [showSuccess, setShowSuccess] = useState(false);
  // console.log(`FormPremise ----showSuccess`, showSuccess);

  // Prepare the props for the SovereignLocationPicker
  // const finalErfBoundary = getSafeCoords(erfGeo?.geometry);
  // const finalErfCentroid = erfGeo?.centroid || activeErf?.centroid;
  const finalErfNo = activeErf?.erfNo || premise?.erfNo || erfNo || "N/A";

  const getOptions = (name) =>
    settings?.find((s) => s.name === name)?.options || [];

  const accessInitValues = {
    erfId: premise?.erfId || "",
    erfNo: premise?.erfNo || "",
    trnType: "METER_DISCOVERY",
    access: {
      hasAccess: action?.access,
      reason: "",
    },
    metadata: {
      created: { at: timestamp, byUser: agentName, byUid: agentUid },
      updated: { at: timestamp, byUser: agentName, byUid: agentUid },
      lmPcode: lmId, // Keep for legacy support
      districtId: districtId,
      provinceId: provinceId,
      countryId: countryId,
    },
    premise: {
      id: premise?.id,
      address: address || "N/A",
    },
  };
  // console.log(`handleSubmitDiscovery --accessInitValues`, accessInitValues);

  const handleSubmitDiscovery = async (values) => {
    console.log(
      `handleSubmitDiscovery --values?.ast?.normalisation?.actionTaken`,
      values?.ast?.normalisation?.actionTaken,
    );
    if (!premise?.id) {
      Alert.alert("Error", "Premise data not found.");
      return;
    }
    setInProgress(true);
    try {
      const storage = getStorage();

      // --- PHASE 1: UPLOAD ---
      const syncedMedia = await Promise.all(
        (values?.media || []).map(async (item) => {
          if (item.uri && !item.url) {
            // 🎯 Fixed Folder Logic: Use meterType from Section 3
            const folder =
              values?.accessData?.access?.hasAccess === "yes"
                ? `${values?.meterType}_meters`
                : "no_access";

            const fileName = `${values?.accessData?.erfId}_${item.tag}_${Date.now()}.jpg`;
            const storageRef = ref(storage, `meters/${folder}/${fileName}`);

            const response = await fetch(item.uri);
            const blob = await response.blob();
            await uploadBytes(storageRef, blob);
            const downloadUrl = await getDownloadURL(storageRef);

            const { uri, ...cleanItem } = item;
            return { ...cleanItem, url: downloadUrl };
          }
          return item;
        }),
      );

      // --- PHASE 2: THE SCRUBBER ---
      const cleanPayload = JSON.parse(
        JSON.stringify(
          {
            ...values,
            accessData: {
              ...values.accessData,
              media: undefined, // 🎯 Drop the nested one so ONLY the root 'media' exists
            },
            media: syncedMedia, // 🏛️ This is your primary Forensic Pillar
          },
          (key, value) => (value === undefined ? null : value),
        ),
      );

      // --- PHASE 3: DISPATCH ---

      console.log(`handleSubmitDiscovery --cleanPayload`, cleanPayload);
      console.log(
        `handleSubmitDiscovery --cleanPayload?.ast?.normalisation?.actionTaken`,
        cleanPayload?.ast?.normalisation?.actionTaken,
      );
      await addTrn(cleanPayload).unwrap();
      setShowSuccess(true);
      setTimeout(() => {
        router.replace("/(tabs)/premises");
        setInProgress(false);
      }, 2000);
    } catch (error) {
      console.error("Submission Error:", error);
      Alert.alert("Sync Error", error.message);
    }
  };

  const accessSchema = object().shape({
    // 🛡️ BRANCH 1: Administrative Data
    accessData: object().shape({
      erfId: string().required("Required"),
      erfNo: string().required("Required"),
      trnType: string().required(),
      access: object().shape({
        hasAccess: string().required("Access status is required"),
        reason: string().when("hasAccess", {
          is: (val) => val === "no", // 🎯 Explicit function check is more robust
          then: (s) => s.required("Please provide a reason for no access"),
          otherwise: (s) => s.nullable().notRequired(),
        }),
      }),
      metadata: object().shape({
        created: object().shape({
          at: string().required(),
          byUser: string().required(),
          byUid: string().required(),
        }),
        lmPcode: string().required(),
        districtId: string().required("District ID required"),
        provinceId: string().required("Province ID required"),
        countryId: string().required("Country ID required"),
      }),
      premise: object().shape({
        id: string().required(),
        address: string().required(),
      }),
    }),

    // 🛡️ BRANCH 2: Forensic Proof (Matching your initValues.media)
    media: array()
      .of(object())
      .test("na-forensics", "No Access photo required", function (value) {
        const { accessData } = this.parent;
        const hasAccess = accessData?.access?.hasAccess;
        const reason = accessData?.access?.reason;

        // 🚩 THE INTELLIGENT TRIGGER:
        // We ONLY demand a photo if:
        // - hasAccess is 'no'
        // - AND a reason has been selected (it's not an empty string)
        if (hasAccess === "no" && reason && reason.trim() !== "") {
          return value?.some((item) => item.tag === "noAccessPhoto");
        }

        // Otherwise, the mission is still in "Draft" or is a "Yes Access" mission
        return true;
      }),
  });

  const WaterDiscoverySchema = object().shape({
    // --- SECTION 1: ADMINISTRATIVE ---
    accessData: accessSchema.fields.accessData, // Reusing your locked-in base schema

    // --- SECTION 2: THE PHYSICAL ASSET ---
    ast: object().shape({
      astData: object().shape({
        astNo: string().required("Meter number is required"),
        astManufacturer: string().required("Manufacturer is required"),
        astName: string().required("Model is required"),
        meter: object().shape({
          category: string().required(),
        }),
      }),
      anomalies: object().shape({
        // 🏛️ The Trigger
        anomaly: string().required("Anomaly Required"),

        // 🧠 The Intelligent Detail
        anomalyDetail: string().when("anomaly", {
          is: (val) => val && val.length > 0 && val !== "Meter Ok", // 🎯 Required if selected and NOT "Meter Ok"
          then: (schema) => schema.required("Detail is required"),
          otherwise: (schema) => schema.notRequired().nullable(),
        }),
      }),
      location: object().shape({
        gps: object()
          .nullable()
          .required("GPS location is required")
          .test("is-valid-gps", "Invalid GPS coordinates", (value) => {
            return value && value.lat !== 0 && value.lng !== 0;
          }),
      }),
      meterReading: string().required("Required"),
    }),

    // --- SECTION 3: MISSION TYPE ---
    meterType: string().oneOf(["water"]).required(),

    // --- SECTION 4: TOP-LEVEL FORENSIC PROOF ---
    media: array()
      .of(object())
      .test("water-forensics", "Forensic photo missing", function (value) {
        const { accessData, ast } = this.parent; // 🎯 ACCESS SIBLINGS
        const hasAccess = accessData?.access?.hasAccess;
        const meterNo = ast?.astData?.astNo;
        const anomaly = ast?.anomalies?.anomaly;
        const meterReading = ast?.meterReading;

        // 🚩 Rule 1: No Access (Only trigger if a reason is selected)
        if (hasAccess === "no" && accessData?.access?.reason) {
          if (!value?.some((m) => m.tag === "noAccessPhoto")) {
            return this.createError({ message: "No Access photo required" });
          }
        }

        // 🚩 Rule 2: Meter Photo (Only trigger if the agent started typing the Meter No)
        if (meterNo?.trim() && !value?.some((m) => m.tag === "astNoPhoto")) {
          return this.createError({ message: "Meter photo required" });
        }

        // 🚩 Rule 2: Meter Reading Photo (Only trigger if there is a reading
        if (
          meterReading?.trim() &&
          !value?.some((m) => m.tag === "meterReadingPhoto")
        ) {
          return this.createError({ message: "Meter reading photo required" });
        }

        // 🚩 Rule 3: Anomaly Photo (Only trigger if an actual anomaly is selected)
        if (
          anomaly &&
          anomaly !== "Meter Ok" &&
          !value?.some((m) => m.tag === "anomalyPhoto")
        ) {
          return this.createError({ message: "Anomaly photo required" });
        }

        return true;
      }),
  });

  const ElecDiscoverySchema = object().shape({
    accessData: accessSchema.fields.accessData,
    ast: object().shape({
      astData: object().shape({
        astNo: string().required("Meter number is required"),
        astManufacturer: string().required("Manufacturer is required"),
        astName: string().when("astManufacturer", {
          is: (val) => val && val.length > 0, // 🎯 If Manufacturer is NOT null/empty
          then: (schema) => schema.required("Model name is required"),
          otherwise: (schema) => schema.notRequired(),
        }),
        meter: object().shape({
          phase: string().oneOf(["single", "three"]).required("Phase Required"),
          type: string()
            .oneOf(["prepaid", "conventional"])
            .required("Meter Type Required"),
          category: string()
            .oneOf(["Normal", "Bulk"])
            .required("Meter Category Required"),

          keypad: object().shape({
            serialNo: string().required("Required"),
            comment: string().when("serialNo", {
              is: (val) => !val || val.trim().length === 0,
              then: (s) => s.required("Comment required if no keypad serial"),
              otherwise: (s) => s.notRequired(),
            }),
          }),

          cb: object().shape({
            size: string().required("Required"),
            comment: string().when("size", {
              is: (val) => !val || val.trim().length === 0,
              then: (s) => s.required("Comment required if CB size is missing"),
              otherwise: (s) => s.notRequired(),
            }),
          }),
        }),
      }),
      anomalies: object().shape(
        {
          // 🏛️ The Trigger
          anomaly: string().required("Anomaly Required"),

          // 🧠 The Intelligent Detail - Forced Dependency
          anomalyDetail: string().when(["anomaly"], {
            is: (anomaly) =>
              anomaly && anomaly !== "" && anomaly !== "Meter Ok",
            then: (schema) =>
              schema.required("Detail is required for this anomaly"),
            otherwise: (schema) => schema.notRequired().nullable(),
          }),
        },
        [["anomaly", "anomalyDetail"]],
      ), // 🎯 This ensures circular awareness
      sc: object().shape({
        status: string().required("SC Status Required"),
      }),
      ogs: object().shape({
        hasOffGridSupply: string().required("Off Grid Status Required"),
      }),
      normalisation: object().shape({
        actionTaken: array().of(string()).required("Required"),
      }),
      location: object().shape({
        placement: string().required("Placement Required"),
        gps: object().nullable().required("GPS pin required on map"), // 🎯 Validates Object {lat, lng}
      }),
    }),
    meterType: string().oneOf(["electricity"]).required(),
    media: array()
      .of(object())
      .test(
        "elec-top-level-forensics",
        "Forensic photos missing",
        function (value) {
          const { accessData, ast } = this.parent; // 🎯 Direct access to siblings
          const hasAccess = accessData?.access?.hasAccess;
          const meterNo = ast?.astData?.astNo;
          const keypadSerial = ast?.astData?.meter?.keypad?.serialNo;
          const cbSize = ast?.astData?.meter?.cb?.size;
          const hasOffGrid = ast?.ogs?.hasOffGridSupply;
          const anomaly = ast?.anomalies?.anomaly;
          const normalisationActions = ast?.normalisation?.actionTaken;

          if (hasAccess === "no") {
            return value?.some((m) => m.tag === "noAccessPhoto")
              ? true
              : this.createError({ message: "No Access photo required" });
          }

          // 🚩 Conditional Proofs
          if (meterNo?.trim() && !value?.some((m) => m.tag === "astNoPhoto"))
            return this.createError({ message: "Meter No. photo required" });

          if (
            keypadSerial?.trim() &&
            !value?.some((m) => m.tag === "keypadPhoto")
          )
            return this.createError({
              message: "Keypad Serial photo required",
            });

          if (cbSize?.trim() && !value?.some((m) => m.tag === "astCbPhoto"))
            return this.createError({
              message: "Circuit Breaker photo required",
            });

          if (hasOffGrid === "yes" && !value?.some((m) => m.tag === "ogsPhoto"))
            return this.createError({
              message: "Off-Grid Supply photo required",
            });

          if (
            anomaly &&
            anomaly !== "Meter Ok" &&
            !value?.some((m) => m.tag === "anomalyPhoto")
          )
            return this.createError({ message: "Anomaly photo required" });

          const hasIntervention = Array.isArray(normalisationActions)
            ? normalisationActions.some((a) => a !== "none") // 🎯 Fixed: lowercase 'none'
            : false;

          if (
            hasIntervention &&
            !value?.some((m) => m.tag === "normalisationPhoto")
          ) {
            return this.createError({
              message: "Photo proof of Normalisation required",
            });
          }

          return true;
        },
      ),
  });

  const getInitialValues = () => {
    // 🎯 Standardize access to the string "yes" or "no"
    const accessStr = action?.access === "yes" ? "yes" : "no";

    // --- STEP 1: THE NO ACCESS MISSION ---
    if (accessStr === "no") {
      return {
        initValues: {
          accessData: accessInitValues,
          ast: null,
          meterType: "NA",
          media: [],
        },
        schema: accessSchema,
      };
    }

    // --- STEP 2: WATER DISCOVERY ---
    if (action?.meterType === "water") {
      return {
        initValues: {
          accessData: {
            ...accessInitValues,
            access: { hasAccess: "yes", reason: "N/A" },
          },
          ast: {
            astData: {
              astNo: "", // Empty for real field use
              astManufacturer: "",
              astName: "",
              meter: { category: "Normal" },
            },
            anomalies: {
              anomaly: "",
              anomalyDetail: "",
            },
            location: {
              gps: null, // Placeholder for the final liveLocation capture
            },
            meterReading: "",
          },
          meterType: "water",
          media: [],
        },
        schema: WaterDiscoverySchema,
      };
    }

    // --- STEP 3: ELECTRICITY DISCOVERY (The Default) ---
    return {
      initValues: {
        accessData: {
          ...accessInitValues,
          access: { hasAccess: "yes", reason: "N/A" },
        },
        ast: {
          astData: {
            astNo: "123456789",
            astManufacturer: "Conlog",
            astName: "Bec55",
            meter: {
              phase: "single",
              type: "prepaid",
              category: "Normal",
              keypad: { serialNo: "tyu67890", comment: "" }, // 🎯 Initialized
              cb: { size: "90", comment: "" }, // 🎯 Initialized
            },
          },
          anomalies: {
            anomaly: "Meter Ok",
            anomalyDetail: "Operationally Ok",
          },
          sc: { status: "connected" },
          location: {
            gps: null, // 🛰️ Will be an Object {lat, lng} via the Picker
            placement: "kiosk",
          },
          ogs: { hasOffGridSupply: "no" },
          normalisation: { actionTaken: ["none"] },
        },
        meterType: "electricity",
        media: [],
      },
      schema: ElecDiscoverySchema,
    };
  };

  const actionInit = useMemo(() => getInitialValues(), [premiseId, actionRaw]);
  // console.log(`FormPremise ----actionInit`, actionInit);

  // 2. Setup the Watcher in a useEffect
  useEffect(() => {
    let subscription;

    const startWatching = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location is required for forensic evidence.",
        );
        return;
      }

      // Watch position changes in real-time
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 1, // Update every 1 meter moved
          timeInterval: 5000, // Or every 5 seconds
        },
        (location) => {
          setLiveLocation({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });
        },
      );
    };

    startWatching();

    // Cleanup on unmount
    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  const selectedErfId = activeErf?.id;
  // console.log(`WaterSections ----selectedErfId`, selectedErfId);
  // console.log(`WaterSections ----selectedErfId`, selectedErfId);
  const erfGeo =
    all?.geoLibrary?.[selectedErfId] || all?.geoEntries?.[selectedErfId];
  const erfBoundary = getSafeCoords(erfGeo?.geometry);

  return (
    <>
      {/* 🛡️ THE GLOBAL GUARD: Drop it at the very top of your JSX */}
      <ScreenLock
        visible={inProgress}
        title={"SYNCING"}
        status="Securing encrypted data packet..."
      />
      <Formik
        initialValues={actionInit.initValues}
        onSubmit={handleSubmitDiscovery}
        validationSchema={actionInit.schema}
        enableReinitialize={true}
        validateOnMount={true}
        validateOnChange={true}
        // validateOnBlur={true}
      >
        {({ values, setFieldValue, isSuccess, errors, isValid }) => {
          // console.log(` `);
          // console.log(
          //   `handleSubmitDiscovery values`,
          //   JSON.stringify(values, null, 2),
          // );
          console.log(` `);
          console.log(`handleSubmitDiscovery --values`, values);
          console.log(
            `handleSubmitDiscovery --values?.ast?.normalisation?.actionTaken`,
            values?.ast?.normalisation?.actionTaken,
          );
          // console.log(`values`, JSON.stringify(values, null, 2));

          // console.log(
          //   `handleSubmitDiscovery --values?.meterType`,
          //   values?.meterType,
          // );
          // console.log(` `);
          // console.log(`handleSubmitDiscovery --errors`, errors);
          // console.log(`errors`, JSON.stringify(errors, null, 2));
          // console.log(`handleSubmitDiscovery --isValid`, isValid);

          return (
            <ScrollView
              style={styles.container}
              contentContainerStyle={{ paddingBottom: 50 }}
            >
              <Stack.Screen
                options={{
                  title: address || "Meter Discovery",
                  headerTitleStyle: { fontSize: 14, fontWeight: "900" }, // Sovereign Polish
                  headerLeft: () => (
                    <TouchableOpacity
                      // onPress={() => router.back()}
                      onPress={() => {
                        router.dismissAll();
                        router.replace("/(tabs)/premises");
                      }}
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
                      <Text
                        style={{
                          color: "#2563eb",
                          fontSize: 14,
                          fontWeight: "900",
                        }}
                      >
                        {premise?.erfNo || "N/Av"}
                      </Text>
                    </View>
                  ),
                }}
              />

              {/* ACCESS TOGGLE */}
              {values?.accessData?.access?.hasAccess === "yes" ? (
                // ACCESS SECTION
                <View>
                  {values?.meterType === "electricity" ? (
                    <ElectricitySections
                      values={values}
                      setFieldValue={setFieldValue}
                      getOptions={getOptions}
                      disabled={isTrnLoading}
                      agentName={agentName}
                      agentUid={agentUid}
                      erfBoundary={erfBoundary}
                      erfNo={finalErfNo}
                      erfCentroid={landingPoint}
                      landingPoint={landingPoint}
                      icon={"tooltip-outline"}
                    />
                  ) : (
                    <WaterSections
                      values={values}
                      setFieldValue={setFieldValue}
                      getOptions={getOptions}
                      disabled={isTrnLoading}
                      agentName={agentName}
                      agentUid={agentUid}
                      erfBoundary={erfBoundary}
                      erfNo={finalErfNo}
                      erfCentroid={landingPoint}
                      landingPoint={landingPoint}
                      icon={"tooltip-outline"}
                    />
                  )}
                </View>
              ) : (
                // NO ACCESS SECTION
                <Surface style={styles.card}>
                  {values?.accessData?.access?.hasAccess === "no" && (
                    <Surface style={styles.naCard} elevation={2}>
                      <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons
                          name="alert-circle"
                          size={18}
                          color="#dc2626"
                        />
                        <Text
                          style={[styles.sectionTitle, { color: "#dc2626" }]}
                        >
                          N/A Reason
                        </Text>
                      </View>

                      {/* Reason Selector */}
                      <TouchableOpacity
                        style={styles.selector}
                        onPress={() => setModalVisible(true)}
                      >
                        <View>
                          <Text style={styles.selectorValue}>
                            {values?.accessData?.access?.reason ||
                              "Select reason ..."}
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name="chevron-down"
                          size={22}
                          color="#dc2626"
                        />
                      </TouchableOpacity>

                      <Divider style={{ marginVertical: 15 }} />

                      <IrepsMedia
                        name="media" // 🎯 Ensure this is NOT "accessData.media"
                        tag={"noAccessPhoto"}
                        agentName={agentName}
                        agentUid={agentUid}
                      />
                    </Surface>
                  )}
                </Surface>
              )}

              {/* RESET / SUBMIT BTNS */}
              <ForensicFooter
                isTrnLoading={isTrnLoading}
                isSuccess={isSuccess}
              />

              <Portal>
                <Modal
                  visible={modalVisible}
                  onDismiss={() => setModalVisible(false)}
                  contentContainerStyle={styles.modalContent}
                >
                  <RadioButton.Group
                    onValueChange={(v) => {
                      setFieldValue("accessData.access.reason", v);
                      setModalVisible(false);
                    }}
                    value={values?.accessData?.access?.reason}
                  >
                    {NA_REASONS.map((r) => (
                      <RadioButton.Item key={r} label={r} value={r} />
                    ))}
                  </RadioButton.Group>
                </Modal>

                <Modal
                  visible={showSuccess}
                  dismissable={false} // Force them to acknowledge or wait for auto-nav
                  contentContainerStyle={styles.successModal}
                >
                  <View style={styles.successContent}>
                    <View style={styles.successIconCircle}>
                      <Feather name="check" size={50} color="#fff" />
                    </View>
                    <Text style={styles.successTitle}>MISSION SUCCESS</Text>
                    <Text style={styles.successSub}>
                      {values?.accessData?.access?.hasAccess ? "" : "NA Access"}{" "}
                      Trn saved successfully
                    </Text>

                    <TouchableOpacity
                      style={styles.continueBtn}
                      onPress={() => {
                        setShowSuccess(false);
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
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  sectionCard: {
    margin: 10,
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  sectionHeader: {
    padding: 10,
    backgroundColor: "#E2E8F0",
    flexDirection: "row",
    gap: 8,
  },
  sectionTitle: { fontSize: 14, fontWeight: "bold", color: "#475569" },
  input: { marginBottom: 10, backgroundColor: "#fff" },
  selector: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },

  card: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  naCard: {
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  row: { flexDirection: "row", gap: 10, padding: 10 },
  toggleBtn: { flex: 1, borderRadius: 10 },
  actionText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#475569",
    marginTop: 4,
  },
  selectorValue: { fontSize: 16, fontWeight: "600", color: "#1E293B" },
  footer: { flexDirection: "row", gap: 12, marginTop: 20, padding: 20 },
  submitBtn: { flex: 2, borderRadius: 10 },
  resetBtn: { flex: 1, borderRadius: 10 },
  watermarkOverlay: {
    position: "absolute",
    bottom: 20,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 10,
    borderRadius: 5,
  },
  watermarkText: { color: "white", fontSize: 10, fontWeight: "bold" },
  cameraControls: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
  },
  captureBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  captureBtnInternal: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "white",
  },
  gpsBadge: {
    marginTop: 10,
    padding: 5,
    backgroundColor: "#dcfce7",
    borderRadius: 5,
  },
  gpsBadgeText: { fontSize: 10, color: "#166534", fontWeight: "bold" },

  headerMeterText: { fontSize: 14, color: "#64748b", fontWeight: "bold" },

  actionBlock: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#dc2626",
  },

  thumbnailContainer: {
    width: 110,
    height: 110,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  removePhotoBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    padding: 2,
  },

  inspectionModal: {
    margin: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "black",
  },
  inspectionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "100%",
    height: "80%", // Leaves room for the close button and footer
  },
  closeInspectionBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
  },
  inspectionFooter: {
    position: "absolute",
    bottom: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  inspectionText: {
    color: "white",
    fontWeight: "bold",
    letterSpacing: 1,
  },

  modalContainer: {
    backgroundColor: "white",
    padding: 10,
    margin: 20,
    borderRadius: 20,
    height: "70%",
  },
  cameraWrapper: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 15,
    backgroundColor: "#000",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  scanTarget: {
    width: 250,
    height: 150,
    borderWidth: 2,
    borderColor: "#00FF00",
    backgroundColor: "transparent",
  },
  scanText: {
    color: "white",
    marginTop: 20,
    fontWeight: "bold",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 5,
  },
  closeBtn: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
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
    backgroundColor: "#22C55E", // Success Green
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    // Shadow for depth
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
  successSub: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  continueBtn: {
    backgroundColor: "#0F172A",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  continueBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },

  integratedMediaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "#F1F5F9", // Subtle background to "group" the media tools
    borderRadius: 12,
    padding: 8,
    height: 120, // Enough height for 100px thumbnails + padding
  },
  cameraSlot: {
    width: 90,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#CBD5E1",
    paddingRight: 8,
  },
  ribbonSlot: {
    flex: 1, // Takes all remaining space
    height: "100%",
  },
  tinyLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#475569",
    marginTop: 2,
  },
  inputContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0", // Normal border
    overflow: "hidden", // Keeps the left border sharp
  },
  errorIndicator: {
    borderLeftWidth: 5, // 🎯 The "Sexy" thin indicator
    borderLeftColor: "#EF4444", // Forensic Red
    backgroundColor: "#FEF2F2", // Very light red tint (Optional)
  },

  mapModalContainer: { padding: 10, flex: 1, justifyContent: "center" },
  mapPickerSurface: {
    borderRadius: 20,
    height: "70%",
    overflow: "hidden",
    backgroundColor: "white",
  },
  pickerMap: { flex: 1 },
  modalHeader: {
    padding: 15,
    backgroundColor: "#f8fafc",
    alignItems: "center",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 15,
    backgroundColor: "#f8fafc",
  },

  iconCircleSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  centroidLabel: {
    backgroundColor: "rgba(15, 23, 42, 0.7)", // Dark slate semi-transparent
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  centroidText: {
    color: "#FFD700",
    fontSize: 10,
    fontWeight: "900",
  },
  // selector: {
  //   flexDirection: "row",
  //   justifyContent: "space-between",
  //   alignItems: "center",
  //   padding: 12,
  //   borderRadius: 12,
  //   backgroundColor: "#f8fafc", // Sexy Light Grey
  //   borderWidth: 1,
  //   borderColor: "#e2e8f0",
  //   elevation: 2,
  // },
  // label: {
  //   fontSize: 11,
  //   fontWeight: "900",
  //   color: "#475569",
  //   marginBottom: 8,
  //   textTransform: "uppercase",
  //   letterSpacing: 1,
  // },
  // actionText: {
  //   fontSize: 10,
  //   color: "#94a3b8",
  //   fontWeight: "600",
  //   marginTop: 2,
  // },
});
