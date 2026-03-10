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
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from "react-native-maps";
import { Button, Modal, Portal } from "react-native-paper";
import { useWarehouse } from "../../src/context/WarehouseContext";

const { width, height } = Dimensions.get("window");

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

const FormMapPositioner = ({
  label = "Physical Asset Positioning",
  name,
  erfId,
  defaultLocation,
}) => {
  // console.log(`FormMapPositioner --defaultLocation`, defaultLocation);
  const [showMap, setShowMap] = useState(false);
  const { all } = useWarehouse();
  const { values, errors, setFieldValue } = useFormikContext();
  const targetGeo = all?.geoLibrary?.[erfId] || null;
  // console.log(`FormMapPositioner --targetGeo`, targetGeo);

  const startLat = defaultLocation?.lat ?? targetGeo?.centroid?.lat ?? -34.028;
  // console.log(`FormMapPositioner --startLat`, startLat);

  const startLng = defaultLocation?.lng ?? targetGeo?.centroid?.lng ?? 23.076;
  // console.log(`FormMapPositioner --startLng`, startLng);

  const erfCoordinates = useMemo(() => {
    if (!targetGeo?.geometry) return null;

    let geometryObj = targetGeo.geometry;

    if (typeof geometryObj === "string") {
      try {
        geometryObj = JSON.parse(geometryObj);
      } catch (e) {
        return null;
      }
    }

    if (!geometryObj?.coordinates) return null;

    const raw =
      geometryObj.type === "MultiPolygon"
        ? geometryObj.coordinates?.[0]?.[0]
        : geometryObj.coordinates?.[0];

    if (!Array.isArray(raw)) return null;

    return raw.map((c) => ({
      latitude: c[1],
      longitude: c[0],
    }));
  }, [targetGeo]);

  const fieldError = getIn(errors, name);
  const hasError = !!fieldError;

  const currentLocation = getIn(values, name); // { lat, lng }
  // console.log(`FormMapPositioner --currentLocation`, currentLocation);

  const resolvedLocation =
    currentLocation &&
    typeof currentLocation === "object" &&
    typeof currentLocation.lat === "number" &&
    typeof currentLocation.lng === "number"
      ? currentLocation
      : { lat: startLat, lng: startLng };
  // console.log(`FormMapPositioner --resolvedLocation`, resolvedLocation);

  const hasValidCurrentPoint =
    currentLocation &&
    typeof currentLocation === "object" &&
    typeof currentLocation.lat === "number" &&
    typeof currentLocation.lng === "number";

  const hasValidDefaultPoint =
    defaultLocation &&
    typeof defaultLocation === "object" &&
    typeof defaultLocation.lat === "number" &&
    typeof defaultLocation.lng === "number";

  const isVerified =
    hasValidCurrentPoint &&
    hasValidDefaultPoint &&
    !isSamePoint(currentLocation, defaultLocation);

  const handleDragEnd = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;

    setFieldValue(name, {
      lat: latitude,
      lng: longitude,
    });

    console.log(`📡 [POSITION SECURED]: ${latitude}, ${longitude}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.topLabel}>{label}</Text>

      <TouchableOpacity
        onPress={() => setShowMap(true)}
        style={[styles.selector, hasError && styles.errorBorder]}
        // style={[styles.selector, !isVerified && styles.errorBorder]}
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
              {isVerified
                ? `${resolvedLocation.lat.toFixed(6)}° , ${resolvedLocation.lng.toFixed(6)}°`
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

      <Portal>
        <Modal
          visible={showMap}
          onDismiss={() => setShowMap(false)}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>DRAG PIN TO PHYSICAL ASSET</Text>

            <View style={styles.modalBtnRow}>
              <Button
                mode="outlined"
                onPress={() => setShowMap(false)}
                textColor="#475569"
                style={styles.cancelBtn}
              >
                CANCEL
              </Button>

              <Button
                mode="contained"
                onPress={() => setShowMap(false)}
                buttonColor="#059669"
                disabled={!isVerified}
              >
                DONE
              </Button>
            </View>
          </View>

          <View style={styles.mapWrapper}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              showsUserLocation={true}
              initialRegion={{
                latitude: resolvedLocation.lat,
                longitude: resolvedLocation.lng,
                latitudeDelta: 0.00035,
                longitudeDelta: 0.00035,
              }}
            >
              {erfCoordinates && (
                <Polygon
                  coordinates={erfCoordinates}
                  strokeColor="#059669"
                  fillColor="rgba(5, 150, 105, 0.15)"
                  strokeWidth={3}
                />
              )}

              <Marker
                draggable
                coordinate={{
                  latitude: resolvedLocation.lat,
                  longitude: resolvedLocation.lng,
                }}
                onDragEnd={handleDragEnd}
                anchor={{ x: 0.5, y: 1 }}
              >
                <View style={styles.markerWrapper}>
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={50}
                    color="#dc2626"
                  />
                </View>
              </Marker>
            </MapView>

            <View pointerEvents="none" style={styles.mapTip}>
              <Text style={styles.mapTipText}>
                LONG-PRESS AND DRAG PIN TO EXACT LOCATION
              </Text>
            </View>
          </View>
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 5,
  },

  modalContent: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginVertical: 34,
    height: height - 48,
    borderRadius: 18,
    overflow: "hidden",
    justifyContent: "flex-start",
  },

  modalHeader: {
    flexDirection: "column",
    alignItems: "center", // centers horizontally
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  modalTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#64748b",
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: "center",
  },

  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "center", // center buttons
    gap: 12,
  },

  cancelBtn: {
    borderColor: "#cbd5e1",
  },

  mapTip: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "rgba(30, 41, 59, 0.9)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },

  mapTipText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  mapWrapper: {
    flex: 1,
  },
});
