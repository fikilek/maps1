import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Formik, getIn, useFormikContext } from "formik";
import { useRef, useState } from "react";
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
  IconButton,
  Modal,
  Portal,
  RadioButton,
  Surface,
  Text,
  TextInput,
} from "react-native-paper";

// Firebase & Redux
import { CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import ViewShot from "react-native-view-shot";
import { boolean, object, string } from "yup";
import { FieldMediaPreview } from "../../../components/media/FieldMediaPreview";
import { useWarehouse } from "../../context/WarehouseContext";
import { useAssetMedia } from "../../hooks/useAssetMedia";
import { useAuth } from "../../hooks/useAuth";
import { useGetSettingsQuery } from "../../redux/settingsApi";
import { useAddTrnMutation } from "../../redux/trnsApi";
import { WaterMeterEntry } from "./WaterMeterEntry";

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
  const { premiseId, address, erfNo } = useLocalSearchParams();
  const auth = useAuth();
  const router = useRouter();
  const { all } = useWarehouse();
  const { data: settings } = useGetSettingsQuery();
  const [addTrn, { isLoading: isTrnLoading }] = useAddTrnMutation();

  const agentUid = auth?.user?.uid || "unknown_uid";
  const agentName = auth?.profile?.profile?.displayName || "Field Agent";
  const premise = all.prems.find((p) => p.id === premiseId);
  const currentLmPcode = premise?.metadata?.lmPcode || "UNKNOWN";
  const [inspectedImage, setInspectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  console.log(`FormPremise ----showSuccess`, showSuccess);

  const viewShotRef = useRef();
  const [tempUri, setTempUri] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraVisible, setCameraVisible] = useState(false);
  const cameraRef = useRef(null);

  const getOptions = (name) =>
    settings?.find((s) => s.name === name)?.options || [];

  const initialValues = {
    hasAccess: true,
    meterType: "electricity",
    ast: {
      astData: {
        astNo: "",
        astManufacturer: "",
        meter: {
          phase: "",
          type: "Normal",
          keypad: { serialNo: "" },
          cb: { size: "" },
        },
      },
      anomalies: { anomaly: "", anomalyDetail: "" },
      sc: { status: "" },
      location: { placement: "" },
      ogs: { hasOffGridSupply: false },
      normalisation: { actionTaken: "" },
    },
    naSection: { reason: "", photos: [] },
  };

  const handleSubmitDiscovery = async (values) => {
    if (!premise?.id) {
      Alert.alert("Error", "Premise data not found.");
      return;
    }

    try {
      const timestamp = new Date().toISOString();
      let finalPhotoUrls = [];

      // 1. GATE CHECK: NO ACCESS LOGIC
      if (!values?.hasAccess) {
        // Handle Photo Uploads for No Access
        if (values?.naSection?.photos?.length > 0) {
          const storage = getStorage();
          const uploadPromises = values.naSection.photos.map(
            async (photo, index) => {
              const fileName = `${premise.erfId}_${premise.id}_NA_${timestamp}_${index}.jpg`;
              const storageRef = ref(storage, `premises/no_access/${fileName}`);
              const response = await fetch(photo.uri);
              const blob = await response.blob();
              await uploadBytes(storageRef, blob);
              return await getDownloadURL(storageRef);
            },
          );
          finalPhotoUrls = await Promise.all(uploadPromises);
        }

        const naPayload = {
          trnType: "METER_DISCOVERY",
          erfId: premise.erfId,
          premise: {
            id: premise.id,
            address: address || "N/A",
            status: "NO_ACCESS",
          },
          metadata: {
            created: premise?.metadata?.created || {
              at: timestamp,
              byUser: agentName,
              byUid: agentUid,
            },
            updated: { at: timestamp, byUser: agentName, byUid: agentUid },
            lmPcode: currentLmPcode,
          },
          data: {
            hasAccess: false,
            naReason: values?.naSection?.reason || "No Reason Provided",
            evidencePhotos: finalPhotoUrls,
          },
        };
        await addTrn(naPayload).unwrap();
        router.back();
        return; // EXIT HERE
      }

      // 2. GATE CHECK: ACCESS GRANTED (WATER OR ELEC)
      const commonMetadata = {
        created: premise?.metadata?.created || {
          at: timestamp,
          byUser: agentName,
          byUid: agentUid,
        },
        updated: { at: timestamp, byUser: agentName, byUid: agentUid },
        lmPcode: currentLmPcode,
      };

      let specificData = {};

      if (values?.meterType === "water") {
        // WATER DATA GATE
        specificData = {
          meterType: "water",
          astNo: values?.ast?.astData?.astNo,
          manufacturer: values?.ast?.astData?.astManufacturer,
          model: values?.ast?.astData?.astName,
          waterMeterType: values?.ast?.astData?.meter?.type,
          anomaly: values?.ast?.anomalies?.anomaly,
          anomalyDetail: values?.ast?.anomalies?.anomalyDetail,
          placement: values?.ast?.location?.placement,
          gps: values?.ast?.location?.gps,
        };
      } else {
        // ELECTRICITY DATA GATE
        specificData = {
          meterType: "electricity",
          // ... (Your electricity specific fields go here)
          astNo: values?.ast?.astData?.astNo,
        };
      }

      const accessPayload = {
        trnType: "METER_DISCOVERY",
        erfId: premise.erfId,
        premise: {
          id: premise.id,
          address: address || "N/A",
          status: "ACCESSED",
        },
        metadata: commonMetadata,
        data: {
          hasAccess: true,
          ...specificData,
        },
      };

      await addTrn(accessPayload).unwrap();
      // 🎯 Trigger Success Overlay instead of immediate router.replace
      setShowSuccess(true);

      // Auto-navigate after 2 seconds if they don't tap anything
      setTimeout(() => {
        setShowSuccess(false);
        router.replace(`/(tabs)/erfs/${values.erfId}`);
      }, 2000);

      router.back();
    } catch (error) {
      console.error("Submission Error:", error);
      Alert.alert("Sync Error", error.message);
    }
  };

  // const handleSubmitDiscovery = async (values) => {
  //   if (!premise?.id) {
  //     Alert.alert("Error", "Premise data not found.");
  //     return;
  //   }

  //   try {
  //     const timestamp = new Date().toISOString();
  //     let finalPhotoUrls = [];

  //     // 1. STORAGE UPLOAD (Keep this here)
  //     if (!values.hasAccess && values.naSection.photos?.length > 0) {
  //       const storage = getStorage();
  //       const uploadPromises = values.naSection.photos.map(
  //         async (photo, index) => {
  //           // Path: erfId_premiseId_noAccess_timestamp_index.jpg
  //           const fileName = `${premise.erfId}_${premise.id}_noAccess_${timestamp}_${index}.jpg`;
  //           const storageRef = ref(storage, `premises/${fileName}`);
  //           const response = await fetch(photo.uri);
  //           const blob = await response.blob();
  //           await uploadBytes(storageRef, blob);
  //           return await getDownloadURL(storageRef);
  //         },
  //       );
  //       finalPhotoUrls = await Promise.all(uploadPromises);
  //     }

  //     // 2. CONSTRUCT THE CONSOLIDATED METADATA
  //     const metadata = {
  //       ...premise.metadata,
  //       created: premise.metadata?.created || {
  //         at: timestamp,
  //         byUser: agentName,
  //         byUid: agentUid,
  //       },
  //       updated: { at: timestamp, byUser: agentName, byUid: agentUid },
  //       lmPcode: currentLmPcode, // Ensure this is present for the query filters
  //     };

  //     // 3. CONSTRUCT THE TRN (Payload matches standard)
  //     const trnPayload = {
  //       trnType: "METER_DISCOVERY",
  //       erfId: premise.erfId,
  //       premise: {
  //         id: premise.id,
  //         address: address || "Unknown Address",
  //         status: values.hasAccess ? "true" : "false",
  //       },
  //       metadata,
  //       data: {
  //         hasAccess: values.hasAccess,
  //         ...(values.hasAccess
  //           ? {
  //               meterSerial: values.meterSerial || "N/A",
  //               reading: values.reading || "0",
  //             }
  //           : {
  //               naReason: values.naSection.reason || "No Reason Provided",
  //               evidencePhotos: finalPhotoUrls,
  //               adverseCondition: true,
  //             }),
  //       },
  //     };

  //     // 4. 🔥 SINGLE SOURCE OF ACTION
  //     // This will trigger the Firestore doc AND the local Premise cache update
  //     await addTrn(trnPayload).unwrap();

  //     router.back();
  //   } catch (error) {
  //     console.error("Submission Error:", error);
  //     Alert.alert("Sync Error", "Failed to upload.");
  //   }
  // };

  const DiscoverySchema = object().shape({
    hasAccess: boolean(),
    meterSerial: string().when("hasAccess", {
      is: true,
      then: (schema) => schema.required("Serial required"),
    }),
    naSection: object().shape({
      reason: string().when("$hasAccess", {
        is: false,
        then: (schema) => schema.required("Reason is required"),
      }),
    }),
  });

  const handleCaptureNAPhoto = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res?.granted) return;
    }
    setCameraVisible(true);
  };

  const capturePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        setTempUri(photo.uri);
        setCameraVisible(false);
      } catch (error) {
        console.error("Capture Error:", error);
      }
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmitDiscovery}
      validationSchema={DiscoverySchema}
    >
      {({ values, setFieldValue, handleSubmit, resetForm, isValid, dirty }) => (
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 50 }}
        >
          <Stack.Screen options={{ title: address || "Discovery" }} />

          {/* ACCESS TOGGLE */}
          <Surface style={styles.card} elevation={1}>
            <FormToggle
              label="Access Status"
              name="hasAccess"
              disabled={isTrnLoading}
              trueLabel="ACCESS"
              falseLabel="NO ACCESS"
            />
          </Surface>

          {values.hasAccess ? (
            // ACCESS SECTION
            <View>
              <Surface style={styles.card} elevation={1}>
                <Text style={styles.labelSmall}>Resource Type</Text>
                <View style={styles.row}>
                  {/* ELECTRICITY BUTTON */}
                  <Button
                    mode={
                      values?.meterType === "electricity"
                        ? "contained"
                        : "outlined"
                    }
                    style={styles.flex1}
                    buttonColor={
                      values?.meterType === "electricity"
                        ? "#FFF7ED"
                        : undefined
                    } // Light amber tint
                    textColor={
                      values?.meterType === "electricity"
                        ? "#9A3412"
                        : "#64748B"
                    }
                    onPress={() => setFieldValue("meterType", "electricity")}
                    icon={() => (
                      <MaterialCommunityIcons
                        name="flash"
                        size={20}
                        color={
                          values?.meterType === "electricity"
                            ? "#F59E0B"
                            : "#94A3B8"
                        }
                      />
                    )}
                  >
                    ELECTRICITY
                  </Button>

                  {/* WATER BUTTON */}
                  <Button
                    mode={
                      values?.meterType === "water" ? "contained" : "outlined"
                    }
                    style={styles.flex1}
                    buttonColor={
                      values?.meterType === "water" ? "#EFF6FF" : undefined
                    } // Light blue tint
                    textColor={
                      values?.meterType === "water" ? "#1E40AF" : "#64748B"
                    }
                    onPress={() => setFieldValue("meterType", "water")}
                    icon={() => (
                      <MaterialCommunityIcons
                        name="water"
                        size={20}
                        color={
                          values?.meterType === "water" ? "#3B82F6" : "#94A3B8"
                        }
                      />
                    )}
                  >
                    WATER
                  </Button>
                </View>
              </Surface>

              {values.meterType === "electricity" ? (
                <ElectricitySections
                  values={values}
                  setFieldValue={setFieldValue}
                  getOptions={getOptions}
                  disabled={isTrnLoading}
                />
              ) : (
                <WaterSections
                  values={values}
                  setFieldValue={setFieldValue}
                  getOptions={getOptions}
                  disabled={isTrnLoading}
                />
              )}
            </View>
          ) : (
            // NO ACCESS SECTION
            <Surface style={styles.card}>
              {/* NO ACCESSS */}
              {!values.hasAccess && (
                <Surface style={styles.naCard} elevation={2}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons
                      name="alert-circle"
                      size={18}
                      color="#dc2626"
                    />
                    <Text style={[styles.sectionTitle, { color: "#dc2626" }]}>
                      N/A JUSTIFICATION
                    </Text>
                  </View>

                  {/* Reason Selector */}
                  <TouchableOpacity
                    style={styles.selector}
                    onPress={() => setModalVisible(true)}
                  >
                    <View>
                      <Text style={styles.label}>NA REASON</Text>
                      <Text style={styles.selectorValue}>
                        {values.naSection.reason || "Select..."}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-down"
                      size={22}
                      color="#dc2626"
                    />
                  </TouchableOpacity>

                  <Divider style={{ marginVertical: 15 }} />

                  {/* Capture Button */}
                  <View style={styles.row}>
                    <TouchableOpacity
                      style={[styles.actionBlock, { flex: 1, height: 80 }]}
                      onPress={handleCaptureNAPhoto}
                    >
                      <MaterialCommunityIcons
                        name="camera-plus"
                        size={32}
                        color="#dc2626"
                      />
                      <Text style={styles.actionText}>ADD EVIDENCE PHOTO</Text>
                    </TouchableOpacity>
                  </View>

                  {/* 🎯 THE THUMBNAIL BED (Horizontal Scroll) */}
                  {values.naSection.photos?.length > 0 && (
                    <View style={{ marginVertical: 15 }}>
                      <Text style={styles.label}>
                        Captured Evidence ({values.naSection.photos.length})
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 12, paddingRight: 20 }}
                      >
                        {values.naSection.photos.map((item, index) => (
                          <View key={index} style={styles.thumbnailContainer}>
                            {/* 🎯 WRAP THE IMAGE IN THE CLICKABLE TOUCHABLE */}
                            <TouchableOpacity
                              onPress={() => setInspectedImage(item.uri)}
                              activeOpacity={0.8}
                            >
                              <Image
                                source={{ uri: item.uri }}
                                style={styles.thumbnail}
                              />
                            </TouchableOpacity>

                            {/* KEEP THE REMOVE BUTTON ON TOP */}
                            <TouchableOpacity
                              style={styles.removePhotoBadge}
                              onPress={() => {
                                const updated = values.naSection.photos.filter(
                                  (_, i) => i !== index,
                                );
                                setFieldValue("naSection.photos", updated);
                              }}
                            >
                              <MaterialCommunityIcons
                                name="close-circle"
                                size={22}
                                color="white"
                              />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* FULL SCREEN INSPECTION MODAL */}
                  <Portal>
                    <Modal
                      visible={!!inspectedImage}
                      onDismiss={() => setInspectedImage(null)}
                      contentContainerStyle={styles.inspectionModal}
                    >
                      <View style={styles.inspectionContainer}>
                        <Image
                          source={{ uri: inspectedImage }}
                          style={styles.fullImage}
                          contentFit="contain"
                        />
                        <TouchableOpacity
                          style={styles.closeInspectionBtn}
                          onPress={() => setInspectedImage(null)}
                        >
                          <MaterialCommunityIcons
                            name="close-circle"
                            size={40}
                            color="white"
                          />
                        </TouchableOpacity>

                        <View style={styles.inspectionFooter}>
                          <Text style={styles.inspectionText}>
                            Evidence Review
                          </Text>
                        </View>
                      </View>
                    </Modal>
                  </Portal>
                </Surface>
              )}
            </Surface>
          )}

          {/* RESET / SUBMIT BTNS */}
          <View style={styles.footer}>
            <Button
              mode="outlined"
              onPress={() => {
                Alert.alert(
                  "Reset Form?",
                  "This will permanently delete all captured data and evidence photos for this premise. Are you sure?",
                  [
                    {
                      text: "CANCEL",
                      style: "cancel",
                    },
                    {
                      text: "YES, RESET",
                      style: "destructive", // Shows red on iOS
                      onPress: () => resetForm(),
                    },
                  ],
                );
              }}
              style={styles.resetBtn}
              disabled={isTrnLoading || !isValid}
              textColor="#64748B"
            >
              RESET
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isTrnLoading}
              buttonColor={isValid && dirty ? "#22C55E" : "#DC2626"}
              style={styles.submitBtn}
              disabled={isTrnLoading || !isValid}
            >
              {isValid && dirty ? "SUBMIT DISCOVERY" : "COMPLETE FORM"}
            </Button>
          </View>

          <Portal>
            <Modal
              visible={cameraVisible}
              onDismiss={() => setCameraVisible(false)}
              contentContainerStyle={{ flex: 1 }}
            >
              <TouchableOpacity
                style={styles.cameraCloseBtn}
                onPress={() => setCameraVisible(false)}
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={30}
                  color="white"
                />
              </TouchableOpacity>
              <CameraView style={{ flex: 1 }} ref={cameraRef} />

              <View style={styles.cameraControls}>
                <TouchableOpacity
                  style={styles.captureBtn}
                  onPress={capturePhoto}
                >
                  <View style={styles.captureBtnInternal} />
                </TouchableOpacity>
              </View>
            </Modal>

            <Modal visible={!!tempUri} onDismiss={() => setTempUri(null)}>
              <View
                style={{
                  height: 500,
                  backgroundColor: "black",
                  margin: 20,
                  borderRadius: 15,
                  overflow: "hidden",
                }}
              >
                <ViewShot
                  ref={viewShotRef}
                  options={{ format: "jpg", quality: 0.8 }}
                  style={{ flex: 1 }}
                >
                  <Image
                    source={{ uri: tempUri }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.watermarkOverlay}>
                    <Text style={styles.watermarkText}>
                      📍 GPS:{" "}
                      {values.naSection.gps
                        ? `${values.naSection.gps[0].toFixed(4)}, ${values.naSection.gps[1].toFixed(4)}`
                        : "NO GPS"}
                    </Text>
                    <Text style={styles.watermarkText}>🏠 ERF: {erfNo}</Text>
                    <Text style={styles.watermarkText}>
                      👤 AGENT: {agentName}
                    </Text>
                    <Text style={styles.watermarkText}>
                      📅 {new Date().toLocaleString()}
                    </Text>
                  </View>
                </ViewShot>
                <View style={styles.row}>
                  <Button
                    style={{ flex: 1 }}
                    mode="contained"
                    buttonColor="red"
                    onPress={() => setTempUri(null)}
                  >
                    DISCARD
                  </Button>
                  <Button
                    style={{ flex: 1 }}
                    mode="contained"
                    buttonColor="#22C55E"
                    onPress={async () => {
                      const burnedUri = await viewShotRef.current.capture();

                      const newPhotoEntry = {
                        uri: burnedUri,
                        timestamp: new Date().toISOString(),
                      };

                      const existingPhotos = values.naSection.photos || [];
                      setFieldValue("naSection.photos", [
                        ...existingPhotos,
                        newPhotoEntry,
                      ]);
                      setTempUri(null); // Close the preview modal
                    }}
                  >
                    SAVE & BURN
                  </Button>
                </View>
              </View>
            </Modal>

            <Modal
              visible={modalVisible}
              onDismiss={() => setModalVisible(false)}
              contentContainerStyle={styles.modalContent}
            >
              <RadioButton.Group
                onValueChange={(v) => {
                  setFieldValue("naSection.reason", v);
                  setModalVisible(false);
                }}
                value={values.naSection.reason}
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
                  Premise has been vaulted successfully
                </Text>

                <TouchableOpacity
                  style={styles.continueBtn}
                  onPress={() => {
                    setShowSuccess(false);
                    router.replace(`/(tabs)/erfs/${values.erfId}`);
                  }}
                >
                  <Text style={styles.continueBtnText}>CONTINUE</Text>
                </TouchableOpacity>
              </View>
            </Modal>
          </Portal>
        </ScrollView>
      )}
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

// const FormInputMeterNo = ({ label, name, disabled, ...props }) => {
//   const { setFieldValue, values } = useFormikContext();
//   const { all } = useWarehouse();

//   // Scanner State
//   const [scannerVisible, setScannerVisible] = useState(false);
//   const [permission, requestPermission] = useCameraPermissions();

//   const handleOpenScanner = async () => {
//     if (!permission?.granted) {
//       const { granted } = await requestPermission();
//       if (!granted) {
//         Alert.alert(
//           "Permission Denied",
//           "Camera access is required to scan barcodes.",
//         );
//         return;
//       }
//     }
//     setScannerVisible(true);
//   };

//   const validateMeterNo = (val) => {
//     const cleanedVal = val.trim().toUpperCase();
//     setFieldValue(name, cleanedVal);

//     if (cleanedVal.length > 3) {
//       // Searching across all.meters and all.prems for absolute safety
//       const duplicate =
//         (all.meters || []).find((m) => m.meterNo === cleanedVal) ||
//         (all.prems || []).find(
//           (p) =>
//             p.ast?.astData?.astNo === cleanedVal ||
//             p.services?.waterMeterNo === cleanedVal ||
//             p.services?.electricityMeterNo === cleanedVal,
//         );

//       if (duplicate) {
//         Alert.alert(
//           "🚨 DUPLICATE METER DETECTED",
//           `Meter [${cleanedVal}] is already linked to:\n\n📍 ${duplicate.address?.strNo || "Unknown"} ${duplicate.address?.StrName || ""}`,
//           [
//             {
//               text: "I WILL FIX IT",
//               style: "destructive",
//               onPress: () => setFieldValue(name, ""),
//             },
//           ],
//         );
//       }
//     }
//   };

//   const onBarCodeScanned = ({ data }) => {
//     setScannerVisible(false);
//     validateMeterNo(data); // Pass scanned data through validation
//   };

//   return (
//     <>
//       <TextInput
//         label={label}
//         value={getIn(values, name) || ""}
//         onChangeText={validateMeterNo}
//         disabled={disabled}
//         mode="outlined"
//         autoCapitalize="characters"
//         style={{ marginBottom: 10 }}
//         {...props}
//       />
//       <TextInput.Icon
//         icon="barcode-scan"
//         onPress={handleOpenScanner}
//         disabled={disabled}
//         forceTextInputFocus={false}
//       />

//       {/* Embedded Scanner UI */}
//       <Portal>
//         <Modal
//           visible={scannerVisible}
//           onDismiss={() => setScannerVisible(false)}
//           contentContainerStyle={styles.modalContainer}
//         >
//           <View style={styles.cameraWrapper}>
//             <CameraView
//               style={StyleSheet.absoluteFill}
//               facing="back"
//               barcodeScannerSettings={{
//                 barcodeTypes: ["code128", "qr", "ean13", "code39"],
//               }}
//               onBarcodeScanned={scannerVisible ? onBarCodeScanned : undefined}
//             />
//             <View style={styles.overlay}>
//               <View style={styles.scanTarget} />
//               <Text style={styles.scanText}>
//                 Align Barcode inside the frame
//               </Text>
//             </View>
//             <Button
//               mode="contained"
//               onPress={() => setScannerVisible(false)}
//               style={styles.closeBtn}
//             >
//               CANCEL
//             </Button>
//           </View>
//         </Modal>
//       </Portal>
//     </>
//   );
// };

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

const FormToggle = ({ label, name, trueLabel, falseLabel, disabled }) => {
  const { values, setFieldValue } = useFormikContext();
  // Using the Safe Chain here
  const val = getIn(values, name);

  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.labelSmall}>{label}</Text>
      <View style={styles.row}>
        {/* HAVE ACCESS BUTTON */}
        <Button
          mode={val === true ? "contained" : "outlined"}
          style={styles.flex1}
          onPress={() => setFieldValue(name, true)}
          disabled={disabled}
          buttonColor={val === true ? "#E8F5E9" : undefined} // Light green background when selected
          textColor={val === true ? "#2E7D32" : "#64748B"} // Dark green text when selected
          icon={() => (
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color={val === true ? "#2E7D32" : "#94A3B8"}
            />
          )}
        >
          {trueLabel}
        </Button>

        {/* NO ACCESS BUTTON */}
        <Button
          mode={val === false ? "contained" : "outlined"}
          style={styles.flex1}
          onPress={() => setFieldValue(name, false)}
          disabled={disabled}
          buttonColor={val === false ? "#FFEBEE" : undefined} // Light red background when selected
          textColor={val === false ? "#D32F2F" : "#64748B"} // Dark red text when selected
          icon={() => (
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color={val === false ? "#D32F2F" : "#94A3B8"}
            />
          )}
        >
          {falseLabel}
        </Button>
      </View>
    </View>
  );
};

// --- SECTIONS ---

const ElectricitySections = ({
  values,
  setFieldValue,
  getOptions,
  disabled,
}) => (
  <View>
    <FormSection title="Meter Details">
      <FormInput
        label="METER NUMBER"
        name="ast.astData.astNo"
        disabled={disabled}
      />
      <FormSelect
        label="MANUFACTURER"
        name="ast.astData.astManufacturer"
        options={getOptions("elec_manufacturers")}
        disabled={disabled}
      />
    </FormSection>
    <FormSection title="Anomalies">
      <FormSelect
        label="ANOMALY"
        name="ast.anomalies.anomaly"
        options={getOptions("anomalies").map((a) => a.anomaly)}
        disabled={disabled}
      />
    </FormSection>
  </View>
);

const WaterSections = ({ values, setFieldValue, getOptions, disabled }) => {
  // Pulling specific water anomalies from the settings API
  const anomalies = getOptions("anomalies") || [];
  const { takePhoto } = useAssetMedia();

  return (
    <View style={disabled && { opacity: 0.7 }}>
      {/* 2.1: Water Meter Description */}
      <FormSection title="Water Meter Description">
        <View style={styles.row}>
          <WaterMeterEntry disabled={disabled} />
        </View>

        <FormSelect
          label="METER TYPE"
          options={["Normal", "Bulk"]}
          name="ast.astData.meter.type"
          disabled={disabled}
        />

        <FormSelect
          label="MANUFACTURER"
          options={getOptions("water_manufacturers")}
          name="ast.astData.astManufacturer"
          disabled={disabled}
        />

        <FormInput
          label="METER MODEL NAME"
          name="ast.astData.astName"
          disabled={disabled}
        />
      </FormSection>

      {/* 2.2: Meter Anomalies */}
      <FormSection title="Meter Anomalies">
        <FormSelect
          label="ANOMALY"
          options={anomalies.map((a) => a.anomaly)}
          // onSelect={(val) => {
          //   setFieldValue("ast.anomalies.anomaly", val);
          //   setFieldValue("ast.anomalies.anomalyDetail", "");
          // }}
          name="ast.anomalies.anomaly"
          disabled={disabled}
        />
        <FormSelect
          label="ANOMALY DETAIL"
          // Safe chaining to prevent crash if anomaly is not yet selected
          // options={
          //   anomalies.find((a) => a.anomaly === values?.ast?.anomalies?.anomaly)
          //     ?.anomalyDetails || []
          // }
          name="ast.anomalies.anomalyDetail"
          disabled={disabled}
        />
      </FormSection>

      {/* 2.3: Meter Location */}
      <FormSection title="Meter Location">
        <TextInput
          label="GOOGLE ADDRESS"
          // Applied optional chaining as requested to prevent crash
          value={values?.ast?.location?.address?.googleAdr || ""}
          disabled
          mode="outlined"
          style={styles.readOnlyInput}
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <FormSelect
              label="PLACEMENT"
              options={[
                "Kiosk",
                "Top Pole",
                "Bottom Pole",
                "Indoors",
                "Boundary Wall",
                "Other",
              ]}
              name="ast.location.placement"
              disabled={disabled}
            />
          </View>
          <IconButton
            icon="camera"
            mode="contained"
            containerColor="#E2E8F0"
            onPress={() => takePhoto("ast.media.meterPlacement")} // 🎯 Using the standard hook
            disabled={disabled}
            style={styles.inlineMediaBtn}
          />
        </View>
        {/* 🎯 Always add the preview below the camera action */}
        <FieldMediaPreview path="ast.media.meterPlacement" />
      </FormSection>
    </View>
  );
};

// --- STYLES ---

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  sectionCard: {
    margin: 10,
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  sectionHeader: { padding: 10, backgroundColor: "#E2E8F0" },
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
});
