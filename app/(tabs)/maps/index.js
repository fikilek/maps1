import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  Marker,
  Polygon,
  Polyline,
  PROVIDER_GOOGLE,
} from "react-native-maps";

// 🎯 Context & Utilities
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import GeoStatusHUD from "../../../components/GeoStatusHUD"; // ⬅️ Restored
import GeoCascadingSelector from "../../../components/maps/GeoCascadingSelector"; // ⬅️ Restored
import SelectedErf from "../../../components/maps/SelectedErf"; // ⬅️ Restored
import SelecteMeter from "../../../components/maps/SelectedMeter"; // ⬅️ Restored
import SelectedPremise from "../../../components/maps/SelectedPremise"; // ⬅️ Restored
import { useGeo } from "../../../src/context/GeoContext";
import {
  bboxToRegion,
  getSafeCoords,
  useMap,
} from "../../../src/context/MapContext";
import { useWarehouse } from "../../../src/context/WarehouseContext";
import { useAuth } from "../../../src/hooks/useAuth";
import { cutLastWord } from "../../../src/utils/stringsUtils";

export default function MapsScreen() {
  const { mapRef, flyTo } = useMap();
  const { geoState, updateGeo } = useGeo();
  const { all } = useWarehouse();
  const { activeWorkbase } = useAuth(); // 🎯 THE STABILITY ANCHOR
  const router = useRouter();

  const lastSignalRef = useRef(null);

  // 🎯 THE INITIAL LAUNCH REGION
  // Uses the BBox from the active workbase to ensure the map never starts at [0,0]
  const initialRegion = useMemo(() => {
    const targetBBox = geoState?.selectedLm?.bbox || activeWorkbase?.bbox;
    if (targetBBox) {
      return bboxToRegion(targetBBox);
    }
    return {
      latitude: -34.035, // Knysna Fallback
      longitude: 23.0483,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  }, []);

  const wardsList = all?.wards || [];
  const [region, setRegion] = useState(null);
  const [zoom, setZoom] = useState(10);

  const [showLayers, setShowLayers] = useState({
    erfs: true,
    premises: true,
    asts: true,
  });

  const handleRegionChange = (newRegion) => {
    const currentZoom = Math.round(Math.log2(360 / newRegion?.longitudeDelta));
    setZoom(currentZoom);
    setRegion(newRegion);
  };

  // 🚀 THE PILOT EFFECT: Handles all "Flights" across the LM
  useEffect(() => {
    const signal = geoState?.flightSignal;
    if (!signal || signal === lastSignalRef?.current) return;

    const {
      lastSelectionType,
      selectedLm,
      selectedWard,
      selectedErf,
      selectedPremise,
      selectedMeter,
    } = geoState;

    console.log(
      `🚀 [PILOT]: Command Received: ${lastSelectionType} | Signal: ${signal}`,
    );

    switch (lastSelectionType) {
      case "LM":
        if (selectedLm?.bbox) flyTo(selectedLm?.bbox);
        break;

      case "WARD":
        if (selectedWard?.bbox) flyTo(selectedWard?.bbox);
        break;

      case "ERF":
        const erfGeo = all?.geoLibrary?.[selectedErf?.id];
        if (erfGeo?.bbox) flyTo(erfGeo?.bbox, 90);
        break;

      case "PREMISE":
        const premisePoint = selectedPremise?.geometry?.centroid;
        const pErfEntry = all?.geoLibrary?.[selectedErf?.id];
        const pErfCoords = getSafeCoords(pErfEntry?.geometry);
        const pBundle = [];

        if (Array.isArray(premisePoint) && premisePoint.length >= 2) {
          const pLat = premisePoint[0] < 0 ? premisePoint[0] : premisePoint[1];
          const pLng = premisePoint[0] > 0 ? premisePoint[0] : premisePoint[1];
          pBundle.push({ latitude: pLat, longitude: pLng });
        }
        if (pErfCoords?.length > 0) {
          pErfCoords.forEach((coord) => pBundle.push(coord));
        }

        if (pBundle.length > 0) {
          mapRef.current?.fitToCoordinates(pBundle, {
            edgePadding: { top: 70, right: 70, bottom: 70, left: 70 },
            animated: true,
          });
        }
        break;

      case "METER":
        const meterGps = selectedMeter?.ast?.location?.gps;
        const pCentroid = selectedPremise?.geometry?.centroid;
        const erfEntry = all?.geoLibrary?.[selectedErf?.id];
        const erfCoords = getSafeCoords(erfEntry?.geometry);
        const bundleCoords = [];

        if (meterGps?.lat) {
          bundleCoords.push({
            latitude: meterGps.lat,
            longitude: meterGps.lng,
          });
        }
        if (Array.isArray(pCentroid) && pCentroid.length >= 2) {
          const pLat = pCentroid[0] < 0 ? pCentroid[0] : pCentroid[1];
          const pLng = pCentroid[0] > 0 ? pCentroid[0] : pCentroid[1];
          bundleCoords.push({ latitude: pLat, longitude: pLng });
        }
        if (erfCoords?.length > 0) {
          erfCoords.forEach((coord) => bundleCoords.push(coord));
        }

        if (bundleCoords.length > 0) {
          mapRef.current?.fitToCoordinates(bundleCoords, {
            edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
            animated: true,
          });
        }
        break;

      default:
        break;
    }

    lastSignalRef.current = signal;
  }, [geoState?.flightSignal]);

  // 🏛️ RENDERING LAYERS (0 to 3)

  const renderLM = () => {
    const lmId = geoState?.selectedLm?.id || activeWorkbase?.id;
    if (!lmId) return null;
    const lmEntry = all?.geoLibrary?.[lmId];
    const lmCoords = getSafeCoords(lmEntry?.geometry || lmEntry);
    if (lmCoords?.length < 3) return null;

    return (
      <Polygon
        key={`lm-boundary-${lmId}`}
        coordinates={lmCoords}
        strokeColor="#0f172a"
        fillColor="transparent"
        strokeWidth={3}
        zIndex={10}
      />
    );
  };

  const renderWards = () => {
    return wardsList.map((ward, index) => {
      if (!ward?.geometry) return null;
      const wardCoords = getSafeCoords(ward?.geometry);
      if (wardCoords?.length < 3) return null;

      const isSelected = geoState?.selectedWard?.id === ward?.id;

      return (
        <Polygon
          key={`ward-poly-${ward?.id || index}`}
          coordinates={wardCoords}
          strokeColor={isSelected ? "#2563eb" : "#475569"}
          fillColor={
            isSelected ? "rgba(37, 99, 235, 0.2)" : "rgba(148, 163, 184, 0.05)"
          }
          strokeWidth={isSelected ? 3 : 1.5}
          zIndex={isSelected ? 100 : 50}
          tappable={true}
        />
      );
    });
  };

  const renderSelectedErf = () => {
    const selectedId = geoState?.selectedErf?.id;
    if (!selectedId) return null;
    const heavyEntry = all?.geoLibrary?.[selectedId];
    const borderCoords = getSafeCoords(heavyEntry?.geometry);
    const centroid = heavyEntry?.centroid;

    if (borderCoords?.length < 3 || !centroid?.lat) return null;

    return (
      <>
        <Polygon
          key={`sovereign-border-${selectedId}`}
          coordinates={borderCoords}
          strokeColor="#FFD700" // 🟡 Sovereign Gold
          fillColor="rgba(255, 215, 0, 0.15)"
          strokeWidth={4}
          zIndex={1000}
        />
        <SelectedErf
          coordinate={{ latitude: centroid?.lat, longitude: centroid?.lng }}
          erfNo={geoState?.selectedErf?.erfNo}
        />
      </>
    );
  };

  const renderSelectedPremise = () => {
    const selectedPremise = geoState?.selectedPremise;
    const centroid = selectedPremise?.geometry?.centroid;
    if (!selectedPremise?.id || !centroid || centroid?.length < 2) return null;

    const addr = selectedPremise?.address;
    const adrLn1 = addr
      ? `${addr?.strNo || ""} ${addr?.strName}`?.trim()
      : "NO ADR";
    const adrLn2 = addr ? ` ${addr?.strType || ""}`?.trim() : "";

    return (
      <SelectedPremise
        coordinate={{ latitude: centroid[0], longitude: centroid[1] }}
        erfNo={selectedPremise?.erfNo}
        adrLn1={adrLn1}
        adrLn2={adrLn2}
        premiseId={selectedPremise?.id}
      />
    );
  };

  const renderAssetMarker = () => {
    const selectedMeter = geoState?.selectedMeter;
    const gps = selectedMeter?.ast?.location?.gps;
    if (!gps?.lat) return null;

    return (
      <SelecteMeter
        isWater={selectedMeter?.meterType === "water"}
        meterNo={selectedMeter?.ast?.astData?.astNo || "NO ID"}
        coordinates={{ latitude: gps.lat, longitude: gps.lng }}
        shortAdr={cutLastWord(
          selectedMeter?.accessData?.premise?.address || "N/A",
        )}
        erfNo={selectedMeter?.accessData?.erfNo || "N/A"}
      />
    );
  };

  const renderErfsNeighborhood = () => {
    if (!showLayers?.erfs || !region || zoom < 16) return null;

    const latMin = region.latitude - region.latitudeDelta / 2;
    const latMax = region.latitude + region.latitudeDelta / 2;
    const lngMin = region.longitude - region.longitudeDelta / 2;
    const lngMax = region.longitude + region.longitudeDelta / 2;

    const isLevel1 = zoom >= 17;

    return all?.erfs
      ?.filter((erf) => {
        if (erf?.id === geoState?.selectedErf?.id) return false;
        const rawCentroid = all?.geoLibrary?.[erf?.id]?.centroid;
        const cLat =
          rawCentroid?.lat ||
          (Array.isArray(rawCentroid) ? rawCentroid[0] : null);
        const cLng =
          rawCentroid?.lng ||
          (Array.isArray(rawCentroid) ? rawCentroid[1] : null);
        return (
          cLat >= latMin && cLat <= latMax && cLng >= lngMin && cLng <= lngMax
        );
      })
      .map((erf) => {
        const heavyEntry = all?.geoLibrary?.[erf?.id];
        const rawCentroid = heavyEntry?.centroid;
        const cLat = rawCentroid?.lat || rawCentroid?.[0];
        const cLng = rawCentroid?.lng || rawCentroid?.[1];

        return (
          <React.Fragment key={`nb-erf-${erf?.id}`}>
            {isLevel1 && (
              <Polygon
                coordinates={getSafeCoords(heavyEntry?.geometry)}
                strokeColor="#94a3b8"
                fillColor="transparent"
                strokeWidth={0.5}
                zIndex={900}
              />
            )}
            <Marker
              coordinate={{ latitude: cLat, longitude: cLng }}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={(e) => {
                e?.stopPropagation();
                const parentWard = all?.wards?.find(
                  (w) => w.id === erf?.admin?.ward?.id,
                );
                updateGeo({
                  selectedWard: parentWard || null,
                  lastSelectionType: "WARD",
                });
                updateGeo({ selectedErf: erf, lastSelectionType: "ERF" });
                router.push(`/erfs/${erf?.id}`);
              }}
            >
              {isLevel1 ? (
                <View style={styles.neighborhoodLabel}>
                  <Text style={styles.neighborhoodLabelText}>
                    {erf?.erfNo || "N/A"}
                  </Text>
                </View>
              ) : (
                <View style={styles.neighborhoodDot} />
              )}
            </Marker>
          </React.Fragment>
        );
      });
  };

  const renderAssetLink = () => {
    const meter = geoState?.selectedMeter;
    const premise = geoState?.selectedPremise;
    if (
      !meter?.id ||
      !premise?.id ||
      meter?.accessData?.premise?.id !== premise?.id
    )
      return null;

    const meterGps = meter?.ast?.location?.gps;
    const pCentroid = premise?.geometry?.centroid;
    if (!meterGps?.lat || !pCentroid) return null;

    return (
      <>
        <Polyline
          coordinates={[
            { latitude: meterGps.lat, longitude: meterGps.lng },
            { latitude: pCentroid[0], longitude: pCentroid[1] },
          ]}
          strokeColor="#3b82f6"
          strokeWidth={3}
          lineDashPattern={[5, 5]}
          zIndex={1200}
        />
        <Marker
          coordinate={{
            latitude: (meterGps.lat + pCentroid[0]) / 2,
            longitude: (meterGps.lng + pCentroid[1]) / 2,
          }}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>SERVICE LINK</Text>
          </View>
        </Marker>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.hudOverlay}>
        <GeoStatusHUD />
      </View>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation={true}
      >
        {renderLM()}
        {renderWards()}
        {renderSelectedErf()}
        {renderAssetLink()}
        {renderSelectedPremise()}
        {renderErfsNeighborhood()}
        {renderAssetMarker()}
      </MapView>
      <View style={styles.gcsOverlay}>
        <GeoCascadingSelector />
      </View>

      {/* 🛠️ LAYER CONTROL POD */}
      <View style={styles.layerControl}>
        <TouchableOpacity
          style={[styles.layerBtn, showLayers.erfs && styles.layerBtnActive]}
          onPress={() => setShowLayers((p) => ({ ...p, erfs: !p.erfs }))}
        >
          <MaterialCommunityIcons
            name="layers-outline"
            size={20}
            color={showLayers.erfs ? "#fff" : "#64748b"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.layerBtn,
            showLayers.premises && styles.layerBtnActive,
          ]}
          onPress={() =>
            setShowLayers((p) => ({ ...p, premises: !p.premises }))
          }
        >
          <MaterialCommunityIcons
            name="home-outline"
            size={20}
            color={showLayers.premises ? "#fff" : "#64748b"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.layerBtn, showLayers.asts && styles.layerBtnActive]}
          onPress={() => setShowLayers((p) => ({ ...p, asts: !p.asts }))}
        >
          <MaterialCommunityIcons
            name="lightning-bolt-outline"
            size={20}
            color={showLayers.asts ? "#fff" : "#64748b"}
          />
        </TouchableOpacity>
        <View style={styles.zoomDisplay}>
          <Text style={styles.zoomText}>{zoom}</Text>
          <Text style={styles.zoomLabel}>ZOOM</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject, flex: 1 },
  hudOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 10,
  },
  gcsOverlay: {
    position: "absolute",
    bottom: 30,
    left: 10,
    right: 10,
    zIndex: 10,
    elevation: 10,
  },
  layerControl: {
    position: "absolute",
    top: 80,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 8,
    padding: 6,
    elevation: 5,
    zIndex: 100,
  },
  layerBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    marginBottom: 4,
  },
  layerBtnActive: { backgroundColor: "#2563eb" },
  neighborhoodDot: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: "#7b8492",
    borderWidth: 1.5,
    borderColor: "white",
    elevation: 3,
  },
  neighborhoodLabel: {
    backgroundColor: "white",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#94a3b8",
    elevation: 4,
  },
  neighborhoodLabelText: { fontSize: 9, fontWeight: "400", color: "#1e293b" },
  zoomDisplay: {
    marginTop: 10,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 44,
  },
  zoomText: {
    color: "#4CD964",
    fontSize: 14,
    fontWeight: "900",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  zoomLabel: {
    color: "#94a3b8",
    fontSize: 7,
    fontWeight: "800",
    marginTop: -2,
  },
  distanceBadge: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  distanceText: { color: "white", fontSize: 8, fontWeight: "900" },
});

// import React, { useEffect, useMemo, useRef, useState } from "react";
// import {
//   // Dimensions,
//   Platform,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import MapView, {
//   Marker,
//   Polygon,
//   Polyline,
//   PROVIDER_GOOGLE,
// } from "react-native-maps";

// // 🎯 Context & Utilities
// import { MaterialCommunityIcons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";
// import GeoStatusHUD from "../../../components/GeoStatusHUD";
// import GeoCascadingSelector from "../../../components/maps/GeoCascadingSelector";
// import SelectedErf from "../../../components/maps/SelectedErf";
// import SelecteMeter from "../../../components/maps/SelectedMeter";
// import SelectedPremise from "../../../components/maps/SelectedPremise";
// import { useGeo } from "../../../src/context/GeoContext";
// import {
//   bboxToRegion,
//   getSafeCoords,
//   useMap,
// } from "../../../src/context/MapContext"; // 🚀 New
// import { useWarehouse } from "../../../src/context/WarehouseContext";
// import { cutLastWord } from "../../../src/utils/stringsUtils";

// // const { width } = Dimensions.get("window");

// export default function MapsScreen() {
//   // console.log(`SovereignMap ---mounted`);
//   const { mapRef, flyTo } = useMap();
//   const { geoState, updateGeo } = useGeo();
//   const { all } = useWarehouse();
//   const router = useRouter();
//   // 🛡️ THE GATEKEEPER: Ensures we only fly ONCE per tap
//   const lastSignalRef = useRef(null);

//   // 🎯 THE INITIAL LAUNCH REGION
//   // This calculates the perfect view based on the active LM's BBox
//   const initialRegion = useMemo(() => {
//     if (geoState?.selectedLm?.bbox) {
//       return bboxToRegion(geoState?.selectedLm?.bbox);
//     }
//     // Fallback if something is broken
//     return {
//       latitude: -34.035,
//       longitude: 23.0483,
//       latitudeDelta: 0.1,
//       longitudeDelta: 0.1,
//     };
//   }, []); // Only calculate on the very first mount

//   // 🛡️ Guard the list: Ensure it's the list of objects from the warehouse
//   const wardsList = all?.wards || [];
//   const [region, setRegion] = useState(null);
//   const [zoom, setZoom] = useState(10);
//   // console.log(`renderErfsNeighborhood ----zoom`, zoom);

//   const [showLayers, setShowLayers] = useState({
//     erfs: true,
//     premises: true,
//     asts: true,
//   });

//   const handleRegionChange = (newRegion) => {
//     // 🎯 1. Calculate Zoom
//     const currentZoom = Math.round(Math.log2(360 / newRegion?.longitudeDelta));

//     // 🎯 2. Update State (This triggers the Viewport Re-calculation)
//     setZoom(currentZoom);
//     setRegion(newRegion);
//   };

//   useEffect(() => {
//     const signal = geoState?.flightSignal;
//     if (!signal || signal === lastSignalRef?.current) return;

//     const {
//       lastSelectionType,
//       selectedLm,
//       selectedWard,
//       selectedErf,
//       selectedPremise, // 🎯 The missing link
//       selectedMeter,
//     } = geoState;

//     console.log(`🚀 [PILOT]: Command Received: ${lastSelectionType}`);
//     console.log(`🚀 [PILOT]: signal Received: ${signal}`);

//     switch (lastSelectionType) {
//       case "LM":
//         if (selectedLm?.bbox) flyTo(selectedLm?.bbox);
//         // console.log(`🌍 [PILOT]: Pinpointing LM BBOX: `, selectedLm?.bbox);
//         break;

//       case "WARD":
//         if (selectedWard?.bbox) flyTo(selectedWard?.bbox);
//         // console.log(`🌍 [PILOT]: Pinpointing WARD BBOX: `, selectedWard?.bbox);
//         break;

//       case "ERF":
//         const erfGeo = all?.geoLibrary?.[selectedErf?.id];
//         if (erfGeo?.bbox) flyTo(erfGeo?.bbox, 90);
//         // console.log(`🌍 [PILOT]: Pinpointing ERF BBOX: `, erfGeo?.bbox);
//         break;

//       case "PREMISE":
//         const premisePoint = selectedPremise?.geometry?.centroid;

//         // 🏛️ Get the Erf Geometry for the bundle
//         const pErfEntry = all?.geoLibrary?.[selectedErf?.id];
//         const pErfCoords = getSafeCoords(pErfEntry?.geometry);

//         const pBundle = [];

//         // 1. Add Premise Point
//         if (Array.isArray(premisePoint) && premisePoint.length >= 2) {
//           const pLat = premisePoint[0] < 0 ? premisePoint[0] : premisePoint[1];
//           const pLng = premisePoint[0] > 0 ? premisePoint[0] : premisePoint[1];
//           pBundle.push({ latitude: pLat, longitude: pLng });
//         }

//         // 2. Add Erf Boundary
//         if (pErfCoords && pErfCoords.length > 0) {
//           pErfCoords.forEach((coord) => pBundle.push(coord));
//         }

//         if (pBundle.length > 0) {
//           console.log(
//             `🌍 [PILOT]: Bundling ${pBundle.length} points for Premise/Erf view.`,
//           );

//           mapRef.current?.fitToCoordinates(pBundle, {
//             edgePadding: {
//               top: 70, // Space for GeoStatusHUD
//               right: 70,
//               bottom: 70, // Space for GCS + Selection Overlays
//               left: 70,
//             },
//             animated: true,
//           });
//         }
//         break;

//       case "METER":
//         const meterGps = selectedMeter?.ast?.location?.gps;
//         const premiseCentroid = selectedPremise?.geometry?.centroid;

//         // 🏛️ Get the Erf Geometry for the bundle
//         const erfEntry = all?.geoLibrary?.[selectedErf?.id];
//         const erfCoords = getSafeCoords(erfEntry?.geometry);

//         const bundleCoords = [];

//         // 1. Add Meter Point
//         if (meterGps?.lat) {
//           bundleCoords.push({
//             latitude: meterGps.lat,
//             longitude: meterGps.lng,
//           });
//         }

//         // 2. Add Premise Point
//         if (Array.isArray(premiseCentroid) && premiseCentroid.length >= 2) {
//           const pLat =
//             premiseCentroid[0] < 0 ? premiseCentroid[0] : premiseCentroid[1];
//           const pLng =
//             premiseCentroid[0] > 0 ? premiseCentroid[0] : premiseCentroid[1];
//           bundleCoords.push({ latitude: pLat, longitude: pLng });
//         }

//         // 3. Add Erf Boundary (The Frame)
//         // We add all coordinates of the polygon to ensure the whole Erf stays in view
//         if (erfCoords && erfCoords.length > 0) {
//           erfCoords.forEach((coord) => bundleCoords.push(coord));
//         }

//         if (bundleCoords.length > 0) {
//           mapRef.current?.fitToCoordinates(bundleCoords, {
//             edgePadding: {
//               top: 100, // Space for GeoStatusHUD
//               right: 100,
//               bottom: 100, // Space for GCS + Selection Overlays
//               left: 100,
//             },
//             animated: true,
//           });
//         }
//         break;

//       default:
//         console.log("ℹ️ [PILOT]: No specific destination for this command.");
//     }

//     lastSignalRef.current = signal;
//   }, [geoState?.flightSignal]);

//   const renderLM = () => {
//     const lmId = geoState?.selectedLm?.id;
//     if (!lmId) return null;

//     // 🎯 Reach into the library for the LM's "Heavy" geometry
//     const lmEntry = all?.geoLibrary?.[lmId];
//     const lmCoords = getSafeCoords(lmEntry?.geometry || lmEntry);

//     // 🛡️ Native Guard: Polygons need 3 points
//     if (lmCoords?.length < 3) return null;

//     return (
//       <Polygon
//         key={`lm-boundary-${lmId}`}
//         coordinates={lmCoords}
//         strokeColor="#0f172a" // 🌑 Deep Navy/Black for the "Containment" border
//         fillColor="transparent"
//         strokeWidth={3}
//         zIndex={10} // Base layer
//       />
//     );
//   };

//   const renderWards = () => {
//     // 🛡️ Ensure we only map over actual objects
//     return wardsList.map((ward, index) => {
//       if (typeof ward !== "object" || !ward?.geometry) return null;

//       const wardCoords = getSafeCoords(ward?.geometry);
//       if (wardCoords?.length < 3) return null;

//       // 🛡️ Safe Selection Logic (compare primitives only)
//       const isSelected =
//         (geoState?.selectedWard?.id &&
//           ward?.id &&
//           geoState?.selectedWard?.id === ward?.id) ||
//         geoState?.selectedWard?.name === ward?.name;

//       return (
//         <Polygon
//           // 🛡️ Key must be a string
//           key={`ward-poly-${ward?.id || index}`}
//           coordinates={wardCoords}
//           strokeColor={isSelected ? "#2563eb" : "#475569"}
//           fillColor={
//             isSelected ? "rgba(37, 99, 235, 0.2)" : "rgba(148, 163, 184, 0.05)"
//           }
//           strokeWidth={isSelected ? 3 : 1.5}
//           zIndex={isSelected ? 100 : 50}
//           tappable={true}
//         />
//       );
//     });
//   };

//   const renderSelectedErf = () => {
//     const selectedId = geoState?.selectedErf?.id;
//     if (!selectedId) return null;

//     // console.log(`renderSelectedErf ---selectedErf`, selectedErf);

//     // 🎯 THE VAULT LOOKUP: Fetch the Heavy GeoData
//     const heavyEntry =
//       all?.geoLibrary?.[selectedId] || all?.geoEntries?.[selectedId];

//     const borderCoords = getSafeCoords(heavyEntry?.geometry);
//     const centroid = heavyEntry?.centroid;

//     // 🛡️ NATIVE FIREWALL: Guard both the Polygon and the Marker
//     if (borderCoords?.length < 3 || !centroid?.lat || !centroid?.lng)
//       return null;

//     return (
//       <>
//         {/* 🏛️ THE SOVEREIGN BORDER */}
//         <Polygon
//           key={`sovereign-border-${selectedId}`}
//           coordinates={borderCoords}
//           strokeColor="#FFD700" // 🟡 Sovereign Gold
//           fillColor="rgba(255, 215, 0, 0.15)"
//           strokeWidth={4}
//           zIndex={1000}
//         />

//         {/* 📍 THE COMMAND PIN */}
//         <SelectedErf
//           coordinate={{
//             latitude: centroid?.lat,
//             longitude: centroid?.lng,
//           }}
//           erfNo={geoState?.selectedErf?.erfNo}
//         />
//       </>
//     );
//   };

//   const renderSelectedPremise = () => {
//     // console.log(`renderSelectedPremise ---running`);
//     const selectedPremise = geoState?.selectedPremise;
//     const centroid = selectedPremise?.geometry?.centroid;
//     // console.log(`renderSelectedPremise ---centroid`, centroid);

//     if (!selectedPremise?.id || !centroid || centroid?.length < 2) return null;

//     // 🏗️ ADDRESS CONSTRUCTION
//     const addr = selectedPremise?.address;
//     // console.log(`renderSelectedPremise ---addr`, addr);
//     const erfNo = selectedPremise?.erfNo;
//     const premiseId = selectedPremise?.id;
//     const adrLn1 = addr
//       ? `${addr?.strNo || ""} ${addr?.strName}`?.trim()
//       : "NO ADR";
//     // console.log(`renderSelectedPremise ---adrLn1`, adrLn1);
//     const adrLn2 = addr ? ` ${addr?.strType || ""}`?.trim() : "NO ADR";
//     // console.log(`renderSelectedPremise ---adrLn2`, adrLn2);

//     return (
//       <SelectedPremise
//         coordinate={{
//           latitude: centroid[0],
//           longitude: centroid[1],
//         }}
//         erfNo={erfNo}
//         adrLn1={adrLn1}
//         adrLn2={adrLn2}
//         premiseId={premiseId}
//       />
//     );
//   };

//   const renderAssetMarker = () => {
//     const selectedMeter = geoState?.selectedMeter;
//     const verifiedGps = selectedMeter?.ast?.location?.gps;

//     if (!verifiedGps?.lat) return null;

//     const isWater = selectedMeter?.meterType === "water";
//     const meterNo = selectedMeter?.ast?.astData?.astNo || "NO ID";
//     const premAdr = selectedMeter?.accessData?.premise?.address || "N/Av";
//     const shortAdr = cutLastWord(premAdr)?.trim();
//     const erfNo = selectedMeter?.accessData?.erfNo || "N/Av";
//     console.log(`renderAssetMarker  -- METER on erfNo: `, erfNo);

//     return (
//       <SelecteMeter
//         isWater={isWater}
//         meterNo={meterNo}
//         coordinates={{
//           latitude: verifiedGps?.lat,
//           longitude: verifiedGps?.lng,
//         }}
//         shortAdr={shortAdr}
//         erfNo={erfNo}
//       />
//     );
//   };

//   const renderErfsNeighborhood = () => {
//     // 🛡️ v0.5 RULE: Guard the viewport and zoom floor
//     if (!showLayers?.erfs || !region || zoom < 17) return null;

//     const erfList = all?.erfs || [];
//     const selectedId = geoState?.selectedErf?.id;

//     const latMin = region?.latitude - region?.latitudeDelta / 2;
//     const latMax = region?.latitude + region?.latitudeDelta / 2;
//     const lngMin = region?.longitude - region?.longitudeDelta / 2;
//     const lngMax = region?.longitude + region?.longitudeDelta / 2;

//     const isLevel1 = zoom >= 18; // Labels + Boundaries
//     const isLevel2 = zoom === 17; // Dots Only

//     return erfList
//       .filter((erf) => {
//         if (erf?.id === selectedId) return false;

//         const heavyEntry = all?.geoLibrary?.[erf?.id];
//         const rawCentroid = heavyEntry?.centroid;

//         // 🎯 FLEXIBLE CENTROID: Handle both {lat, lng} and [lat, lng]
//         const cLat =
//           rawCentroid?.lat ||
//           (Array.isArray(rawCentroid) ? rawCentroid[0] : null);
//         const cLng =
//           rawCentroid?.lng ||
//           (Array.isArray(rawCentroid) ? rawCentroid[1] : null);

//         if (!cLat || !cLng) return false;

//         return (
//           cLat >= latMin && cLat <= latMax && cLng >= lngMin && cLng <= lngMax
//         );
//       })
//       .map((erf) => {
//         const heavyEntry = all?.geoLibrary?.[erf?.id];
//         const borderCoords = getSafeCoords(heavyEntry?.geometry);
//         const rawCentroid = heavyEntry?.centroid;

//         const cLat =
//           rawCentroid?.lat ||
//           (Array.isArray(rawCentroid) ? rawCentroid[0] : null);
//         const cLng =
//           rawCentroid?.lng ||
//           (Array.isArray(rawCentroid) ? rawCentroid[1] : null);

//         // 🎯 DATA RECOVERY: Force a fallback string so the box is never empty
//         const displayErfNo =
//           erf?.erfNo || heavyEntry?.properties?.erfNo || "N/A";

//         return (
//           <React.Fragment key={`nb-erf-${erf?.id}`}>
//             {/* 🏛️ BOUNDARY LAYER: Stays simple */}
//             {isLevel1 && borderCoords?.length > 3 && (
//               <Polygon
//                 coordinates={borderCoords}
//                 strokeColor="#94a3b8"
//                 fillColor="transparent"
//                 strokeWidth={0.5}
//                 zIndex={900}
//               />
//             )}

//             {/* 📍 MARKER LAYER: The Stabilized Version */}

//             <Marker
//               key={`nb-erf-${erf?.id}`} // 🎯 Ensure the key is on the Marker
//               coordinate={{ latitude: cLat, longitude: cLng }}
//               anchor={{ x: 0.5, y: 0.5 }} // Centered for better hit detection
//               zIndex={1000}
//               tracksViewChanges={zoom === 17 || zoom >= 18}
//               /* 🚀 THE NATIVE FIX: Move logic from TouchableOpacity to Marker onPress */

//               /* 🚀 THE NATIVE FIX: Standardized Double-Tap Drill-down */
//               onPress={(e) => {
//                 // 🛡️ Prevent the map from handling this as a generic map tap
//                 e?.stopPropagation();

//                 if (isLevel1) {
//                   // 1. Find the Parent Ward for this neighborhood Erf
//                   const parentWardId = erf?.admin?.ward?.id;
//                   const parentWard = all?.wards?.find(
//                     (w) => w.id === parentWardId,
//                   );

//                   // 🎯 TAP 1: The Sovereign (Ward)
//                   // Re-anchors the view to the ward level
//                   updateGeo({
//                     selectedWard: parentWard || null,
//                     lastSelectionType: "WARD",
//                   });

//                   // 🎯 TAP 2: The Target (Erf)
//                   // Places the selection on the specific Erf
//                   updateGeo({
//                     selectedErf: erf,
//                     lastSelectionType: "ERF",
//                   });

//                   // 🎯 2. Launch the Screen
//                   router.push(`/erfs/${erf?.id}`);
//                 }
//               }}
//             >
//               {/* 🏛️ VIEW ONLY: No Touchable here, just the visual representation */}
//               {isLevel1 ? (
//                 <View style={styles.neighborhoodLabel}>
//                   <Text style={styles.neighborhoodLabelText}>
//                     {displayErfNo}
//                   </Text>
//                 </View>
//               ) : (
//                 <View style={styles.neighborhoodDot} />
//               )}
//             </Marker>
//           </React.Fragment>
//         );
//       });
//   };

//   const renderAssetLink = () => {
//     const selectedMeter = geoState?.selectedMeter;
//     const selectedPremise = geoState?.selectedPremise;

//     // 🛡️ NATIVE GUARD 1: Ensure both objects exist
//     if (!selectedMeter?.id || !selectedPremise?.id) return null;

//     // 🔍 FORENSIC LINK CHECK:
//     // Does this specific meter actually serve this specific premise?
//     const meterLinkedPremiseId = selectedMeter?.accessData?.premise?.id;
//     const isVerifiedLink = meterLinkedPremiseId === selectedPremise?.id;

//     if (!isVerifiedLink) {
//       // console.log(
//       //   `📡 AssetLink Blocked: Meter ${selectedMeter.id} is not linked to Premise ${selectedPremise.id}`,
//       // );
//       return null;
//     }

//     const meterGps = selectedMeter?.ast?.location?.gps;
//     const premiseCentroid = selectedPremise?.geometry?.centroid;

//     // 🛡️ NATIVE GUARD 2: Coordinate existence
//     if (!meterGps?.lat || !premiseCentroid || premiseCentroid.length < 2)
//       return null;

//     const pLat = premiseCentroid[0]; // 🎯 Respecting your working standard [0] = Lat
//     const pLng = premiseCentroid[1];

//     // 📏 Midpoint for the Distance Label
//     const midLat = (meterGps?.lat + pLat) / 2;
//     const midLng = (meterGps?.lng + pLng) / 2;

//     return (
//       <>
//         {/* 🏁 THE VERIFIED UMBILICAL */}
//         <Polyline
//           key={`link-${selectedMeter?.id}-${selectedPremise?.id}`}
//           coordinates={[
//             { latitude: meterGps?.lat, longitude: meterGps?.lng },
//             { latitude: pLat, longitude: pLng },
//           ]}
//           strokeColor="#3b82f6"
//           strokeWidth={3}
//           lineDashPattern={[5, 5]}
//           zIndex={1200}
//         />

//         {/* 🏷️ THE TACTICAL DISTANCE LABEL */}
//         <Marker
//           coordinate={{ latitude: midLat, longitude: midLng }}
//           anchor={{ x: 0.5, y: 0.5 }}
//           tracksViewChanges={false}
//         >
//           <View style={styles.distanceBadge}>
//             <MaterialCommunityIcons
//               name="link-variant"
//               size={10}
//               color="white"
//             />
//             <Text style={styles.distanceText}>SERVICE LINK</Text>
//           </View>
//         </Marker>
//       </>
//     );
//   };

//   const LayerControl = () => (
//     <View style={styles.layerControl}>
//       <TouchableOpacity
//         style={[styles.layerBtn, showLayers?.erfs && styles.layerBtnActive]}
//         onPress={() =>
//           setShowLayers((prev) => ({ ...prev, erfs: !prev?.erfs }))
//         }
//       >
//         <MaterialCommunityIcons
//           name="layers-outline"
//           size={20}
//           color={showLayers?.erfs ? "#fff" : "#64748b"}
//         />
//       </TouchableOpacity>

//       <TouchableOpacity
//         style={[styles.layerBtn, showLayers?.premises && styles.layerBtnActive]}
//         onPress={() =>
//           setShowLayers((prev) => ({ ...prev, premises: !prev?.premises }))
//         }
//       >
//         <MaterialCommunityIcons
//           name="home-outline"
//           size={20}
//           color={showLayers?.premises ? "#fff" : "#64748b"}
//         />
//       </TouchableOpacity>

//       <TouchableOpacity
//         style={[styles.layerBtn, showLayers?.asts && styles.layerBtnActive]}
//         onPress={() =>
//           setShowLayers((prev) => ({ ...prev, asts: !prev?.asts }))
//         }
//       >
//         <MaterialCommunityIcons
//           name="lightning-bolt-outline"
//           size={20}
//           color={showLayers?.asts ? "#fff" : "#64748b"}
//         />
//       </TouchableOpacity>
//       {/* --- 🛰️ DIAGNOSTIC RADAR --- */}
//       <View style={styles.zoomDisplay}>
//         <Text style={styles.zoomText}>{zoom}</Text>
//         <Text style={styles.zoomLabel}>ZOOM</Text>
//       </View>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <View style={styles.hudOverlay}>
//         <GeoStatusHUD />
//       </View>
//       <MapView
//         ref={mapRef}
//         provider={PROVIDER_GOOGLE}
//         style={styles.map}
//         initialRegion={initialRegion} // 🚀 BOOM: App starts here
//         onRegionChangeComplete={handleRegionChange} // 🎯 For Step 3 (Zoom)
//         showsUserLocation={true} // 🔵 The Blue Dot
//         followsUserLocation={false} // 🛡️ Keep 'false' so the user stays in manual control
//         showsMyLocationButton={false} // 🛡️ We use our custom "ME" button instead
//       >
//         {/* 🏛️ The Cascading Visual Layers */}
//         {renderLM() /* Level 0 */}
//         {renderWards() /* Level 1 */}
//         {renderSelectedErf() /* Level 2 - Selection */}
//         {renderAssetLink()}
//         {renderSelectedPremise()}
//         {renderErfsNeighborhood() /* Level 3 - Step 3 coming next*/}
//         {renderAssetMarker()}
//       </MapView>
//       <View style={styles.gcsOverlay}>
//         <GeoCascadingSelector />
//       </View>
//       <LayerControl />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   map: {
//     ...StyleSheet.absoluteFillObject, // 🎯 This makes the map the background
//     flex: 1,
//   },
//   hudOverlay: {
//     position: "absolute",
//     top: 0, // Adjust based on your status bar height
//     left: 0,
//     right: 0,
//     zIndex: 100, // 🛰️ Force it above the Map
//     elevation: 10,
//     // paddingHorizontal: 5,
//   },
//   gcsOverlay: {
//     position: "absolute", // 🎯 This pulls the GCS out of the flex flow
//     bottom: 30, // 🎯 Anchors it to the bottom
//     left: 10,
//     right: 10,
//     // On Android, the Map is very "greedy" with touches.
//     // We must give the overlay a zIndex and Elevation to stay on top.
//     zIndex: 10,
//     elevation: 10,
//   },
//   markerText: {
//     fontSize: 10,
//     // fontWeight: "900",
//     // color: "#1e293b",
//     // marginLeft: 2,
//     backgroundColor: "white",
//   },

//   premiseMarkerContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   // Erf Marker
//   markerContainer: {
//     // borderRadius: 15,
//     // backgroundColor: "#507adc",
//     // borderWidth: 2,
//     // borderColor: "#ffffff",
//     // // alignItems: "center",
//     // // justifyContent: "center",
//     // shadowColor: "#622ea1",
//     // // shadowOffset: { width: 0, height: 2 },
//     // shadowOpacity: 0.5,
//     // shadowRadius: 2,
//     // elevation: 6,
//   },
//   markerPill: {
//     // borderRadius: 15,
//     // backgroundColor: "#507adc",
//     // borderWidth: 2,
//     borderColor: "#ffffff",
//     // alignItems: "center",
//     // justifyContent: "center",
//     shadowColor: "#622ea1",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.5,
//     shadowRadius: 2,
//     elevation: 6,
//   },

//   // Premise Marker
//   premiseCircle: {
//     // width: 60,
//     // height: 60,
//     borderRadius: 15,
//     backgroundColor: "#507adc",
//     borderWidth: 2,
//     borderColor: "#ffffff",
//     // alignItems: "center",
//     // justifyContent: "center",
//     shadowColor: "#622ea1",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.5,
//     shadowRadius: 2,
//     elevation: 6,
//   },
//   premiseLabel: {
//     backgroundColor: "#507adc",
//     paddingHorizontal: 2,
//     paddingVertical: 2,
//     borderRadius: 4,
//     marginTop: 2,
//   },
//   premiseLabelText: {
//     fontSize: 6,
//     fontWeight: "500",
//     color: "#ffffff",
//     // alignSelf: "center",
//     // textTransform: "uppercase",
//   },

//   layerControl: {
//     position: "absolute",
//     top: 80, // 🛰️ Positioned top-right for easy thumb access
//     right: 10,
//     backgroundColor: "rgba(255, 255, 255, 0.9)",
//     borderRadius: 8,
//     padding: 6,
//     elevation: 5,
//     zIndex: 100,
//   },
//   layerBtn: {
//     width: 40,
//     height: 40,
//     justifyContent: "center",
//     alignItems: "center",
//     borderRadius: 6,
//     marginBottom: 4,
//   },
//   layerBtnActive: {
//     backgroundColor: "#2563eb", // iREPS Primary Blue
//   },

//   neighborhoodDot: {
//     width: 7,
//     height: 7,
//     borderRadius: 5,
//     backgroundColor: "#7b8492", // Slate
//     borderWidth: 1.5,
//     borderColor: "white",
//     elevation: 3,
//   },
//   neighborhoodLabel: {
//     backgroundColor: "white",
//     paddingHorizontal: 8, // Increased for better "Tap Target"
//     paddingVertical: 4, // Increased for better "Tap Target"
//     borderRadius: 6,
//     borderWidth: 1,
//     borderColor: "#94a3b8",
//     elevation: 4, // Higher shadow to indicate it's interactive
//   },

//   neighborhoodLabelText: {
//     fontSize: 9,
//     fontWeight: "400", // Heavy weight for readability
//     color: "#1e293b", // Deep Navy
//   },
//   zoomDisplay: {
//     marginTop: 10,
//     backgroundColor: "rgba(15, 23, 42, 0.9)", // Deep Slate
//     borderRadius: 8,
//     paddingVertical: 6,
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 1,
//     borderColor: "rgba(255, 255, 255, 0.1)",
//     minWidth: 44,
//   },
//   zoomText: {
//     color: "#4CD964", // Sovereign Green
//     fontSize: 14,
//     fontWeight: "900",
//     fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
//   },
//   zoomLabel: {
//     color: "#94a3b8",
//     fontSize: 7,
//     fontWeight: "800",
//     marginTop: -2,
//   },
// });
