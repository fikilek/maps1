import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Formik } from "formik";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { Divider, Surface, Switch } from "react-native-paper";

import { useMemo } from "react";
import * as Yup from "yup";
import FormInput from "../../../components/forms/FormInput";
import FormMapPositioner from "../../../components/forms/FormMapPositioner";
import FormSelect from "../../../components/forms/FormSelect";
import { useGeo } from "../../context/GeoContext";
import { useWarehouse } from "../../context/WarehouseContext";
import { useAuth } from "../../hooks/useAuth";
import {
  useAddPremiseMutation,
  useUpdatePremiseMutation,
} from "../../redux/premisesApi";
import { ForensicFooter } from "../meters/ForensicFooter";

const { width, height } = Dimensions.get("window");

const streetTypeOptions = [
  "Select...",
  "Street",
  "Road",
  "Avenue",
  "Drive",
  "Close",
  "Way",
  "Boulevard",
  "Crescent",
  "Backroom",
];
const propertyTypeOptions = [
  "Select...",
  "Residential",
  "Business",
  "Industrial",
  "Sectional Title",
  "Vacant Land",
  "Flats",
];

const premiseOccupancySatusOptions = [
  "Select...",
  `Occupied`,
  `Unoccupied`,
  `Vandalised`,
  `Under Construction`,
  `Dilapidated`,
];

// 🏛️ Schema Validation (Yup)
const PremiseSchema = Yup.object().shape({
  address: Yup.object().shape({
    strNo: Yup.string().required("Mandatory"),
    strName: Yup.string().required("Mandatory"),
    strType: Yup.string()
      .notOneOf(["Select..."], "Please select a street type")
      .required("Required"),
  }),
  propertyType: Yup.object().shape({
    type: Yup.string()
      .notOneOf(["Select..."], "Please select a property type")
      .required("Required"),
    // If type is "Sectional Title" (or Flats), name is mandatory
    name: Yup.string().when("type", {
      // 🎯 Logic: Check if the value is either Flats or Sectional Title
      is: (val) =>
        val === "Flats" || val === "Sectional Title" || val === "Business",
      then: (schema) => schema.required("Unit Name is mandatory"),
      otherwise: (schema) => schema.optional(),
    }),
    // If type is "Sectional Title", unitNo must have at least one entry
    unitNo: Yup.string().when("type", {
      is: (val) => val === "Flats" || val === "Sectional Title",
      then: (schema) => schema.required("Unit No is mandatory"),
      otherwise: (schema) => schema.optional(),
    }),
  }),
  context: Yup.string()
    .oneOf(["Township", "Suburb"], "Please select a valid category")
    .required("Required"),
  occupancy: Yup.object().shape({
    status: Yup.string()
      .oneOf(
        [
          "Occupied",
          "Unoccupied",
          "Vandalised",
          "Under Consrtruction",
          "Dilapidated",
          "Accessed",
        ],
        "Invalid Status",
      )
      .required("Required"),
  }),
  metadata: Yup.object().shape({
    isGpsVerified: Yup.boolean()
      .oneOf([true], "Field verification is mandatory")
      .required("Required"),
  }),
});

export default function FormPremise() {
  // console.log(`FormPremise ----mounted`);

  const { all } = useWarehouse();
  const router = useRouter();

  const { id, premiseId, duplicateId } = useLocalSearchParams();

  // 🕵️ 2. DETERMINE MISSION MODE
  const isEdit = !!premiseId;
  // console.log(`FormPremise ----isEdit`, isEdit);
  const isDuplicate = !!duplicateId;
  // console.log(`FormPremise ----isDuplicate`, isDuplicate);

  // 🏛️ 3. RESOLVE SOURCE DATA FROM WAREHOUSE
  const sourcePremise = useMemo(() => {
    const targetId = premiseId || duplicateId; // Look for either the target or the template
    if (!targetId) return null;
    return all?.prems?.find((p) => p.id === targetId);
  }, [premiseId, duplicateId, all?.prems]);

  const { authState } = useAuth();

  const { geoState } = useGeo();
  // console.log(`FormPremise ----geoState`, geoState);

  /* SELECTED ERF METADATA  */
  const targetGeo = all?.geoEntries?.[id] || null;
  const selectedErf = geoState?.selectedErf || null;
  console.log(`FormPremise ----selectedErf`, selectedErf);
  // console.log(`FormPremise ----selectedErf?.erfNo`, selectedErf?.erfNo);

  /* 🏛️ SOVEREIGN SOURCE: Extracting directly from the Erf Object */
  const erfNo = selectedErf?.erfNo || "N/A"; // e.g. "214"
  const safeErfNo = erfNo.replace(/\//g, "-");

  // 🎯 THE LOCK: Icon lands exactly on the Erf's Centroid

  /* 🛰️ GEOMETRY RESOLVER: Tiered Fallback */
  const erfCentroid = useMemo(() => {
    // 🎯 TIER 1: The Erf's actual SG/GIS Centroid (High Precision)
    if (targetGeo?.centroid) {
      return [targetGeo.centroid.lat, targetGeo.centroid.lng];
    }

    // 🎯 TIER 3: The LM's Centroid (Municipal Center)
    // Pulling from the warehouse metadata
    if (all?.meta?.centroid) {
      return [all.meta.centroid.lat, all.meta.centroid.lng];
    }

    // 🛡️ LAST RESORT: Safe Municipal Default (Knysna area)
    return [-34.035, 23.048];
  }, [targetGeo, geoState?.userLocation, all?.meta?.centroid]);

  // 🌍 REGIONAL HIERARCHY: Direct from the Erf's admin block
  const admin = selectedErf?.admin;
  const lmId = admin?.localMunicipality?.pcode; // e.g. "ZA1048"
  const dmId = admin?.district?.pcode; // e.g. "ZA104"
  const provinceId = admin?.province?.pcode; // e.g. "ZA1"
  const countryId = admin?.country?.pcode; // e.g. "ZA1"

  // 🎯 THE INTELLIGENCE RESOLVER

  const initialValues = useMemo(() => {
    const timestamp = new Date().toISOString();
    const agentStamp = {
      at: timestamp,
      byUser: authState?.user?.displayName || "Field Agent",
      byUid: authState?.user?.uid || "unknown_uid",
    };

    // 🛡️ MODE A: THE EDIT (Preserve Identity & History)
    if (isEdit && sourcePremise) {
      return {
        ...sourcePremise,
        metadata: {
          ...sourcePremise.metadata,
          updated: agentStamp, // Only the update pulse changes
        },
      };
    }

    // 👯 MODE B: THE DUPLICATE (Selective Cloning)
    if (isDuplicate && sourcePremise) {
      return {
        ...sourcePremise,
        // 🎯 NEW IDENTITY
        id: `PRM_${Date.now()}_${Math.floor(Math.random() * 1000)}_${safeErfNo}`,

        // 🎯 FRESH START: Wipe Meters & Specific Unit Number
        services: { electricityMeters: [], waterMeters: [] },
        propertyType: { ...sourcePremise.propertyType, unitNo: "" },

        metadata: {
          ...sourcePremise.metadata,
          // 🛡️ THE NA RESET: The new twin has no visit history
          naCount: [],

          // 🏛️ AUDIT TRAIL: New birth event
          created: agentStamp,
          updated: agentStamp,
          isGpsVerified: true, // We trust the parent structure's location
        },
      };
    }

    return {
      id: `PRM_${Date.now()}_${Math.floor(Math.random() * 1000)}_${safeErfNo}`,
      erfId: id,
      erfNo: erfNo,
      address: { strNo: "", strName: "", strType: "" },
      propertyType: { type: "", name: "", unitNo: "" },
      metadata: {
        created: agentStamp,
        updated: agentStamp,
        lmPcode: lmId,
        isGpsVerified: false,
      },
      geometry: { centroid: erfCentroid },
      services: { electricityMeters: [], waterMeters: [] },
      occupancy: { status: "Occupied" },
      context: selectedErf?.isTownship ? "Township" : "Suburb",
      parents: {
        lmId: lmId || null,
        dmId: dmId || null,
        provinceId: provinceId || null,
        countryId: countryId || null,
      },
    };
  }, [
    isEdit,
    isDuplicate,
    sourcePremise,
    id,
    erfNo,
    safeErfNo,
    erfCentroid,
    lmId,
    dmId,
    provinceId,
    authState?.user,
  ]);

  // console.log(`FormPremise ----initialValues`, initialValues);
  // console.log(`FormPremise ---sourcePremise`, sourcePremise);

  const [addPremise] = useAddPremiseMutation();
  const [updatePremise] = useUpdatePremiseMutation(); // 🎯 Ensure this is in your API slice

  const handleSubmit = async (values, { setSubmitting }) => {
    // 🕵️ Determine if this is an Edit or a New Capture
    const isEdit = !!values?.id;

    try {
      // 🛰️ 1. PREPARE SOVEREIGN METADATA
      // We ensure the 'updated' block follows the nested standard: { at, byUser, byUid }
      const finalValues = {
        ...values,
        metadata: {
          ...values.metadata,
          updated: {
            at: new Date().toISOString(),
            byUser: authState?.user?.displayName || "Field Agent",
            byUid: authState?.user?.uid || "unknown_uid",
          },
        },
      };

      // 🛰️ 2. EXECUTE THE CORRECT MUTATION
      if (isEdit) {
        // console.log(`FormPremise ---EDIT FORM ---finalValues`, finalValues);
        await updatePremise(finalValues).unwrap();
      } else {
        // console.log(`FormPremise ---NEW FORM ---finalValues`, finalValues);
        await addPremise(finalValues).unwrap();
      }

      // 🏛️ 3. SUCCESS NAVIGATION
      // Tactical retreat to the Erf details screen to view the updated stack
      router.replace(`/(tabs)/erfs/${values?.erfId}`);
    } catch (err) {
      // 🛡️ 4. OFFLINE-FIRST RESILIENCE
      // console.warn(`🛰️ Signal Lost but Data Vaulted: ${err.message}`);

      ToastAndroid.show("Saved Locally - Will sync when signal returns.");
      router.replace(`/(tabs)/erfs/${values?.erfId}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={PremiseSchema}
      validateOnMount={true}
      onSubmit={handleSubmit}
    >
      {({ setFieldValue, values, isSubmitting, errors }) => {
        return (
          <View style={styles.container}>
            <Stack.Screen
              options={{
                title: isEdit ? "Edit Premise" : "New Premise", // Improved UI clarity
                headerRight: () => (
                  <View style={styles.headerErfBadge}>
                    <Text style={styles.headerErfText}>ERF: {erfNo}</Text>
                  </View>
                ),
                headerLeft: () => (
                  <TouchableOpacity
                    // 🎯 THE FIX: Instead of router.back(), use replace to go back to the Anchor
                    onPress={() => router.replace(`/(tabs)/erfs/${id}`)}
                    style={styles.closeBtnBorder}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={20}
                      color="#000"
                    />
                  </TouchableOpacity>
                ),
              }}
            />

            <ScrollView contentContainerStyle={styles.formScroll}>
              {/* Property Clasification */}
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="office-building-marker"
                  size={18}
                  color="#059669"
                />
                <Text style={styles.sectionTitle}>PROPERTY CLASSIFICATION</Text>
              </View>
              <Surface style={styles.card} elevation={1}>
                {/* PROPERTY CONTEXT [Township / Suburb] */}
                <Surface style={styles.card} elevation={1}>
                  {/* 🏙️ TOWNSHIP / SUBURB TOGGLE ROW */}
                  <TouchableOpacity
                    // 🛡️ Lock interaction if the form is in flight
                    disabled={isSubmitting}
                    style={styles.toggleRow}
                    activeOpacity={0.7}
                    onPress={() =>
                      setFieldValue("isTownship", !values.isTownship)
                    }
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleLabel}>
                        {values.isTownship ? "Township" : "Suburb"}
                      </Text>
                      <Text style={{ fontSize: 10, color: "#94a3b8" }}>
                        Tap row to toggle geographic context
                      </Text>
                    </View>

                    <Switch
                      value={values.isTownship}
                      color="#059669"
                      // Keep this for direct toggle hits
                      onValueChange={(v) => setFieldValue("isTownship", v)}
                      // 🛡️ Prevent the Switch from blocking the row tap on some Android versions
                      pointerEvents="none"
                    />
                  </TouchableOpacity>
                </Surface>
                <FormSelect
                  label="Property Status"
                  name="occupancy.status"
                  options={premiseOccupancySatusOptions}
                  icon="office-building-marker"
                />

                <Divider style={styles.divider} />

                {/* PROPERTYTYPE type */}
                <Surface style={styles.card} elevation={1}>
                  <FormSelect
                    label="Property Type"
                    name="propertyType.type"
                    options={propertyTypeOptions}
                    icon="office-building-marker"
                  />

                  <Divider style={styles.divider} />
                  {/* PROPERTYTYPE unitName */}
                  {values?.propertyType?.type !== "Residential" &&
                    values?.propertyType?.type !== "Vacant Land" && (
                      <>
                        <FormInput
                          label="Unit Name"
                          name="propertyType.name"
                          placeholder="Unit Name"
                          keyboardType="default"
                        />
                        <Divider style={styles.divider} />
                        {/* PROPERTYTYPE unitNo */}
                        <FormInput
                          label="Unit Number"
                          name="propertyType.unitNo"
                          placeholder="Unit Number"
                          keyboardType="default"
                        />
                      </>
                    )}
                </Surface>
              </Surface>

              {/* STREET ADDRESS */}
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="map-marker-radius"
                  size={18}
                  color="#059669"
                />
                <Text style={styles.sectionTitle}>STREET ADDRESS</Text>
              </View>
              <Surface style={styles.card} elevation={1}>
                <Surface style={styles.card} elevation={1}>
                  <View style={{ flexDirection: "row" }}>
                    <View style={{ flex: 1 }}>
                      <FormInput
                        label="STR NO"
                        name="address.strNo"
                        placeholder="Str No"
                        keyboardType="default"
                      />
                    </View>
                    <View style={{ flex: 2, marginLeft: 12 }}>
                      <FormInput
                        label="STR NAME"
                        name="address.strName"
                        placeholder="Str Name"
                        autoCapitalize="words" // 🏛️ Auto-Title Case for Street Names
                      />
                    </View>
                  </View>

                  <FormSelect
                    label="STREET TYPE"
                    name="address.strType"
                    options={streetTypeOptions}
                  />
                </Surface>

                <Surface style={styles.card} elevation={1}>
                  <FormMapPositioner
                    label="Physical Premise Location"
                    name="geometry.centroid"
                    erfId={id}
                    defaultLocation={erfCentroid}
                  />
                </Surface>
              </Surface>

              {/* 🎯 THE SOVEREIGN FOOTER */}
              {/* <Surface style={styles.card} elevation={1}>
                <FormFooter />
              </Surface> */}
              <ForensicFooter />

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        );
      }}
    </Formik>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  formScroll: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  headerErfBadge: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  headerErfText: { color: "#34d399", fontSize: 11, fontWeight: "bold" },
  label: { fontSize: 10, fontWeight: "800", color: "#94a3b8", marginBottom: 4 },
  selector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  selectorValue: { fontSize: 15, fontWeight: "600", color: "#1e293b" },
  input: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 10,
  },
  addressRow: { flexDirection: "row", marginBottom: 10 },
  row: { flexDirection: "row" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#64748b",
    marginLeft: 6,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleLabel: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  toggleSubLabel: { fontSize: 11, color: "#94a3b8" },
  photoBox: {
    height: 120,
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#cbd5e1",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  photoPlaceholder: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 8,
    fontWeight: "600",
  },
  photoPreview: { alignItems: "center" },
  photoText: { color: "#059669", fontWeight: "bold", marginTop: 4 },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 10 },
  submitBtn: {
    flex: 2,
    backgroundColor: "#0f172a",
    paddingVertical: 18,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  submitBtnText: {
    color: "#fff",
    fontWeight: "bold",
    letterSpacing: 1,
    marginLeft: 8,
  },
  resetBtn: {
    flex: 1,
    backgroundColor: "#e2e8f0",
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  resetBtnText: {
    color: "#475569",
    fontWeight: "800",
    fontSize: 14,
    marginLeft: 8,
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 15 },
  divider: { marginVertical: 10 },
  miniMapWrapper: {
    height: 100,
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  miniMap: { flex: 1 },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  mapOverlayText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
    marginTop: 4,
  },
  fullMapModal: {
    backgroundColor: "white",
    margin: 0,
    width: width,
    height: height,
    justifyContent: "flex-start",
  },
  fullMapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  fullMap: { flex: 1 },
  mapTip: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "#0f172a",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  mapTipText: { color: "#fff", fontWeight: "bold" },
  closeBtnBorder: {
    borderWidth: 1.5,
    borderColor: "#000000",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 8,
    padding: 4,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
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
});
