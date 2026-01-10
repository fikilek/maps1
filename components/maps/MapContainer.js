// components/maps/MapContainer.js
import { useRef, useState } from "react";
import { View } from "react-native";
import BaseMap from "./BaseMap";
import BoundaryLayer from "./BoundaryLayer";
import MapCameraController from "./MapCameraController";

export default function MapContainer({
  lm,
  selectedWard,
  wards,
  erfs,
  selectedErf,
  cameraRequestId,
}) {
  const mapRef = useRef(null);

  // Inside MapContainer.js
  const [zoom, setZoom] = useState(0);
  // console.log(`MapContainer ----zoom`, zoom);

  const [region, setRegion] = useState(null);
  // console.log(`MapContainer ----region`, region);

  const onRegionChangeComplete = (newRegion) => {
    setRegion(newRegion); // Store the full region object (lat, lng, deltas)
    const calcZoom = Math.round(Math.log2(360 / newRegion.longitudeDelta));
    setZoom(calcZoom);
  };

  return (
    <View style={{ flex: 1 }}>
      <BaseMap mapRef={mapRef} onRegionChangeComplete={onRegionChangeComplete}>
        {lm && (
          <BoundaryLayer
            lm={lm}
            selectedWard={selectedWard}
            selectedErf={selectedErf}
            wards={wards}
            allErfs={erfs} // Pass the full list of 700+ ERFs
            currentRegion={region}
            currentZoom={zoom}
          />
        )}
        {/* <ErfLayer erfs={erfs} selectedErf={selectedErf} /> */}
      </BaseMap>

      <MapCameraController
        mapRef={mapRef}
        lm={lm}
        selectedWard={selectedWard}
        erf={selectedErf}
        cameraRequestId={cameraRequestId}
      />
    </View>
  );
}
