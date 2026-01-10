import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker, Polygon } from "react-native-maps";

const LM_STROKE_COLOR = "#2563eb";
const WARD_STROKE_COLOR = "#16a34a";
const ERF_STROKE_COLOR = "#00aeff";

const extractCoords = (item) => {
  const geom = item?.geometry;
  if (!geom || !geom.coordinates) return null;

  let rings = null;
  if (geom.type === "Polygon") {
    rings = geom.coordinates[0];
  } else if (geom.type === "MultiPolygon") {
    let temp = geom.coordinates;
    while (Array.isArray(temp) && temp.length > 0 && Array.isArray(temp[0])) {
      if (typeof temp[0][0] === "number") {
        rings = temp;
        break;
      }
      temp = temp[0];
    }
  }

  if (!Array.isArray(rings) || rings.length === 0) return null;

  return rings.map((coord) => ({
    latitude: coord[1],
    longitude: coord[0],
  }));
};

/**
 * Optimized Check: Is point on screen?
 * Uses a percentage buffer so it scales with zoom level.
 */
const isPointInRegion = (point, region, bufferFactor = 0.1) => {
  if (!region || !point) return false;

  const latBuffer = region.latitudeDelta * bufferFactor;
  const lngBuffer = region.longitudeDelta * bufferFactor;

  return (
    point.lat >= region.latitude - region.latitudeDelta / 2 - latBuffer &&
    point.lat <= region.latitude + region.latitudeDelta / 2 + latBuffer &&
    point.lng >= region.longitude - region.longitudeDelta / 2 - lngBuffer &&
    point.lng <= region.longitude + region.longitudeDelta / 2 + lngBuffer
  );
};

const BoundaryLayer = ({
  lm,
  wards = [],
  selectedWard,
  selectedErf,
  allErfs = [],
  currentRegion,
  currentZoom,
}) => {
  const lmCoords = useMemo(() => extractCoords(lm), [lm]);
  const erfCoords = useMemo(() => extractCoords(selectedErf), [selectedErf]);

  const wardCoordsMap = useMemo(() => {
    const map = new Map();
    wards.forEach((w) => {
      const coords = extractCoords(w);
      if (coords) map.set(w.id, coords);
    });
    return map;
  }, [wards]);

  // LAYER 1: Visible Boundaries (Medium buffer for neighborhood context)
  const visiblePolygons = useMemo(() => {
    if (currentZoom < 15) return [];
    return allErfs.filter(
      (erf) =>
        erf.id !== selectedErf?.id &&
        isPointInRegion(erf.centroid, currentRegion, 0.5)
    );
  }, [allErfs, currentRegion, currentZoom, selectedErf?.id]);

  // LAYER 2: Visible Labels (Tight buffer for performance)
  const visibleLabels = useMemo(() => {
    if (currentZoom < 17) return [];
    return allErfs.filter(
      (erf) =>
        erf.id !== selectedErf?.id &&
        isPointInRegion(erf.centroid, currentRegion, 0.05)
    );
  }, [allErfs, currentRegion, currentZoom, selectedErf?.id]);

  return (
    <>
      {/* 1. MUNICIPALITY & WARDS */}
      {lmCoords && (
        <Polygon
          key={`lm-${lm.id}`}
          coordinates={lmCoords}
          strokeColor={LM_STROKE_COLOR}
          strokeWidth={2}
          fillColor="rgba(37,99,235,0.02)"
          zIndex={1}
        />
      )}

      {wards.map((ward) => {
        const coords = wardCoordsMap.get(ward.id);
        if (!coords) return null;
        const isSelected = selectedWard?.id === ward.id;
        return (
          <Polygon
            key={`ward-${ward.id}`}
            coordinates={coords}
            strokeColor={isSelected ? "#dc2626" : WARD_STROKE_COLOR}
            strokeWidth={isSelected ? 2 : 1}
            fillColor={
              isSelected ? "rgba(220,38,38,0.1)" : "rgba(22,163,74,0.02)"
            }
            zIndex={isSelected ? 5 : 2}
          />
        );
      })}

      {/* 2. NEIGHBORHOOD BOUNDARIES (Vector-based, fast) */}
      {visiblePolygons.map((erf) => (
        <Polygon
          key={`poly-${erf.id}`}
          coordinates={extractCoords(erf)}
          strokeColor="rgba(188, 46, 46, 0.7)"
          strokeWidth={0.5}
          fillColor="transparent"
          zIndex={10}
        />
      ))}

      {/* 3. NEIGHBORHOOD LABELS (Heavy, strictly filtered) */}
      {visibleLabels.map((erf) => (
        <Marker
          key={`label-${erf.id}`}
          coordinate={{
            latitude: erf.centroid.lat,
            longitude: erf.centroid.lng,
          }}
          // Re-enable tracking ONLY if list is small enough to avoid lag
          tracksViewChanges={visibleLabels.length < 60}
          anchor={{ x: 0.5, y: 0.5 }}
          pointerEvents="none"
          zIndex={20}
        >
          <View style={styles.miniLabelContainer}>
            <Text style={styles.miniLabelText}>{erf.sg?.parcelNo}</Text>
          </View>
        </Marker>
      ))}

      {/* 4. SELECTED ERF (Highest Priority) */}
      {erfCoords && (
        <Polygon
          key={`selected-poly-${selectedErf.id}`}
          coordinates={erfCoords}
          strokeColor={ERF_STROKE_COLOR}
          strokeWidth={3}
          fillColor="rgba(0, 174, 255, 0.3)"
          zIndex={100}
        />
      )}

      {/* 4. SELECTED ERF (Highest Priority) */}
      {selectedErf?.centroid && (
        <Marker
          key={`selected-marker-${selectedErf.id}`}
          coordinate={{
            latitude: selectedErf.centroid.lat,
            longitude: selectedErf.centroid.lng,
          }}
          // Center the dot exactly on the centroid
          anchor={{ x: 0.5, y: 0.5 }}
          zIndex={1000} // Ensure it is above EVERYTHING
          tracksViewChanges={true} // Keep true for the selected one so it's always crisp
        >
          <View style={styles.selectedMarkerContainer}>
            <View style={styles.labelBubble}>
              <Text style={styles.labelText}>
                {selectedErf?.sg?.parcelNo || "SELECTED"}
              </Text>
            </View>
            <View style={styles.blueDot} />
          </View>
        </Marker>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  selectedMarkerContainer: { alignItems: "center", justifyContent: "center" },
  labelBubble: {
    backgroundColor: "white",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#00aeff",
    marginBottom: 2,
    elevation: 4,
  },
  labelText: { fontSize: 10, fontWeight: "bold", color: "#333" },
  blueDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#00aeff",
    borderWidth: 2,
    borderColor: "white",
  },
  miniLabelContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: "#bbb",
  },
  miniLabelText: {
    fontSize: 9,
    color: "#000",
    fontWeight: "bold",
  },
});

export default React.memo(BoundaryLayer);
