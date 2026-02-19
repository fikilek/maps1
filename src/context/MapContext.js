// src/context/MapContext.js
import { createContext, useContext, useRef } from "react";

const MapContext = createContext(null);

export const MapProvider = ({ children }) => {
  const mapRef = useRef(null);

  /**
   * ✈️ THE UNIVERSAL PILOT
   * Handles BBox [minLng, minLat, maxLng, maxLat],
   * GPS {lat, lng}, or Coordinate Arrays [{latitude, longitude}]
   */
  // src/context/MapContext.js

  const flyTo = (target, padding = 60) => {
    if (!mapRef.current || !target) return;

    let points = [];

    // 📦 CASE 1: The BBox Object (The Firestore "Map")
    // We check for the keys you saw in your "firefoo" lookup
    if (target.minLat && target.maxLat && target.minLng && target.maxLng) {
      points = [
        { latitude: target.minLat, longitude: target.minLng }, // Bottom Left
        { latitude: target.maxLat, longitude: target.maxLng }, // Top Right
      ];
    }
    // 📍 CASE 2: Single Point (Meter/Premise: {lat, lng})
    else if (target.lat && target.lng) {
      points = [{ latitude: target.lat, longitude: target.lng }];
    }
    // 🏛️ CASE 3: Standard Coordinate Array (Fallback)
    else if (Array.isArray(target)) {
      points = target;
    }

    // 🚀 MISSION EXECUTION
    if (points.length > 0) {
      mapRef.current.fitToCoordinates(points, {
        edgePadding: {
          top: padding,
          right: padding,
          bottom: padding,
          left: padding,
        },
        animated: true,
      });
    } else {
      console.warn(
        "⚠️ Pilot: Targeted 'Map' object missing min/max keys.",
        target,
      );
    }
  };
  return (
    <MapContext.Provider value={{ mapRef, flyTo }}>
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => useContext(MapContext);

// // src/context/MapContext.js
// import { createContext, useContext, useRef } from "react";

// const MapContext = createContext(null);

// export const MapProvider = ({ children }) => {
//   const mapRef = useRef(null);

//   /**
//    * ✈️ THE FLIGHT COMMAND
//    * @param {Array} coords - [{latitude: x, longitude: y}, ...]
//    */

//   const flyTo = (coords, padding = 40) => {
//     if (!mapRef.current || !coords || coords.length === 0) return;

//     console.log(`🚀 [PILOT]: Preparing flight for ${coords.length} points.`);

//     // 🎯 THE SPEED FIX: If the list is huge, we don't send all points.
//     // We only send the extreme corners. Google Maps loves this.
//     let tacticalCoords = coords;

//     if (coords.length > 50) {
//       const lats = coords.map((c) => c.latitude);
//       const lngs = coords.map((c) => c.longitude);

//       tacticalCoords = [
//         { latitude: Math.min(...lats), longitude: Math.min(...lngs) }, // Bottom Left
//         { latitude: Math.max(...lats), longitude: Math.max(...lngs) }, // Top Right
//       ];
//       console.log("⚡ [SUPER-SONIC]: Compressed flight to 2 points (BBox).");
//     }

//     mapRef.current.fitToCoordinates(tacticalCoords, {
//       edgePadding: {
//         top: padding,
//         right: padding,
//         bottom: padding,
//         left: padding,
//       },
//       animated: true,
//     });
//   };

//   // const flyTo = (coords, padding = 40) => {
//   //   if (mapRef.current && coords && coords?.length > 0) {
//   //     // 🛡️ THE SOVEREIGN THINNER:
//   //     // If we have > 100 points, we take a sample to protect the Bridge.
//   //     let tacticalCoords = coords;
//   //     if (coords.length > 100) {
//   //       const sampleRate = Math.ceil(coords.length / 50); // Aim for ~50 points total
//   //       tacticalCoords = coords.filter((_, index) => index % sampleRate === 0);
//   //       console.log(
//   //         `📉 [THINNED]: Reduced ${coords.length} -> ${tacticalCoords.length} points for speed.`,
//   //       );
//   //     }

//   //     console.log("🚀 Pilot: Executing flyTo command...");
//   //     mapRef.current.fitToCoordinates(tacticalCoords, {
//   //       edgePadding: {
//   //         top: padding,
//   //         right: padding,
//   //         bottom: padding,
//   //         left: padding,
//   //       },
//   //       animated: true,
//   //     });
//   //   }
//   // };

//   // const flyTo = (coords, padding = 40) => {
//   //   console.log(`MapProvider ----flyTo()----coords?.length`, coords?.length);
//   //   if (mapRef.current && coords && coords?.length > 0) {
//   //     console.log("🚀 Pilot: Executing flyTo command...");
//   //     mapRef.current.fitToCoordinates(coords, {
//   //       edgePadding: {
//   //         top: padding,
//   //         right: padding,
//   //         bottom: padding,
//   //         left: padding,
//   //       },
//   //       animated: true,
//   //     });
//   //     return;
//   //   } else {
//   //     console.warn("⚠️ Pilot: Cannot fly. MapRef or Coords missing.", {
//   //       hasRef: !!mapRef.current,
//   //       count: coords?.length,
//   //     });
//   //     return;
//   //   }
//   // };

//   return (
//     <MapContext.Provider value={{ mapRef, flyTo }}>
//       {children}
//     </MapContext.Provider>
//   );
// };

// export const useMap = () => useContext(MapContext);

// // src/utils/geoUtils.js

// /**
//  * 🛡️ THE VALIDATOR: Flattens GeoJSON coordinates for React Native Maps
//  * Handles Polygon, MultiPolygon, and varying nesting levels safely.
//  */

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

export const bboxToRegion = (bbox) => {
  if (!bbox || !bbox.minLat) return null;

  const lat = (bbox.minLat + bbox.maxLat) / 2;
  const lng = (bbox.minLng + bbox.maxLng) / 2;
  const latDelta = Math.abs(bbox.maxLat - bbox.minLat) * 1.1; // 10% padding
  const lngDelta = Math.abs(bbox.maxLng - bbox.minLng) * 1.1;

  return {
    latitude: lat,
    longitude: lng,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
};
