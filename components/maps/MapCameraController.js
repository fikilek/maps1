// components/maps/MapCameraController.js
import { useEffect, useRef } from "react";

export default function MapCameraController({ mapRef, lm, ward }) {
  const didFitLmRef = useRef(false);
  const lastWardIdRef = useRef(null);

  /* =========================
     FIT LOCAL MUNICIPALITY
  ========================= */
  useEffect(() => {
    if (!mapRef?.current) return;
    if (!lm?.bbox) return;
    if (didFitLmRef.current) return;

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

    didFitLmRef.current = true;
  }, [lm, mapRef]);

  /* =========================
     FIT SELECTED WARD
  ========================= */
  useEffect(() => {
    if (!mapRef?.current) return;
    if (!ward?.bbox) return;

    // prevent re-zooming same ward
    if (lastWardIdRef.current === ward.id) return;

    const { minLat, minLng, maxLat, maxLng } = ward.bbox;

    mapRef.current.fitToCoordinates(
      [
        { latitude: minLat, longitude: minLng },
        { latitude: maxLat, longitude: maxLng },
      ],
      {
        edgePadding: {
          top: 80,
          right: 60,
          bottom: 80,
          left: 60,
        },
        animated: true,
      }
    );

    lastWardIdRef.current = ward.id;
  }, [ward, mapRef]);

  return null;
}
