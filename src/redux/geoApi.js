import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { fsError, fsLog } from "./firestoreLogger";

/**
 * Geography API Slice
 * Idiomatic RTK Query + Firestore streaming
 */
export const geoApi = createApi({
  reducerPath: "geoApi",
  baseQuery: fakeBaseQuery(),
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
       LOCAL MUNICIPALITY (BY ID) 🔥 NEW
       REQUIRED FOR MAPS + CASCADING SELECTOR
    ========================= */
    getLocalMunicipalityById: builder.query({
      queryFn: () => ({ data: null }),

      async onCacheEntryAdded(
        localMunicipalityId,
        { updateCachedData, cacheEntryRemoved }
      ) {
        console.log(
          `getLocalMunicipalityById ----localMunicipalityId`,
          localMunicipalityId
        );
        if (!localMunicipalityId) return;

        const scope = `LM(id:${localMunicipalityId})`;
        fsLog(scope, "listener created");

        const unsubscribe = onSnapshot(
          doc(db, "lms", localMunicipalityId),
          (snap) => {
            if (!snap.exists()) {
              fsError(scope, "document does not exist");
              updateCachedData(() => null);
              return;
            }

            fsLog(scope, "snapshot", {
              fromCache: snap.metadata.fromCache,
            });

            updateCachedData(() => ({
              id: snap.id,
              ...snap.data(),
            }));
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

    /* =========================
       GET WARDS BY LOCAL MUNICIPALITY
    ========================= */
    getWardsByLocalMunicipality: builder.query({
      queryFn: async (
        localMunicipalityId,
        { signal, dispatch },
        _extraOptions,
        baseQuery
      ) => {
        if (!localMunicipalityId) {
          return {
            error: {
              status: "BAD_REQUEST",
              error: "localMunicipalityId is required",
            },
          };
        }

        return new Promise((resolve, reject) => {
          const q = query(
            collection(db, "wards"),
            where("parents.localMunicipalityId", "==", localMunicipalityId),
            orderBy("code", "asc")
          );

          const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              const wards = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));

              resolve({ data: wards });
            },
            (error) => {
              console.error("Ward stream error", error);
              reject({ error });
            }
          );

          // 🔥 VERY IMPORTANT: cleanup on unsubscribe
          signal.addEventListener("abort", () => {
            unsubscribe();
          });
        });
      },

      providesTags: (result = []) =>
        result.length
          ? [
              ...result.map(({ id }) => ({ type: "Ward", id })),
              { type: "Ward", id: "LIST" },
            ]
          : [{ type: "Ward", id: "LIST" }],
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
