import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location"; // Ensure this is imported at the to
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Formik, getIn, useFormikContext } from "formik";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Button,
  Divider,
  Modal,
  Portal,
  RadioButton,
  Surface,
  Text,
  TextInput,
} from "react-native-paper";
import { array, object, string } from "yup";

// Firebase & Redux
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import MapView, { Marker, Polygon } from "react-native-maps";
import { IrepsMedia } from "../../../components/media/IrepsMedia";
import { useGeo } from "../../context/GeoContext";
import { getSafeCoords } from "../../context/MapContext";
import { useWarehouse } from "../../context/WarehouseContext";
import { useAuth } from "../../hooks/useAuth";
import { useGetSettingsQuery } from "../../redux/settingsApi";
import { useAddTrnMutation } from "../../redux/trnsApi";
import { ForensicFooter } from "./ForensicFooter";
import FormInputMeterNo from "./FormInputMeterNo";

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
  const {
    premiseId,
    address,
    erfNo,
    action: actionRaw,
  } = useLocalSearchParams();
  // console.log(`FormPremise ----premiseId`, premiseId);
  // console.log(`FormPremise ----address`, address);
  // console.log(`FormPremise ----erfNo`, erfNo);
  // console.log(`FormPremise ----actionRaw`, actionRaw);
  // 🎯 Parse the action object safely

  const action = (() => {
    try {
      return actionRaw
        ? JSON.parse(actionRaw)
        : { access: "no", meterType: "" };
    } catch (e) {
      return { access: "no", meterType: "" };
    }
  })();

  // const action = actionRaw
  //   ? JSON.parse(actionRaw)
  //   : { access: "no", meterType: "" };
  // console.log(`FormPremise ----action`, action);

  const auth = useAuth();
  const router = useRouter();
  const { all } = useWarehouse();
  const { data: settings } = useGetSettingsQuery();
  const [addTrn, { isLoading: isTrnLoading }] = useAddTrnMutation();
  const [liveLocation, setLiveLocation] = useState(null);
  const { geoState } = useGeo();
  const activeErf = geoState?.selectedErf;

  const agentUid = auth?.user?.uid || "unknown_uid";
  const agentName = auth?.profile?.profile?.displayName || "Field Agent";

  const premise = all.prems.find((p) => p.id === premiseId);
  const currentLmPcode = premise?.metadata?.lmPcode || "UNKNOWN";
  const [modalVisible, setModalVisible] = useState(false);
  const timestamp = new Date().toISOString();

  const [showSuccess, setShowSuccess] = useState(false);
  // console.log(`FormPremise ----showSuccess`, showSuccess);

  const [showMapPicker, setShowMapPicker] = useState(false);
  const [tempCoords, setTempCoords] = useState(null);

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
      lmPcode: currentLmPcode,
    },
    premise: {
      id: premise?.id,
      address: address || "N/A",
    },
    media: [],
  };
  // console.log(`handleSubmitDiscovery --accessInitValues`, accessInitValues);

  const handleSubmitDiscovery = async (values) => {
    if (!premise?.id) {
      Alert.alert("Error", "Premise data not found.");
      return;
    }

    try {
      const storage = getStorage();

      // --- PHASE 1: UPLOAD ---
      const syncedMedia = await Promise.all(
        (values?.accessData?.media || []).map(async (item) => {
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

      // --- PHASE 2: THE SCRUBBER & RE-NESTING ---
      const cleanPayload = JSON.parse(
        JSON.stringify(
          {
            ...values,
            accessData: {
              ...values.accessData,
              media: syncedMedia, // 🎯 PUT MEDIA BACK IN SECTION 1
            },
          },
          (key, value) => (value === undefined ? null : value),
        ),
      );

      // console.log(`Final 3-Section Clean Payload:`, cleanPayload);

      // --- PHASE 3: DISPATCH ---
      await addTrn(cleanPayload).unwrap();
      setShowSuccess(true);

      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error) {
      console.error("Submission Error:", error);
      Alert.alert("Sync Error", error.message);
    }
  };

  const accessSchema = object().shape({
    accessData: object().shape({
      erfId: string().required("Required"),
      erfNo: string().required("Required"),
      trnType: string().required(),
      access: object().shape({
        hasAccess: string().required("Access status is required"),
        reason: string().when("hasAccess", {
          is: "no",
          then: (s) => s.required("Please provide a reason for no access"),
          otherwise: (s) => s.notRequired(),
        }),
      }),
      metadata: object().shape({
        created: object().shape({
          at: string().required(),
          byUser: string().required(),
          byUid: string().required(),
        }),
        lmPcode: string().required(),
      }),
      premise: object().shape({
        id: string().required(),
        address: string().required(),
      }),

      // 🎯 MEDIA VALIDATION: The Forensic Guardrail
      media: array()
        .of(object())
        .test(
          "has-no-access-photo",
          "A 'No Access' forensic photo is required",
          function (value) {
            console.log(`handleSubmitDiscovery --yup value`, value);

            // We reach into the sibling 'access' object to see the status
            const { hasAccess } = this.parent.access;
            console.log(`handleSubmitDiscovery --yup hasAccess`, hasAccess);

            // If they chose NO access, we MUST find an item with the 'noAccessPhoto' tag
            if (hasAccess === "no") {
              return value?.some((item) => item.tag === "noAccessPhoto");
            }

            // If access is YES, this specific test passes (Water/Elec photos handled in their schemas)
            return true;
          },
        ),
    }),
  });

  const WaterDiscoverySchema = object().shape({
    // --- SECTION 1 ---
    accessData: object().shape({
      ...accessSchema.fields.accessData.fields,

      media: array()
        .of(object())
        .test("media-forensics", "Forensic photos missing", function (value) {
          // 🎯 Accessing the 3 Sections from the root
          const root = this.options.from[this.options.from.length - 1].value;
          const hasAccess = root.accessData?.access?.hasAccess;
          const meterNo = root.ast?.astData?.astNo;
          const anomaly = root.ast?.anomalies?.anomaly;

          // 🚩 Rule 1: No Access Photo (Required if hasAccess is 'no')
          if (hasAccess === "no") {
            if (!value?.some((item) => item.tag === "noAccessPhoto"))
              return false;
          }

          // 🚩 Rule 2: Asset Photo (Required if Meter No is not empty)
          if (meterNo && meterNo.trim() !== "") {
            if (!value?.some((item) => item.tag === "astNoPhoto")) return false;
          }

          // 🚩 Rule 3: Anomaly Photo (Required if Anomaly is selected)
          // We exclude "Meter Ok" if that's your standard for "no anomaly"
          if (anomaly && anomaly !== "" && anomaly !== "Meter Ok") {
            if (!value?.some((item) => item.tag === "anomalyPhoto"))
              return false;
          }

          return true;
        }),
    }),

    // --- SECTION 2 ---
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
        anomaly: string().required("Please select an anomaly status"),
        anomalyDetail: string().required("Detail is required"),
      }),
    }),

    // --- SECTION 3 ---
    meterType: string().oneOf(["water"]).required(),
  });

  const ElecDiscoverySchema = object().shape({
    // --- SECTION 1: ACCESS & MEDIA ---
    accessData: object().shape({
      ...accessSchema.fields.accessData.fields,
      media: array()
        .of(object())
        .test(
          "elec-media-forensics",
          "Forensic photos missing",
          function (value) {
            const root = this.options.from[this.options.from.length - 1].value;
            const hasAccess = root.accessData?.access?.hasAccess;
            const meterNo = root.ast?.astData?.astNo;
            const anomaly = root.ast?.anomalies?.anomaly;

            if (hasAccess === "no") {
              return value?.some((item) => item.tag === "noAccessPhoto");
            }

            // Proof of Meter Number
            if (meterNo && meterNo.trim() !== "") {
              if (!value?.some((item) => item.tag === "astNoPhoto"))
                return false;
            }

            // Proof of Anomaly
            if (anomaly && anomaly !== "" && anomaly !== "Meter Ok") {
              if (!value?.some((item) => item.tag === "anomalyPhoto"))
                return false;
            }

            return true;
          },
        ),
    }),

    // --- SECTION 2: THE ELECTRICAL ASSET (Detailed) ---
    ast: object().shape({
      astData: object().shape({
        astNo: string().required("Meter number is required"),
        astManufacturer: string().required("Manufacturer is required"),
        astName: string().required("Model name is required"),
        meter: object().shape({
          phase: string().oneOf(["single", "three"]).required("Select phase"),
          type: string()
            .oneOf(["prepaid", "conventional"])
            .required("Select type"),
          category: string()
            .oneOf(["Normal", "Bulk"])
            .required("Select category"),

          // 🎯 Keypad Logic: Comment required if Serial is empty
          keypad: object().shape({
            serialNo: string(),
            comment: string().when("serialNo", {
              is: (val) => !val || val.length === 0,
              then: (s) => s.required("Comment required if no keypad serial"),
              otherwise: (s) => s.notRequired(),
            }),
          }),

          // 🎯 CB Logic: Comment required if Size is empty
          cb: object().shape({
            size: string()
              .matches(/^[0-9]*$/, "Size must be numbers only") // 🎯 Pure numeric guard
              .nullable(),
            comment: string().when("size", {
              is: (val) => !val || val.trim().length === 0,
              then: (s) => s.required("Comment required if CB size is missing"),
              otherwise: (s) => s.notRequired(),
            }),
          }),
        }),
      }),
      anomalies: object().shape({
        anomaly: string().required("Anomaly status is required"),
        anomalyDetail: string().required("Detail is required"),
      }),
      sc: object().shape({
        status: string().required("Seal condition required"),
      }),
      location: object().shape({
        placement: string().required("Placement required"),
      }),
      ogs: object().shape({
        hasOffGridSupply: string()
          .oneOf(["yes", "no"], "Selection required")
          .required("Please specify off-grid status"),
      }),
      normalisation: object().shape({
        actionTaken: string().required("Action required"),
      }),
    }),

    // --- SECTION 3: TYPE ---
    meterType: string().oneOf(["electricity"]).required(),
  });

  const getInitialValues = () => {
    // 🎯 Standardize access to the string "yes" or "no"
    const accessStr = action?.access === "yes" ? "yes" : "no";

    // --- STEP 1: THE NO ACCESS MISSION ---
    if (accessStr === "no") {
      return {
        initValues: {
          accessData: { ...accessInitValues },
          ast: null,
          meterType: "NA",
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
              anomaly: "Meter Ok",
              anomalyDetail: "Operationaly Ok",
            },
            location: {
              gps: null, // Placeholder for the final liveLocation capture
              placement: "kiosk",
            },
          },
          meterType: "water",
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
            astNo: "4455",
            astManufacturer: "Kent",
            astName: "Kent5555",
            meter: {
              phase: "single", // Default
              type: "prepaid", // Default
              category: "Normal", // Default
              keypad: { serialNo: "", comment: "" },
              cb: { size: "60", comment: "" },
            },
          },
          anomalies: {
            anomaly: "Meter Ok",
            anomalyDetail: "Operationaly Ok",
          },
          sc: { status: "" },
          location: {
            gps: null, // Placeholder for the final liveLocation capture
            placement: "kiosk",
          },
          // location: { placement: "kiosk" },
          ogs: { hasOffGridSupply: "no" },
          normalisation: { actionTaken: "None" },
        },
        meterType: "electricity",
      },
      schema: ElecDiscoverySchema, // ⚡ Pointing to the new deep schema
    };
  };

  const actionInit = getInitialValues();
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

  const openLocationMission = (currentGps) => {
    // Set initial pin to current GPS or the live blue dot
    setTempCoords(currentGps || liveLocation);
    setShowMapPicker(true);
  };

  const ElectricitySections = ({
    values,
    setFieldValue,
    getOptions,
    disabled,
    liveLocation,
    agentName,
    agentUid,
  }) => (
    <View>
      {/* ⚡ SECTION 1: CORE METER DATA */}
      <FormSection title="Meter Details">
        <FormInput
          label="METER NUMBER"
          name="ast.astData.astNo"
          disabled={disabled}
        />
        <IrepsMedia
          tag={"astNoPhoto"}
          agentName={agentName}
          agentUid={agentUid}
        />
        <FormSelect
          label="MANUFACTURER"
          name="ast.astData.astManufacturer"
          options={getOptions("elec_manufacturers")}
          disabled={disabled}
        />
        <FormInput
          label="MODEL (NAME)"
          name="ast.astData.astName"
          disabled={disabled}
        />

        <View style={styles.row}>
          <FormSelect
            label="PHASE"
            name="ast.astData.meter.phase"
            options={["single", "three"]}
            style={{ flex: 1 }}
            disabled={disabled}
          />
          <FormSelect
            label="TYPE"
            name="ast.astData.meter.type"
            options={["prepaid", "conventional"]}
            style={{ flex: 1, marginLeft: 8 }}
            disabled={disabled}
          />
        </View>

        <FormSelect
          label="CATEGORY"
          name="ast.astData.meter.category"
          options={["Normal", "Bulk"]}
          disabled={disabled}
        />
      </FormSection>

      {/* ⌨️ SECTION 2: KEYPAD & CIRCUIT BREAKER */}
      <FormSection title="Infrastructure">
        <FormInput
          label="KEYPAD SERIAL NO"
          name="ast.astData.meter.keypad.serialNo"
          disabled={disabled}
        />

        <IrepsMedia
          tag={"keypadPhoto"}
          agentName={agentName}
          agentUid={agentUid}
        />
        {/* 🎯 Conditional Comment: Keypad */}
        {!values.ast.astData.meter.keypad.serialNo && (
          <FormInput
            label="KEYPAD COMMENT (REQUIRED)"
            name="ast.astData.meter.keypad.comment"
            placeholder="Why is there no serial?"
            disabled={disabled}
          />
        )}

        <FormInput
          label="CB SIZE (AMPS)"
          name="ast.astData.meter.cb.size"
          keyboardType="numeric"
          disabled={disabled}
        />
        <IrepsMedia
          tag={"astCbPhoto"}
          agentName={agentName}
          agentUid={agentUid}
        />
        {/* 🎯 Conditional Comment: Circuit Breaker */}
        {!values.ast.astData.meter.cb.size && (
          <FormInput
            label="CB COMMENT (REQUIRED)"
            name="ast.astData.meter.cb.comment"
            placeholder="Why is the CB size missing?"
            disabled={disabled}
          />
        )}
      </FormSection>

      {/* 🔒 SECTION 3: CONNECTION & STATUS */}
      <FormSection title="Status & Supply">
        <FormSelect
          label="SERVICE CONNECTION (SC)"
          name="ast.sc.status"
          options={["Connected", "Disconnected", "Not In Use"]}
          disabled={disabled}
        />

        {/* Boolean Switch/Select for Off-Grid */}

        <FormSelect
          label="OFF-GRID SUPPLY?"
          name="ast.ogs.hasOffGridSupply"
          options={["yes", "no"]} // 🎯 The new universal standard
          getOptionLabel={(val) => (val === "yes" ? "Yes" : "No")}
          disabled={disabled}
        />

        <IrepsMedia
          tag={"ogsPhoto"}
          agentName={agentName}
          agentUid={agentUid}
        />
      </FormSection>

      {/* 🚩 SECTION 5: LOCATION */}
      <FormSection title="Meter Location">
        <FormSelect
          label="LOCATION"
          name="ast.location.placement"
          options={["Internal", "External", "Pole"]}
          disabled={disabled}
        />

        <View style={{ paddingVertical: 10 }}>
          <Text style={styles.label}>Physical Asset Positioning</Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowMapPicker(true)} // 🛰️ Launch the Mission Modal
            style={[
              styles.selector,
              // 🛡️ Visual Warning if not yet set
              !values.ast?.location?.gps && {
                borderColor: "#ef4444",
                borderWidth: 1.5,
              },
            ]}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              {/* 🎯 Status Icon */}
              <View
                style={[
                  styles.iconCircleSmall,
                  {
                    backgroundColor: values.ast?.location?.gps
                      ? "#dcfce7"
                      : "#fee2e2",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    values.ast?.location?.gps
                      ? "map-marker-check"
                      : "map-marker-plus"
                  }
                  size={24}
                  color={values.ast?.location?.gps ? "#16a34a" : "#dc2626"}
                />
              </View>

              <View style={{ marginLeft: 12 }}>
                <Text
                  style={[
                    styles.selectorValue,
                    {
                      color: values.ast?.location?.gps ? "#1e293b" : "#dc2626",
                    },
                  ]}
                >
                  {values.ast?.location?.gps
                    ? `${values.ast.location.gps.lat.toFixed(6)}, ${values.ast.location.gps.lng.toFixed(6)}`
                    : "TAP TO PINPOINT METER"}
                </Text>
                <Text style={styles.actionText}>
                  {values.ast?.location?.gps
                    ? "Manual GPS Verified"
                    : "Location Required"}
                </Text>
              </View>
            </View>

            <MaterialCommunityIcons name="target" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>
      </FormSection>

      {/* 🚩 SECTION 5: ANOMALIES */}
      <FormSection title="Anomalies & Actions">
        <FormSelect
          label="ANOMALY"
          name="ast.anomalies.anomaly"
          options={getOptions("anomalies").map((a) => a.anomaly)}
          disabled={disabled}
        />
        <FormInput
          label="ANOMALY DETAIL"
          name="ast.anomalies.anomalyDetail"
          multiline
          disabled={disabled}
        />

        <IrepsMedia
          tag={"anomalyPhoto"}
          agentName={agentName}
          agentUid={agentUid}
        />
      </FormSection>

      {/* 🚩 SECTION 4: NORMALISATION */}
      <FormSection title="Normalisation">
        <FormSelect
          label="NORMALISATION ACTION"
          name="ast.normalisation.actionTaken"
          options={["None", "Sealed", "Replaced", "Fined"]}
          disabled={disabled}
        />
        <IrepsMedia
          tag={"normalisationPhoto"}
          agentName={agentName}
          agentUid={agentUid}
        />
      </FormSection>
    </View>
  );

  const WaterSections = ({
    values,
    setFieldValue,
    getOptions,
    disabled,
    liveLocation,
    agentName,
    agentUid,
  }) => {
    const anomalies = getOptions("anomalies") || [];

    return (
      <View style={disabled && { opacity: 0.7 }}>
        {/* 2.1: Water Meter Description */}
        <FormSection title="Water Meter Description">
          <View style={styles.row}>
            <FormInputMeterNo
              label="Meter Number"
              name="ast.astData.astNo"
              disabled={disabled}
            />
          </View>
          <IrepsMedia
            tag={"astNoPhoto"}
            agentName={agentName}
            agentUid={agentUid}
          />

          <FormSelect
            label="Category (Normal/Bulk)"
            options={["Normal", "Bulk"]}
            name="ast.astData.meter.category"
            disabled={disabled}
          />

          <FormSelect
            label="Manufacture"
            options={getOptions("water_manufacturers")}
            name="ast.astData.astManufacturer"
            disabled={disabled}
          />

          <FormInput
            label="Model Name"
            name="ast.astData.astName"
            disabled={disabled}
          />
        </FormSection>

        {/* 2.2: Meter Anomalies */}
        <FormSection title="Meter Anomalies">
          <View
            style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}
          >
            <View style={{ flex: 1 }}>
              <FormSelect
                label="ANOMALY"
                options={anomalies.map((a) => a.anomaly)}
                name="ast.anomalies.anomaly"
                disabled={disabled}
              />
            </View>
          </View>

          <FormSelect
            label="Anomaly Detail"
            options={
              anomalies.find(
                (a) => a.anomaly === values?.ast?.anomalies?.anomaly,
              )?.anomalyDetails || []
            }
            name="ast.anomalies.anomalyDetail"
            disabled={!values?.ast?.anomalies?.anomaly || disabled}
          />
          <IrepsMedia
            tag={"anomalyPhoto"}
            agentName={agentName}
            agentUid={agentUid}
          />
        </FormSection>

        {/* 2.3: Meter Location */}
        <FormSection title="Meter Location">
          <View style={{ paddingVertical: 10 }}>
            <Text style={styles.label}>Physical Asset Positioning</Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowMapPicker(true)} // 🛰️ Launch the Mission Modal
              style={[
                styles.selector,
                // 🛡️ Visual Warning if not yet set
                !values.ast?.location?.gps && {
                  borderColor: "#ef4444",
                  borderWidth: 1.5,
                },
              ]}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
              >
                {/* 🎯 Status Icon */}
                <View
                  style={[
                    styles.iconCircleSmall,
                    {
                      backgroundColor: values.ast?.location?.gps
                        ? "#dcfce7"
                        : "#fee2e2",
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      values.ast?.location?.gps
                        ? "map-marker-check"
                        : "map-marker-plus"
                    }
                    size={24}
                    color={values.ast?.location?.gps ? "#16a34a" : "#dc2626"}
                  />
                </View>

                <View style={{ marginLeft: 12 }}>
                  <Text
                    style={[
                      styles.selectorValue,
                      {
                        color: values.ast?.location?.gps
                          ? "#1e293b"
                          : "#dc2626",
                      },
                    ]}
                  >
                    {values.ast?.location?.gps
                      ? `${values.ast.location.gps.lat.toFixed(6)}, ${values.ast.location.gps.lng.toFixed(6)}`
                      : "TAP TO PINPOINT METER"}
                  </Text>
                  <Text style={styles.actionText}>
                    {values.ast?.location?.gps
                      ? "Manual GPS Verified"
                      : "Location Required"}
                  </Text>
                </View>
              </View>

              <MaterialCommunityIcons name="target" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
        </FormSection>
      </View>
    );
  };

  const selectedErfId = activeErf?.id;
  console.log(`WaterSections ----selectedErfId`, selectedErfId);
  const erfGeo =
    all?.geoLibrary?.[selectedErfId] || all?.geoEntries?.[selectedErfId];
  const erfBoundary = getSafeCoords(erfGeo?.geometry);
  const erfCentroid = erfGeo?.centroid;

  return (
    <Formik
      initialValues={actionInit.initValues}
      onSubmit={handleSubmitDiscovery}
      validationSchema={actionInit.schema}
      validateOnMount={true}
      enableReinitialize={false}
    >
      {({ values, setFieldValue, isSuccess, errors, isValid }) => {
        console.log(` `);
        // console.log(
        //   `handleSubmitDiscovery values`,
        //   JSON.stringify(values, null, 2),
        // );
        // console.log(`handleSubmitDiscovery --values`, values);
        // console.log(
        //   `handleSubmitDiscovery --values?.meterType`,
        //   values?.meterType,
        // );
        // console.log(`handleSubmitDiscovery --errors`, errors);
        // console.log(`handleSubmitDiscovery --isValid`, isValid);

        return (
          <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 50 }}
          >
            <Stack.Screen
              options={{
                title: address || "Discovery",
                headerRight: () => (
                  <Text style={{ color: "blue", fontSize: 16 }}>
                    {premise?.erfNo || "N/Av"}
                  </Text>
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
                    liveLocation={liveLocation}
                  />
                ) : (
                  <WaterSections
                    values={values}
                    setFieldValue={setFieldValue}
                    getOptions={getOptions}
                    disabled={isTrnLoading}
                    liveLocation={liveLocation}
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
                      <Text style={[styles.sectionTitle, { color: "#dc2626" }]}>
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
                      tag={"noAccessPhoto"}
                      agentName={agentName}
                      agentUid={agentUid}
                    />
                  </Surface>
                )}
              </Surface>
            )}

            {/* RESET / SUBMIT BTNS */}
            <ForensicFooter isTrnLoading={isTrnLoading} isSuccess={isSuccess} />

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
                      router.replace(
                        `/(tabs)/erfs/${values?.accessData?.erfId}`,
                      );
                      // router.replace(`/(tabs)/erfs/${erfNo}`);
                    }}
                  >
                    <Text style={styles.continueBtnText}>CONTINUE</Text>
                  </TouchableOpacity>
                </View>
              </Modal>

              <Modal
                visible={showMapPicker}
                onDismiss={() => setShowMapPicker(false)}
                contentContainerStyle={styles.mapModalContainer}
              >
                <Surface style={styles.mapPickerSurface}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>DRAG PIN TO METER</Text>
                  </View>

                  <MapView
                    style={styles.pickerMap}
                    showsUserLocation={true}
                    initialRegion={{
                      latitude:
                        erfCentroid?.lat || liveLocation?.lat || -33.9249,
                      longitude:
                        erfCentroid?.lng || liveLocation?.lng || 18.4241,
                      latitudeDelta: 0.001,
                      longitudeDelta: 0.001,
                    }}
                  >
                    {/* 🏛️ REFERENCE LAYER: The Erf Boundary */}
                    {erfBoundary.length > 2 && (
                      <Polygon
                        coordinates={erfBoundary}
                        strokeColor="#FFD700" // 🟡 Sovereign Gold
                        fillColor="rgba(255, 215, 0, 0.1)"
                        strokeWidth={2}
                      />
                    )}

                    {/* 🏷️ TARGET LABEL: The Erf Number at Centroid */}
                    {erfCentroid && (
                      <Marker
                        coordinate={{
                          latitude: erfCentroid.lat,
                          longitude: erfCentroid.lng,
                        }}
                        tracksViewChanges={false} // Optimization
                      >
                        <View style={styles.centroidLabel}>
                          <Text style={styles.centroidText}>
                            {values.accessData?.erfNo}
                          </Text>
                        </View>
                      </Marker>
                    )}

                    {/* 📍 THE MISSION OBJECTIVE: The Draggable Meter */}
                    <Marker
                      draggable
                      coordinate={{
                        latitude:
                          tempCoords?.lat || liveLocation?.lat || -33.9249,
                        longitude:
                          tempCoords?.lng || liveLocation?.lng || 18.4241,
                      }}
                      onDragEnd={(e) => {
                        const c = e.nativeEvent.coordinate;
                        setTempCoords({ lat: c.latitude, lng: c.longitude });
                      }}
                      pinColor="#3B82F6" // 🔵 Blue to represent the Water Meter
                      title="Drag to actual meter location"
                    />
                  </MapView>

                  <View style={styles.modalFooter}>
                    <Button
                      mode="outlined"
                      onPress={() => setShowMapPicker(false)}
                    >
                      CANCEL
                    </Button>
                    <Button
                      mode="contained"
                      onPress={() => {
                        setFieldValue("ast.location.gps", tempCoords);
                        setShowMapPicker(false);
                      }}
                      style={{ backgroundColor: "#16a34a" }}
                    >
                      SAVE POSITION
                    </Button>
                  </View>
                </Surface>
              </Modal>
            </Portal>
          </ScrollView>
        );
      }}
    </Formik>
  );
}

// --- SHARED FORM COMPONENTS ---

const FormSection = ({ title, children }) => (
  <Surface style={styles.sectionCard} elevation={2}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <Divider />
    <View style={{ padding: 10 }}>{children}</View>
  </Surface>
);

const FormInput = ({ label, name, disabled, ...props }) => {
  const { handleChange, handleBlur, values } = useFormikContext();
  return (
    <TextInput
      label={label}
      value={getIn(values, name)}
      onChangeText={handleChange(name)}
      onBlur={handleBlur(name)}
      disabled={disabled}
      mode="outlined"
      style={styles.input}
      {...props}
    />
  );
};

const FormSelect = ({ label, name, options = [], disabled }) => {
  const { values, setFieldValue } = useFormikContext();
  const [visible, setVisible] = useState(false);
  const value = getIn(values, name);

  return (
    <View style={{ marginBottom: 15 }}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setVisible(true)}
        disabled={disabled}
      >
        <Text>{value || "Select Option..."}</Text>
        <MaterialCommunityIcons name="chevron-down" size={20} />
      </TouchableOpacity>
      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <ScrollView style={{ maxHeight: 300 }}>
            {options.map((opt) => (
              <RadioButton.Item
                key={opt}
                label={opt}
                value={opt}
                status={value === opt ? "checked" : "unchecked"}
                onPress={() => {
                  setFieldValue(name, opt);
                  setVisible(false);
                }}
              />
            ))}
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
};

// const FormToggle = ({ label, name, trueLabel, falseLabel, disabled }) => {
//   const { values, setFieldValue } = useFormikContext();
//   // Using the Safe Chain here
//   const val = getIn(values, name);

//   return (
//     <View style={{ marginBottom: 10 }}>
//       <Text style={styles.labelSmall}>{label}</Text>
//       <View style={styles.row}>
//         {/* HAVE ACCESS BUTTON */}
//         <Button
//           mode={val === true ? "contained" : "outlined"}
//           style={styles.flex1}
//           onPress={() => setFieldValue(name, true)}
//           disabled={disabled}
//           buttonColor={val === true ? "#E8F5E9" : undefined} // Light green background when selected
//           textColor={val === true ? "#2E7D32" : "#64748B"} // Dark green text when selected
//           icon={() => (
//             <MaterialCommunityIcons
//               name="check-circle"
//               size={20}
//               color={val === true ? "#2E7D32" : "#94A3B8"}
//             />
//           )}
//         >
//           {trueLabel}
//         </Button>

//         {/* NO ACCESS BUTTON */}
//         <Button
//           mode={val === false ? "contained" : "outlined"}
//           style={styles.flex1}
//           onPress={() => setFieldValue(name, false)}
//           disabled={disabled}
//           buttonColor={val === false ? "#FFEBEE" : undefined} // Light red background when selected
//           textColor={val === false ? "#D32F2F" : "#64748B"} // Dark red text when selected
//           icon={() => (
//             <MaterialCommunityIcons
//               name="close-circle"
//               size={20}
//               color={val === false ? "#D32F2F" : "#94A3B8"}
//             />
//           )}
//         >
//           {falseLabel}
//         </Button>
//       </View>
//     </View>
//   );
// };

// --- SECTIONS ---

// --- STYLES ---

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
