// components/maps/MapContainer.js
import { useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { useGeo } from "../../src/context/GeoContext";
import BaseMap from "./BaseMap";
import BoundaryLayer from "./BoundaryLayer";
import MapCameraController from "./MapCameraController";

export default function MapContainer({ wards, erfs, cameraRequestId }) {
  const mapRef = useRef(null);
  const { geoState } = useGeo();

  const memoizedErfs = useMemo(() => erfs, [erfs.length]);

  // Pulling truth directly from context
  const { lmId, wardId, id, selectedErf } = geoState;

  // Find objects locally from the lists passed in
  const activeLm = useMemo(() => ({ id: lmId }), [lmId]); // Simplified LM object
  const activeWard = useMemo(
    () => wards.find((w) => w.id === wardId),
    [wards, wardId]
  );

  const [zoom, setZoom] = useState(0);
  const [region, setRegion] = useState(null);

  const onRegionChangeComplete = (newRegion) => {
    setRegion(newRegion);
    const calcZoom = Math.round(Math.log2(360 / newRegion.longitudeDelta));
    setZoom(calcZoom);
  };

  return (
    <View style={{ flex: 1 }}>
      <BaseMap mapRef={mapRef} onRegionChangeComplete={onRegionChangeComplete}>
        {lmId && (
          <BoundaryLayer
            wards={wards}
            allErfs={memoizedErfs}
            currentRegion={region}
            currentZoom={zoom}
          />
        )}
      </BaseMap>

      <MapCameraController
        mapRef={mapRef}
        lm={activeLm}
        selectedWard={activeWard}
        erf={selectedErf}
        cameraRequestId={cameraRequestId}
      />
    </View>
  );
}
