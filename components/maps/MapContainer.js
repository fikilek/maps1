// MapContainer.js
import { useRef } from "react";
import { StyleSheet, View } from "react-native";
import BaseMap from "./BaseMap";
import BoundaryLayer from "./BoundaryLayer";
import MapCameraController from "./MapCameraController";

export default function MapContainer({ lm, town, ward }) {
  const mapRef = useRef(null);

  return (
    <View style={styles.container}>
      <BaseMap mapRef={mapRef}>{lm && <BoundaryLayer lm={lm} />}</BaseMap>

      {/* CONTROLLERS LIVE OUTSIDE MAPVIEW */}
      <MapCameraController mapRef={mapRef} lm={lm} town={town} ward={ward} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
