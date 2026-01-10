import { useEffect } from "react";

export default function MapCameraController({
  mapRef,
  lm,
  selectedWard,
  erf,
  cameraRequestId,
}) {
  useEffect(() => {
    if (!mapRef?.current) return;

    // Hierarchy logic: If no ERF, it goes to Ward. If no Ward, it goes to LM.
    const target = erf || selectedWard || lm;
    const bbox = target?.bbox;

    if (!bbox) return;

    const { minLng, minLat, maxLng, maxLat } = bbox;

    mapRef.current.fitToCoordinates(
      [
        { latitude: minLat, longitude: minLng },
        { latitude: maxLat, longitude: maxLng },
      ],
      {
        edgePadding: { top: 80, right: 50, bottom: 80, left: 50 },
        animated: true,
      }
    );

    // Dependencies: trigger whenever a selection changes OR the manual button is tapped
  }, [lm?.id, selectedWard?.id, erf?.id, cameraRequestId]);

  return null;
}
