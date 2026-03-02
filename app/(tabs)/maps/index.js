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
import NeighbourhoodPremiseMarker from "../../../components/maps/NeighbourhoodPremiseMarker";
import SelectedErf from "../../../components/maps/SelectedErf"; // ⬅️ Restored
import SelecteMeter from "../../../components/maps/SelectedMeter"; // ⬅️ Restored
import SelectedPremise from "../../../components/maps/SelectedPremise"; // ⬅️ Restored
import { useDiscovery } from "../../../src/context/DiscoveryContext";
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
    return targetBBox
      ? bboxToRegion(targetBBox)
      : {
          latitude: -34.035,
          longitude: 23.0483,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        };
  }, [geoState?.selectedLm?.bbox, activeWorkbase?.bbox]);

  const wardsList = all?.wards || [];
  const [region, setRegion] = useState(null);
  // console.log(`region`, region);
  const [zoom, setZoom] = useState(10);

  const [showLayers, setShowLayers] = useState({
    erfs: true,
    premises: true,
    asts: true,
    sc: true,
  });

  const handleRegionChange = (newRegion) => {
    const currentZoom = Math.round(Math.log2(360 / newRegion?.longitudeDelta));
    setZoom(currentZoom);
    setRegion(newRegion);
  };

  // 🚀 THE PILOT EFFECT: Handles all "Flights" across the LM
  useEffect(() => {
    const signal = geoState?.flightSignal;
    if (!signal || signal === lastSignalRef.current) return;

    const {
      lastSelectionType,
      selectedLm,
      selectedWard,
      selectedErf,
      selectedPremise,
      selectedMeter,
    } = geoState;

    // 🛡️ RESET SAFE-GUARD:
    // If wipe/reset cleared selections, do NOT fly.
    if (!lastSelectionType) {
      lastSignalRef.current = signal; // consume the signal so we don't loop
      return;
    }

    console.log(
      `🚀 [PILOT]: Command Received: ${lastSelectionType} | Signal: ${signal}`,
    );

    switch (lastSelectionType) {
      case "LM": {
        if (selectedLm?.bbox) flyTo(selectedLm.bbox);
        break;
      }

      case "WARD": {
        if (selectedWard?.bbox) flyTo(selectedWard.bbox);
        break;
      }

      case "ERF": {
        const erfGeo = all?.geoLibrary?.[selectedErf?.id];
        if (erfGeo?.bbox) flyTo(erfGeo.bbox, 90);
        break;
      }

      case "PREMISE": {
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
      }

      case "METER": {
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
      }

      default:
        break;
    }

    lastSignalRef.current = signal;
  }, [geoState?.flightSignal, all?.geoLibrary, flyTo, mapRef]);

  const renderLM = () => {
    // 🏛️ Ensure we have a Target ID
    const lmId = geoState?.selectedLm?.id || activeWorkbase?.id;
    if (!lmId) return null;

    // 🏛️ Look in the Warehouse GeoLibrary
    const lmEntry = all?.geoLibrary?.[lmId];

    // 🕵️ FORENSIC SEARCH: Where is the geometry hiding?
    // We check:
    // 1. lmEntry.geometry.coordinates (Parsed)
    // 2. lmEntry.coordinates (Direct)
    // 3. lmEntry.geometry (Raw)
    const targetGeo =
      lmEntry?.geometry?.coordinates ||
      lmEntry?.coordinates ||
      lmEntry?.geometry ||
      lmEntry;

    const lmCoords = getSafeCoords(targetGeo);

    if (!lmCoords || lmCoords.length < 3) {
      // If still failing, check the direct objects as a last resort
      const fallbackGeo =
        geoState?.selectedLm?.geometry || activeWorkbase?.geometry;
      const fallbackCoords = getSafeCoords(fallbackGeo);
      if (fallbackCoords?.length < 3) return null;

      return (
        <Polygon
          coordinates={fallbackCoords}
          strokeColor="#0f172a"
          fillColor="transparent"
          strokeWidth={3}
          zIndex={10}
        />
      );
    }

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

  const RenderPremisesNeighborhood = () => {
    // 🛡️ Guard: Precision zoom (18+) and active layer check
    const { openMissionDiscovery } = useDiscovery();

    if (!showLayers?.premises || !region || zoom < 18) return null;

    const latMin = region.latitude - region.latitudeDelta / 2;
    const latMax = region.latitude + region.latitudeDelta / 2;
    const lngMin = region.longitude - region.longitudeDelta / 2;
    const lngMax = region.longitude + region.longitudeDelta / 2;

    return all?.prems
      ?.filter((prem) => {
        if (prem?.id === geoState?.selectedPremise?.id) return false;

        const centroid = prem?.geometry?.centroid;
        if (!centroid || !Array.isArray(centroid)) return false;

        const pLat = centroid[0];
        const pLng = centroid[1];

        return (
          pLat >= latMin && pLat <= latMax && pLng >= lngMin && pLng <= lngMax
        );
      })
      .map((prem) => {
        const [pLat, pLng] = prem?.geometry?.centroid;

        return (
          <NeighbourhoodPremiseMarker
            key={`nb-prem-${prem?.id}`}
            prem={prem}
            zoom={zoom}
            coordinate={{ latitude: pLat, longitude: pLng }}
            // If you want click-to-select later, enable this:
            onPress={(e) => {
              e?.stopPropagation?.();
              updateGeo({
                selectedPremise: prem,
                lastSelectionType: "PREMISE",
              });
              openMissionDiscovery({
                premiseId: prem?.id,
              });
            }}
            // onLongPress={(e) => {
            //   e?.stopPropagation?.();

            //   updateGeo({
            //     selectedPremise: prem,
            //     lastSelectionType: "PREMISE",
            //   });

            // }}
            showAddressFromZoom={18}
            showTypeFromZoom={18}
          />
        );
      });
  };

  const renderMetersNeighborhood = () => {
    if (!showLayers?.asts || !region || zoom < 18) return null;

    const latMin = region.latitude - region.latitudeDelta / 2;
    const latMax = region.latitude + region.latitudeDelta / 2;
    const lngMin = region.longitude - region.longitudeDelta / 2;
    const lngMax = region.longitude + region.longitudeDelta / 2;

    return all?.meters
      ?.filter((m) => {
        const lat = m?.ast?.location?.gps?.lat;
        const lng = m?.ast?.location?.gps?.lng;
        return (
          lat &&
          lng &&
          lat >= latMin &&
          lat <= latMax &&
          lng >= lngMin &&
          lng <= lngMax
        );
      })
      .map((m) => {
        const coordinate = {
          latitude: m.ast.location.gps.lat,
          longitude: m.ast.location.gps.lng,
        };
        const isWater = m.meterType === "water";
        const isAnomaly =
          !!m.ast?.anomalies?.anomaly && m.ast.anomalies.anomaly !== "N/A";

        return (
          <Marker
            key={`nb-meter-${m.id}`}
            coordinate={coordinate}
            // anchor={{ x: 0.5, y: 0.5 }}
            anchor={{ x: 0.1, y: 0.1 }}
            zIndex={1200}
          >
            <View
              style={[
                styles.meterMarkerCircle,
                {
                  backgroundColor: isWater ? "#3B82F6" : "#EAB308",
                  borderColor: isAnomaly ? "#EF4444" : "#FFFFFF", // Red ring for Bypassed/Illegal
                  borderWidth: isAnomaly ? 2 : 1,
                },
              ]}
            />
          </Marker>
        );
      });
  };

  const renderServiceConnections = () => {
    // 🛡️ Guard: Precision Tactical View (Zoom 18+)
    if (!showLayers?.sc || !region || zoom < 18) return null;

    const latMin = region.latitude - region.latitudeDelta / 2;
    const latMax = region.latitude + region.latitudeDelta / 2;
    const lngMin = region.longitude - region.longitudeDelta / 2;
    const lngMax = region.longitude + region.longitudeDelta / 2;

    return all?.meters
      ?.filter((m) => {
        const mLat = m?.ast?.location?.gps?.lat;
        const mLng = m?.ast?.location?.gps?.lng;

        // 🛰️ Bounding Box Spatial Cull for Meters
        const inView =
          mLat >= latMin && mLat <= latMax && mLng >= lngMin && mLng <= lngMax;

        // Check if there is a valid premise link
        const hasPremiseLink = !!m.accessData?.premise?.id;

        return inView && hasPremiseLink;
      })
      .map((m) => {
        // console.log(`meter`, m);
        // Find the parent premise in the warehouse
        const parentPrem = all?.prems?.find(
          (p) => p.id === m.accessData.premise.id,
        );
        // console.log(`parentPrem`, parentPrem);
        const pCentroid = parentPrem?.geometry?.centroid;

        if (!pCentroid || !Array.isArray(pCentroid)) return null;

        const mLat = m.ast.location.gps.lat;
        const mLng = m.ast.location.gps.lng;
        const pLat = pCentroid[0];
        const pLng = pCentroid[1];

        const isWater = m.meterType === "water";
        const connectionColor = isWater
          ? "rgba(59, 130, 246, 0.6)"
          : "rgba(234, 179, 8, 0.6)";

        return (
          <Polyline
            key={`sc-link-${m.id}`}
            coordinates={[
              { latitude: mLat, longitude: mLng },
              { latitude: pLat, longitude: pLng },
            ]}
            strokeColor={connectionColor}
            strokeWidth={2}
            lineDashPattern={[4, 4]} // 🎯 Dashed to distinguish from physical boundaries
            zIndex={850} // Below markers, above erfs
          />
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
        {RenderPremisesNeighborhood()}
        {renderMetersNeighborhood()}
        {renderServiceConnections()}
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

        <TouchableOpacity
          style={[styles.layerBtn, showLayers.sc && styles.layerBtnActive]}
          onPress={() => setShowLayers((p) => ({ ...p, sc: !p.sc }))}
        >
          <MaterialCommunityIcons
            name="vector-line"
            size={20}
            color={showLayers.sc ? "#fff" : "#64748b"}
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
    // paddingHorizontal: 8,
    // paddingVertical: 4,:
    padding: 8,
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

  premiseSquare: {
    width: 15, // Small and precise
    height: 15,
    backgroundColor: "#3B82F6", // Command Blue
    borderWidth: 1.5,
    borderColor: "#FFFFFF", // White border for visibility against any map background
    borderRadius: 1, // Sharp corners for a technical feel
    elevation: 2,
  },
  // meterMarkerCircle: {
  //   width: 8,
  //   height: 8,
  //   borderRadius: 4, // ⚪ Circle vs 🟦 Square
  //   borderWidth: 1,
  //   borderColor: '#FFFFFF',
  //   elevation: 6,
  // },
  meterMarkerCircle: {
    width: 10,
    height: 10,
    borderRadius: 4, // Perfect Circle
    borderWidth: 1,
    borderColor: "#FFFFFF",
    elevation: 5, // Highest elevation
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 1,
  },
});
