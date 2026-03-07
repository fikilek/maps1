import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from "redux-persist";

import { reduxStorage } from "./reduxStorage";

import { astsApi } from "./astsApi";
import { authApi } from "./authApi";
import { erfsApi } from "./erfsApi";
import { geoApi } from "./geoApi";
import { premisesApi } from "./premisesApi";
import { salesApi } from "./salesApi";
import { settingsApi } from "./settingsApi";
import { spApi } from "./spApi";
import { trnsApi } from "./trnsApi";
import { usersApi } from "./usersApi";

import newTrnsReducer from "./newTrnsSlice";
import offlineReducer from "./offlineSlice";

/* =====================================================
   ROOT REDUCER
===================================================== */
const rootReducer = combineReducers({
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

  offline: offlineReducer,
  newTrns: newTrnsReducer,
});

/* =====================================================
   REDUX PERSIST CONFIG
===================================================== */
const persistConfig = {
  key: "root",
  version: 2,
  storage: reduxStorage,

  // Keep persisted state small + valuable
  whitelist: ["offline"],

  // Never persist auth + large/sensitive caches
  blacklist: [
    erfsApi.reducerPath,
    usersApi.reducerPath,
    spApi.reducerPath,
    trnsApi.reducerPath,
    settingsApi.reducerPath,
    astsApi.reducerPath,
    authApi.reducerPath,
    geoApi.reducerPath,
    premisesApi.reducerPath,
    salesApi.reducerPath,
    "newTrns",
  ],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

/* =====================================================
   STORE
===================================================== */
export const store = configureStore({
  reducer: persistedReducer,

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: __DEV__
        ? false
        : {
            ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
          },
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

export const persistor = persistStore(store);

// ✅ RTK Query listeners (recommended)
setupListeners(store.dispatch);
