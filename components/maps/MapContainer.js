// MapContainer.js
import { useRef } from "react";
import { StyleSheet, View } from "react-native";
import BaseMap from "./BaseMap";
import BoundaryLayer from "./BoundaryLayer";
import MapCameraController from "./MapCameraController";

export default function MapContainer({ lm, ward, wards }) {
  const mapRef = useRef(null);

  return (
    <View style={styles.container}>
      <BaseMap mapRef={mapRef}>
        {lm && (
          <BoundaryLayer
            lm={lm}
            wards={wards} // ✅ now defined
            selectedWard={ward} // ✅ now defined
          />
        )}
      </BaseMap>

      <MapCameraController mapRef={mapRef} lm={lm} ward={ward} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
