import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  collection,
  getDocs,
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

const transformToMeta = (id, erf) => {
  return {
    id,
    admin: erf?.admin,
    erfNo: workoutSovereignErf(id)?.erfNo,
    premises: erf.premises || [],
    metadata: erf.metadata,
  };
};

export const erfsApi = createApi({
  reducerPath: "erfsApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["ERF"],

  endpoints: (builder) => ({
    getErfsByLmAndWard: builder.query({
      async queryFn({ lmPcode, wardPcode }) {
        // console.log("getErfsByLmAndWard ----mounted");
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

    getErfsByLmPcode: builder.query({
      async queryFn({ lmPcode }) {
        // 🎯 THE INSTANT STRIKE:
        // We pull from MMKV inside the queryFn.
        // This ensures the VERY FIRST thing the UI sees is the disk data.
        const localMeta = erfMemory.getErfsMetaList(lmPcode) || [];
        const localGeo = erfMemory.getErfsGeoList(lmPcode) || {};
        const wardSet = new Set();
        localMeta.forEach((m) => {
          if (m.admin?.ward?.name) wardSet.add(m.admin.ward.name);
        });

        return {
          data: {
            metaEntries: localMeta,
            geoEntries: localGeo,
            wards: ["ALL", ...Array.from(wardSet)].sort(),
          },
        };
      },

      async onCacheEntryAdded(
        { lmPcode },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};
        try {
          await cacheDataLoaded;

          // 🛑 STEP 2: THE STREAM (Background Delta Sync only)
          const q = query(
            collection(db, "ireps_erfs"),
            where("admin.localMunicipality.pcode", "==", lmPcode),
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) return;

            updateCachedData((draft) => {
              const indexMap = new Map(
                draft.metaEntries.map((m, i) => [m.id, i]),
              );
              let hasChanges = false;

              snapshot.docChanges().forEach((change) => {
                hasChanges = true;
                const erf = change.doc.data();
                const id = erf.erfId || change.doc.id;

                if (change.type === "removed") {
                  const remIdx = indexMap.get(id);
                  if (remIdx !== undefined) {
                    draft.metaEntries.splice(remIdx, 1);
                    delete draft.geoEntries[id];
                  }
                } else {
                  const meta = transformToMeta(id, erf);
                  const existingIdx = indexMap.get(id);
                  if (existingIdx !== undefined) {
                    draft.metaEntries[existingIdx] = meta;
                  } else {
                    draft.metaEntries.push(meta);
                  }

                  if (erf.geometry || erf.centroid) {
                    draft.geoEntries[id] = {
                      centroid: erf.centroid,
                      bbox: erf.bbox,
                      geometry:
                        typeof erf.geometry === "string"
                          ? JSON.parse(erf.geometry)
                          : erf.geometry,
                    };
                  }
                }
              });

              // 🏛️ PERSIST ONLY ON ACTUAL CHANGES
              if (hasChanges) {
                erfMemory.saveBulkErfMeta(lmPcode, draft.metaEntries);
                erfMemory.saveBulkErfGeo(lmPcode, draft.geoEntries);
              }
            });
          });
        } catch (error) {
          console.error("❌ [STREAM ERROR]:", error);
        }
        await cacheEntryRemoved;
        unsubscribe();
      },
    }),

    // getErfsByLmPcode: builder.query({
    //   async queryFn({ lmPcode }) {
    //     return { data: { metaEntries: [], geoEntries: {}, wards: [] } };
    //   },
    //   async onCacheEntryAdded(
    //     { lmPcode },
    //     { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
    //   ) {
    //     let unsubscribe = () => {};
    //     if (!lmPcode) return;

    //     try {
    //       await cacheDataLoaded;

    //       // 🛑 STEP 1: HYDRATION (Instant UI from MMKV)
    //       const localMeta = erfMemory.getErfsMetaList(lmPcode) || [];
    //       const localGeo = erfMemory.getErfsGeoList(lmPcode) || {};
    //       updateCachedData((draft) => {
    //         // Only hydrate if we haven't already filled this cache entry
    //         if (draft.metaEntries.length === 0) {
    //           draft.metaEntries = localMeta;
    //           draft.geoEntries = localGeo;
    //         }
    //       });

    //       // 🛑 STEP 2: THE TRINITY STREAM
    //       const q = query(
    //         collection(db, "ireps_erfs"),
    //         where("admin.localMunicipality.pcode", "==", lmPcode),
    //       );

    //       unsubscribe = onSnapshot(q, (snapshot) => {
    //         // 🛡️ GUARD 1: If Firestore sends an empty packet, do not open the vault.
    //         if (snapshot.empty && snapshot.docChanges().length === 0) {
    //           // console.log("📡 [STREAM]: Received empty snapshot. Guarding disk...");
    //           return;
    //         }

    //         updateCachedData((draft) => {
    //           // 🚀 INDEX ACCELERATION
    //           const indexMap = new Map(
    //             draft.metaEntries.map((m, i) => [m.id, i]),
    //           );

    //           snapshot.docChanges().forEach((change) => {
    //             const erf = change.doc.data();
    //             const id = erf.erfId || change.doc.id;

    //             switch (change.type) {
    //               case "added":
    //                 if (!indexMap.has(id)) {
    //                   draft.metaEntries.push(transformToMeta(id, erf));
    //                 }
    //                 break;
    //               case "modified":
    //                 const modIdx = indexMap.get(id);
    //                 if (modIdx !== undefined) {
    //                   draft.metaEntries[modIdx] = transformToMeta(id, erf);
    //                 }
    //                 break;
    //               case "removed":
    //                 const remIdx = indexMap.get(id);
    //                 if (remIdx !== undefined) {
    //                   draft.metaEntries.splice(remIdx, 1);
    //                   delete draft.geoEntries[id];
    //                 }
    //                 break;
    //             }

    //             // 🛰️ GEOMETRY HANDLER
    //             if (change.type !== "removed") {
    //               if (erf.geometry || erf.centroid) {
    //                 draft.geoEntries[id] = {
    //                   centroid: erf.centroid,
    //                   bbox: erf.bbox,
    //                   geometry:
    //                     typeof erf.geometry === "string"
    //                       ? JSON.parse(erf.geometry)
    //                       : erf.geometry,
    //                 };
    //               }
    //             }
    //           });

    //           // 🛡️ GUARD 2: THE "NO-WIPE" SHIELD
    //           // Only save to disk if we actually have data in RAM.
    //           if (draft.metaEntries.length > 0) {
    //             erfMemory.saveBulkErfMeta(lmPcode, draft.metaEntries);
    //             erfMemory.saveBulkErfGeo(lmPcode, draft.geoEntries);
    //             erfMemory.saveSyncTimestamp(lmPcode);
    //           }

    //           // 📊 RE-CALCULATE WARDS
    //           const wardSet = new Set();
    //           draft.metaEntries.forEach((m) => {
    //             if (m.admin?.ward?.name) wardSet.add(m.admin.ward.name);
    //           });
    //           draft.wards = ["ALL", ...Array.from(wardSet)].sort();
    //         });
    //       });

    //       // unsubscribe = onSnapshot(q, (snapshot) => {
    //       //   updateCachedData((draft) => {
    //       //     const indexMap = new Map(
    //       //       draft.metaEntries.map((m, i) => [m.id, i]),
    //       //     );

    //       //     snapshot.docChanges().forEach((change) => {
    //       //       const erf = change.doc.data();
    //       //       const id = erf.erfId || change.doc.id;

    //       //       switch (change.type) {
    //       //         case "added":
    //       //           if (!indexMap.has(id)) {
    //       //             draft.metaEntries.push(transformToMeta(id, erf));
    //       //           }
    //       //           break;

    //       //         case "modified":
    //       //           const modIdx = indexMap.get(id);
    //       //           if (modIdx !== undefined) {
    //       //             draft.metaEntries[modIdx] = transformToMeta(id, erf);
    //       //           }
    //       //           break;

    //       //         case "removed":
    //       //           const remIdx = indexMap.get(id);
    //       //           if (remIdx !== undefined) {
    //       //             draft.metaEntries.splice(remIdx, 1);
    //       //             delete draft.geoEntries[id];
    //       //           }
    //       //           break;
    //       //       }

    //       //       // 🛰️ GEOMETRY HANDLER (For Added/Modified)
    //       //       if (change.type !== "removed") {
    //       //         if (erf.geometry || erf.centroid) {
    //       //           draft.geoEntries[id] = {
    //       //             centroid: erf.centroid,
    //       //             bbox: erf.bbox,
    //       //             geometry:
    //       //               typeof erf.geometry === "string"
    //       //                 ? JSON.parse(erf.geometry)
    //       //                 : erf.geometry,
    //       //           };
    //       //         }
    //       //       }
    //       //     });

    //       //     // 🏛️ PERSIST TO DISK (Bulk update)
    //       //     erfMemory.saveBulkErfMeta(lmPcode, draft.metaEntries); // Array of erfs
    //       //     erfMemory.saveBulkErfGeo(lmPcode, draft.geoEntries); // Object of geos

    //       //     // 📊 RE-CALCULATE WARDS
    //       //     const wardSet = new Set();
    //       //     draft.metaEntries.forEach((m) => {
    //       //       if (m.admin?.ward?.name) wardSet.add(m.admin.ward.name);
    //       //     });
    //       //     draft.wards = ["ALL", ...Array.from(wardSet)].sort();
    //       //   });
    //       // });
    //     } catch (error) {
    //       console.error("❌ [ERF STREAM ERROR]:", error);
    //     }

    //     await cacheEntryRemoved;
    //     unsubscribe();
    //   },
    // }),

    // getErfsByLmPcode: builder.query({
    //   async queryFn({ lmPcode }) {
    //     return { data: { metaEntries: [], geoEntries: {}, wards: [] } };
    //   },

    //   keepUnusedDataFor: 3600,

    //   async onCacheEntryAdded(
    //     { lmPcode },
    //     { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
    //   ) {
    //     let unsubscribe = () => {};
    //     if (!lmPcode) return;

    //     try {
    //       await cacheDataLoaded;

    //       // 🛑 STEP 1: INSTANT HYDRATION FROM VAULT
    //       const localMeta = erfMemory.getErfsMetaList(lmPcode) || [];
    //       const localGeo = erfMemory.getErfsGeoList(lmPcode) || {};
    //       const lastSync = erfMemory.getLastSyncTimestamp(lmPcode);

    //       updateCachedData((draft) => {
    //         if (draft.metaEntries.length === 0) {
    //           const wardSet = new Set();
    //           localMeta.forEach((m) => {
    //             if (m.admin?.ward?.name) wardSet.add(m.admin.ward.name);
    //           });

    //           draft.metaEntries = localMeta;
    //           draft.geoEntries = localGeo;
    //           draft.wards = ["ALL", ...Array.from(wardSet)].sort();
    //         }
    //       });

    //       // 🛑 STEP 2: DELTA STRATEGY SETUP
    //       const lastSyncDate = lastSync ? new Date(lastSync) : new Date(0);
    //       const isFresh = (new Date() - lastSyncDate) / (1000 * 60 * 60) < 24;

    //       let q = query(
    //         collection(db, "ireps_erfs"),
    //         where("admin.localMunicipality.pcode", "==", lmPcode),
    //         orderBy("metadata.updatedAt", "desc"),
    //       );

    //       if (isFresh && localMeta.length > 0) {
    //         q = query(
    //           q,
    //           where("metadata.updatedAt", ">", lastSyncDate.toISOString()),
    //         );
    //       }

    //       // 🏛️ STEP 3: THE SOVEREIGN SYNC (Optimized for Knysna)
    //       unsubscribe = onSnapshot(q, (snapshot) => {
    //         if (snapshot.empty) return;

    //         updateCachedData((draft) => {
    //           const changes = snapshot.docChanges();

    //           // 🚀 INDEX ACCELERATION: Map current IDs to their array position
    //           // This stops the O(N) findIndex "CPU Burn" on large datasets
    //           const indexMap = new Map(
    //             draft.metaEntries.map((m, i) => [m.id, i]),
    //           );

    //           changes.forEach((change) => {
    //             const erf = change.doc.data();
    //             const id = erf.erfId || change.doc.id;
    //             const meta = transformToMeta(id, erf);

    //             const existingIdx = indexMap.get(id);

    //             if (existingIdx !== undefined) {
    //               draft.metaEntries[existingIdx] = meta;
    //             } else {
    //               draft.metaEntries.push(meta);
    //               indexMap.set(id, draft.metaEntries.length - 1);
    //             }

    //             // 🛑 REMOVED: erfMemory.saveSingleErfMeta(lmPcode, id, meta);
    //             // NO DISK I/O IN THE LOOP
    //           });

    //           // 🏛️ THE BULK STRIKE: Save the whole result to MMKV ONCE after the loop
    //           erfMemory.saveBulkErfMeta(lmPcode, draft.metaEntries);
    //           erfMemory.saveSyncTimestamp(lmPcode);

    //           // 📊 RE-CALCULATE WARDS (Once per snapshot, not once per doc)
    //           const wardSet = new Set();
    //           draft.metaEntries.forEach((m) => {
    //             if (m.admin?.ward?.name) wardSet.add(m.admin.ward.name);
    //           });
    //           draft.wards = ["ALL", ...Array.from(wardSet)].sort();
    //         });
    //       });
    //     } catch (error) {
    //       console.error("❌ [STREAM ERROR]:", error);
    //     }

    //     await cacheEntryRemoved;
    //     unsubscribe();
    //   },
    // }),

    // getErfsByLmPcode: builder.query({
    //   // 🎯 Fix: Wrap in queryFn to satisfy fakeBaseQuery requirements
    //   async queryFn({ lmPcode }) {
    //     // We return an empty success because the real data flows through onCacheEntryAdded
    //     return { data: { metaEntries: [], geoEntries: {}, wards: [] } };
    //   },

    //   keepUnusedDataFor: 3600, // 1 Hour Management Cache

    //   async onCacheEntryAdded(
    //     { lmPcode },
    //     { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
    //   ) {
    //     // console.log(`getErfsByLmPcode --onCacheEntryAdded --lmPcode`, lmPcode);
    //     let unsubscribe = () => {};
    //     if (!lmPcode) return;

    //     try {
    //       await cacheDataLoaded;

    //       // 🛑 STEP 1: INSTANT HYDRATION FROM VAULT
    //       const localMeta = erfMemory.getErfsMetaList(lmPcode) || [];
    //       const localGeo = erfMemory.getErfsGeoList(lmPcode) || {};
    //       const lastSync = erfMemory.getLastSyncTimestamp(lmPcode);

    //       updateCachedData((draft) => {
    //         // Only hydrate if we haven't already filled this cache entry
    //         if (draft.metaEntries.length === 0) {
    //           const wardSet = new Set();
    //           localMeta.forEach((m) => {
    //             if (m.admin?.ward?.name) wardSet.add(m.admin.ward.name);
    //           });

    //           draft.metaEntries = localMeta;
    //           draft.geoEntries = localGeo;
    //           draft.wards = ["ALL", ...Array.from(wardSet)].sort();
    //         }
    //       });

    //       // 🛑 STEP 2: DELTA STRATEGY
    //       const lastSyncDate = lastSync ? new Date(lastSync) : new Date(0);
    //       const isFresh = (new Date() - lastSyncDate) / (1000 * 60 * 60) < 24;

    //       let q = query(
    //         collection(db, "ireps_erfs"),
    //         where("admin.localMunicipality.pcode", "==", lmPcode),
    //         orderBy("metadata.updatedAt", "desc"),
    //       );

    //       if (isFresh && localMeta.length > 0) {
    //         q = query(
    //           q,
    //           where("metadata.updatedAt", ">", lastSyncDate.toISOString()),
    //         );
    //       }

    //       // 🏛️ SOVEREIGN SNAPSHOT ENGINE (SURGICAL CASE-BASED)
    //       unsubscribe = onSnapshot(q, (snapshot) => {
    //         if (snapshot.empty) return;

    //         // 🎯 Open the Draft Portal ONCE
    //         updateCachedData((draft) => {
    //           snapshot.docChanges().forEach((change) => {
    //             const erf = change.doc.data();
    //             const id = erf.erfId || change.doc.id;

    //             // 🚀 1. META SURGERY (Your Original Schema)
    //             const meta = transformToMeta(id, erf);
    //             const idx = draft.metaEntries.findIndex((m) => m.id === id);

    //             if (idx !== -1) {
    //               draft.metaEntries[idx] = meta;
    //             } else {
    //               draft.metaEntries.push(meta);
    //             }

    //             // ⚡️ DISK SAVE: Surgical and light
    //             erfMemory.saveSingleErfMeta(lmPcode, id, meta);

    //             // 🚀 2. GEO SURGERY: Keep the Map Alive
    //             // We only update the key if it's an add or modify.
    //             // This ensures the other 4,103 stay in RAM!
    //             // if (change.type === "added" || change.type === "modified") {
    //             //   if (erf.geometry || erf.centroid) {
    //             //     draft.geoEntries[id] = {
    //             //       centroid: erf.centroid,
    //             //       bbox: erf.bbox,
    //             //       geometry:
    //             //         typeof erf.geometry === "string"
    //             //           ? JSON.parse(erf.geometry)
    //             //           : erf.geometry,
    //             //     };
    //             //   }
    //             // } else if (change.type === "removed") {
    //             //   delete draft.geoEntries[id];
    //             // }
    //           });

    //           // 🚀 4. TIMESTAMP SECURE
    //           erfMemory.saveSyncTimestamp(lmPcode);
    //         });
    //       });
    //     } catch (error) {
    //       console.error("❌ [STREAM ERROR]:", error);
    //     }

    //     await cacheEntryRemoved;
    //     unsubscribe();
    //   },
    // }),

    getErfsByCountryCode: builder.query({
      async queryFn() {
        return { data: [] };
      },
      async onCacheEntryAdded(
        { id }, // 🎯 THE SOVEREIGN OBJECT ARGUMENT
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};
        try {
          await cacheDataLoaded;
          if (!id) return;

          // 🛡️ Anchoring to the Admin Hierarchy
          const q = query(
            collection(db, "ireps_erfs"),
            where("admin.country.pcode", "==", id),
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            updateCachedData(() => {
              return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
            });
          });
        } catch (error) {
          console.error("❌ [NATIONAL ERF ERROR]:", error);
        }

        await cacheEntryRemoved;
        unsubscribe();
      },
    }),
  }),
});

export const {
  useGetErfsByLmPcodeQuery,
  useGetErfsByLmAndWardQuery,
  useGetErfsByCountryCodeQuery,
} = erfsApi;
