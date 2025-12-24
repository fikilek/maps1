import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";

import { authApi } from "./authApi";
import { geoApi } from "./geoApi";
import { usersApi } from "./usersSlice";

import { reduxStorage } from "./reduxStorage";

// Example future slices (if/when you add them)
import offlineReducer from "./offlineSlice";
// import uiReducer from "./uiSlice";

/* =====================================================
   ROOT REDUCER
===================================================== */
const rootReducer = combineReducers({
  // RTK Query APIs
  [geoApi.reducerPath]: geoApi.reducer,
  [authApi.reducerPath]: authApi.reducer,
  [usersApi.reducerPath]: usersApi.reducer,
  // App-level slices (example)
  offline: offlineReducer,
  // ui: uiReducer,
});

/* =====================================================
   REDUX PERSIST CONFIG
===================================================== */
const persistConfig = {
  key: "root",
  version: 1,
  storage: reduxStorage,

  // 👇 Persist ONLY non-RTK Query slices
  whitelist: [
    "offline",
    // "ui",
  ],

  blacklist: [geoApi.reducerPath, authApi.reducerPath, usersApi],
};

/* =====================================================
   PERSISTED REDUCER
===================================================== */
const persistedReducer = persistReducer(persistConfig, rootReducer);

/* =====================================================
   STORE
===================================================== */
export const store = configureStore({
  reducer: persistedReducer,

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // required for redux-persist
    }).concat(geoApi.middleware, authApi.middleware, usersApi.middleware),
});

/* =====================================================
   PERSISTOR
===================================================== */
export const persistor = persistStore(store);
