import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getIn, useFormikContext } from "formik";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polygon } from "react-native-maps";
import { Button, Modal, Portal, Surface } from "react-native-paper";

const SovereignLocationPicker = ({
  label,
  name,
  icon = "home-map-marker",
  referenceBoundary = [],
  erfNo = "",
  erfCentroid = null,
}) => {
  const { values, setFieldValue } = useFormikContext();
  const [modalVisible, setModalVisible] = useState(false);

  const rawValue = getIn(values, name);
  const coords = Array.isArray(rawValue)
    ? { latitude: rawValue[0], longitude: rawValue[1] }
    : { latitude: rawValue?.lat, longitude: rawValue?.lng };

  const [tempCoords, setTempCoords] = useState(coords);

  const handleConfirm = () => {
    const finalValue = Array.isArray(rawValue)
      ? [tempCoords.latitude, tempCoords.longitude]
      : { lat: tempCoords.latitude, lng: tempCoords.longitude };

    setFieldValue(name, finalValue);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={styles.previewWrapper}
        onPress={() => {
          setTempCoords(coords);
          setModalVisible(true);
        }}
      >
        <MapView
          style={styles.miniMap}
          scrollEnabled={false}
          zoomEnabled={false}
          region={{
            ...coords,
            latitudeDelta: 0.002,
            longitudeDelta: 0.002,
          }}
        >
          <Marker coordinate={coords}>
            <MaterialCommunityIcons name={icon} size={24} color="#0f172a" />
          </Marker>
        </MapView>
        <View style={styles.overlay}>
          <MaterialCommunityIcons
            name="arrow-expand-all"
            size={20}
            color="#fff"
          />
          <Text style={styles.overlayText}>Tap to Position Premise</Text>
        </View>
      </TouchableOpacity>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalSurface}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SITUATIONAL POSITIONING</Text>
              <Text style={styles.modalSubTitle}>ERF {erfNo}</Text>
            </View>

            <MapView
              style={styles.fullMap}
              showsUserLocation={true} // 🔵 THE BLUE DOT
              followsUserLocation={false}
              initialRegion={{
                ...coords,
                latitudeDelta: 0.001,
                longitudeDelta: 0.001,
              }}
            >
              {/* 🏛️ REFERENCE: The Erf Boundary (Gold) */}
              {referenceBoundary.length > 0 && (
                <Polygon
                  coordinates={referenceBoundary}
                  strokeColor="#FFD700"
                  fillColor="rgba(255, 214, 0, 0.15)"
                  strokeWidth={3}
                  zIndex={1}
                />
              )}

              {/* 🏷️ REFERENCE: Erf No Label at Centroid */}
              {erfCentroid && (
                <Marker
                  coordinate={{
                    latitude: erfCentroid[0],
                    longitude: erfCentroid[1],
                  }}
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={false}
                >
                  <View style={styles.erfLabel}>
                    <Text style={styles.erfLabelText}>{erfNo}</Text>
                  </View>
                </Marker>
              )}

              {/* 📍 THE MISSION: Draggable Premise Pin */}
              <Marker
                draggable
                coordinate={tempCoords}
                onDragEnd={(e) => setTempCoords(e.nativeEvent.coordinate)}
                zIndex={10}
              >
                <MaterialCommunityIcons name={icon} size={44} color="#0f172a" />
              </Marker>
            </MapView>

            <View style={styles.modalFooter}>
              <Button onPress={() => setModalVisible(false)}>CANCEL</Button>
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
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  label: {
    fontSize: 11,
    fontWeight: "900",
    color: "#64748b",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  previewWrapper: {
    height: 120,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  miniMap: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayText: {
    color: "white",
    fontWeight: "900",
    fontSize: 12,
    marginTop: 4,
  },
  modalContainer: { flex: 1, padding: 0 },
  modalSurface: { flex: 1, backgroundColor: "white" },
  modalHeader: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontWeight: "900",
    fontSize: 14,
    color: "#1e293b",
    textAlign: "center",
  },
  modalSubTitle: {
    fontWeight: "700",
    fontSize: 12,
    color: "#FFD700",
    textAlign: "center",
    backgroundColor: "#0f172a",
    alignSelf: "center",
    paddingHorizontal: 10,
    borderRadius: 4,
    marginTop: 4,
  },
  fullMap: { flex: 1 },
  erfLabel: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  erfLabelText: { color: "#FFD700", fontSize: 10, fontWeight: "900" },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    backgroundColor: "white",
  },
  confirmBtn: { backgroundColor: "#0f172a", paddingHorizontal: 20 },
});

export default SovereignLocationPicker;
