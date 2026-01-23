import { erfsKV } from "../redux/mmkv";

export const erfMemory = {
  saveErfsMetaList: (lmPcode, metaEntries) => {
    // 🛡️ The "Annoying Error" Fix: Silent return if empty
    if (!metaEntries || metaEntries.length === 0) {
      console.log("ℹ️ [STORAGE]: Erfs Meta List empty. Skipping vault.");
      return;
    }
    try {
      console.log(` `);
      console.log(
        `saveErfsMetaList ----metaEntries?.length`,
        metaEntries?.length,
      );
      const storageKey = `meta_${lmPcode}`;
      erfsKV.set(storageKey, JSON.stringify(metaEntries));

      // Update Registry for tracking
      const registry = erfMemory.getRegistry();
      registry.lms = registry.lms || {};
      registry.lms[lmPcode] = {
        count: metaEntries.length,
        lastSync: new Date().toISOString(),
      };
      erfsKV.set("registry", JSON.stringify(registry));

      console.log(
        `✅ [DISK]: Saved ErfsMetaList for ${lmPcode} (${metaEntries.length} items).`,
      );
    } catch (e) {
      console.error("❌ [VAULT]: SaveErfsMetaList Failed", e);
    }
  },

  getErfsMetaList: (lmPcode) => {
    try {
      const storageKey = `meta_${lmPcode}`;
      const data = erfsKV.getString(storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("❌ [VAULT]: GetErfsMetaList Failed", e);
      return [];
    }
  },

  saveErfsGeoList: (lmPcode, geoEntries) => {
    // geoEntries is an object { erfId: { geometry } }
    if (!geoEntries || Object.keys(geoEntries).length === 0) return;

    try {
      const ids = Object.keys(geoEntries);
      ids.forEach((id) => {
        // Individual keys per Erf shape for high performance
        erfsKV.set(`geo_${id}`, JSON.stringify(geoEntries[id]));
      });
      console.log(`⚙️ [SHREDDER]: Saved ErfsGeoList for ${ids.length} Erfs.`);
    } catch (error) {
      console.error("❌ [VAULT]: SaveErfsGeoList Failed", error);
    }
  },

  getErfsGeoList: (erfId) => {
    try {
      const data = erfsKV.getString(`geo_${erfId}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("❌ [VAULT]: GetErfsGeoList Failed", e);
      return null;
    }
  },

  getRegistry: () => {
    const data = erfsKV.getString("registry");
    return data ? JSON.parse(data) : { lms: {} };
  },

  clearAll: () => {
    erfsKV.clearAll();
    console.log("☢️ [STORAGE CLEARED]: MMKV erfKV wiped clean.");
  },
};
