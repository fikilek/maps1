import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getIn, useFormikContext } from "formik";
import { useMemo, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from "react-native-maps"; // 🛰️ Added Polygon
import { Button, Modal, Portal } from "react-native-paper";
import { useWarehouse } from "../../src/context/WarehouseContext";

const { width, height } = Dimensions.get("window");

const FormMapPositioner = ({
  label = "Physical Asset Positioning",
  name,
  erfId,
}) => {
  const [showMap, setShowMap] = useState(false);
  const { all } = useWarehouse();
  const { values, setFieldValue } = useFormikContext();

  // 🏛️ THE SINGLE SOURCE OF TRUTH: targetGeo from geoLibrary
  const targetGeo = all?.geoLibrary?.[erfId];

  // 📍 THE MISSION START: Directly from the Centroid
  const startLat = targetGeo?.centroid?.lat || -34.028;
  const startLng = targetGeo?.centroid?.lng || 23.076;

  // 🗺️ THE BOUNDARY REFINERY (Only for the green perimeter lines)
  const erfCoordinates = useMemo(() => {
    if (!targetGeo?.geometry?.coordinates) return null;
    const raw =
      targetGeo.geometry.type === "MultiPolygon"
        ? targetGeo.geometry.coordinates[0][0]
        : targetGeo.geometry.coordinates[0];
    return raw.map((c) => ({ latitude: c[1], longitude: c[0] }));
  }, [targetGeo]);

  const handleDragEnd = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;

    // 💉 1. CAPTURE THE GPS: Dump the array into Formik
    setFieldValue(name, [latitude, longitude]);

    // ✅ 2. AUTHENTICATE: Flip the verification flag
    // This is what turns the border from Red to Green
    setFieldValue("metadata.isGpsVerified", true);

    console.log(`📡 [POSITION SECURED]: ${latitude}, ${longitude}`);
  };

  // const isVerified = values.metadata?.isGpsVerified === true;
  const isVerified =
    values.metadata?.isGpsVerified === true ||
    (Array.isArray(currentLocation) && currentLocation.length === 2);
  const currentLocation = getIn(values, name); // e.g., [lat, lng]

  return (
    <View style={styles.container}>
      {/* 🔘 TRIGGER BUTTON */}
      <Text style={styles.topLabel}>{label}</Text>

      <TouchableOpacity
        onPress={() => setShowMap(true)}
        // 🛡️ THE VISUAL DNA: Apply errorBorder only if NOT verified
        style={[styles.selector, !isVerified && styles.errorBorder]}
      >
        <View style={styles.row}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isVerified ? "#dcfce7" : "#fee2e2" },
            ]}
          >
            <MaterialCommunityIcons
              name={isVerified ? "map-marker-check" : "map-marker-alert"}
              size={24}
              color={isVerified ? "#059669" : "#dc2626"}
            />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.selectorValue}>
              {isVerified && Array.isArray(currentLocation)
                ? `${currentLocation[0].toFixed(6)}° , ${currentLocation[1].toFixed(6)}°`
                : "VERIFY PREMISE POSITION"}
            </Text>
            <Text style={styles.actionText}>
              {isVerified
                ? "Coordinate Lock Secured"
                : "Long-press & Drag pin to verify"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* <TouchableOpacity
        onPress={() => setShowMap(true)}
        style={styles.selector}
      >
        <View style={styles.row}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="map-marker-radius"
              size={24}
              color="#059669"
            />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.selectorValue}>ADJUST ASSET POSITION</Text>
            <Text style={styles.actionText}>Defaults to Erf Centroid</Text>
          </View>
        </View>
        <MaterialCommunityIcons name="target" size={24} color="#64748B" />
      </TouchableOpacity> */}

      <Portal>
        <Modal
          visible={showMap}
          onDismiss={() => setShowMap(false)}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>DRAG PIN TO PHYSICAL ASSET</Text>
            <Button
              mode="contained"
              onPress={() => setShowMap(false)}
              buttonColor="#059669"
            >
              DONE
            </Button>
          </View>

          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            showsUserLocation={true}
            initialRegion={{
              latitude: startLat,
              longitude: startLng,
              latitudeDelta: 0.001,
              longitudeDelta: 0.001,
            }}
          >
            {/* 🏛️ GREEN PERIMETER LINES */}
            {erfCoordinates && (
              <Polygon
                coordinates={erfCoordinates}
                strokeColor="#059669"
                fillColor="rgba(5, 150, 105, 0.15)"
                strokeWidth={3}
              />
            )}

            {/* 📍 THE PIN: Starts at Centroid, captured on Drag */}

            <Marker
              draggable
              coordinate={{ latitude: startLat, longitude: startLng }}
              onDragEnd={handleDragEnd}
              anchor={{ x: 0.5, y: 1 }}
            >
              <View style={styles.markerWrapper}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={50} // 🎯 Massive for field ergonomics
                  color="#dc2626"
                />
              </View>
            </Marker>
          </MapView>
        </Modal>
      </Portal>
    </View>
  );
};

export default FormMapPositioner;

const styles = StyleSheet.create({
  container: { paddingVertical: 10 },
  topLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748b",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  selector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  errorBorder: { borderColor: "#ef4444", borderLeftWidth: 6 },
  row: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  textBlock: { marginLeft: 12 },
  selectorValue: { fontSize: 13, fontWeight: "800" },
  actionText: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
    fontWeight: "600",
  },

  // Paper Modal Styles
  modalContent: {
    backgroundColor: "white",
    margin: 0,
    height: height,
    width: width,
    justifyContent: "flex-start",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  modalTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#64748b",
    letterSpacing: 1,
  },
  map: { flex: 1 },
  tipSurface: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    backgroundColor: "#1e293b",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
  },
  tipText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.5,
  },

  markerWrapper: {
    // 🛡️ Shadow makes it feel "lifted" and easier to target
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    // We ensure the wrapper doesn't add extra padding that throws off the tip
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 5, // Visual adjustment to see the tip clearly
  },
});
