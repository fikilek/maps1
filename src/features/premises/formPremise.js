import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Formik } from "formik";
import { get } from "lodash";
import { useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import {
  ActivityIndicator,
  Divider,
  List,
  Modal,
  Portal,
  Surface,
  Switch,
} from "react-native-paper";

import * as Yup from "yup";
import { useGeo } from "../../context/GeoContext";
import { useAuth } from "../../hooks/useAuth";
import { useAddPremiseMutation } from "../../redux/premisesApi";

const { width, height } = Dimensions.get("window");

const STREET_TYPES = [
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
const PROPERTY_TYPES = [
  "Select...",
  "Residential",
  "Business",
  "Industrial",
  "Sectional Title",
  "Vacant Land",
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
      is: (val) => val === "Sectional Title",
      then: (schema) =>
        schema.required("Estate/Block Name is mandatory for this type"),
    }),
    // If type is "Sectional Title", unitNo must have at least one entry
    unitNo: Yup.array().when("type", {
      is: (val) => val === "Sectional Title",
      then: (schema) => schema.min(1, "Unit Number is mandatory"),
    }),
  }),
  isTownship: Yup.boolean().required(),
});

export default function FormPremise() {
  console.log(` `);
  console.log(`FormPremise ----mounted`);

  const router = useRouter();
  const { id } = useLocalSearchParams(); // This is the Erf ID
  const { geoState } = useGeo();
  // console.log(`FormPremise ----geoState`, geoState);
  const { user } = useAuth();

  const [typeModal, setTypeModal] = useState(null);
  // console.log(`FormPremise ----typeModal`, typeModal);
  const [mapFullVisible, setMapFullVisible] = useState(false);

  const selectedErf = geoState?.selectedErf || null;
  // console.log(`FormPremise ----selectedErf?.erfNo`, selectedErf?.erfNo);
  const erfNo = selectedErf?.erfNo || "N/A";

  const targetGeometry = geoState?.erfGeometries?.[id] || null;
  // console.log(`FormPremise ----targetGeometry`, targetGeometry);

  const fallbackCentroid = [
    geoState?.selectedLm?.centroid?.lat || -33.946,
    geoState?.selectedLm?.centroid?.lng || 22.984,
  ];
  // console.log(`FormPremise ----fallbackCentroid`, fallbackCentroid);

  const safeErfNo = selectedErf?.erfNo.replace(/\//g, "-");

  const initialValues = {
    id: `PRM_${Date.now()}_${Math.floor(Math.random() * 1000)}_${safeErfNo}`,
    erfId: id,
    erfNo: selectedErf?.erfNo || "",
    // 🛠️ FIX: Lowercase 'address' and camelCase 'strName'
    address: { strNo: "12", strName: "Google", strType: "Street" },
    propertyType: { type: "Business", name: "", unitNo: [] },
    metadata: {
      created: {
        byUser: user?.displayName || "Field Agent",
        byUid: user?.uid || "field_agent",
        at: new Date().toISOString(),
      },
      updated: {
        byUser: user?.displayName || "Field Agent",
        byUid: user?.uid || "field_agent",
        at: new Date().toISOString(),
      },
    },
    geometry: {
      centroid: targetGeometry?.centroid || fallbackCentroid,
    },
    // Adding service placeholders to match Detail screen grid
    services: {
      electricityMeter: 0,
      waterMeter: 0,
    },
    occupancy: { status: "OCCUPIED" },
    isTownship: selectedErf?.isTownship || false,
    parents: {
      localMunicipalityId: geoState?.selectedLm?.id || null,
      districtMunicipalityId: geoState?.selectedDm?.id || null,
      provinceId: geoState?.selectedProv?.id || null,
    },
  };
  // console.log(`FormPremise ----initialValues`, initialValues);

  const handleTextChange = (setFieldValue, key, value) => {
    const formattedValue = value.charAt(0).toUpperCase() + value.slice(1);
    setFieldValue(key, formattedValue);
  };

  const [addPremise] = useAddPremiseMutation();

  const getLabelStyle = (fieldName, errors) => {
    // Use lodash 'get' to find 'address.strNo' inside the objects
    const hasError = get(errors, fieldName);

    return {
      color: hasError ? "#D32F2F" : "#000",
      fontWeight: "bold",
      marginBottom: 4,
      fontSize: 12,
    };
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    console.log(`FormPremise ----values`, values);

    // 1. We must add the lmPcode to metadata so the API can find the cache
    const payload = {
      ...values,
      metadata: {
        ...values.metadata,
        lmPcode: values.parents.localMunicipalityId, // 🎯 CRITICAL ALIGNMENT
      },
    };
    // console.log(`FormPremise ----payload`, payload);

    try {
      // 2. Just call the mutation.
      // onQueryStarted will handle Vaulting (MMKV) and Injection (RAM)
      const addPremiseResult = await addPremise(payload).unwrap();
      // console.log(`FormPremise ----addPremiseResult`, addPremiseResult);

      router.replace(`/(tabs)/erfs/${values.erfId}`);
    } catch (err) {
      // Even if it fails (Offline), the UI is already updated by onQueryStarted
      console.log(`Error submitting premise`, err);
      console.log(`FormPremise --handleSubmit--values`, values);
      router.replace(`/(tabs)/erfs/${values.erfId}`);
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
      {({
        handleChange,
        setFieldValue,
        values,
        handleSubmit,
        resetForm,
        errors,
        touched,
        isSubmitting,
        isValid,
      }) => {
        // console.log(`FormPremise ----values`, values);
        // console.log(`FormPremise ----errors`, errors);
        return (
          <View style={styles.container}>
            <Stack.Screen
              options={{
                title: "New Premise",
                headerRight: () => (
                  <View style={styles.headerErfBadge}>
                    <Text style={styles.headerErfText}>ERF: {erfNo}</Text>
                  </View>
                ),
                headerLeft: () => (
                  <TouchableOpacity
                    onPress={() => router.back()}
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

            <Portal>
              <Modal
                visible={!!typeModal}
                onDismiss={() => setTypeModal(null)}
                contentContainerStyle={styles.modalContent}
              >
                <Text style={styles.modalTitle}>
                  Select{" "}
                  {typeModal === "street" ? "Street Type" : "Property Type"}
                </Text>
                <ScrollView>
                  {(typeModal === "street" ? STREET_TYPES : PROPERTY_TYPES).map(
                    (item) => (
                      <List.Item
                        key={item}
                        title={item}
                        onPress={() => {
                          setFieldValue(
                            typeModal === "street"
                              ? "address.strType"
                              : "propertyType.type",
                            item,
                          );
                          setTypeModal(null);
                        }}
                      />
                    ),
                  )}
                </ScrollView>
              </Modal>

              <Modal
                visible={mapFullVisible}
                onDismiss={() => setMapFullVisible(false)}
                contentContainerStyle={styles.fullMapModal}
              >
                <View style={styles.fullMapHeader}>
                  <Text style={styles.modalTitle}>
                    Drag Premise to Your Dot
                  </Text>
                  <TouchableOpacity onPress={() => setMapFullVisible(false)}>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={32}
                      color="#059669"
                    />
                  </TouchableOpacity>
                </View>
                <MapView
                  style={styles.fullMap}
                  showsUserLocation={true}
                  initialRegion={{
                    latitude: values.geometry.centroid[0],
                    longitude: values.geometry.centroid[1],
                    latitudeDelta: 0.002,
                    longitudeDelta: 0.002,
                  }}
                >
                  <Marker
                    draggable
                    coordinate={{
                      latitude: values.geometry.centroid[0],
                      longitude: values.geometry.centroid[1],
                    }}
                    onDragEnd={(e) =>
                      setFieldValue("geometry.centroid", [
                        e.nativeEvent.coordinate.latitude,
                        e.nativeEvent.coordinate.longitude,
                      ])
                    }
                  >
                    <MaterialCommunityIcons
                      name="home-map-marker"
                      size={40}
                      color="#0f172a"
                    />
                  </Marker>
                </MapView>
                <View style={styles.mapTip}>
                  <Text style={styles.mapTipText}>Long-press icon to drag</Text>
                </View>
              </Modal>
            </Portal>

            <ScrollView contentContainerStyle={styles.formScroll}>
              {/* PROPERTY CLASSIFICATION */}
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="office-building-marker"
                  size={18}
                  color="#059669"
                />
                <Text style={styles.sectionTitle}>PROPERTY CLASSIFICATION</Text>
              </View>

              <Surface style={styles.card} elevation={1}>
                <TouchableOpacity
                  style={[
                    styles.selector,
                    {
                      // borderWidth: isValid ? 0 : 0.5,
                      borderColor: isValid ? "transparent" : "red",
                      padding: 5,
                      borderRadius: 10,
                    },
                  ]}
                  onPress={() => setTypeModal("property")}
                >
                  <View>
                    <Text style={getLabelStyle("propertyType.type", errors)}>
                      PROPERTY TYPE
                    </Text>
                    <Text style={styles.selectorValue}>
                      {values.propertyType.type}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={24}
                    color="#64748b"
                  />
                </TouchableOpacity>
                <Divider style={styles.divider} />
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>
                    {values.isTownship ? "Township" : "Suburb"}
                  </Text>
                  <Switch
                    value={values.isTownship}
                    color="#059669"
                    onValueChange={(v) => setFieldValue("isTownship", v)}
                  />
                </View>
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
                <View style={styles.addressRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={getLabelStyle("address.strNo", errors)}>
                      STR NO
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="123"
                      value={values.address.strNo}
                      onChangeText={handleChange("address.strNo")}
                      editable={!isSubmitting}
                      borderWidth={0.5}
                      borderColor={!isValid ? "#fa0000" : "#fff"}
                    />
                  </View>
                  <View style={{ flex: 2, marginLeft: 10 }}>
                    <Text style={getLabelStyle("address.strName", errors)}>
                      STR NAME
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Main"
                      value={values.address.strName}
                      onChangeText={(v) =>
                        handleTextChange(setFieldValue, "address.strName", v)
                      }
                      borderWidth={0.5}
                      borderColor={!isValid ? "#fa0000" : "#fff"}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.selector}
                  onPress={() => setTypeModal("street")}
                >
                  <View>
                    <Text style={getLabelStyle("address.strType", errors)}>
                      STREET TYPE
                    </Text>
                    <Text style={styles.selectorValue}>
                      {values.address.strType}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="form-select"
                    size={22}
                    color="#059669"
                  />
                </TouchableOpacity>

                <Divider style={styles.divider} />
                <Text style={styles.label}>GEOSPATIAL LOCATION</Text>
                <TouchableOpacity
                  style={styles.miniMapWrapper}
                  onPress={() => setMapFullVisible(true)}
                >
                  <MapView
                    style={styles.miniMap}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    region={{
                      latitude: values.geometry.centroid[0],
                      longitude: values.geometry.centroid[1],
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    }}
                  >
                    <Marker
                      coordinate={{
                        latitude: values.geometry.centroid[0],
                        longitude: values.geometry.centroid[1],
                      }}
                    >
                      <MaterialCommunityIcons
                        name="home-map-marker"
                        size={24}
                        color="#0f172a"
                      />
                    </Marker>
                  </MapView>
                  <View style={styles.mapOverlay}>
                    <MaterialCommunityIcons
                      name="arrow-expand-all"
                      size={20}
                      color="#fff"
                    />
                    <Text style={styles.mapOverlayText}>
                      Tap to Position Premise
                    </Text>
                  </View>
                </TouchableOpacity>
              </Surface>

              {/* STRUCTURE MANIFEST */}
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="office-building"
                  size={18}
                  color="#059669"
                />
                <Text style={styles.sectionTitle}>STRUCTURE MANIFEST</Text>
              </View>
              <Surface style={styles.card} elevation={1}>
                <Text style={styles.label}>PROPERTY / ESTATE NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Gemini-IO Estates"
                  value={values.propertyType.name}
                  onChangeText={(v) =>
                    handleTextChange(setFieldValue, "propertyType.name", v)
                  }
                />
                <Divider style={styles.divider} />
                <View style={styles.toggleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleLabel}>
                      Multi-Unit / Sectional Title
                    </Text>
                    <Text style={styles.toggleSubLabel}>
                      Enable for flats, malls, or blocks
                    </Text>
                  </View>
                  <Switch
                    value={values.isSectionalTitle}
                    color="#059669"
                    onValueChange={(v) => setFieldValue("isSectionalTitle", v)}
                  />
                </View>

                {values.isSectionalTitle && (
                  <View style={styles.multiUnitBox}>
                    <Divider style={styles.divider} />
                    <View style={styles.row}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.label}>BLOCK NAME</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Block A"
                          value={values.blockName}
                          onChangeText={(v) =>
                            handleTextChange(setFieldValue, "blockName", v)
                          }
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.label}>UNIT NUMBER</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="101"
                          onChangeText={(v) =>
                            setFieldValue("propertyType.unitNo", [v])
                          }
                        />
                      </View>
                    </View>
                  </View>
                )}
              </Surface>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.resetBtn}
                  onPress={() => resetForm()}
                >
                  <MaterialCommunityIcons
                    name="refresh"
                    size={20}
                    color="#64748b"
                  />
                  <Text style={styles.resetBtnText}>RESET</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  // Keep it always visible, but logic handles tap-ability
                  disabled={!isValid || isSubmitting}
                  style={[
                    styles.submitBtn, // Using your existing submitBtn style
                    (!isValid || isSubmitting) && styles.btnDisabled, // Override with disabled looks
                  ]}
                  onPress={handleSubmit}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      {/* <MaterialCommunityIcons
                      name="check-bold"
                      size={20}
                      // Change icon color based on validity
                      color={!isValid ? "#fa0000" : "#fff"}
                    /> */}
                      <Feather
                        name={!isValid ? "x" : "check"}
                        size={24}
                        color={!isValid ? "#fa0000" : "#03ff5b"}
                      />
                      <Text
                        style={[
                          styles.submitBtnText,
                          !isValid && {
                            color: !isValid ? "#fa0000" : "#03ff5b",
                          }, // Change text color based on validity
                        ]}
                      >
                        SUBMIT
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
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
