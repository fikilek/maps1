import { reduxKV } from "./mmkv";

export const reduxStorage = {
  getItem: (key) => {
    const value = reduxKV.getString(key);
    return Promise.resolve(value);
  },

  setItem: (key, value) => {
    reduxKV.set(key, value);
    return Promise.resolve(true);
  },

  removeItem: (key) => {
    reduxKV.delete(key);
    return Promise.resolve(true);
  },
};
