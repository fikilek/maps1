import { useEffect } from "react";

export default function MapCameraController({ mapRef, lm, town, ward, erf }) {
  useEffect(() => {
    const target = erf || ward || town || lm;
    if (!target?.bbox || !mapRef.current) return;

    const { north, south, east, west } = target.bbox;

    mapRef.current.fitToCoordinates(
      [
        { latitude: north, longitude: east },
        { latitude: south, longitude: west },
      ],
      {
        edgePadding: { top: 60, bottom: 60, left: 60, right: 60 },
        animated: true,
      }
    );
  }, [lm, town, ward, erf]);

  return null;
}
