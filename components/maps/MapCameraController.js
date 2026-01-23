// components/maps/MapCameraController.js
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useGeo } from "../../src/context/GeoContext";
import { geoApi } from "../../src/redux/geoApi";
import { erfMemory } from "../../src/storage/erfMemory";

export default function MapCameraController({ mapRef, cameraRequestId }) {
  const { geoState } = useGeo();
  const { lmId, wardId, id } = geoState;

  // 🏛️ REACH INTO RTK CACHE FOR LM/WARD DATA (On-Demand)
  // We use the 'select' capability so we don't trigger new fetches here
  const lmDetails = useSelector(
    (state) =>
      geoApi.endpoints.getLocalMunicipalityById.select(lmId)(state)?.data
  );

  const wardDetails = useSelector((state) =>
    geoApi.endpoints.getWardsByLocalMunicipality
      .select(lmId)(state)
      ?.data?.find((w) => w.id === wardId)
  );

  useEffect(() => {
    if (!mapRef?.current) return;

    const runCamera = () => {
      // 1. PRIORITY: ERF (From MMKV Warehouse)
      if (id) {
        const erfGeo = erfMemory.getErfGeo(id);
        if (erfGeo?.bbox) return zoomToBbox(erfGeo.bbox, "ERF");
      }

      // 2. FALLBACK: WARD (From RTK Cache)
      if (wardId && wardDetails?.bbox) {
        return zoomToBbox(wardDetails.bbox, "WARD");
      }

      // 3. ROOT: MUNICIPALITY (From RTK Cache)
      if (lmId && lmDetails?.bbox) {
        return zoomToBbox(lmDetails.bbox, "LM");
      }
    };

    function zoomToBbox(bbox, level) {
      console.log(
        `✈️ MCC: Flying to ${level} using Bbox from ${
          level === "ERF" ? "MMKV" : "RTK Cache"
        }`
      );
      const { minLng, minLat, maxLng, maxLat } = bbox;
      mapRef.current.fitToCoordinates(
        [
          { latitude: minLat, longitude: minLng },
          { latitude: maxLat, longitude: maxLng },
        ],
        {
          edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
          animated: true,
        }
      );
    }

    runCamera();
  }, [lmId, wardId, id, cameraRequestId, lmDetails, wardDetails]);

  return null;
}
