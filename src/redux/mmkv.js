import { createMMKV } from "react-native-mmkv";

export const authKV = createMMKV({ id: "auth" });
export const geoKV = createMMKV({ id: "geo-cache" });
export const erfsKV = createMMKV({ id: "erfs-cache" });
export const formKV = createMMKV({ id: "form-drafts" });
export const uiKV = createMMKV({ id: "ui" });
export const reduxKV = createMMKV({ id: "redux-persist" });
export const premiseKV = createMMKV({ id: "premise" });
