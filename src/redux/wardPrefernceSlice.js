// src/redux/wardPreferenceSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  lastWardByLm: {}, // { [lmPcode]: wardPcode }
};

const wardPreferenceSlice = createSlice({
  name: "geoSession",
  initialState,
  reducers: {
    rememberLastWardForLm(state, action) {
      const { lmPcode, wardPcode } = action.payload || {};
      if (!lmPcode || !wardPcode) return;
      state.lastWardByLm[lmPcode] = wardPcode;
    },
  },
});

export const { rememberLastWardForLm } = wardPreferenceSlice.actions;
export default wardPreferenceSlice.reducer;

export const selectLastWardForLm = (state, lmPcode) =>
  state.geoSession?.lastWardByLm?.[lmPcode] || null;
