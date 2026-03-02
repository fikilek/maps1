import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getIn, useFormikContext } from "formik";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from "react-native-maps";
import { Button, IconButton, Modal, Portal, Surface } from "react-native-paper";
import { FormSection } from "../forms/FormSection";

const SovereignLocationPicker = ({
  label = "SITUATIONAL POSITIONING",
  name, // 🎯 TARGET: e.g., "ast.location.gps" or "location.gps"
  initialGps = null, // 🎯 ANCHOR: The premise GPS to start from if name is empty
  icon = "map-marker-radius",
  referenceBoundary = [],
  erfNo = "N/A",
  erfCentroid = null,
  disabled = false,
}) => {
  const { values, setFieldValue, errors, touched } = useFormikContext();
  const [modalVisible, setModalVisible] = useState(false);

  // 🏛️ FORENSIC DATA EXTRACTION
  const rawValue = getIn(values, name);
  const error = getIn(errors, name);
  const isTouched = getIn(touched, name);
  const hasError = !!error && (isTouched || values?.submitCount > 0);

  /**
   * 🔍 THE COORDINATE HIERARCHY
   * 1. Current Form Value (User moved it)
   * 2. Initial GPS provided (Premise location)
   * 3. Erf Centroid (The administrative center)
   * 4. Default Fallback
   */
  const getCoords = (val) => {
    // Check Current Value
    if (Array.isArray(val) && val.length === 2)
      return { latitude: val[0], longitude: val[1] };
    if (val?.lat && val?.lng) return { latitude: val.lat, longitude: val.lng };
    if (val?.latitude && val?.longitude)
      return { latitude: val.latitude, longitude: val.longitude };

    // Check Initial GPS Prop
    if (Array.isArray(initialGps))
      return { latitude: initialGps[0], longitude: initialGps[1] };
    if (initialGps?.lat)
      return { latitude: initialGps.lat, longitude: initialGps.lng };

    // Check Centroid
    if (erfCentroid)
      return { latitude: erfCentroid[0], longitude: erfCentroid[1] };

    // Global Fallback
    return { latitude: -33.9249, longitude: 18.4241 };
  };

  const [tempCoords, setTempCoords] = useState(getCoords(rawValue));

  // Ensure temp stays in sync when opening the portal
  useEffect(() => {
    if (modalVisible) {
      setTempCoords(getCoords(rawValue));
    }
  }, [modalVisible, rawValue]);

  const handleConfirm = () => {
    // 🏛️ SOVEREIGN ALIGNMENT: Force Object Format
    // We ignore the 'rawValue' type and force the iREPS Standard {lat, lng}
    const finalValue = {
      lat: tempCoords.latitude,
      lng: tempCoords.longitude,
    };

    console.log(
      `🛰️ [GPS LOCK]: Saving to Formik path "${name}" as Object:`,
      finalValue,
    );

    setFieldValue(name, finalValue);
    setModalVisible(false);
  };

  const currentCoords = getCoords(rawValue);

  return (
    <FormSection title={label}>
      <View style={[styles.container, disabled && { opacity: 0.6 }]}>
        {/* 🏷️ VALIDATION HEADER */}

        {/* 📍 PREVIEW MINI-MAP */}
        <TouchableOpacity
          disabled={disabled}
          activeOpacity={0.8}
          style={[styles.previewWrapper, hasError && styles.previewError]}
          onPress={() => setModalVisible(true)}
        >
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.miniMap}
            scrollEnabled={false}
            zoomEnabled={false}
            region={{
              ...currentCoords,
              latitudeDelta: 0.001,
              longitudeDelta: 0.001,
            }}
          >
            {referenceBoundary.length > 0 && (
              <Polygon
                coordinates={referenceBoundary}
                strokeColor="#FFD700"
                fillColor="rgba(255, 215, 0, 0.1)"
                strokeWidth={2}
              />
            )}
            <Marker coordinate={currentCoords}>
              <MaterialCommunityIcons
                name={icon}
                size={28}
                color={hasError ? "#ef4444" : "#0f172a"}
              />
            </Marker>
          </MapView>

          <View style={styles.overlay}>
            <View
              style={[
                styles.overlay,
                rawValue && { backgroundColor: "rgba(15, 23, 42, 0.7)" }, // 🌑 Darker if we have a lock
              ]}
            >
              <MaterialCommunityIcons
                name={rawValue ? "crosshairs-gps" : "arrow-expand-all"}
                size={20}
                color={rawValue ? "#4ade80" : "#fff"} // 🟢 Green icon if locked
              />

              <Text
                style={[
                  styles.overlayText,
                  rawValue && { color: "#4ade80" }, // 🟢 Green text if locked
                ]}
              >
                {rawValue
                  ? `POSITION LOCKED: ${currentCoords.latitude.toFixed(5)}, ${currentCoords.longitude.toFixed(5)}`
                  : "TAP TO POSITION PIN"}
              </Text>

              {rawValue && (
                <Text
                  style={{
                    fontSize: 8,
                    color: "rgba(255,255,255,0.6)",
                    fontWeight: "bold",
                    marginTop: 2,
                  }}
                >
                  TAP TO RE-ADJUST
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* 🏛️ THE MODAL PORTAL */}
        <Portal>
          <Modal
            visible={modalVisible}
            onDismiss={() => setModalVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <Surface style={styles.modalSurface}>
              <View style={styles.modalHeader}>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={() => setModalVisible(false)}
                />
                <View style={styles.titleGroup}>
                  <Text style={styles.modalTitle}>SITUATIONAL POSITIONING</Text>
                  <Text style={styles.modalSubTitle}>ERF {erfNo}</Text>
                </View>
              </View>

              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.fullMap}
                showsUserLocation
                showsMyLocationButton
                initialRegion={{
                  ...tempCoords,
                  latitudeDelta: 0.0008,
                  longitudeDelta: 0.0008,
                }}
              >
                {referenceBoundary.length > 0 && (
                  <Polygon
                    coordinates={referenceBoundary}
                    strokeColor="#FFD700"
                    fillColor="rgba(255, 215, 0, 0.2)"
                    strokeWidth={4}
                  />
                )}

                <Marker
                  draggable
                  coordinate={tempCoords}
                  onDragEnd={(e) => setTempCoords(e.nativeEvent.coordinate)}
                  zIndex={10}
                >
                  <View style={styles.activeMarker}>
                    <MaterialCommunityIcons
                      name={icon}
                      size={58}
                      color="#0f172a"
                    />
                    <View style={styles.markerShadow} />
                  </View>
                </Marker>
              </MapView>

              <View style={styles.modalFooter}>
                <Button
                  mode="contained"
                  onPress={handleConfirm}
                  style={styles.confirmBtn}
                >
                  CONFIRM POSITION
                </Button>
              </View>
            </Surface>
          </Modal>
        </Portal>
      </View>
    </FormSection>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 10 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748b",
    textTransform: "uppercase",
  },
  labelError: { color: "#ef4444" },
  previewWrapper: {
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  previewError: { borderColor: "#ef4444", borderLeftWidth: 8 }, // 🏛️ Forensic Red
  miniMap: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayText: { color: "#fff", fontWeight: "900", fontSize: 11, marginTop: 4 },

  // 🏛️ MODAL: Margin 5, Radius 10
  modalContainer: { flex: 1, margin: 5, justifyContent: "center" },
  modalSurface: {
    flex: 0.85,
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
  },

  modalHeader: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  titleGroup: { flex: 1, alignItems: "center", marginRight: 40 },
  modalTitle: { fontSize: 12, fontWeight: "900", color: "#1e293b" },
  modalSubTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "#0f172a",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  fullMap: { flex: 1 },
  modalFooter: { padding: 20, backgroundColor: "#fff" },

  // 🏛️ BUTTON: Light Grey, Black Text
  confirmBtn: { backgroundColor: "#e2e8f0", borderRadius: 12 },
  confirmBtnLabel: { color: "#000", fontWeight: "900" },

  activeMarker: { alignItems: "center" },
  markerShadow: {
    width: 10,
    height: 4,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 5,
    marginTop: -5,
  },
});

export default SovereignLocationPicker;

// const styles = StyleSheet.create({
//   container: { marginBottom: 10 },
//   headerRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     // marginBottom: 8,
//   },
//   label: {
//     fontSize: 10,
//     fontWeight: "900",
//     color: "#64748b",
//     textTransform: "uppercase",
//   },
//   labelError: { color: "#ef4444" },
//   coordBadge: {
//     backgroundColor: "#f1f5f9",
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 4,
//   },
//   coordText: {
//     fontSize: 9,
//     fontFamily: "monospace",
//     color: "#475569",
//     fontWeight: "bold",
//   },
//   previewWrapper: {
//     height: 140,
//     borderRadius: 12,
//     overflow: "hidden",
//     borderWidth: 1,
//     borderColor: "#e2e8f0",
//   },
//   previewError: { borderColor: "#ef4444", borderLeftWidth: 6 },
//   miniMap: { flex: 1 },
//   overlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: "rgba(15, 23, 42, 0.4)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   overlayText: { color: "#fff", fontWeight: "900", fontSize: 11, marginTop: 4 },
//   modalContainer: { flex: 1, margin: 10, borderRadius: 10 },
//   modalSurface: { flex: 1, backgroundColor: "#fff" },
//   modalHeader: {
//     paddingHorizontal: 10,
//     paddingTop: 40,
//     paddingBottom: 15,
//     flexDirection: "row",
//     alignItems: "center",
//     borderBottomWidth: 1,
//     borderBottomColor: "#f1f5f9",
//   },
//   titleGroup: { flex: 1, alignItems: "center", marginRight: 40 },
//   modalTitle: { fontSize: 12, fontWeight: "900", color: "#1e293b" },
//   modalSubTitle: {
//     fontSize: 11,
//     fontWeight: "bold",
//     color: "#fff",
//     backgroundColor: "#0f172a",
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 4,
//     marginTop: 4,
//   },
//   fullMap: { flex: 1 },
//   modalFooter: { padding: 20, backgroundColor: "#fff" },
//   confirmBtn: { backgroundColor: "#0f172a", borderRadius: 12 },
//   activeMarker: { alignItems: "center" },
//   markerShadow: {
//     width: 10,
//     height: 4,
//     backgroundColor: "rgba(0,0,0,0.2)",
//     borderRadius: 5,
//     marginTop: -5,
//   },
// });
