// src/redux/wardErfAccessSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  allowedWardKeys: {},
};

const wardErfAccessSlice = createSlice({
  name: "wardErfAccess",
  initialState,
  reducers: {
    allowWardErfPack: (state, action) => {
      const wardCacheKey = action.payload?.wardCacheKey;
      if (!wardCacheKey) return;

      state.allowedWardKeys[wardCacheKey] = {
        wardCacheKey,
        allowedAt: new Date().toISOString(),
      };
    },

    disallowWardErfPack: (state, action) => {
      const wardCacheKey = action.payload?.wardCacheKey;
      if (!wardCacheKey) return;

      delete state.allowedWardKeys[wardCacheKey];
    },

    clearAllAllowedWardErfPacks: (state) => {
      state.allowedWardKeys = {};
    },
  },
});

export const {
  allowWardErfPack,
  disallowWardErfPack,
  clearAllAllowedWardErfPacks,
} = wardErfAccessSlice.actions;

export const wardErfAccessReducer = wardErfAccessSlice.reducer;

// selectors
export const selectAllowedWardKeys = (state) =>
  state?.wardErfAccess?.allowedWardKeys || {};

export const selectIsWardErfPackAllowed = (state, wardCacheKey) =>
  !!state?.wardErfAccess?.allowedWardKeys?.[wardCacheKey];
