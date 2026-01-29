import { useEffect } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from "react-native-maps";

// 🎯 Context & Utilities
import { MaterialCommunityIcons } from "@expo/vector-icons";
import GeoCascadingSelector from "../../../components/maps/GeoCascadingSelector";
import { useGeo } from "../../../src/context/GeoContext";
import { getSafeCoords, useMap } from "../../../src/context/MapContext"; // 🚀 New
import { useWarehouse } from "../../../src/context/WarehouseContext";

const { width } = Dimensions.get("window");

export default function SovereignMap() {
  const { mapRef, flyTo } = useMap();
  const { geoState } = useGeo();
  const { all } = useWarehouse();

  // 🛡️ Guard the list: Ensure it's the list of objects from the warehouse
  const wardsList = all?.wards || [];
  const lmId = geoState?.selectedLm?.id;
  const selectedErf = geoState?.selectedErf;
  const lmEntry = all?.geoLibrary?.[lmId];
  const geometry = lmEntry?.geometry || lmEntry;
  const safeCoords = getSafeCoords(geometry);

  useEffect(() => {
    if (safeCoords.length > 0) flyTo(safeCoords);
  }, [lmId, safeCoords.length]);

  useEffect(() => {
    // 🛡️ 1. ID Guard: Ensure we have a target
    const targetId = selectedErf?.id;
    console.log(`SovereignMap----targetId`, targetId);

    if (!targetId) return;

    console.log(
      `✈️ Pilot: Target Locked: ERF ${selectedErf.erfNo || targetId}`,
    );

    // 🎯 2. THE VAULT LOOKUP: Fetch the "Heavy" GeoData from RAM
    // This is the geoEntries we just refined in the API endpoint
    const heavyGeo = all?.geoLibrary?.[targetId] || all?.geoEntries?.[targetId];
    // console.log(`SovereignMap----heavyGeo`, heavyGeo);

    if (!heavyGeo || !heavyGeo.geometry) {
      console.warn(
        "⚠️ Pilot: No geometry found in RAM Vault for this ID. Staying grounded.",
      );
      return;
    }

    // 🛡️ 3. Safe Extraction
    const coords = getSafeCoords(heavyGeo.geometry);
    // console.log(`SovereignMap----coords`, coords);

    // 🛡️ 4. THE NATIVE FIREWALL: Never fly to an empty list
    if (coords && coords.length > 0) {
      console.log(`SovereignMap----ABOUT TO FLY ----coords`, coords);

      flyTo(coords, 30); // High-altitude flight with 70px padding
    } else {
      console.error(
        "❌ Pilot: Failed to extract valid coordinates from Geo-Vault.",
      );
    }
  }, [selectedErf?.id]); // 🎯 Trigger only when the ID changes

  const renderLM = () => {
    const lmId = geoState?.selectedLm?.id;
    if (!lmId) return null;

    // 🎯 Reach into the library for the LM's "Heavy" geometry
    const lmEntry = all?.geoLibrary?.[lmId];
    const lmCoords = getSafeCoords(lmEntry?.geometry || lmEntry);

    // 🛡️ Native Guard: Polygons need 3 points
    if (lmCoords.length < 3) return null;

    return (
      <Polygon
        key={`lm-boundary-${lmId}`}
        coordinates={lmCoords}
        strokeColor="#0f172a" // 🌑 Deep Navy/Black for the "Containment" border
        fillColor="transparent"
        strokeWidth={3}
        zIndex={10} // Base layer
      />
    );
  };

  const renderWards = () => {
    // 🛡️ Ensure we only map over actual objects
    return wardsList.map((ward, index) => {
      if (typeof ward !== "object" || !ward?.geometry) return null;

      const wardCoords = getSafeCoords(ward?.geometry);
      if (wardCoords.length < 3) return null;

      // 🛡️ Safe Selection Logic (compare primitives only)
      const isSelected =
        (geoState?.selectedWard?.id &&
          ward?.id &&
          geoState?.selectedWard?.id === ward?.id) ||
        geoState?.selectedWard?.name === ward.name;

      return (
        <Polygon
          // 🛡️ Key must be a string
          key={`ward-poly-${ward.id || index}`}
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

    // 🎯 THE VAULT LOOKUP: Fetch the Heavy GeoData
    const heavyEntry =
      all?.geoLibrary?.[selectedId] || all?.geoEntries?.[selectedId];

    const borderCoords = getSafeCoords(heavyEntry?.geometry);
    const centroid = heavyEntry?.centroid;

    // 🛡️ NATIVE FIREWALL: Guard both the Polygon and the Marker
    if (borderCoords.length < 3 || !centroid?.lat || !centroid?.lng)
      return null;

    return (
      <>
        {/* 🏛️ THE SOVEREIGN BORDER */}
        <Polygon
          key={`sovereign-border-${selectedId}`}
          coordinates={borderCoords}
          strokeColor="#FFD700" // 🟡 Sovereign Gold
          fillColor="rgba(255, 215, 0, 0.15)"
          strokeWidth={4}
          zIndex={1000}
        />

        {/* 📍 THE COMMAND PIN */}
        <Marker
          key={`sovereign-marker-${selectedId}`}
          coordinate={{
            latitude: centroid.lat,
            longitude: centroid.lng,
          }}
          // 🎯 Identifying the Erf clearly
          title={`ERF ${geoState.selectedErf.erfNo || "N/A"}`}
          description={heavyEntry?.address || "Selected Target"}
          zIndex={1001} // Stay above the border
        >
          {/* 🎨 Custom Icon & Label (Optional) */}
          <View style={styles.markerContainer}>
            <View style={styles.markerPill}>
              <MaterialCommunityIcons
                name="map-marker"
                size={34}
                color="#0004ff"
              />
              <Text style={styles.markerText}>
                {geoState.selectedErf.erfNo}
              </Text>
            </View>
          </View>
        </Marker>
      </>
    );
  };

  const renderAssetMarker = () => {
    const selectedMeter = geoState?.selectedMeter;
    const verifiedGps = selectedMeter?.ast?.location?.gps;

    if (!verifiedGps?.lat) return null;

    const isWater = selectedMeter.meterType === "water";
    const meterNo = selectedMeter?.ast?.astData?.astNo || "NO ID";

    return (
      <Marker
        key={`ast-label-${selectedMeter.id}`}
        coordinate={{
          latitude: verifiedGps.lat,
          longitude: verifiedGps.lng,
        }}
        // 🎯 Anchor to the center of our custom label
        // anchor={{ x: 0.5, y: 0.5 }}
        zIndex={2000}
      >
        <View style={styles.meterMarkerContainer}>
          {/* 🏛️ THE SOVEREIGN LABEL PILL */}
          <View
            style={[
              styles.meterMarkerPill,
              { borderColor: isWater ? "#3B82F6" : "#EAB308" },
            ]}
          >
            <MaterialCommunityIcons
              name={isWater ? "water" : "lightning-bolt"}
              size={16}
              color={isWater ? "#3B82F6" : "#EAB308"}
            />
            <Text style={styles.meterMarkerText}>{meterNo}</Text>
          </View>

          {/* 🎯 THE PRECISION CROSSHAIR (Optional - for that Pro look)
          <View
            style={[
              styles.meterDot,
              { backgroundColor: isWater ? "#3B82F6" : "#EAB308" },
            ]}
          /> */}
        </View>
      </Marker>
    );
  };
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        // onRegionChangeComplete={handleRegionChange} // 🎯 For Step 3 (Zoom)
        showsUserLocation={true} // 🔵 The Blue Dot
        followsUserLocation={false} // 🛡️ Keep 'false' so the user stays in manual control
        showsMyLocationButton={false} // 🛡️ We use our custom "ME" button instead
      >
        {/* 🏛️ The Cascading Visual Layers */}
        {renderLM() /* Level 0 */}
        {renderWards() /* Level 1 */}
        {renderSelectedErf() /* Level 2 - Selection */}
        {/* {renderNeighborhood() /* Level 3 - Step 3 coming next */}
        {renderAssetMarker()}
      </MapView>

      <View style={styles.gcsOverlay}>
        <GeoCascadingSelector />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject, // 🎯 This makes the map the background
  },
  gcsOverlay: {
    position: "absolute", // 🎯 This pulls the GCS out of the flex flow
    bottom: 30, // 🎯 Anchors it to the bottom
    left: 10,
    right: 10,
    // On Android, the Map is very "greedy" with touches.
    // We must give the overlay a zIndex and Elevation to stay on top.
    zIndex: 10,
    elevation: 10,
  },
  markerText: {
    fontSize: 14,
    // fontWeight: "900",
    color: "#1e293b",
    // marginLeft: 2,
    backgroundColor: "white",
  },
});
