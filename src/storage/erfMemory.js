import { erfsKV } from "../redux/mmkv";

export const erfMemory = {
  // 🏛️ META: BULK OPERATIONS (The Gold Standard)
  saveBulkErfMeta: (lmPcode, metaEntries) => {
    try {
      const storageKey = `meta_${lmPcode}`;
      erfsKV.set(storageKey, JSON.stringify(metaEntries));

      // Update Registry for the Audit Report
      const registry = erfMemory.getRegistry();
      registry.lms = registry.lms || {};
      registry.lms[lmPcode] = {
        count: metaEntries.length,
        lastSync: new Date().toISOString(),
      };
      erfsKV.set("registry", JSON.stringify(registry));

      console.log(
        `⚡️ [VAULT]: ${lmPcode} Meta Secured (${metaEntries.length} items).`,
      );
    } catch (e) {
      console.error("❌ [VAULT]: Bulk Meta Save Failed", e);
    }
  },

  getErfsMetaList: (lmPcode) => {
    try {
      const storageKey = `meta_${lmPcode}`;
      const data = erfsKV.getString(storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  // 🛰️ GEO: BULK OPERATIONS (The Map Irrigation)
  saveBulkErfGeo: (lmPcode, geoEntries) => {
    try {
      const storageKey = `geo_${lmPcode}`;
      erfsKV.set(storageKey, JSON.stringify(geoEntries));

      const count = Object.keys(geoEntries).length;
      console.log(
        `🛰️ [GEO VAULT]: ${lmPcode} Shapes Secured (${count} items).`,
      );
    } catch (e) {
      console.error("❌ [GEO VAULT]: Bulk Geo Save Failed", e);
    }
  },

  getErfsGeoList: (lmPcode) => {
    try {
      const storageKey = `geo_${lmPcode}`;
      const data = erfsKV.getString(storageKey);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  },

  // 🛠️ UTILITIES
  getRegistry: () => {
    const data = erfsKV.getString("registry");
    return data ? JSON.parse(data) : { lms: {} };
  },

  saveSyncTimestamp: (lmPcode) => {
    erfsKV.set(`last_sync_${lmPcode}`, new Date().toISOString());
  },

  getLastSyncTimestamp: (lmPcode) => {
    return erfsKV.getString(`last_sync_${lmPcode}`);
  },

  clearAll: () => {
    erfsKV.clearAll();
    console.log("☢️ [STORAGE CLEARED]: MMKV wiped clean.");
  },

  // 🕵️ AUDIT: This counts shapes in the NEW bulk format
  getGeoCount: (lmPcode) => {
    try {
      const geo = erfMemory.getErfsGeoList(lmPcode);
      return Object.keys(geo).length;
    } catch (e) {
      return 0;
    }
  },
};

// import { erfsKV } from "../redux/mmkv";

// export const erfMemory = {
//   // 🎯 NEW: SAVE SINGLE ERF (The A06 Performance Pillar)
//   // This updates only ONE record in the large meta array
//   saveSingleErfMeta: (lmPcode, erfId, updatedErf) => {
//     try {
//       const storageKey = `meta_${lmPcode}`;
//       const currentData = erfsKV.getString(storageKey);
//       let metaEntries = currentData ? JSON.parse(currentData) : [];

//       const idx = metaEntries.findIndex((m) => m.id === erfId);
//       if (idx !== -1) {
//         metaEntries[idx] = updatedErf;
//       } else {
//         metaEntries.unshift(updatedErf); // Add to top if new
//       }

//       // Write back the updated array
//       erfsKV.set(storageKey, JSON.stringify(metaEntries));
//       // console.log(`⚡️ [DELTA VAULT]: Erf ${erfId} updated surgically.`);
//     } catch (e) {
//       console.error("❌ [VAULT]: saveSingleErfMeta Failed", e);
//     }
//   },

//   // 🧹 NEW: DELETE SINGLE ERF
//   deleteSingleErfMeta: (lmPcode, erfId) => {
//     try {
//       const storageKey = `meta_${lmPcode}`;
//       const currentData = erfsKV.getString(storageKey);
//       if (!currentData) return;

//       let metaEntries = JSON.parse(currentData);
//       metaEntries = metaEntries.filter((m) => m.id !== erfId);

//       erfsKV.set(storageKey, JSON.stringify(metaEntries));
//       erfsKV.delete(`geo_${erfId}`); // Clean up geometry too
//       console.log(`🧹 [VAULT CLEANUP]: Erf ${erfId} removed.`);
//     } catch (e) {
//       console.error("❌ [VAULT]: deleteSingleErfMeta Failed", e);
//     }
//   },

//   // --- 🏛️ EXISTING BULK FUNCTIONS (KEEP THESE) ---

//   saveErfsMetaList: (lmPcode, metaEntries) => {
//     if (!metaEntries || metaEntries.length === 0) return;
//     try {
//       const storageKey = `meta_${lmPcode}`;
//       erfsKV.set(storageKey, JSON.stringify(metaEntries));

//       const registry = erfMemory.getRegistry();
//       registry.lms = registry.lms || {};
//       registry.lms[lmPcode] = {
//         count: metaEntries.length,
//         lastSync: new Date().toISOString(),
//       };
//       erfsKV.set("registry", JSON.stringify(registry));

//       console.log(
//         `✅ [DISK]: Saved ErfsMetaList for ${lmPcode} (${metaEntries.length} items).`,
//       );
//     } catch (e) {
//       console.error("❌ [VAULT]: SaveErfsMetaList Failed", e);
//     }
//   },

//   getErfsMetaList: (lmPcode) => {
//     try {
//       const storageKey = `meta_${lmPcode}`;
//       const data = erfsKV.getString(storageKey);
//       return data ? JSON.parse(data) : [];
//     } catch (e) {
//       console.error("❌ [VAULT]: GetErfsMetaList Failed", e);
//       return [];
//     }
//   },

//   saveErfsGeoList: (lmPcode, geoEntries) => {
//     if (!geoEntries || Object.keys(geoEntries).length === 0) return;
//     try {
//       const ids = Object.keys(geoEntries);
//       ids.forEach((id) => {
//         erfsKV.set(`geo_${id}`, JSON.stringify(geoEntries[id]));
//       });
//       console.log(`⚙️ [SHREDDER]: Saved ErfsGeoList for ${ids.length} Erfs.`);
//     } catch (error) {
//       console.error("❌ [VAULT]: SaveErfsGeoList Failed", error);
//     }
//   },

//   getRegistry: () => {
//     const data = erfsKV.getString("registry");
//     return data ? JSON.parse(data) : { lms: {} };
//   },

//   clearAll: () => {
//     erfsKV.clearAll();
//     console.log("☢️ [STORAGE CLEARED]: MMKV erfKV wiped clean.");
//   },

//   saveSyncTimestamp: (lmPcode) => {
//     const now = new Date().toISOString();
//     erfsKV.set(`last_sync_${lmPcode}`, now);
//   },

//   getLastSyncTimestamp: (lmPcode) => {
//     return erfsKV.getString(`last_sync_${lmPcode}`);
//   },

//   getGeoCount: (lmPcode) => {
//     try {
//       if (!lmPcode) return 0;
//       const metaList = erfMemory.getErfsMetaList(lmPcode) || [];
//       let count = 0;
//       metaList.forEach((erf) => {
//         if (erfsKV.contains(`geo_${erf.id}`)) count++;
//       });
//       return count;
//     } catch (e) {
//       console.error("❌ [VAULT]: getGeoCount Failed", e);
//       return 0;
//     }
//   },

//   saveBulkErfMeta: (lmPcode, metaEntries) => {
//     try {
//       const storageKey = `meta_${lmPcode}`;
//       // ⚡ Absolute speed: One stringify, one disk write.
//       erfsKV.set(storageKey, JSON.stringify(metaEntries));
//       console.log(
//         `⚡️ [VAULT]: ${lmPcode} Bulk Update Complete (${metaEntries.length} items).`,
//       );
//     } catch (e) {
//       console.error("❌ [VAULT]: Bulk Save Failed", e);
//     }
//   },

//   // 🛰️ THE GEO VAULT: Saves the Map/Object of shapes
//   saveBulkErfGeo: (lmPcode, geoEntries) => {
//     try {
//       const storageKey = `geo_${lmPcode}`;
//       // geoEntries is the Object { "id1": {geometry...}, "id2": {...} }
//       erfsKV.set(storageKey, JSON.stringify(geoEntries));

//       const count = Object.keys(geoEntries).length;
//       console.log(
//         `🛰️ [GEO VAULT]: ${lmPcode} Shapes Secured (${count} items).`,
//       );
//     } catch (e) {
//       console.error("❌ [GEO VAULT]: Bulk Save Failed", e);
//     }
//   },

//   // 🕵️ THE GEO RETRIEVER: Used in Step 1 (Hydration)
//   getErfsGeoList: (lmPcode) => {
//     try {
//       const storageKey = `geo_${lmPcode}`;
//       const data = erfsKV.getString(storageKey);
//       return data ? JSON.parse(data) : {}; // Returns empty object if none found
//     } catch (e) {
//       return {};
//     }
//   },

//   getAllKeys: () => {
//     try {
//       return erfsKV.getAllKeys();
//     } catch (e) {
//       console.error("❌ [VAULT]: getAllKeys Failed", e);
//       return [];
//     }
//   },
// };
