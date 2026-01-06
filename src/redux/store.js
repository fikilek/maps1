import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";

import { authApi } from "./authApi";
import { geoApi } from "./geoApi";

import { reduxStorage } from "./reduxStorage";

// Example future slices (if/when you add them)
import { erfsApi } from "./erfsApi";
import offlineReducer from "./offlineSlice";
import { spApi } from "./spApi";
import { usersApi } from "./usersApi";
// import uiReducer from "./uiSlice";

/* =====================================================
   ROOT REDUCER
===================================================== */
const rootReducer = combineReducers({
  // RTK Query APIs
  [geoApi.reducerPath]: geoApi.reducer,
  [authApi.reducerPath]: authApi.reducer,
  [usersApi.reducerPath]: usersApi.reducer,
  [spApi.reducerPath]: spApi.reducer, // ✅ ADD THIS
  [erfsApi.reducerPath]: erfsApi.reducer,
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
  whitelist: ["offline", geoApi],

  blacklist: [
    // geoApi.reducerPath,
    authApi.reducerPath,
    usersApi.reducerPath,
    spApi.reducerPath,
    erfsApi.reducerPath,
  ],
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
    }).concat(
      geoApi.middleware,
      authApi.middleware,
      usersApi.middleware,
      spApi.middleware,
      erfsApi.middleware
    ),
});

/* =====================================================
   PERSISTOR
===================================================== */
export const persistor = persistStore(store);

console.log("STORE authApi.reducerPath =", authApi.reducerPath);
