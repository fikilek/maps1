import { createMMKV } from "react-native-mmkv";

export const authKV = createMMKV({ id: "auth" });
export const geoKV = createMMKV({ id: "geo-cache" });
export const formKV = createMMKV({ id: "form-drafts" });
export const uiKV = createMMKV({ id: "ui" });
export const reduxKV = createMMKV({ id: "redux-persist" });

const GEO_LEVELS = ["countryId", "provinceId", "dmId", "lmId", "tnId", "wdId"];

export const geoMemory = {
  getCountryId: () => geoKV.getString("countryId"),
  setCountryId: (id) => geoKV.set("countryId", id),

  getProvinceId: () => geoKV.getString("provinceId"),
  setProvinceId: (id) => geoKV.set("provinceId", id),

  getDmId: () => geoKV.getString("dmId"),
  setDmId: (id) => geoKV.set("dmId", id),

  getLmId: () => geoKV.getString("lmId"),
  setLmId: (id) => geoKV.set("lmId", id),

  getTnId: () => geoKV.getString("tnId"),
  setTnId: (id) => geoKV.set("tnId", id),

  getWdId: () => geoKV.getString("wdId"),
  setWdId: (id) => geoKV.set("wdId", id),

  clearBelow: (level) => {
    const index = GEO_LEVELS.indexOf(level + "Id");
    if (index === -1) return;

    for (let i = index + 1; i < GEO_LEVELS.length; i++) {
      geoKV.delete(GEO_LEVELS[i]);
    }
  },
};
