import { Polygon } from "react-native-maps";

export default function BoundaryLayer({ lm }) {
  console.log(``);
  console.log(`BoundaryLayer ----RENDER RENDER`);
  if (!lm?.geometry?.polygons?.length) return null;
  console.log(
    `BoundaryLayer ----lm?.geometry?.polygons?.length`,
    lm?.geometry?.polygons?.length
  );

  // 🔥 ANDROID FIX: use FIRST polygon + FIRST ring only
  const ring = lm.geometry.polygons[0].rings[0];
  // console.log(`BoundaryLayer ----ring`, ring);

  const coordinates = ring.points.map((p) => ({
    latitude: p.lat,
    longitude: p.lng,
  }));
  // console.log(`BoundaryLayer ----coordinates`, coordinates);

  console.log("Rendering polygon with points:", coordinates.length);

  return (
    <Polygon
      coordinates={coordinates}
      strokeColor="red"
      strokeWidth={4}
      fillColor="rgba(255,0,0,0.25)"
      tappable
    />
  );
}
