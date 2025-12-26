// components/maps/MapCameraController.js
import { useEffect, useRef } from "react";

export default function MapCameraController({ mapRef, lm, town, ward }) {
  const didFitRef = useRef(false);

  useEffect(() => {
    if (!mapRef?.current) return;
    if (!lm?.bbox) return;

    // prevent refitting on every render
    if (didFitRef.current) return;

    const [minLng, minLat, maxLng, maxLat] = lm.bbox;

    mapRef.current.fitToCoordinates(
      [
        { latitude: minLat, longitude: minLng },
        { latitude: maxLat, longitude: maxLng },
      ],
      {
        edgePadding: {
          top: 60,
          right: 40,
          bottom: 60,
          left: 40,
        },
        animated: true,
      }
    );

    didFitRef.current = true;
  }, [lm, mapRef]);

  return null;
}
