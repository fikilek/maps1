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

// Helper to parse the stringified geometry back into an object for the cache
const transformErfData = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    geometry:
      typeof data.geometry === "string"
        ? JSON.parse(data.geometry)
        : data.geometry,
  };
};

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
          const erfs = snapshot.docs.map(transformErfData);

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
          const erfs = snapshot.docs.map(transformErfData);

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
  }),
});

export const { useGetErfsByLmPcodeQuery, useGetErfsByLmAndWardQuery } = erfsApi;
