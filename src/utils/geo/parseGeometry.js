// utils/geo/parseGeometry.js
export const transformGeoData = (doc) => {
  const data = doc.data ? doc.data() : doc;

  let geometry = data.geometry;

  if (typeof geometry === "string") {
    try {
      geometry = JSON.parse(geometry);
    } catch (e) {
      console.warn("Invalid geometry JSON", e);
      geometry = null;
    }
  }

  return {
    id: doc.id || data.id,
    ...data,
    geometry,
  };
};
