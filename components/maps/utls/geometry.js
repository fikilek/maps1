/**
 * Convert GeoJSON Polygon / MultiPolygon to
 * react-native-maps LatLng array
 */
export function geometryToLatLngs(geometry) {
  if (!geometry) return [];

  // Polygon
  if (geometry.type === "Polygon") {
    return geometry.coordinates[0].map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    }));
  }

  // MultiPolygon (take outer ring of first polygon)
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates[0][0].map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    }));
  }

  return [];
}

export function bboxToLatLngs(bbox) {
  if (!bbox || bbox.length !== 4) return [];

  const [minLng, minLat, maxLng, maxLat] = bbox;

  return [
    { latitude: minLat, longitude: minLng },
    { latitude: minLat, longitude: maxLng },
    { latitude: maxLat, longitude: maxLng },
    { latitude: maxLat, longitude: minLng },
  ];
}
