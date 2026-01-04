import { Polygon } from "react-native-maps";

const LM_STROKE_WIDTH = 3;
const WARD_STROKE_WIDTH = 1;

const LM_STROKE_COLOR = "#2563eb"; // blue
const WARD_STROKE_COLOR = "#16a34a"; // green

function toMapCoords(points) {
  return points.map((p) => ({
    latitude: p.latitude ?? p.lat,
    longitude: p.longitude ?? p.lng,
  }));
}

const BoundaryLayer = ({ lm, wards = [], selectedWard }) => {
  console.log("BoundaryLayer ----mounted");

  if (!lm?.geometry?.polygons) return null;

  return (
    <>
      {lm.geometry.polygons.map((polygon, pIdx) =>
        polygon.rings.map((ring, rIdx) => (
          <Polygon
            key={`lm-${pIdx}-${rIdx}`}
            coordinates={toMapCoords(ring.points)}
            strokeColor={LM_STROKE_COLOR}
            strokeWidth={LM_STROKE_WIDTH}
            fillColor="rgba(37,99,235,0.05)"
            tappable={false}
          />
        ))
      )}

      {wards.map((ward) =>
        ward.geometry.polygons.map((polygon, pIdx) =>
          polygon.rings.map((ring, rIdx) => {
            const isSelected = selectedWard?.id === ward.id;

            return (
              <Polygon
                key={`ward-${ward.id}-${pIdx}-${rIdx}`}
                coordinates={toMapCoords(ring.points)}
                strokeColor={isSelected ? "#dc2626" : WARD_STROKE_COLOR}
                strokeWidth={isSelected ? 2 : WARD_STROKE_WIDTH}
                fillColor={
                  isSelected ? "rgba(220,38,38,0.15)" : "rgba(22,163,74,0.05)"
                }
                tappable={false}
              />
            );
          })
        )
      )}
    </>
  );
};

export default BoundaryLayer;
