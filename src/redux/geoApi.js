import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
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
  // 🔥 Keep data in cache for 24 hours (86400 seconds)
  keepUnusedDataFor: 86400,
  tagTypes: [
    "Country",
    "Province",
    "District",
    "LocalMunicipality",
    "Town",
    "Ward", // 🔥 ADD THIS
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
              }))
            );
          },
          (error) => fsError(scope, "snapshot error", error)
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
        { updateCachedData, cacheEntryRemoved }
      ) {
        if (!countryId) return;

        const scope = `Provinces(country:${countryId})`;
        fsLog(scope, "listener created");

        const unsubscribe = onSnapshot(
          query(
            collection(db, "provinces"),
            where("countryId", "==", countryId)
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
              }))
            );
          },
          (error) => fsError(scope, "snapshot error", error)
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
        { updateCachedData, cacheEntryRemoved }
      ) {
        if (!provinceId) return;

        const scope = `Districts(province:${provinceId})`;
        fsLog(scope, "listener created");

        const unsubscribe = onSnapshot(
          query(
            collection(db, "districtMunicipalities"),
            where("provinceId", "==", provinceId)
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
              }))
            );
          },
          (error) => fsError(scope, "snapshot error", error)
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
        { updateCachedData, cacheEntryRemoved }
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
              }))
            );
          },
          (error) => fsError(scope, "snapshot error", error)
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

    // getLocalMunicipalityById: builder.query({
    //   async queryFn(lmId) {
    //     if (!lmId) return { data: null };
    //     try {
    //       // Pointing to your 'localMunicipalities' collection
    //       const docRef = doc(db, "lms", lmId);
    //       const snap = await getDoc(docRef);
    //       if (!snap.exists()) return { error: "Municipality not found" };

    //       return { data: { id: snap.id, ...snap.data() } };
    //     } catch (error) {
    //       console.log(`getLocalMunicipalityById ----error`, error);
    //       return { error };
    //     }
    //   },
    // }),
    // getLocalMunicipalityById: builder.query({
    //   queryFn: () => ({ data: null }),

    //   async onCacheEntryAdded(
    //     localMunicipalityId,
    //     { updateCachedData, cacheEntryRemoved }
    //   ) {
    //     console.log(
    //       `getLocalMunicipalityById ----localMunicipalityId`,
    //       localMunicipalityId
    //     );
    //     if (!localMunicipalityId) return;

    //     const scope = `LM(id:${localMunicipalityId})`;
    //     fsLog(scope, "listener created");

    //     const unsubscribe = onSnapshot(
    //       doc(db, "lms", localMunicipalityId),
    //       (snap) => {
    //         if (!snap.exists()) {
    //           fsError(scope, "document does not exist");
    //           updateCachedData(() => null);
    //           return;
    //         }

    //         fsLog(scope, "snapshot", {
    //           fromCache: snap.metadata.fromCache,
    //         });

    //         updateCachedData(() => ({
    //           id: snap.id,
    //           ...snap.data(),
    //         }));
    //       },
    //       (error) => fsError(scope, "snapshot error", error)
    //     );

    //     await cacheEntryRemoved;
    //     fsLog(scope, "listener unsubscribed");
    //     unsubscribe();
    //   },
    // }),

    /* =========================
       TOWNS
    ========================= */
    getTowns: builder.query({
      queryFn: () => ({ data: [] }),

      async onCacheEntryAdded(
        localMunicipalityId,
        { updateCachedData, cacheEntryRemoved }
      ) {
        if (!localMunicipalityId) return;

        const scope = `Towns(LM:${localMunicipalityId})`;
        fsLog(scope, "listener created");

        const unsubscribe = onSnapshot(
          query(
            collection(db, "towns"),
            where("localMunicipalityId", "==", localMunicipalityId)
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
              }))
            );
          },
          (error) => fsError(scope, "snapshot error", error)
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
        { updateCachedData, cacheEntryRemoved, getState }
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
          (error) => fsError(scope, "snapshot error", error)
        );

        await cacheEntryRemoved;
        fsLog(scope, "listener unsubscribed");
        unsubscribe();
      },
    }),

    /* =========================
       GET WARDS BY LOCAL MUNICIPALITY
    ========================= */
    getWardsByLocalMunicipality: builder.query({
      async queryFn(lmPcode) {
        // console.log(`getWardsByLocalMunicipality ----lmPcode`, lmPcode);
        if (!lmPcode) return { data: [] };
        try {
          const q = query(
            collection(db, "wards"),
            where("parents.localMunicipalityId", "==", lmPcode),
            orderBy("code", "asc")
          );
          const snap = await getDocs(q);
          const wards = snap.docs.map((d) => transformGeoData(d));
          // console.log(`getWardsByLocalMunicipality ----wards`, wards);
          return { data: wards };
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
  useGetLocalMunicipalitiesQuery,
  useGetLocalMunicipalityByIdQuery, // 🔥 NEW
  useGetTownsQuery,
  useGetWardsQuery,
  useGetWardsByLocalMunicipalityQuery,
} = geoApi;
