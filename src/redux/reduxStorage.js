// src/redux/reduxStorage.js
import { reduxKV } from "./mmkv";

const removeKey = (key) => {
  // Different MMKV libs / versions expose different remove methods.
  if (typeof reduxKV.delete === "function") return reduxKV.delete(key);
  if (typeof reduxKV.removeItem === "function") return reduxKV.removeItem(key);
  if (typeof reduxKV.remove === "function") return reduxKV.remove(key);

  // last resort: overwrite with empty (so redux-persist won't rehydrate it)
  if (typeof reduxKV.set === "function") return reduxKV.set(key, "");
  throw new Error("reduxKV has no delete/remove method");
};

export const reduxStorage = {
  getItem: (key) => {
    const value =
      typeof reduxKV.getString === "function"
        ? reduxKV.getString(key)
        : reduxKV.get(key); // fallback for some MMKV libs

    return Promise.resolve(value ?? null);
  },

  setItem: (key, value) => {
    reduxKV.set(key, value);
    return Promise.resolve(true);
  },

  removeItem: (key) => {
    removeKey(key);
    return Promise.resolve(true);
  },
};
