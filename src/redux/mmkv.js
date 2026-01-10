import { createMMKV } from "react-native-mmkv";

export const authKV = createMMKV({ id: "auth" });
export const geoKV = createMMKV({ id: "geo-cache" });
export const erfsKV = createMMKV({ id: "erfs-cache" });
export const formKV = createMMKV({ id: "form-drafts" });
export const uiKV = createMMKV({ id: "ui" });
export const reduxKV = createMMKV({ id: "redux-persist" });

// These keys must match your Firestore/State naming conventions exactly
const GEO_LEVELS = ["countryId", "provinceId", "dmId", "lmId", "tnId", "wdId"];

export const geoMemory = {
  // --- Generic Helper (The Engine) ---

  /**
   * Sets a value and clears everything below it in the hierarchy
   * @param {string} levelKey - e.g., 'lmId'
   * @param {string} id - The value to store
   */
  setStep: (levelKey, id) => {
    // 1. Set the current value
    geoKV.set(levelKey, id);

    // 2. Cascade Invalidation
    const index = GEO_LEVELS.indexOf(levelKey);
    if (index !== -1) {
      for (let i = index + 1; i < GEO_LEVELS.length; i++) {
        geoKV.delete(GEO_LEVELS[i]);
      }
    }
  },

  // --- Getters ---
  getCountryId: () => geoKV.getString("countryId"),
  getProvinceId: () => geoKV.getString("provinceId"),
  getDmId: () => geoKV.getString("dmId"),
  getLmId: () => geoKV.getString("lmId"),
  getTnId: () => geoKV.getString("tnId"),
  getWdId: () => geoKV.getString("wdId"),

  // --- Role-Specific Helper for Onboarding ---

  /**
   * Returns the full selection object for submission
   */
  getAll: () => ({
    countryId: geoKV.getString("countryId"),
    provinceId: geoKV.getString("provinceId"),
    dmId: geoKV.getString("dmId"),
    lmId: geoKV.getString("lmId"),
    tnId: geoKV.getString("tnId"),
    wdId: geoKV.getString("wdId"),
  }),

  clearAll: () => {
    GEO_LEVELS.forEach((key) => geoKV.delete(key));
  },
};

// import { createMMKV } from "react-native-mmkv";

// export const authKV = createMMKV({ id: "auth" });
// export const geoKV = createMMKV({ id: "geo-cache" });
// export const formKV = createMMKV({ id: "form-drafts" });
// export const uiKV = createMMKV({ id: "ui" });
// export const reduxKV = createMMKV({ id: "redux-persist" });

// const GEO_LEVELS = ["countryId", "provinceId", "dmId", "lmId", "tnId", "wdId"];

// export const geoMemory = {
//   getCountryId: () => geoKV.getString("countryId"),
//   setCountryId: (id) => geoKV.set("countryId", id),

//   getProvinceId: () => geoKV.getString("provinceId"),
//   setProvinceId: (id) => geoKV.set("provinceId", id),

//   getDmId: () => geoKV.getString("dmId"),
//   setDmId: (id) => geoKV.set("dmId", id),

//   getLmId: () => geoKV.getString("lmId"),
//   setLmId: (id) => geoKV.set("lmId", id),

//   getTnId: () => geoKV.getString("tnId"),
//   setTnId: (id) => geoKV.set("tnId", id),

//   getWdId: () => geoKV.getString("wdId"),
//   setWdId: (id) => geoKV.set("wdId", id),

//   clearBelow: (level) => {
//     const index = GEO_LEVELS.indexOf(level + "Id");
//     if (index === -1) return;

//     for (let i = index + 1; i < GEO_LEVELS.length; i++) {
//       geoKV.delete(GEO_LEVELS[i]);
//     }
//   },
// };
