// components/maps/BoundaryLayer.js
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker, Polygon } from "react-native-maps";
import { useSelector } from "react-redux";
import { useGeo } from "../../src/context/GeoContext";
import { geoApi } from "../../src/redux/geoApi";
import { erfMemory } from "../../src/storage/erfMemory";

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
  wards = [],
  allErfs = [],
  currentRegion,
  currentZoom,
}) => {
  const { geoState } = useGeo();

  const {
    lmId,
    wardId: selectedWardId,
    id: selectedErfId,
    selectedErf,
  } = geoState;
  // console.log(`BoundaryLayer ----selectedErf`, selectedErf);

  // NEIGHBOUHG
  // 1. Identify which IDs are on screen (Using Meta centroids)
  const visibleNeighborIds = useMemo(() => {
    // Gate: Only show neighbor shapes when zoomed in deep (Street Level)
    if (currentZoom < 16 || allErfs.length === 0 || !currentRegion) return [];

    return allErfs
      .filter(
        (erf) =>
          erf.id !== selectedErfId &&
          isPointInRegion(erf.centroid, currentRegion, 0.4) // 0.4 buffer for smooth edges
      )
      .map((erf) => erf.id);
  }, [allErfs, currentRegion, currentZoom, selectedErfId]);

  // 2. HYDRATION: State to hold the heavy geometries
  const [neighborShapes, setNeighborShapes] = useState([]);

  useEffect(() => {
    // If we move out or have no IDs, clear the shapes
    if (visibleNeighborIds.length === 0) {
      setNeighborShapes([]);
      return;
    }

    // Go to geoKV to get the "Heavy" shapes for only these specific neighbors
    const shapes = visibleNeighborIds
      .map((id) => erfMemory.getErfGeo(id)) // Fetching from the warehouse
      .filter(Boolean); // Ensure no nulls if some geo is missing

    setNeighborShapes(shapes);
  }, [visibleNeighborIds]); // Fires only when the map stops and IDs change

  // 🏛️ FETCH LM GEOMETRY ON DEMAND (Just like MCC)
  const lmDetails = useSelector(
    (state) =>
      geoApi.endpoints.getLocalMunicipalityById.select(lmId)(state)?.data
  );

  const lmCoords = useMemo(() => extractCoords(lmDetails), [lmDetails]);

  // FETCH WARD GEOMETRY
  const wardCoordsMap = useMemo(() => {
    const map = new Map();
    wards.forEach((w) => {
      const coords = extractCoords(w);
      if (coords) map.set(w.id, coords);
    });
    return map;
  }, [wards]);

  // 🏛️ FETCH SELECTED ERF GEOMETRY ON DEMAND
  const selectedErfData = useMemo(() => {
    if (!selectedErfId) return null;
    // Get geometry/centroid from MMKV Warehouse
    return erfMemory.getErfGeo(selectedErfId);
  }, [selectedErfId]);
  // console.log(`BoundaryLayer ----selectedErfData`, selectedErfData);

  const erfCoords = useMemo(() => {
    if (!selectedErfData) return null;

    // 🛡️ CHECK 1: If the warehouse already gave us the boundary array
    if (selectedErfData.boundary && Array.isArray(selectedErfData.boundary)) {
      // console.log("✅ Using pre-formatted boundary from Warehouse");
      return selectedErfData.boundary;
    }

    // 🛡️ CHECK 2: Fallback to the old extractor if it's raw GeoJSON
    return extractCoords(selectedErfData);
  }, [selectedErfData]);

  return (
    <>
      {/* 0. LOCAL MUNICIPALITY BOUNDARY (The "Home Base") */}
      {lmCoords && (
        <Polygon
          key={`lm-${lmId}`}
          coordinates={lmCoords}
          strokeColor={LM_STROKE_COLOR}
          strokeWidth={2}
          fillColor="transparent"
          zIndex={1} // Lowest layer
        />
      )}
      {/* 1. WARDS */}
      {wards.map((ward) => {
        const coords = wardCoordsMap.get(ward.id);
        if (!coords) return null;
        const isSelected = selectedWardId === ward.id;
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

      {/* 4. SELECTED ERF HIGHLIGHT & LABEL */}
      {erfCoords && (
        <>
          {/* The Bold Blue Boundary */}
          <Polygon
            key={`selected-poly-${selectedErfId}`}
            coordinates={erfCoords}
            strokeColor={ERF_STROKE_COLOR}
            strokeWidth={3}
            fillColor="rgba(0, 174, 255, 0.3)"
            zIndex={100}
          />

          {/* The Label and the Blue Dot */}
          {selectedErfData?.centroid && (
            <Marker
              key={`selected-marker-${selectedErfId}`}
              coordinate={{
                latitude: selectedErfData.centroid.lat,
                longitude: selectedErfData.centroid.lng,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={1000}
            >
              <View style={styles.selectedMarkerContainer}>
                <View style={styles.labelBubble}>
                  <Text style={styles.labelText}>{selectedErf?.erfNo}</Text>
                </View>
                <View style={styles.blueDot} />
              </View>
            </Marker>
          )}
        </>
      )}

      {/* 2. NEIGHBORHOOD BOUNDARIES (The Hydrated Shapes) */}
      {neighborShapes.map((geo) => (
        <Polygon
          key={`neighbor-${geo.id}`}
          coordinates={geo.boundary} // Use the boundary we fetched in useEffect
          strokeColor="rgba(39, 67, 195, 0.5)" // Subtle blue
          strokeWidth={0.8}
          fillColor="transparent"
          zIndex={10}
        />
      ))}

      {/* 3. NEIGHBORHOOD LABELS (The Proven Logic) */}
      {currentZoom >= 17.2 && // 🛡️ High-detail gate: Hide when zooming out
        allErfs
          .filter(
            (erf) =>
              visibleNeighborIds.includes(erf.id) && erf.id !== selectedErfId
          )
          .map((erf) => (
            <Marker
              key={`label-${erf.id}`}
              coordinate={{
                latitude: erf.centroid.lat,
                longitude: erf.centroid.lng,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              // 🎯 PIN THE CENTER
              // ⚡ Optimization: once they are positioned, don't keep re-calculating
              tracksViewChanges={true}
              pointerEvents="none"
              zIndex={50} // Higher than Polygons (10)
            >
              <View style={styles.miniLabelContainer}>
                <Text style={styles.miniLabelText}>{erf.erfNo}</Text>
              </View>
            </Marker>
          ))}
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
