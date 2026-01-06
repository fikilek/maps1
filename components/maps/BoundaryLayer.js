import React, { useMemo } from "react";
import { Polygon } from "react-native-maps";

const LM_STROKE_COLOR = "#2563eb"; // Blue
const WARD_STROKE_COLOR = "#16a34a"; // Green

const BoundaryLayer = ({ lm, wards = [], selectedWard }) => {
  /**
   * Helper to extract coordinates from the Firefoo/Deep nesting schema:
   * geometry -> polygons[0] -> rings[0] -> points[{lat, lng}]
   */
  const extractCoords = (item) => {
    try {
      const points = item?.geometry?.polygons?.[0]?.rings?.[0]?.points;
      if (!points || !Array.isArray(points)) return null;

      return points.map((p) => ({
        latitude: p.lat,
        longitude: p.lng,
      }));
    } catch (e) {
      console.error("BoundaryLayer ---- Error extracting coords:", e);
      return null;
    }
  };

  // Memoize LM coords so they don't re-calculate on every map move
  const lmCoords = useMemo(() => extractCoords(lm), [lm]);

  return (
    <>
      {/* 1. LOCAL MUNICIPALITY BOUNDARY */}
      {lmCoords && (
        <Polygon
          key={`lm-boundary-${lm.id || "primary"}`}
          coordinates={lmCoords}
          strokeColor={LM_STROKE_COLOR}
          strokeWidth={3}
          fillColor="rgba(37, 99, 235, 0.02)" // Very faint blue tint
          tappable={false}
          zIndex={1}
        />
      )}

      {/* 2. WARD BOUNDARIES */}
      {wards.map((ward) => {
        const wardCoords = extractCoords(ward);
        if (!wardCoords) return null;

        const isSelected = selectedWard?.id === ward.id;

        return (
          <Polygon
            key={`ward-poly-${ward.id}`}
            coordinates={wardCoords}
            strokeColor={isSelected ? "#dc2626" : WARD_STROKE_COLOR}
            strokeWidth={isSelected ? 3 : 1.5}
            fillColor={
              isSelected ? "rgba(220, 38, 38, 0.2)" : "rgba(22, 163, 74, 0.05)"
            }
            zIndex={isSelected ? 10 : 2}
            tappable={false}
          />
        );
      })}
    </>
  );
};

export default React.memo(BoundaryLayer);
