import { useRef } from "react";
import { View } from "react-native";

import BaseMap from "./BaseMap";
import BoundaryLayer from "./BoundaryLayer";
import MapCameraController from "./MapCameraController";

export default function MapContainer({ lm, town, ward, erf }) {
  const mapRef = useRef(null);

  return (
    <View style={{ flex: 1 }}>
      <BaseMap mapRef={mapRef}>
        <BoundaryLayer lm={lm} town={town} ward={ward} erf={erf} />

        <MapCameraController
          mapRef={mapRef}
          lm={lm}
          town={town}
          ward={ward}
          erf={erf}
        />
      </BaseMap>
    </View>
  );
}
