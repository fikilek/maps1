import { useEffect } from "react";

export default function MapCameraController({ mapRef, lm, ward }) {
  useEffect(() => {
    if (!mapRef.current) return;

    // 1. ZOOM TO WARD (High Priority)
    if (ward?.geometry?.polygons?.[0]?.rings?.[0]?.points) {
      const points = ward.geometry.polygons[0].rings[0].points.map((p) => ({
        latitude: p.lat,
        longitude: p.lng,
      }));

      mapRef.current.fitToCoordinates(points, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }

    // 2. ZOOM TO LM (When LM is selected or Ward is cleared)
    else if (lm?.bbox && Array.isArray(lm.bbox)) {
      const [minLng, minLat, maxLng, maxLat] = lm.bbox;

      // Providing all 4 corners of the box makes the zoom calculation 100% reliable
      const boxCorners = [
        { latitude: minLat, longitude: minLng }, // Southwest
        { latitude: minLat, longitude: maxLng }, // Southeast
        { latitude: maxLat, longitude: maxLng }, // Northeast
        { latitude: maxLat, longitude: minLng }, // Northwest
      ];

      mapRef.current.fitToCoordinates(boxCorners, {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    }
  }, [lm, ward, mapRef]);

  return null;
}
