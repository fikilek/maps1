import { geoKV } from "../redux/mmkv";

const GEO_LEVELS = ["countryId", "provinceId", "dmId", "lmId", "tnId", "wdId"];

export const geoMemory = {
  // SET: Logic to save selection and wipe children (Cascade)
  setStep: (levelKey, id) => {
    geoKV.set(levelKey, id);
    const index = GEO_LEVELS.indexOf(levelKey);
    if (index !== -1) {
      for (let i = index + 1; i < GEO_LEVELS?.length; i++) {
        geoKV.delete(GEO_LEVELS[i]);
      }
    }
  },

  // WARD WAREHOUSING: For the 0ms "Perfect Boot"
  saveWards: (lmPcode, wards) => {
    geoKV.set(`wards_${lmPcode}`, JSON.stringify(wards));
  },

  getWards: (lmPcode) => {
    const data = geoKV.getString(`wards_${lmPcode}`);
    return data ? JSON.parse(data) : null;
  },

  clearAll: () => {
    geoKV.clearAll();
    console.log("☢️ [STORAGE CLEARED]: MMKV geoKV wiped clean.");
  },

  // 🏛️ NEW: MUNICIPALITY WAREHOUSING
  saveMunicipality: (lm) => {
    if (lm?.id) {
      geoKV.set(`lm_meta_${lm.id}`, JSON.stringify(lm));
    }
  },

  getMunicipality: (lmId) => {
    const data = geoKV.getString(`lm_meta_${lmId}`);
    return data ? JSON.parse(data) : null;
  },
};
