import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { REHYDRATE } from "redux-persist";
import { db } from "../firebase";
import { transformGeoData } from "../utils/geo/parseGeometry";
import { authApi } from "./authApi";
import { fsError, fsLog } from "./firestoreLogger";

/**
 * Geography API Slice
 * Idiomatic RTK Query + Firestore streaming
 */
export const geoApi = createApi({
  reducerPath: "geoApi",
  baseQuery: fakeBaseQuery(),
  extractRehydrationInfo(action, { reducerPath }) {
    if (action.type === REHYDRATE) {
      return action.payload?.[reducerPath];
    }
  },
  // 🔥 Keep data in cache for 24 hours (86400 seconds)
  keepUnusedDataFor: 86400,
  tagTypes: [
    "Country",
    "Province",
    "District",
    "LocalMunicipality",
    "Town",
    "Ward", // 🔥 ADD THIS
    "LMs",
  ],
  endpoints: (builder) => ({
    /* =========================
       COUNTRIES
    ========================= */
    getCountries: builder.query({
      queryFn: () => ({ data: [] }),

      async onCacheEntryAdded(_, { updateCachedData, cacheEntryRemoved }) {
        const scope = "Countries";
        fsLog(scope, "listener created");

        const unsubscribe = onSnapshot(
          collection(db, "countries"),
          (snap) => {
            fsLog(scope, "snapshot", {
              size: snap.size,
              fromCache: snap.metadata.fromCache,
            });

            updateCachedData(() =>
              snap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
              })),
            );
          },
          (error) => fsError(scope, "snapshot error", error),
        );

        await cacheEntryRemoved;
        fsLog(scope, "listener unsubscribed");
        unsubscribe();
      },
    }),

    /* =========================
       PROVINCES
    ========================= */
    getProvinces: builder.query({
      queryFn: () => ({ data: [] }),

      async onCacheEntryAdded(
        countryId,
        { updateCachedData, cacheEntryRemoved },
      ) {
        if (!countryId) return;

        const scope = `Provinces(country:${countryId})`;
        fsLog(scope, "listener created");

        const unsubscribe = onSnapshot(
          query(
            collection(db, "provinces"),
            where("countryId", "==", countryId),
          ),
          (snap) => {
            fsLog(scope, "snapshot", {
              size: snap.size,
              fromCache: snap.metadata.fromCache,
            });

            updateCachedData(() =>
              snap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
              })),
            );
          },
          (error) => fsError(scope, "snapshot error", error),
        );

        await cacheEntryRemoved;
        fsLog(scope, "listener unsubscribed");
        unsubscribe();
      },
    }),

    /* =========================
       DISTRICT MUNICIPALITIES
    ========================= */
    getDistricts: builder.query({
      queryFn: () => ({ data: [] }),

      async onCacheEntryAdded(
        provinceId,
        { updateCachedData, cacheEntryRemoved },
      ) {
        if (!provinceId) return;

        const scope = `Districts(province:${provinceId})`;
        fsLog(scope, "listener created");

        const unsubscribe = onSnapshot(
          query(
            collection(db, "districtMunicipalities"),
            where("provinceId", "==", provinceId),
          ),
          (snap) => {
            fsLog(scope, "snapshot", {
              size: snap.size,
              fromCache: snap.metadata.fromCache,
            });

            updateCachedData(() =>
              snap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
              })),
            );
          },
          (error) => fsError(scope, "snapshot error", error),
        );

        await cacheEntryRemoved;
        fsLog(scope, "listener unsubscribed");
        unsubscribe();
      },
    }),

    /* =========================
       LOCAL MUNICIPALITIES (BY DISTRICT)
    ========================= */
    getLocalMunicipalities: builder.query({
      queryFn: () => ({ data: [] }),

      async onCacheEntryAdded(
        districtId,
        { updateCachedData, cacheEntryRemoved },
      ) {
        if (!districtId) return;

        const scope = `LM(district:${districtId})`;
        fsLog(scope, "listener created");

        const unsubscribe = onSnapshot(
          query(collection(db, "lms"), where("districtId", "==", districtId)),
          (snap) => {
            fsLog(scope, "snapshot", {
              size: snap.size,
              fromCache: snap.metadata.fromCache,
            });

            updateCachedData(() =>
              snap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
              })),
            );
          },
          (error) => fsError(scope, "snapshot error", error),
        );

        await cacheEntryRemoved;
        fsLog(scope, "listener unsubscribed");
        unsubscribe();
      },
    }),

    /* =========================
       LOCAL MUNICIPALITY (BY ID) 🔥 NEW
       REQUIRED FOR MAPS + CASCADING SELECTOR
    ========================= */
    getLocalMunicipalityById: builder.query({
      async queryFn(lmId) {
        if (!lmId) return { data: null };

        try {
          const docRef = doc(db, "lms", lmId);
          const snap = await getDoc(docRef);

          if (!snap.exists()) {
            return { error: "Municipality not found" };
          }

          // 🔥 THIS IS THE FIX
          return { data: transformGeoData(snap) };
        } catch (error) {
          console.error("getLocalMunicipalityById error", error);
          return { error };
        }
      },
    }),

    /* =========================
       LOCAL MUNICIPALITIES (BY COUNTRY)
    ========================= */

    // 🌍 THE GLOBAL LM REGISTRY
    getLmsByCountry: builder.query({
      async queryFn() {
        // Initial empty load – actual data is streamed via onCacheEntryAdded
        return { data: [] };
      },

      async onCacheEntryAdded(
        countryId,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};
        try {
          await cacheDataLoaded;

          console.log(`🛰️ LM REGISTRY START: Scoping to [${countryId}]`);

          // 🎯 Target the 'parents.countryId' based on your Firestore doc structure
          const q = query(
            collection(db, "lms"),
            where("parents.countryId", "==", countryId),
          );

          unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              const lmsList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));

              // Update the cache with the live list
              updateCachedData(() => lmsList);
            },
            (error) => {
              console.error("geoApi snapshot error:", error);
            },
          );
        } catch (error) {
          console.error("🛰️ Stream Error:", error);
        }

        await cacheEntryRemoved;
        console.log("🛰️ LM REGISTRY STOP");
        unsubscribe();
      },
      providesTags: ["LMs"],
    }),

    /* =========================
       TOWNS
    ========================= */
    getTowns: builder.query({
      queryFn: () => ({ data: [] }),

      async onCacheEntryAdded(
        localMunicipalityId,
        { updateCachedData, cacheEntryRemoved },
      ) {
        if (!localMunicipalityId) return;

        const scope = `Towns(LM:${localMunicipalityId})`;
        fsLog(scope, "listener created");

        const unsubscribe = onSnapshot(
          query(
            collection(db, "towns"),
            where("localMunicipalityId", "==", localMunicipalityId),
          ),
          (snap) => {
            fsLog(scope, "snapshot", {
              size: snap.size,
              fromCache: snap.metadata.fromCache,
            });

            updateCachedData(() =>
              snap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
              })),
            );
          },
          (error) => fsError(scope, "snapshot error", error),
        );

        await cacheEntryRemoved;
        fsLog(scope, "listener unsubscribed");
        unsubscribe();
      },
    }),

    /* =========================
       WARDS
    ========================= */
    getWards: builder.query({
      queryFn: () => ({ data: [] }),

      async onCacheEntryAdded(
        townId,
        { updateCachedData, cacheEntryRemoved, getState },
      ) {
        if (!townId) return;

        // 🔒 AUTH GUARD (CRITICAL)
        const state = getState();
        const authState = authApi.endpoints.getAuthState.select()(state)?.data;

        if (!authState?.isAuthenticated) {
          fsLog("Wards", "listener blocked (not authenticated)");
          return;
        }

        const scope = `Wards(town:${townId})`;
        fsLog(scope, "listener created");

        const unsubscribe = onSnapshot(
          query(collection(db, "wards"), where("townId", "==", townId)),
          (snap) => {
            fsLog(scope, "snapshot", {
              size: snap.size,
              fromCache: snap.metadata.fromCache,
            });

            updateCachedData(() => snap.docs.map((d) => transformGeoData(d)));
          },
          (error) => fsError(scope, "snapshot error", error),
        );

        await cacheEntryRemoved;
        fsLog(scope, "listener unsubscribed");
        unsubscribe();
      },
    }),

    /* =========================
   GET WARDS BY LOCAL MUNICIPALITY (OBJECT-STANDARD)
========================= */

    // getWardsByLocalMunicipality: builder.query({
    //   queryFn: (lmPcode) => ({
    //     data: {
    //       entries: [], // full ward docs (WITH geometry)
    //       sync: {
    //         status: "idle", // idle | syncing | ready | error
    //         lmPcode,
    //         firstSnapshotAt: 0,
    //         lastSyncAt: 0,
    //         lastError: null,
    //       },
    //     },
    //   }),

    //   async onCacheEntryAdded(
    //     lmPcode,
    //     { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
    //   ) {
    //     if (!lmPcode) return;
    //     await cacheDataLoaded;

    //     let first = true;

    //     updateCachedData((draft) => {
    //       draft.sync.status = "syncing";
    //       draft.sync.lmPcode = lmPcode;
    //       draft.sync.lastError = null;
    //     });

    //     const q = query(
    //       collection(db, "wards"),
    //       where("parents.localMunicipalityId", "==", lmPcode),
    //     );

    //     const unsubscribe = onSnapshot(
    //       q,
    //       (snap) => {
    //         updateCachedData((draft) => {
    //           if (first) {
    //             first = false;
    //             draft.sync.status = "ready";
    //             draft.sync.firstSnapshotAt = Date.now();
    //           }
    //           draft.sync.lastSyncAt = Date.now();

    //           // simplest + stable: rebuild list each snapshot
    //           draft.entries = snap.docs
    //             .map((d) => transformGeoData(d))
    //             .sort((a, b) => (a.code ?? 0) - (b.code ?? 0));
    //         });
    //       },
    //       (error) => {
    //         console.error("❌ WARDS snapshot error:", error);
    //         updateCachedData((draft) => {
    //           draft.sync.status = "error";
    //           draft.sync.lastError = String(error?.message || error);
    //         });
    //       },
    //     );

    //     await cacheEntryRemoved;
    //     unsubscribe();
    //   },
    // }),

    getWardsByLocalMunicipality: builder.query({
      queryFn: (lmPcode) => ({ data: [] }),

      async onCacheEntryAdded(
        lmPcode,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        if (!lmPcode) return;
        await cacheDataLoaded;

        const q = query(
          collection(db, "wards"),
          where("parents.localMunicipalityId", "==", lmPcode),
        );

        const unsubscribe = onSnapshot(
          q,
          (snap) => {
            console.log("✅ wards snap size:", snap.size, "lmPcode:", lmPcode);
            const wards = snap.docs
              .map((d) => transformGeoData(d))
              .sort((a, b) => (a.code ?? 0) - (b.code ?? 0));
            updateCachedData(() => wards);
          },
          (error) => {
            console.error("❌ WARDS onSnapshot error:", error);
          },
        );

        await cacheEntryRemoved;
        unsubscribe();
      },
    }),

    /* =========================
       GET WARDS BY LOCAL MUNICIPALITY
    ========================= */
    getWardByName: builder.query({
      async queryFn(name) {
        // console.log(`getWardsByLocalMunicipality ----lmPcode`, lmPcode);
        if (!name) return { data: null };
        try {
          const q = query(collection(db, "wards"), where("name", "==", name));
          const snap = await getDocs(q);

          if (snap.docs.length > 0) {
            // Access the first document if it exists
            const doc = snap.docs[0];
            console.log("Found ward document ID:", doc.id);
            return { data: doc };
          } else {
            console.log("No matching document found!");
            return { data: null };
          }
        } catch (error) {
          return { error };
        }
      },
    }),
  }),
});

/* =========================
   AUTO-GENERATED HOOKS
========================= */
export const {
  useGetCountriesQuery,
  useGetProvincesQuery,
  useGetDistrictsQuery,
  useGetLmsByCountryQuery,
  useGetLocalMunicipalitiesQuery,
  useGetLocalMunicipalityByIdQuery, // 🔥 NEW
  useGetTownsQuery,
  useGetWardsQuery,
  useGetWardsByLocalMunicipalityQuery,
  useGetWardByNameQuery,
} = geoApi;
