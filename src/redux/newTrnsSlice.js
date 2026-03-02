// src/redux/newTrnsSlice.js
import { createSlice } from "@reduxjs/toolkit";

/*
  PURPOSE:
  Temporary staging area for NEW inspection TRNs
  created from reports before they become work orders.
*/

const initialState = {
  candidates: [], // meters selected for TRN creation
  context: {
    lmPcode: null,
    yms: [],
    group: "ALL",
    meterNoFilter: "",
  },
};

const newTrnsSlice = createSlice({
  name: "newTrns",
  initialState,
  reducers: {
    setNewTrns(state, action) {
      const { candidates = [], context = {} } = action.payload || {};
      state.candidates = candidates;
      state.context = {
        ...state.context,
        ...context,
      };
    },

    clearNewTrns(state) {
      state.candidates = [];
      state.context = initialState.context;
    },
  },
});

export const { setNewTrns, clearNewTrns } = newTrnsSlice.actions;
export default newTrnsSlice.reducer;
