import { useEffect } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from "react-native-maps";

// 🎯 Context & Utilities
import { MaterialCommunityIcons } from "@expo/vector-icons";
import GeoCascadingSelector from "../../../components/maps/GeoCascadingSelector";
import SelectedErf from "../../../components/maps/SelectedErf";
import { useGeo } from "../../../src/context/GeoContext";
import { getSafeCoords, useMap } from "../../../src/context/MapContext"; // 🚀 New
import { useWarehouse } from "../../../src/context/WarehouseContext";

const { width } = Dimensions.get("window");

export default function SovereignMap() {
  console.log(`SovereignMap ---mounted`);
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

  // 🏛️ Consolidated Sovereign Pilot
  useEffect(() => {
    // 🛡️ 1. NATIVE GUARD: Ensure the map hardware is actually ready
    if (!mapRef.current) return;

    // 🎯 2. PRIORITY 1: The Erf (Tactical Zoom)
    if (selectedErf?.id) {
      const heavyGeo =
        all?.geoLibrary?.[selectedErf.id] || all?.geoEntries?.[selectedErf.id];
      const erfCoords = getSafeCoords(heavyGeo?.geometry);

      if (erfCoords.length > 0) {
        console.log(
          `✈️ Pilot: Flying to Tactical Target (ERF ${selectedErf.erfNo})`,
        );
        flyTo(erfCoords, 100); // Low altitude
        return; // Exit here; Erf takes precedence over LM
      }
    }

    // 🌍 3. PRIORITY 2: The Local Municipality (Strategic Zoom)
    if (lmId && safeCoords.length > 0) {
      console.log(`🌍 Pilot: Flying to Strategic Boundary (LM ${lmId})`);
      flyTo(safeCoords, 100); // High altitude
    }
  }, [lmId, selectedErf?.id, safeCoords.length, !!mapRef.current]);
  // 🎯 Note: We watch safeCoords.length and the existence of the ref

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

    console.log(`renderSelectedErf ---selectedErf`, selectedErf);

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
        <SelectedErf
          coordinate={{
            latitude: centroid.lat,
            longitude: centroid.lng,
          }}
          erfNo={geoState.selectedErf.erfNo}
        />

        {/* <CustomErf
          gps={{
            latitude: centroid.lat,
            longitude: centroid.lng,
          }}
          text={`ERF ${geoState.selectedErf.erfNo}`}
          color="#3B82F6" // 🎯 FORCING BLUE HERE
        /> */}
      </>
    );
  };

  const renderSelectedPremise = () => {
    console.log(`renderSelectedPremise ---running`);
    const selectedPremise = geoState?.selectedPremise;
    const centroid = selectedPremise?.geometry?.centroid;

    if (!selectedPremise?.id || !centroid || centroid.length < 2) return null;

    // 🏗️ ADDRESS CONSTRUCTION
    const addr = selectedPremise.address;
    const erfNo = selectedPremise.erfNo;
    const adrLn1 = addr
      ? `${addr.strNo || ""} ${addr.strName}`.trim()
      : "NO ADR";
    const adrLn2 = addr ? ` ${addr.strType || ""}`.trim() : "NO ADR";

    return (
      <Marker
        key={`premise-marker-${selectedPremise.id}`}
        coordinate={{
          latitude: centroid[0],
          longitude: centroid[1],
        }}
        // 🎯 Anchor to the center-bottom
        anchor={{ x: 0.5, y: 1 }}
        zIndex={1500}
        tracksViewChanges={false}
      >
        <View style={styles.premiseMarkerContainer}>
          {/* 🔘 THE SOVEREIGN CIRCLE */}
          <View style={styles.premiseCircle}>
            <MaterialCommunityIcons
              name="home-variant" // 🏠 Cleaner, less "noisy" icon
              size={22}
              color="#ffffff"
            />
          </View>

          {/* 🏷️ THE FLOATING LABEL (Below the circle) */}
          <View style={styles.premiseLabel}>
            <Text style={styles.premiseLabelText}>Erf:{erfNo}</Text>
            <Text style={styles.premiseLabelText}>{`${adrLn1} ${adrLn2}`}</Text>
          </View>
        </View>
      </Marker>
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
        {renderSelectedPremise()}
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
    fontSize: 10,
    // fontWeight: "900",
    // color: "#1e293b",
    // marginLeft: 2,
    backgroundColor: "white",
  },

  premiseMarkerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  // Erf Marker
  markerContainer: {
    // borderRadius: 15,
    // backgroundColor: "#507adc",
    // borderWidth: 2,
    // borderColor: "#ffffff",
    // // alignItems: "center",
    // // justifyContent: "center",
    // shadowColor: "#622ea1",
    // // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.5,
    // shadowRadius: 2,
    // elevation: 6,
  },
  markerPill: {
    // borderRadius: 15,
    // backgroundColor: "#507adc",
    // borderWidth: 2,
    borderColor: "#ffffff",
    // alignItems: "center",
    // justifyContent: "center",
    shadowColor: "#622ea1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 6,
  },

  // Premise Marker
  premiseCircle: {
    // width: 60,
    // height: 60,
    borderRadius: 15,
    backgroundColor: "#507adc",
    borderWidth: 2,
    borderColor: "#ffffff",
    // alignItems: "center",
    // justifyContent: "center",
    shadowColor: "#622ea1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 6,
  },
  premiseLabel: {
    backgroundColor: "#507adc",
    paddingHorizontal: 2,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  premiseLabelText: {
    fontSize: 6,
    fontWeight: "500",
    color: "#ffffff",
    // alignSelf: "center",
    // textTransform: "uppercase",
  },
});
