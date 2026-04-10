import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { Formik } from "formik";
import { useMemo, useState } from "react";
import {
  Pressable,
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
import { ScreenLock } from "../../../components/SceenLock";
import { useGeo } from "../../context/GeoContext";
import { useWarehouse } from "../../context/WarehouseContext";
import { useAuth } from "../../hooks/useAuth";
import {
  useAddPremiseMutation,
  useUpdatePremiseMutation,
} from "../../redux/premisesApi";
import { ForensicFooter } from "../meters/ForensicFooter";

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
  "Backroom",
];

const premiseOccupancySatusOptions = [
  "Select...",
  `Occupied`,
  `Unoccupied`,
  `Vandalised`,
  `Under Construction`,
  `Dilapidated`,
];

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

function requiresPropertyName(type) {
  return (
    type !== "Select..." &&
    type !== "Residential" &&
    type !== "Vacant Land" &&
    !!String(type || "").trim()
  );
}

function requiresUnitNo(type) {
  return (
    type === "Flats" ||
    type === "Sectional Title" ||
    type === "Townhouse Complex"
  );
}

export default function FormPremise() {
  // console.log(`FormPremise ----mounted`);

  const [inProgress, setInProgress] = useState(false);

  const { all } = useWarehouse();

  const router = useRouter();

  const { id, premiseId, duplicateId } = useLocalSearchParams();

  const isEdit = !!premiseId;

  const isDuplicate = !!duplicateId;

  const sourcePremise = useMemo(() => {
    const targetId = premiseId || duplicateId;
    if (!targetId) return null;
    return all?.prems?.find((p) => p.id === targetId);
  }, [premiseId, duplicateId, all?.prems]);

  const { profile, user } = useAuth();
  // console.log(`profile?.profile?.displayName`, profile?.profile?.displayName);
  // console.log(`user`, user);

  const agentUid = user?.uid || "unknown_uid";
  // console.log(`agentUid`, agentUid);

  const agentName = profile?.profile?.displayName || "Field Agent";
  // console.log(`agentName`, agentName);

  const { geoState, updateGeo } = useGeo();

  const selectedErf = geoState?.selectedErf || null;

  const targetGeo =
    all?.geoLibrary?.[id] || all?.geoLibrary?.[selectedErf?.erfId] || null;

  const erfNo = selectedErf?.erfNo || "N/A";

  const erfCentroid = useMemo(() => {
    if (targetGeo?.centroid?.lat != null && targetGeo?.centroid?.lng != null) {
      return {
        lat: targetGeo.centroid.lat,
        lng: targetGeo.centroid.lng,
      };
    }

    return { lat: -34.035, lng: 23.048 };
  }, [targetGeo]);

  const admin = selectedErf?.admin;

  const premiseSchema = useMemo(() => {
    return Yup.object().shape({
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
          is: (val) => requiresPropertyName(val),
          then: (schema) => schema.trim().required("Unit Name is mandatory"),
          otherwise: (schema) => schema.optional(),
        }),

        unitNo: Yup.string().when("type", {
          is: (val) => requiresUnitNo(val),
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
              if (isEdit) return true;

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
  }, [erfCentroid, isEdit]);

  const initialValues = useMemo(() => {
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
        context: sourcePremise?.context || baseContext,

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
      };
    }

    // DUPLICATE
    if (isDuplicate && sourcePremise) {
      return {
        context: sourcePremise?.context || baseContext,

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
      };
    }

    // NEW
    return {
      context: baseContext,

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
    };
  }, [
    isEdit,
    isDuplicate,
    sourcePremise,
    erfCentroid,
    selectedErf?.isTownship,
  ]);

  const [addPremise] = useAddPremiseMutation();

  const [updatePremise] = useUpdatePremiseMutation(); // 🎯 Ensure this is in your API slice

  function buildSystemFields() {
    const timestamp = new Date().toISOString();

    const stampedParents = {
      countryPcode: admin?.country?.pcode || null,
      provincePcode: admin?.province?.pcode || null,
      dmPcode: admin?.district?.pcode || null,
      lmPcode: admin?.localMunicipality?.pcode || null,
      wardPcode: admin?.ward?.pcode || null,
    };

    const wardNo =
      admin?.ward?.name?.match(/\d+/)?.[0] ||
      admin?.ward?.pcode?.slice(-3) ||
      "UNK";

    const safeErfNo = String(erfNo || "N-A").replace(/\//g, "-");

    const generatedId = `PRM_${Date.now()}_${Math.floor(Math.random() * 1000)}_W${wardNo}_${safeErfNo}`;

    if (isEdit) {
      return {
        id: sourcePremise?.id,
        schemaVersion: sourcePremise?.schemaVersion || "1.0.0",
        erfId: sourcePremise?.erfId || id,
        erfNo: sourcePremise?.erfNo || erfNo,

        parents: {
          countryPcode:
            sourcePremise?.parents?.countryPcode || stampedParents.countryPcode,
          provincePcode:
            sourcePremise?.parents?.provincePcode ||
            stampedParents.provincePcode,
          dmPcode: sourcePremise?.parents?.dmPcode || stampedParents.dmPcode,
          lmPcode: sourcePremise?.parents?.lmPcode || stampedParents.lmPcode,
          wardPcode:
            sourcePremise?.parents?.wardPcode || stampedParents.wardPcode,
        },

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
          createdAt:
            sourcePremise?.metadata?.createdAt ||
            sourcePremise?.metadata?.created?.at ||
            timestamp,

          createdByUid:
            sourcePremise?.metadata?.createdByUid ||
            sourcePremise?.metadata?.created?.byUid ||
            agentUid ||
            "unknown_uid",

          createdByUser:
            sourcePremise?.metadata?.createdByUser ||
            sourcePremise?.metadata?.created?.byUser ||
            agentName ||
            "Field Agent",

          updatedAt: timestamp,
          updatedByUid: agentUid || "unknown_uid",
          updatedByUser: agentName || "Field Agent",

          noAccessTrnIds: Array.isArray(sourcePremise?.metadata?.noAccessTrnIds)
            ? sourcePremise.metadata.noAccessTrnIds
            : [],
        },
      };
    }

    return {
      id: generatedId,
      schemaVersion: "1.0.0",
      erfId: id,
      erfNo: erfNo,
      parents: stampedParents,
      services: {
        electricityMeters: [],
        waterMeters: [],
      },
      metadata: {
        createdAt: timestamp,
        createdByUid: agentUid || "unknown_uid",
        createdByUser: agentName || "Field Agent",

        updatedAt: timestamp,
        updatedByUid: agentUid || "unknown_uid",
        updatedByUser: agentName || "Field Agent",

        noAccessTrnIds: [],
      },
    };
  }

  // function buildSystemFields() {
  //   const timestamp = new Date().toISOString();

  //   const agentStamp = {
  //     at: timestamp,
  //     byUser: agentName || "Field Agent",
  //     byUid: agentUid || "unknown_uid",
  //   };

  //   const stampedParents = {
  //     countryPcode: admin?.country?.pcode || null,
  //     provincePcode: admin?.province?.pcode || null,
  //     dmPcode: admin?.district?.pcode || null,
  //     lmPcode: admin?.localMunicipality?.pcode || null,
  //     wardPcode: admin?.ward?.pcode || null,
  //   };

  //   const wardNo =
  //     admin?.ward?.name?.match(/\d+/)?.[0] ||
  //     admin?.ward?.pcode?.slice(-3) ||
  //     "UNK";

  //   const safeErfNo = String(erfNo || "N-A").replace(/\//g, "-");
  //   // console.log(`safeErfNo`, safeErfNo);
  //   // console.log(`wardNo`, wardNo);

  //   const generatedId = `PRM_${Date.now()}_${Math.floor(Math.random() * 1000)}_W${wardNo}_${safeErfNo}`;

  //   if (isEdit) {
  //     return {
  //       id: sourcePremise?.id,
  //       schemaVersion: sourcePremise?.schemaVersion || "1.0.0",
  //       erfId: sourcePremise?.erfId || id,
  //       erfNo: sourcePremise?.erfNo || erfNo,

  //       parents: {
  //         countryPcode:
  //           sourcePremise?.parents?.countryPcode || stampedParents.countryPcode,
  //         provincePcode:
  //           sourcePremise?.parents?.provincePcode ||
  //           stampedParents.provincePcode,
  //         dmPcode: sourcePremise?.parents?.dmPcode || stampedParents.dmPcode,
  //         lmPcode: sourcePremise?.parents?.lmPcode || stampedParents.lmPcode,
  //         wardPcode:
  //           sourcePremise?.parents?.wardPcode || stampedParents.wardPcode,
  //       },

  //       services: {
  //         electricityMeters: Array.isArray(
  //           sourcePremise?.services?.electricityMeters,
  //         )
  //           ? sourcePremise.services.electricityMeters
  //           : [],
  //         waterMeters: Array.isArray(sourcePremise?.services?.waterMeters)
  //           ? sourcePremise.services.waterMeters
  //           : [],
  //       },

  //       metadata: {
  //         created: sourcePremise?.metadata?.created || agentStamp,
  //         updated: agentStamp,
  //         noAccessTrnIds: Array.isArray(sourcePremise?.metadata?.noAccessTrnIds)
  //           ? sourcePremise.metadata.noAccessTrnIds
  //           : [],
  //       },
  //     };
  //   }

  //   return {
  //     id: generatedId,
  //     schemaVersion: "1.0.0",
  //     erfId: id,
  //     erfNo: erfNo,
  //     parents: stampedParents,
  //     services: {
  //       electricityMeters: [],
  //       waterMeters: [],
  //     },
  //     metadata: {
  //       created: agentStamp,
  //       updated: agentStamp,
  //       noAccessTrnIds: [],
  //     },
  //   };
  // }

  const handleSubmit = async (values, { setSubmitting }) => {
    setInProgress(true);
    try {
      const storage = getStorage();
      const systemFields = buildSystemFields();
      const premiseDocId = systemFields.id;

      const syncedMedia = await Promise.all(
        (values?.media || []).map(async (item) => {
          if (item?.uri && !item?.url) {
            const fileName = `${premiseDocId}_${item.tag}_${Date.now()}.jpg`;
            const storageRef = ref(
              storage,
              `premises/${premiseDocId}/${fileName}`,
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

          return item;
        }),
      );

      const finalValues = JSON.parse(
        JSON.stringify(
          {
            ...systemFields,

            context: values.context,

            address: {
              strNo: String(values?.address?.strNo || "").trim(),
              strName: String(values?.address?.strName || "").trim(),
              strType: values?.address?.strType || "Select...",
            },

            propertyType: {
              type: values?.propertyType?.type || "Select...",
              name: String(values?.propertyType?.name || "").trim(),
              unitNo: String(values?.propertyType?.unitNo || "").trim(),
            },

            occupancy: {
              status: values?.occupancy?.status || "Occupied",
            },

            geometry: {
              centroid: {
                lat: values?.geometry?.centroid?.lat,
                lng: values?.geometry?.centroid?.lng,
              },
            },

            media: syncedMedia,
          },
          (key, value) => (value === undefined ? null : value),
        ),
      );

      if (isEdit) {
        await updatePremise(finalValues).unwrap();
      } else {
        await addPremise(finalValues).unwrap();
      }
      updateGeo({ selectedPremise: null, lastSelectionType: "PREMISE" });
      ToastAndroid.show("Premise saved.", ToastAndroid.LONG);
      router.replace("/(tabs)/premises");
    } catch (err) {
      console.warn(`🛰️Could not save premise form: ${err.message}`);
      ToastAndroid.show("Could not save premise form.", ToastAndroid.LONG);
    } finally {
      setSubmitting(false);
      setInProgress(false);
    }
  };

  return (
    <>
      <ScreenLock
        visible={inProgress}
        title="SYNCING"
        status="Uploading premise form data..."
      />

      <Formik
        initialValues={initialValues}
        validationSchema={premiseSchema}
        validateOnMount={true}
        onSubmit={handleSubmit}
      >
        {({ setFieldValue, values, isSubmitting, errors }) => {
          // console.log(`FormPremise --errors`, errors);
          // console.log(`FormPremise --values`, values);
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
                    <Pressable
                      onPress={() => router.back()}
                      style={styles.backBtn}
                    >
                      <Ionicons name="chevron-back" size={28} color="#1e293b" />
                    </Pressable>
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
                  <Text style={styles.sectionTitle}>
                    PROPERTY CLASSIFICATION
                  </Text>
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
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.toggleLabel}>
                          {values.context === "Township"
                            ? "Township"
                            : "Suburb"}
                        </Text>

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
                    {requiresPropertyName(values?.propertyType?.type) && (
                      <>
                        <FormInput
                          label="Unit Name"
                          name="propertyType.name"
                          placeholder="Unit Name"
                          keyboardType="default"
                        />
                        <Divider style={styles.divider} />
                      </>
                    )}

                    {requiresUnitNo(values?.propertyType?.type) && (
                      <FormInput
                        label="Unit Number"
                        name="propertyType.unitNo"
                        placeholder="Unit Number"
                        keyboardType="default"
                      />
                    )}
                  </Surface>

                  <IrepsMedia
                    tag={"propertyTypePhoto"}
                    agentName={agentName}
                    agentUid={agentUid}
                    fallbackGps={values?.geometry?.centroid}
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
                    fallbackGps={values?.geometry?.centroid}
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
    </>
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

  headerErfText: {
    color: "#34d399",
    fontSize: 11,
    fontWeight: "bold",
  },

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

  toggleLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },

  divider: {
    marginVertical: 10,
  },

  backBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
