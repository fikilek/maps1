import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isOnline: true,
  lastOnlineAt: null,
};

const offlineSlice = createSlice({
  name: "offline",
  initialState,
  reducers: {
    setOnline(state) {
      state.isOnline = true;
      state.lastOnlineAt = Date.now();
    },

    setOffline(state) {
      state.isOnline = false;
    },
  },
});

export const { setOnline, setOffline } = offlineSlice.actions;

export default offlineSlice.reducer;
