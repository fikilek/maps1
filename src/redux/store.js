import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";

import { authApi } from "./authApi";
import { geoApi } from "./geoApi";

import { reduxStorage } from "./reduxStorage";

// Example future slices (if/when you add them)
import { astsApi } from "./astsApi";
import { erfsApi } from "./erfsApi";
import offlineReducer from "./offlineSlice";
import { premisesApi } from "./premisesApi";
import { salesApi } from "./salesApi";
import { settingsApi } from "./settingsApi";
import { spApi } from "./spApi";
import { trnsApi } from "./trnsApi";
import { usersApi } from "./usersApi";
// import uiReducer from "./uiSlice";
import newTrnsReducer from "./newTrnsSlice";

/* =====================================================
   ROOT REDUCER
===================================================== */
const rootReducer = combineReducers({
  // RTK Query APIs
  [geoApi.reducerPath]: geoApi.reducer,
  [authApi.reducerPath]: authApi.reducer,
  [usersApi.reducerPath]: usersApi.reducer,
  [spApi.reducerPath]: spApi.reducer,
  [erfsApi.reducerPath]: erfsApi.reducer,
  [premisesApi.reducerPath]: premisesApi.reducer,
  [trnsApi.reducerPath]: trnsApi.reducer,
  [settingsApi.reducerPath]: settingsApi.reducer,
  [astsApi.reducerPath]: astsApi.reducer,
  [salesApi.reducerPath]: salesApi.reducer,
  // App-level slices (example)
  offline: offlineReducer,
  newTrns: newTrnsReducer,
  // ui: uiReducer,
});

/* =====================================================
   REDUX PERSIST CONFIG
===================================================== */
const persistConfig = {
  key: "root",
  version: 2, // <-- bump this
  storage: reduxStorage,
  whitelist: [
    "offline",
    usersApi.reducerPath,
    spApi.reducerPath,
    erfsApi.reducerPath,
    trnsApi.reducerPath,
    settingsApi.reducerPath,
    astsApi.reducerPath,
  ],
  blacklist: [
    authApi.reducerPath,
    geoApi.reducerPath,
    premisesApi.reducerPath,
    salesApi.reducerPath,
    "newTrns",
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
      serializableCheck: false,
      immutableCheck: false,
    }).concat(
      geoApi.middleware,
      authApi.middleware,
      usersApi.middleware,
      spApi.middleware,
      erfsApi.middleware,
      premisesApi.middleware,
      trnsApi.middleware,
      settingsApi.middleware,
      astsApi.middleware,
      salesApi.middleware,
    ),
});

/* =====================================================
   PERSISTOR
===================================================== */
export const persistor = persistStore(store);

// console.log("STORE authApi.reducerPath =", authApi.reducerPath);
