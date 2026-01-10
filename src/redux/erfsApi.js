import NetInfo from "@react-native-community/netinfo";
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase";
import { erfMemory } from "../storage/erfMemory";
import { transformGeoData } from "../utils/geo/parseGeometry";

export const erfsApi = createApi({
  reducerPath: "erfsApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["ERF"],

  endpoints: (builder) => ({
    // -----------------------------------
    // FETCH: ERFs by LM + Ward (Recommended for performance)
    // -----------------------------------
    getErfsByLmAndWard: builder.query({
      async queryFn({ lmPcode, wardPcode }) {
        console.log("getErfsByLmAndWard ----mounted");
        try {
          if (!lmPcode || !wardPcode) return { data: [] };

          const q = query(
            collection(db, "ireps_erfs"),
            where("admin.localMunicipality.pcode", "==", lmPcode),
            where("admin.ward.pcode", "==", wardPcode),
            orderBy("erfId")
          );

          // One-time fetch (no persistent stream)
          const snapshot = await getDocs(q);
          const erfs = snapshot.docs.map((d) => transformGeoData(d));

          return { data: erfs };
        } catch (error) {
          console.error("❌ getErfsByLmAndWard failed", error);
          return { error };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "ERF", id })),
              { type: "ERF", id: "LIST" },
            ]
          : [{ type: "ERF", id: "LIST" }],
      // Keep ERFs for only 1 hour if status updates are frequent
      keepUnusedDataFor: 3600,
    }),

    // -----------------------------------
    // FETCH: ERFs by Local Municipality (Use with caution - can be large!)
    // -----------------------------------
    getErfsByLmPcode: builder.query({
      async queryFn({ lmPcode }) {
        console.log("getErfsByLmPcode ----mounted");
        try {
          if (!lmPcode) return { data: [] };

          const q = query(
            collection(db, "ireps_erfs"),
            where("admin.localMunicipality.pcode", "==", lmPcode),
            orderBy("erfId"),
            limit(100)
          );

          const snapshot = await getDocs(q);
          const erfs = snapshot.docs.map((d) => transformGeoData(d));

          return { data: erfs };
        } catch (error) {
          console.error("❌ getErfsByLmPcode failed", error);
          return { error };
        }
      },
      providesTags: [{ type: "ERF", id: "LIST" }],
      // Keep wards for 48 hours because they almost never change
      keepUnusedDataFor: 172800,
    }),

    // -----------------------------------
    // FETCH: ERFs by Ward ONLY (PRIMARY, SAFE)
    // -----------------------------------

    getErfsByWard: builder.query({
      async queryFn({ wardPcode }) {
        if (!wardPcode) return { data: [] };

        // 1️⃣ MMKV FIRST (instant, offline-safe)
        const cached = erfMemory.getByWard(wardPcode);
        if (cached?.erfs?.length) {
          console.log("📦 ERFs from erfsKV", wardPcode);
          return { data: cached.erfs };
        }

        // 2️⃣ Network check
        const net = await NetInfo.fetch();
        if (!net.isConnected) {
          console.log("📴 Offline, no ERF cache", wardPcode);
          return { data: [] };
        }

        // 3️⃣ Firestore fetch
        try {
          console.log("🌐 ERFs from Firestore", wardPcode);

          const q = query(
            collection(db, "ireps_erfs"),
            where("admin.ward.pcode", "==", wardPcode),
            orderBy("erfId")
          );

          const snap = await getDocs(q);
          const erfs = snap.docs.map(transformGeoData);

          // 4️⃣ Persist to erfsKV
          erfMemory.setByWard(wardPcode, erfs);

          return { data: erfs };
        } catch (error) {
          console.error("❌ getErfsByWard failed", error);
          return { error };
        }
      },

      keepUnusedDataFor: 86400,
    }),

    // getErfsByWard: builder.query({
    //   async queryFn({ wardPcode }) {
    //     console.log("getErfsByWard ----mounted");
    //     console.log("getErfsByWard ----wardPcode", wardPcode);

    //     try {
    //       if (!wardPcode) return { data: [] };

    //       const q = query(
    //         collection(db, "ireps_erfs"),
    //         where("admin.ward.pcode", "==", wardPcode),
    //         orderBy("erfId")
    //       );

    //       const snapshot = await getDocs(q);
    //       const erfs = snapshot.docs.map((d) => transformGeoData(d));

    //       return { data: erfs };
    //     } catch (error) {
    //       console.error("❌ getErfsByWard failed", error);
    //       return { error };
    //     }
    //   },

    //   providesTags: (result) =>
    //     result
    //       ? [
    //           ...result.map(({ id }) => ({ type: "ERF", id })),
    //           { type: "ERF", id: "LIST" },
    //         ]
    //       : [{ type: "ERF", id: "LIST" }],

    //   // ERFs may change (status, services), but geometry is stable
    //   keepUnusedDataFor: 3600,
    // }),
  }),
});

export const {
  useGetErfsByLmPcodeQuery,
  useGetErfsByLmAndWardQuery,
  useGetErfsByWardQuery,
} = erfsApi;
