import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { REHYDRATE } from "redux-persist";
import { db } from "../firebase";
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
  tagTypes: ["ERF"],
  keepUnusedDataFor: 31536000,
  baseQuery: fakeBaseQuery(),
  extractRehydrationInfo(action, { reducerPath }) {
    if (action.type === REHYDRATE) {
      return action.payload?.[reducerPath];
    }
  },
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
      queryFn: (lmPcode) => ({
        data: {
          metaEntries: [],
          geoEntries: {},
          sync: {
            status: "idle", // idle | syncing | ready | error
            lmPcode,
            lastSyncAt: 0,
            firstSnapshotAt: 0,
          },
        },
      }),

      async onCacheEntryAdded(
        lmPcode,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        if (!lmPcode) return;
        await cacheDataLoaded;

        let first = true;

        // 🏁 Mark syncing immediately
        updateCachedData((draft) => {
          draft.metaEntries = draft.metaEntries || [];
          draft.geoEntries = draft.geoEntries || {};
          draft.sync = draft.sync || {};
          draft.sync.status = "syncing";
          draft.sync.lmPcode = lmPcode;
        });

        // ✅ Authoritative ordering in Firestore
        const q = query(
          collection(db, "ireps_erfs"),
          where("admin.localMunicipality.pcode", "==", lmPcode),
          orderBy("metadata.updatedAt", "desc"),
        );

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            updateCachedData((draft) => {
              // 🛡️ Rehydration shields
              draft.metaEntries = draft.metaEntries || [];
              draft.geoEntries = draft.geoEntries || {};
              draft.sync = draft.sync || {};

              // ✅ FIRST snapshot = full authoritative rebuild (keeps descending order correct)
              if (first) {
                first = false;
                draft.sync.status = "ready";
                draft.sync.firstSnapshotAt = Date.now();

                // 🔥 Bulk heal: replace any rehydrated mess with cloud order
                draft.metaEntries = snapshot.docs.map((doc) => {
                  const data = doc.data();
                  const id = data.erfId || doc.id;
                  return transformToMeta(id, data);
                });

                // optional: also hydrate geoEntries on first pass
                snapshot.docs.forEach((doc) => {
                  const data = doc.data();
                  const id = data.erfId || doc.id;
                  if (data.geometry || data.centroid) {
                    draft.geoEntries[id] = {
                      centroid: data.centroid,
                      bbox: data.bbox,
                      geometry:
                        typeof data.geometry === "string"
                          ? JSON.parse(data.geometry)
                          : data.geometry,
                    };
                  }
                });

                draft.sync.lastSyncAt = Date.now();
                return; // first snapshot done
              }

              // ✅ Any snapshot = last sync time update
              draft.sync.lastSyncAt = Date.now();

              const changes = snapshot.docChanges();
              if (changes.length === 0) return;

              // ✅ Surgical updates (fast) + final re-sort to guarantee descending order
              changes.forEach((change) => {
                const erf = change.doc.data();
                const id = erf.erfId || change.doc.id;

                if (change.type === "removed") {
                  const idx = draft.metaEntries.findIndex((m) => m.id === id);
                  if (idx > -1) draft.metaEntries.splice(idx, 1);
                  delete draft.geoEntries[id];
                  return;
                }

                // META
                const meta = transformToMeta(id, erf);
                const existingIdx = draft.metaEntries.findIndex(
                  (m) => m.id === id,
                );
                if (existingIdx > -1) draft.metaEntries[existingIdx] = meta;
                else draft.metaEntries.push(meta);

                // GEO
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
              });

              // ✅ Final authoritative sort (metadata.updatedAt is ISO string)
              draft.metaEntries.sort((a, b) =>
                String(b?.metadata?.updatedAt || "").localeCompare(
                  String(a?.metadata?.updatedAt || ""),
                ),
              );
            });
          },
          (error) => {
            console.error("❌ ERFs snapshot error:", error);
            updateCachedData((draft) => {
              draft.sync = draft.sync || {};
              draft.sync.status = "error";
              draft.sync.lastError = String(error?.message || error);
            });
          },
        );

        await cacheEntryRemoved;
        unsubscribe();
      },
    }),

    // getErfsByLmPcode: builder.query({
    //   queryFn: (lmPcode) => ({
    //     data: {
    //       metaEntries: [],
    //       geoEntries: {},
    //       sync: {
    //         status: "idle", // idle | syncing | ready | error
    //         lmPcode,
    //         lastSyncAt: 0,
    //         firstSnapshotAt: 0,
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

    //     // 🏁 Mark syncing immediately
    //     updateCachedData((draft) => {
    //       draft.metaEntries = draft.metaEntries || [];
    //       draft.geoEntries = draft.geoEntries || {};

    //       draft.sync = draft.sync || {};
    //       draft.sync.status = "syncing";
    //       draft.sync.lmPcode = lmPcode;
    //     });

    //     const q = query(
    //       collection(db, "ireps_erfs"),
    //       where("admin.localMunicipality.pcode", "==", lmPcode),
    //       orderBy("metadata.updatedAt", "desc"),
    //     );

    //     const unsubscribe = onSnapshot(
    //       q,
    //       (snapshot) => {
    //         const changes = snapshot.docChanges();

    //         updateCachedData((draft) => {
    //           // 🛡️ Rehydration shields
    //           draft.metaEntries = draft.metaEntries || [];
    //           draft.geoEntries = draft.geoEntries || {};
    //           draft.sync = draft.sync || {};

    //           // ✅ FIRST SNAPSHOT = DATA HYDRATED
    //           if (first) {
    //             first = false;
    //             draft.sync.status = "ready";
    //             draft.sync.firstSnapshotAt = Date.now();

    //             // 🛡️ Ensure initial bulk load is sorted (if not using Firestore orderBy)
    //             draft.metaEntries.sort((a, b) =>
    //               (b.metadata?.updatedAt || "").localeCompare(
    //                 a.metadata?.updatedAt || "",
    //               ),
    //             );
    //           }

    //           // ✅ Any snapshot = last sync time update
    //           draft.sync.lastSyncAt = Date.now();

    //           // 🧠 CPU PROTECTION
    //           // If nothing changed, stop here (but still mark ready above)
    //           if (changes.length === 0) return;

    //           changes.forEach((change) => {
    //             const erf = change.doc.data();
    //             const id = erf.erfId || change.doc.id;

    //             if (change.type === "removed") {
    //               const idx = draft.metaEntries.findIndex((m) => m.id === id);
    //               if (idx > -1) draft.metaEntries.splice(idx, 1);
    //               delete draft.geoEntries[id];
    //               return;
    //             }

    //             // ✅ META ENTRY (List data)
    //             const meta = transformToMeta(id, erf);
    //             const existingIdx = draft.metaEntries.findIndex(
    //               (m) => m.id === id,
    //             );

    //             if (existingIdx > -1) {
    //               // If it exists, update it in place
    //               draft.metaEntries[existingIdx] = meta;

    //               // 🔄 OPTIONAL: If it was modified, move it to the top!
    //               const [updatedItem] = draft.metaEntries.splice(
    //                 existingIdx,
    //                 1,
    //               );
    //               draft.metaEntries.unshift(updatedItem);
    //             } else {
    //               // ➕ If it's new, unshift to the TOP of the array
    //               draft.metaEntries.unshift(meta);
    //             }

    //             // ✅ GEO ENTRY (Map data)
    //             if (erf.geometry || erf.centroid) {
    //               draft.geoEntries[id] = {
    //                 centroid: erf.centroid,
    //                 bbox: erf.bbox,
    //                 geometry:
    //                   typeof erf.geometry === "string"
    //                     ? JSON.parse(erf.geometry)
    //                     : erf.geometry,
    //               };
    //             }
    //           });
    //         });
    //       },
    //       (error) => {
    //         console.error("❌ ERFs snapshot error:", error);

    //         updateCachedData((draft) => {
    //           draft.sync = draft.sync || {};
    //           draft.sync.status = "error";
    //           draft.sync.lastError = String(error?.message || error);
    //         });
    //       },
    //     );

    //     await cacheEntryRemoved;
    //     unsubscribe();
    //   },
    // }),
    // //   queryFn: (lmPcode) => ({
    // //     data: {
    // //       metaEntries: [],
    // //       geoEntries: {},
    // //       sync: {
    // //         status: "idle", // idle | syncing | ready | error
    // //         lmPcode,
    // //         lastSyncAt: 0,
    // //         firstSnapshotAt: 0,
    // //       },
    // //     },
    // //   }),

    // //   async onCacheEntryAdded(
    // //     lmPcode,
    // //     { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
    // //   ) {
    // //     if (!lmPcode) return;
    // //     await cacheDataLoaded;

    // //     let first = true;

    // //     // mark syncing as soon as listener starts
    // //     updateCachedData((draft) => {
    // //       if (!draft.metaEntries) draft.metaEntries = [];
    // //       if (!draft.geoEntries) draft.geoEntries = {};
    // //       draft.sync = draft.sync || {};
    // //       draft.sync.status = "syncing";
    // //       draft.sync.lmPcode = lmPcode;
    // //     });

    // //     const q = query(
    // //       collection(db, "ireps_erfs"),
    // //       where("admin.localMunicipality.pcode", "==", lmPcode),
    // //     );

    // //     const unsubscribe = onSnapshot(
    // //       q,
    // //       (snapshot) => {
    // //         if (snapshot.docChanges().length === 0) return;
    // //         updateCachedData((draft) => {
    // //           if (!draft.geoEntries) draft.geoEntries = {};

    // //           // ✅ first snapshot arrived (initial hydration)
    // //           if (first) {
    // //             first = false;
    // //             draft.sync.status = "ready";
    // //             draft.sync.firstSnapshotAt = Date.now();
    // //           }

    // //           // ✅ every snapshot = updated sync time
    // //           draft.sync.lastSyncAt = Date.now();

    // //           snapshot.docChanges().forEach((change) => {
    // //             const erf = change.doc.data();
    // //             const id = erf.erfId || change.doc.id;

    // //             if (change.type === "removed") {
    // //               const idx = draft.metaEntries.findIndex((m) => m.id === id);
    // //               if (idx > -1) draft.metaEntries.splice(idx, 1);
    // //               delete draft.geoEntries[id];
    // //             } else {
    // //               const meta = transformToMeta(id, erf);
    // //               const existingIdx = draft.metaEntries.findIndex(
    // //                 (m) => m.id === id,
    // //               );
    // //               if (existingIdx > -1) draft.metaEntries[existingIdx] = meta;
    // //               else draft.metaEntries.push(meta);

    // //               if (erf.geometry || erf.centroid) {
    // //                 draft.geoEntries[id] = {
    // //                   centroid: erf.centroid,
    // //                   bbox: erf.bbox,
    // //                   geometry:
    // //                     typeof erf.geometry === "string"
    // //                       ? JSON.parse(erf.geometry)
    // //                       : erf.geometry,
    // //                 };
    // //               }
    // //             }
    // //           });
    // //         });
    // //       },
    // //       (error) => {
    // //         console.error("❌ ERFs snapshot error:", error);
    // //         updateCachedData((draft) => {
    // //           draft.sync.status = "error";
    // //           draft.sync.lastError = String(error?.message || error);
    // //         });
    // //       },
    // //     );

    // //     await cacheEntryRemoved;
    // //     unsubscribe();
    // //   },
    // // }),

    // // getErfsByLmPcode: builder.query({
    // //   async queryFn(lmPcode) {
    // //     console.log(`getErfsByLmPcode --queryFn started for ${lmPcode}`);
    // //     return {
    // //       data: {
    // //         metaEntries: [],
    // //         geoEntries: {},
    // //         sync: {
    // //           status: "idle",
    // //           lmPcode,
    // //           lastSyncAt: 0,
    // //           firstSnapshotAt: 0,
    // //         },
    // //       },
    // //     };
    // //   },

    // //   async onCacheEntryAdded(
    // //     lmPcode,
    // //     { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
    // //   ) {
    // //     if (!lmPcode) return;
    // //     let unsubscribe = () => {};
    // //     console.log(
    // //       `getErfsByLmPcode --onCacheEntryAdded STARTED for ${lmPcode}`,
    // //     );

    // //     try {
    // //       await cacheDataLoaded;

    // //       const q = query(
    // //         collection(db, "ireps_erfs"),
    // //         where("admin.localMunicipality.pcode", "==", lmPcode),
    // //         orderBy("metadata.updatedAt", "desc"),
    // //       );

    // //       unsubscribe = onSnapshot(q, (snapshot) => {
    // //         // 🛡️ CPU PROTECTION: Only wake up if there's actual movement
    // //         if (snapshot.docChanges().length === 0) return;

    // //         updateCachedData((draft) => {
    // //           // 🛡️ REHYDRATION SHIELD: Ensure geoEntries exists in the current draft
    // //           if (!draft.geoEntries) draft.geoEntries = {};

    // //           snapshot.docChanges().forEach((change) => {
    // //             const erf = change.doc.data();
    // //             const id = erf.erfId || change.doc.id;

    // //             if (change.type === "removed") {
    // //               const idx = draft.metaEntries.findIndex((m) => m.id === id);
    // //               if (idx > -1) draft.metaEntries.splice(idx, 1);
    // //               delete draft.geoEntries[id];
    // //               // ... inside your forEach loop
    // //             } else {
    // //               // 🎯 1. ATOMIC MERGE for the List (Array)
    // //               const meta = transformToMeta(id, erf);
    // //               const existingIdx = draft.metaEntries.findIndex(
    // //                 (m) => m.id === id,
    // //               );

    // //               if (existingIdx > -1) {
    // //                 draft.metaEntries[existingIdx] = meta;
    // //               } else {
    // //                 draft.metaEntries.push(meta);
    // //               }

    // //               // 🎯 2. GEOMETRY STORAGE for the Map (Object)
    // //               if (erf.geometry || erf.centroid) {
    // //                 // ✅ FIX: Use geoEntries (The Object), NOT metaEntries (The Array)
    // //                 draft.geoEntries[id] = {
    // //                   centroid: erf.centroid,
    // //                   bbox: erf.bbox,
    // //                   geometry:
    // //                     typeof erf.geometry === "string"
    // //                       ? JSON.parse(erf.geometry)
    // //                       : erf.geometry,
    // //                 };
    // //               }
    // //             }
    // //           });
    // //         });
    // //       });
    // //     } catch (e) {
    // //       console.error("❌ [ERF_VAULT_STREAM_ERROR]:", e);
    // //     }
    // //     console.log(
    // //       `getErfsByLmPcode --onCacheEntryAdded ENDED for ${lmPcode}`,
    // //     );
    // //     await cacheEntryRemoved;
    // //     unsubscribe();
    // //   },
    // // }),

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
            orderBy("metadata.updatedAt", "desc"),
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
