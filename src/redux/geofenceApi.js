// src/store/api/geofenceApi.js

import { createApi } from "@reduxjs/toolkit/query/react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";

/* =====================================================
   GEOFENCE API
   ===================================================== */

export const geofenceApi = createApi({
  reducerPath: "geofenceApi",
  baseQuery: async () => ({ data: [] }),

  endpoints: (builder) => ({
    /* =====================================================
       STREAM GEOFENCES BY LM + WARD
       ===================================================== */
    getGeoFencesByLmPcodeWardPcode: builder.query({
      queryFn: () => ({ data: [] }),

      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const lmPcode = queryArgs?.lmPcode || "NAv";
        const wardPcode = queryArgs?.wardPcode || "NAv";

        return `${endpointName}_${lmPcode}_${wardPcode}`;
      },

      async onCacheEntryAdded(
        { lmPcode, wardPcode },
        { updateCachedData, cacheEntryRemoved },
      ) {
        if (!lmPcode || !wardPcode) return;

        const q = query(
          collection(db, "geo_fences"),
          where("parents.lmPcode", "==", lmPcode),
          where("parents.wardPcode", "==", wardPcode),
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          updateCachedData(() => data);
        });

        await cacheEntryRemoved;
        unsubscribe();
      },
    }),

    /* =====================================================
       CREATE GEOFENCE (CALLABLE)
       ===================================================== */
    createGeoFence: builder.mutation({
      async queryFn(payload) {
        try {
          const callable = httpsCallable(functions, "createGeoFence");

          const response = await callable(payload);

          return { data: response?.data };
        } catch (error) {
          console.error("geofenceApi.createGeoFence ---- ERROR", error);

          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error?.message || "Failed to create geofence",
            },
          };
        }
      },
    }),
  }),
});

/* =====================================================
   EXPORT HOOKS
   ===================================================== */

export const {
  useGetGeoFencesByLmPcodeWardPcodeQuery,
  useCreateGeoFenceMutation,
} = geofenceApi;
