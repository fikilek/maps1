import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { fsError, fsLog } from "./firestoreLogger";
// import { fsLog, fsError } from "../utils/logger";

/**
 * Geography API Slice
 * Idiomatic RTK Query + Firestore streaming
 */
export const geoApi = createApi({
  reducerPath: "geoApi",
  baseQuery: fakeBaseQuery(),
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
       LOCAL MUNICIPALITIES
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
          query(
            collection(db, "localMunicipalities"),
            where("districtId", "==", districtId)
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

      async onCacheEntryAdded(townId, { updateCachedData, cacheEntryRemoved }) {
        if (!townId) return;

        const scope = `Wards(town:${townId})`;
        fsLog(scope, "listener created");

        const unsubscribe = onSnapshot(
          query(collection(db, "wards"), where("townId", "==", townId)),
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
  useGetTownsQuery,
  useGetWardsQuery,
} = geoApi;
