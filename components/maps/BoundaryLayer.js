import { Polygon } from "react-native-maps";

export default function BoundaryLayer({ lm, town, ward, erf }) {
  const renderPolygon = (geo, color) => {
    if (!geo?.geometry?.coordinates) return null;

    const coords = geo.geometry.coordinates[0].map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    }));

    return (
      <Polygon
        coordinates={coords}
        strokeColor={color}
        fillColor={`${color}33`}
        strokeWidth={2}
      />
    );
  };

  return (
    <>
      {renderPolygon(lm, "#0033cc")}
      {renderPolygon(town, "#009933")}
      {renderPolygon(ward, "#ff9900")}
      {renderPolygon(erf, "#cc0000")}
    </>
  );
}
