// src/context/MapContext.js
import { createContext, useContext, useRef } from "react";

const MapContext = createContext(null);

export const MapProvider = ({ children }) => {
  const mapRef = useRef(null);

  /**
   * ✈️ THE FLIGHT COMMAND
   * @param {Array} coords - [{latitude: x, longitude: y}, ...]
   */
  const flyTo = (coords, padding = 40) => {
    console.log(`MapProvider ----flyTo()----coords?.length`, coords?.length);
    if (mapRef.current && coords && coords?.length > 0) {
      console.log("🚀 Pilot: Executing flyTo command...");
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: {
          top: padding,
          right: padding,
          bottom: padding,
          left: padding,
        },
        animated: true,
      });
    } else {
      console.warn("⚠️ Pilot: Cannot fly. MapRef or Coords missing.", {
        hasRef: !!mapRef.current,
        count: coords?.length,
      });
    }
  };

  return (
    <MapContext.Provider value={{ mapRef, flyTo }}>
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => useContext(MapContext);

// src/utils/geoUtils.js

/**
 * 🛡️ THE VALIDATOR: Flattens GeoJSON coordinates for React Native Maps
 * Handles Polygon, MultiPolygon, and varying nesting levels safely.
 */
export const getSafeCoords = (geom) => {
  if (!geom || !geom.coordinates || !Array.isArray(geom.coordinates)) return [];

  try {
    const flattenToCoords = (arr) => {
      if (typeof arr[0] === "number") return [arr];
      if (Array.isArray(arr[0])) {
        if (typeof arr[0][0] === "number") return arr;
        return flattenToCoords(arr[0]);
      }
      return [];
    };

    const ring = flattenToCoords(geom.coordinates);

    return ring
      .map((c) => {
        const lat = parseFloat(c[1]);
        const lng = parseFloat(c[0]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { latitude: lat, longitude: lng };
        }
        return null;
      })
      .filter(Boolean);
  } catch (e) {
    console.error("Coordinate Flattening Error", e);
    return [];
  }
};
