import { erfsKV } from "../redux/mmkv";

// Helper for legacy keys
const erfKeyForWard = (wardPcode) => `erfs_ward_${wardPcode}`;

export const erfMemory = {
  // --- NEW: LM-WIDE SPLIT STORAGE (The Future) ---

  saveLmInventory: (lmPcode, erfs) => {
    if (!erfs || !Array.isArray(erfs)) return;
    const metaList = [];

    erfs.forEach((erf) => {
      // 1. Meta (FlatList)
      // metaList.push({
      //   id: erf.id,
      //   erfId: erf.erfId,
      //   erfNo: erf.sg?.parcelNo || "N/A",
      //   wardPcode: erf.admin?.ward?.pcode,
      //   centroid: erf.geometry?.centroid,
      // });
      metaList.push({
        id: erf.id,
        erfId: erf.erfId,
        erfNo: erf.sg?.parcelNo || "N/A",
        wardPcode: erf.admin?.ward?.pcode,
        lmName: erf.admin?.localMunicipality?.name, // 👈 Add this line!
        centroid: erf.geometry?.centroid,
      });

      // 2. Geo (Map - Heavy)
      if (erf.geometry) {
        const geoData = {
          boundary: erf.geometry.boundary,
          centroid: erf.geometry.centroid,
          erfNo: erf.sg?.parcelNo,
          erfId: erf.erfId,
        };
        erfsKV.set(`geo_${erf.erfId}`, JSON.stringify(geoData));
      }
    });

    erfsKV.set(`meta_${lmPcode}`, JSON.stringify(metaList));

    const registry = erfMemory.getRegistry();
    registry.lms = registry.lms || {};
    registry.lms[lmPcode] = {
      count: erfs.length,
      lastSync: new Date().toISOString(),
    };
    erfsKV.set("registry", JSON.stringify(registry));
  },

  getLmMetaList: (lmPcode) => {
    const data = erfsKV.getString(`meta_${lmPcode}`);
    return data ? JSON.parse(data) : [];
  },

  getErfGeo: (erfId) => {
    const data = erfsKV.getString(`geo_${erfId}`);
    return data ? JSON.parse(data) : null;
  },

  // --- LEGACY: WARD-BASED STORAGE (Keep until Map refactor) ---

  getByWard(wardPcode) {
    if (!wardPcode) return null;
    const raw = erfsKV.getString(erfKeyForWard(wardPcode));
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      console.warn("❌ Failed to parse ERF cache", wardPcode);
      return null;
    }
  },

  setByWard(wardPcode, erfs) {
    if (!wardPcode || !Array.isArray(erfs)) return;
    erfsKV.set(
      erfKeyForWard(wardPcode),
      JSON.stringify({
        wardPcode,
        updatedAt: new Date().toISOString(),
        erfs,
      })
    );
  },

  // --- REGISTRY & UTILS ---

  getRegistry: () => {
    const data = erfsKV.getString("registry");
    return data ? JSON.parse(data) : { lms: {} };
  },

  clearAll: () => erfsKV.clearAll(),
};
