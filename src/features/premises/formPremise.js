import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Formik } from "formik";
import { useMemo } from "react";
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
import * as Yup from "yup";
import FormInput from "../../../components/forms/FormInput";
import FormMapPositioner from "../../../components/forms/FormMapPositioner";
import FormSelect from "../../../components/forms/FormSelect";
import { IrepsMedia } from "../../../components/media/IrepsMedia";
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
  "Commercial",
  "Industrial",
  "Sectional Title",
  "Townhouse Complex",
  "Vacant Land",
  "Flats",
  "Estate",
  "Church",
  "School",
  "Government",
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

function hasTaggedMedia(media, tag) {
  if (!Array.isArray(media)) return false;

  return media.some((item) => {
    if (!item) return false;
    return item.tag === tag;
  });
}

function isFilled(value) {
  return String(value || "").trim().length > 0;
}

function isSamePoint(a, b, tolerance = 0.000001) {
  if (!a || !b) return false;

  const aLat = Number(a?.lat);
  const aLng = Number(a?.lng);
  const bLat = Number(b?.lat);
  const bLng = Number(b?.lng);

  if (
    Number.isNaN(aLat) ||
    Number.isNaN(aLng) ||
    Number.isNaN(bLat) ||
    Number.isNaN(bLng)
  ) {
    return false;
  }

  return Math.abs(aLat - bLat) < tolerance && Math.abs(aLng - bLng) < tolerance;
}

export default function FormPremise() {
  // console.log(`FormPremise ----mounted`);

  const { all } = useWarehouse();

  const router = useRouter();

  const { id, premiseId, duplicateId } = useLocalSearchParams();
  console.log(`FormPremise ----id`, id);

  const auth = useAuth();

  const agentUid = auth?.user?.uid || "unknown_uid";
  const agentName = auth?.profile?.profile?.displayName || "Field Agent";

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
  console.log(`FormPremise ----sourcePremise`, sourcePremise);

  const { authState } = useAuth();

  const { geoState, updateGeo } = useGeo();
  // console.log(`FormPremise ----geoState`, geoState);

  /* SELECTED ERF METADATA  */
  const targetGeo =
    all?.geoLibrary?.[id] || all?.geoLibrary?.[selectedErf?.erfId] || null;
  const selectedErf = geoState?.selectedErf || null;
  // console.log(`FormPremise ----selectedErf`, selectedErf);
  // console.log(`FormPremise ----selectedErf?.centroid`, selectedErf?.centroid);
  // console.log(`FormPremise ----selectedErf?.erfNo`, selectedErf?.erfNo);
  // console.log(`FormPremise ----targetGeo`, targetGeo);

  /* 🏛️ SOVEREIGN SOURCE: Extracting directly from the Erf Object */
  const erfNo = selectedErf?.erfNo || "N/A"; // e.g. "214"
  const safeErfNo = erfNo.replace(/\//g, "-");

  // 🎯 THE LOCK: Icon lands exactly on the Erf's Centroid

  /* 🛰️ GEOMETRY RESOLVER: Tiered Fallback */
  const erfCentroid = useMemo(() => {
    if (targetGeo?.centroid?.lat != null && targetGeo?.centroid?.lng != null) {
      return {
        lat: targetGeo.centroid.lat,
        lng: targetGeo.centroid.lng,
      };
    }

    return { lat: -34.035, lng: 23.048 };
  }, [selectedErf, targetGeo, all?.meta?.centroid]);

  // 🌍 REGIONAL HIERARCHY: Direct from the Erf's admin block
  const admin = selectedErf?.admin;
  // const countryId = admin?.country?.pcode; // e.g. "ZA1"
  // const provinceId = admin?.province?.pcode; // e.g. "ZA1"
  // const dmId = admin?.district?.pcode; // e.g. "ZA104"
  // const lmId = admin?.localMunicipality?.pcode; // e.g. "ZA1048"
  // const wardId = admin?.ward?.pcode; // e.g. "ZA1048"
  // const wardNo = admin?.ward?.name?.split(" ")[1];
  const wardNo =
    admin?.ward?.name?.match(/\d+/)?.[0] ||
    admin?.ward?.pcode?.slice(-3) ||
    "UNK";

  const premiseSchema = useMemo(() => {
    return Yup.object().shape({
      schemaVersion: Yup.string().required("Schema version is required"),

      address: Yup.object().shape({
        strNo: Yup.string().trim().required("Mandatory"),
        strName: Yup.string().trim().required("Mandatory"),
        strType: Yup.string()
          .notOneOf(["Select..."], "Please select a street type")
          .required("Required"),
      }),

      propertyType: Yup.object().shape({
        type: Yup.string()
          .notOneOf(["Select..."], "Please select a property type")
          .required("Required"),

        name: Yup.string().when("type", {
          is: (val) =>
            val === "Flats" ||
            val === "Sectional Title" ||
            val === "Commercial",
          then: (schema) => schema.trim().required("Unit Name is mandatory"),
          otherwise: (schema) => schema.optional(),
        }),

        unitNo: Yup.string().when("type", {
          is: (val) => val === "Flats" || val === "Sectional Title",
          then: (schema) => schema.trim().required("Unit No is mandatory"),
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
              "Under Construction",
              "Dilapidated",
              "Accessed",
            ],
            "Invalid Status",
          )
          .required("Required"),
      }),

      geometry: Yup.object().shape({
        centroid: Yup.object()
          .shape({
            lat: Yup.number().required("Latitude is required"),
            lng: Yup.number().required("Longitude is required"),
          })
          .test(
            "moved-from-erf-centroid",
            "You must move the GPS pin away from the default ERF position",
            function (value) {
              const hasValidPoint =
                typeof value?.lat === "number" &&
                typeof value?.lng === "number";

              if (!hasValidPoint) return false;

              const hasDefaultPoint =
                typeof erfCentroid?.lat === "number" &&
                typeof erfCentroid?.lng === "number";

              if (!hasDefaultPoint) return true;

              return !isSamePoint(value, erfCentroid);
            },
          ),
      }),

      media: Yup.array()
        .default([])
        .test(
          "property-type-photo-required",
          "Property Type photo is mandatory once property type is selected",
          function (media) {
            const propertyType = this.parent?.propertyType?.type;

            const propertyTypeChosen =
              !!propertyType &&
              propertyType !== "Select..." &&
              String(propertyType).trim() !== "";

            if (!propertyTypeChosen) return true;

            return hasTaggedMedia(media, "propertyTypePhoto");
          },
        )
        .test(
          "property-address-photo-required",
          "Property Address photo is mandatory once street number and street name are completed",
          function (media) {
            const strNo = this.parent?.address?.strNo;
            const strName = this.parent?.address?.strName;

            const addressCompleted = isFilled(strNo) && isFilled(strName);

            if (!addressCompleted) return true;

            return hasTaggedMedia(media, "propertyAdrPhoto");
          },
        ),
    });
  }, [erfCentroid]);

  const initialValues = useMemo(() => {
    const timestamp = new Date().toISOString();

    const agentStamp = {
      at: timestamp,
      byUser: authState?.user?.displayName || "Field Agent",
      byUid: authState?.user?.uid || "unknown_uid",
    };

    const baseParents = {
      countryPcode: admin?.country?.pcode || null,
      provincePcode: admin?.province?.pcode || null,
      dmPcode: admin?.district?.pcode || null,
      lmPcode: admin?.localMunicipality?.pcode || null,
      wardPcode: admin?.ward?.pcode || null,
    };

    const baseGeometry = {
      centroid: {
        lat: erfCentroid?.lat,
        lng: erfCentroid?.lng,
      },
    };

    const baseContext = selectedErf?.isTownship ? "Township" : "Suburb";

    // EDIT
    if (isEdit && sourcePremise) {
      return {
        ...sourcePremise,

        schemaVersion: sourcePremise?.schemaVersion || "1.0.0",

        erfId: sourcePremise?.erfId || id,
        erfNo: sourcePremise?.erfNo || erfNo,

        context: sourcePremise?.context || baseContext,

        parents: {
          ...baseParents,
        },

        address: {
          strNo: sourcePremise?.address?.strNo || "",
          strName: sourcePremise?.address?.strName || "",
          strType: sourcePremise?.address?.strType || "Select...",
        },

        propertyType: {
          type: sourcePremise?.propertyType?.type || "Select...",
          name: sourcePremise?.propertyType?.name || "",
          unitNo: sourcePremise?.propertyType?.unitNo || "",
        },

        occupancy: {
          status: sourcePremise?.occupancy?.status || "Occupied",
        },

        geometry: sourcePremise?.geometry?.centroid
          ? {
              centroid: {
                lat: sourcePremise.geometry.centroid.lat,
                lng: sourcePremise.geometry.centroid.lng,
              },
            }
          : baseGeometry,

        media: Array.isArray(sourcePremise?.media) ? sourcePremise.media : [],

        services: {
          electricityMeters: Array.isArray(
            sourcePremise?.services?.electricityMeters,
          )
            ? sourcePremise.services.electricityMeters
            : [],
          waterMeters: Array.isArray(sourcePremise?.services?.waterMeters)
            ? sourcePremise.services.waterMeters
            : [],
        },

        metadata: {
          ...sourcePremise?.metadata,
          created: sourcePremise?.metadata?.created || agentStamp,
          updated: agentStamp,
          noAccessTrnIds: Array.isArray(sourcePremise?.metadata?.noAccessTrnIds)
            ? sourcePremise.metadata.noAccessTrnIds
            : [],
        },
      };
    }

    // DUPLICATE
    if (isDuplicate && sourcePremise) {
      return {
        ...sourcePremise,

        schemaVersion: "1.0.0",

        id: `PRM_${Date.now()}_${Math.floor(Math.random() * 1000)}_W${wardNo}_${safeErfNo}`,

        erfId: id,
        erfNo: erfNo,

        context: sourcePremise?.context || baseContext,

        parents: {
          ...baseParents,
        },

        address: {
          strNo: sourcePremise?.address?.strNo || "",
          strName: sourcePremise?.address?.strName || "",
          strType: sourcePremise?.address?.strType || "Select...",
        },

        propertyType: {
          type: sourcePremise?.propertyType?.type || "Select...",
          name: sourcePremise?.propertyType?.name || "",
          unitNo: "",
        },

        occupancy: {
          status: sourcePremise?.occupancy?.status || "Occupied",
        },

        geometry: baseGeometry,

        media: [],

        services: {
          electricityMeters: [],
          waterMeters: [],
        },

        metadata: {
          ...sourcePremise?.metadata,
          created: agentStamp,
          updated: agentStamp,
          noAccessTrnIds: [],
        },
      };
    }

    // NEW
    return {
      schemaVersion: "1.0.0",

      id: `PRM_${Date.now()}_${Math.floor(Math.random() * 1000)}_W${wardNo}_${safeErfNo}`,

      erfId: id,
      erfNo: erfNo,

      context: baseContext,

      parents: {
        ...baseParents,
      },

      address: {
        strNo: "",
        strName: "",
        strType: "Select...",
      },

      propertyType: {
        type: "Select...",
        name: "",
        unitNo: "",
      },

      occupancy: {
        status: "Occupied",
      },

      geometry: baseGeometry,

      media: [],

      services: {
        electricityMeters: [],
        waterMeters: [],
      },

      metadata: {
        created: agentStamp,
        updated: agentStamp,
        noAccessTrnIds: [],
      },
    };
  }, [
    isEdit,
    isDuplicate,
    sourcePremise,
    id,
    erfNo,
    safeErfNo,
    wardNo,
    admin,
    erfCentroid,
    selectedErf?.isTownship,
    authState?.user,
  ]);

  const [addPremise] = useAddPremiseMutation();
  const [updatePremise] = useUpdatePremiseMutation(); // 🎯 Ensure this is in your API slice

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
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

      if (isEdit) {
        await updatePremise(finalValues).unwrap();
      } else {
        await addPremise(finalValues).unwrap();
      }

      updateGeo({
        selectedPremise: finalValues,
        lastSelectionType: "PREMISE",
      });

      router.replace("/(tabs)/premises");
    } catch (err) {
      console.warn(`🛰️Could not save premise form: ${err.message}`);
      ToastAndroid.show("Could not save premise form.", ToastAndroid.LONG);
    } finally {
      setSubmitting(false);
    }
  };

  // const handleSubmit = async (values, { setSubmitting }) => {
  //   try {
  //     const finalValues = {
  //       ...values,
  //       metadata: {
  //         ...values.metadata,
  //         updated: {
  //           at: new Date().toISOString(),
  //           byUser: authState?.user?.displayName || "Field Agent",
  //           byUid: authState?.user?.uid || "unknown_uid",
  //         },
  //       },
  //     };

  //     if (isEdit) {
  //       await updatePremise(finalValues).unwrap();
  //     } else {
  //       await addPremise(finalValues).unwrap();
  //     }

  //     router.replace(`/(tabs)/premises`);
  //   } catch (err) {
  //     console.warn(`🛰️Could not save premise form: ${err.message}`);
  //     ToastAndroid.show("Could not save premise form.", ToastAndroid.LONG);
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={premiseSchema}
      validateOnMount={true}
      onSubmit={handleSubmit}
    >
      {({ setFieldValue, values, isSubmitting, errors }) => {
        console.log(`FormPremise --errors`, errors);
        console.log(`FormPremise --values`, values);
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
                    onPress={() => router.back()}
                    style={styles.backBtn}
                  >
                    <Ionicons name="chevron-back" size={46} color="#1e293b" />
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
                      setFieldValue(
                        "context",
                        values.context === "Township" ? "Suburb" : "Township",
                      )
                    }

                    // onPress={() =>
                    //   setFieldValue("isTownship", !values.isTownship)
                    // }
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleLabel}>
                        {values.context === "Township" ? "Township" : "Suburb"}
                      </Text>
                      {/* <Text style={styles.toggleLabel}>
                        {values.isTownship ? "Township" : "Suburb"}
                      </Text> */}
                      <Text style={{ fontSize: 10, color: "#94a3b8" }}>
                        Tap row to toggle geographic context
                      </Text>
                    </View>

                    <Switch
                      value={values.context === "Township"}
                      color="#059669"
                      onValueChange={(v) =>
                        setFieldValue("context", v ? "Township" : "Suburb")
                      }
                    />

                    {/* <Switch
                      value={values.isTownship}
                      color="#059669"
                      // Keep this for direct toggle hits
                      onValueChange={(v) => setFieldValue("isTownship", v)}
                      // 🛡️ Prevent the Switch from blocking the row tap on some Android versions
                      pointerEvents="none"
                    /> */}
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

                <IrepsMedia
                  tag={"propertyTypePhoto"}
                  agentName={agentName}
                  agentUid={agentUid}
                />
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

                <IrepsMedia
                  tag={"propertyAdrPhoto"}
                  agentName={agentName}
                  agentUid={agentUid}
                />

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
