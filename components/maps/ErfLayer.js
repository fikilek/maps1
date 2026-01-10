// components/maps/ErfLayer.js
import { Marker, Polygon } from "react-native-maps";

export default function ErfLayer({ erfs, selectedErf }) {
  return (
    <>
      {erfs.map((erf) => {
        const isSelected = erf.id === selectedErf?.id;

        // Selected ERF → polygon
        if (isSelected && erf.geometry?.coordinates) {
          const ring =
            erf.geometry.type === "MultiPolygon"
              ? erf.geometry.coordinates[0][0]
              : erf.geometry.coordinates[0];

          return (
            <Polygon
              key={erf.id}
              coordinates={ring.map(([lng, lat]) => ({
                latitude: lat,
                longitude: lng,
              }))}
              strokeColor="#2563eb"
              strokeWidth={3}
              fillColor="rgba(37,99,235,0.15)"
            />
          );
        }

        // Non-selected ERFs → centroid dots
        if (erf.centroid) {
          return (
            <Marker
              key={erf.id}
              coordinate={{
                latitude: erf.centroid.lat,
                longitude: erf.centroid.lng,
              }}
              pinColor="#999"
            />
          );
        }

        return null;
      })}
    </>
  );
}
