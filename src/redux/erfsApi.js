import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase";
import { erfMemory } from "../storage/erfMemory";
import { transformGeoData } from "../utils/geo/parseGeometry";

const workoutSovereignErf = (id) => {
  if (!id) return { erfNo: "N/A" };

  // 🏛️ Following your exact formula:
  // Next 8 Digits (Start at index 8, length 8)
  const erfBlock = id.substring(13, 20).replace(/^0+/, "");
  const erfMain = parseInt(erfBlock, 8);

  // Final 5 Digits (Start at index 16, length 5)
  const portionBlock = id.substring(21, 26).replace(/^0+/, "");
  const portion = parseInt(portionBlock, 6);

  // 🏛️ Constructing the Identity
  // If portion is 0, it's just the Erf. If portion > 0, it's Erf/Portion
  const erfNo =
    Number(portionBlock) === 0 ? `${erfBlock}` : `${erfBlock}/${portionBlock}`;

  return {
    erfNo,
    parcelNo: erfMain,
    portion: portion,
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
            orderBy("erfId"),
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
    // FETCH: ERFs by Local Municipality PCODE
    // -----------------------------------
    getErfsByLmPcode: builder.query({
      async queryFn({ lmPcode }) {
        // We return an empty structure initially; onCacheEntryAdded fills the "shelves"
        return { data: { metaEntries: [], geoEntries: {}, wards: [] } };
      },

      async onCacheEntryAdded(
        { lmPcode },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};
        if (!lmPcode) return;

        try {
          await cacheDataLoaded;

          console.log(`📡 [STREAM]: Opening Erf Pipe for LM: ${lmPcode}`);

          const q = query(
            collection(db, "ireps_erfs"),
            where("admin.localMunicipality.pcode", "==", lmPcode),
            orderBy("erfId"),
            limit(50),
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            // 1. Prepare the fresh data from the snapshot
            const metaEntries = [];
            const geoEntries = {};
            const wardSet = new Set();

            snapshot.docs.forEach((doc) => {
              const erf = transformGeoData(doc);

              // Construct the lightweight Meta object
              const meta = {
                id: erf.erfId,
                admin: erf?.admin,
                erf: erf.erf,
                erfNo: workoutSovereignErf(erf.erfId)?.erfNo,
                premises: erf.premises || [], // 🎯 THIS is what the Cloud Function updates!
              };

              metaEntries.push(meta);

              // Construct the heavy Geo object
              geoEntries[erf.erfId] = {
                centroid: erf.centroid,
                bbox: erf.bbox,
                geometry: erf.geometry,
              };

              if (erf.admin?.ward?.name) wardSet.add(erf.admin.ward.name);
            });

            // 2. 💉 UPDATE RAM (Redux State)
            updateCachedData((draft) => {
              draft.metaEntries = metaEntries;
              draft.geoEntries = geoEntries;
              draft.wards = ["ALL", ...Array.from(wardSet)].sort();
            });

            // 3. 📦 VAULT TO DISK (MMKV)
            // Since we are inside the stream, this happens AUTOMATICALLY
            // whenever a premise is added and the Cloud Function finishes!
            erfMemory.saveErfsMetaList(lmPcode, metaEntries);
            erfMemory.saveErfsGeoList(lmPcode, geoEntries);

            console.log(
              `✅ [VAULT SYNC]: ${metaEntries.length} Erfs secured to MMKV.`,
            );
          });
        } catch (error) {
          console.error("❌ [STREAM ERROR]:", error);
        }

        // Clean up the listener when the user leaves the map/municipality
        await cacheEntryRemoved;
        unsubscribe();
      },
    }),
  }),
});

export const { useGetErfsByLmPcodeQuery, useGetErfsByLmAndWardQuery } = erfsApi;
