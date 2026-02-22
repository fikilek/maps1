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

    // getErfsByLmPcode: builder.query({
    //   async queryFn({ lmPcode }) {
    //     if (!lmPcode)
    //       return { data: { metaEntries: [], geoEntries: {}, wards: [] } };

    //     try {
    //       console.log(
    //         `[${new Date().toLocaleTimeString()}] 🏛️ getErfsByLmPcode ---queryFn SRARTED for ${lmPcode}`,
    //       );
    //       const startTime = Date.now(); // ⏱️ Start timer
    //       // ⚡ THE INSTANT STRIKE: Moving hydration here stops the "Switching Evaporation"
    //       const localMeta = erfMemory.getErfsMetaList(lmPcode) || [];
    //       const localGeo = erfMemory.getErfsGeoList(lmPcode) || {};

    //       const wardSet = new Set();
    //       localMeta.forEach((m) => {
    //         if (m.admin?.ward?.name) wardSet.add(m.admin.ward.name);
    //       });

    //       console.log(
    //         `🏛️ [SOVEREIGN HYDRATION]: ${lmPcode} | Meta: ${localMeta.length} | Geo: ${Object.keys(localGeo).length}`,
    //       );

    //       const duration = Date.now() - startTime; // 🏁 Calculate diff
    //       console.log(
    //         `[${new Date().toLocaleTimeString()}] 🏛️ [SOVEREIGN HYDRATION]: ${lmPcode} loaded in ${duration}ms`,
    //       );
    //       console.log(
    //         `[${new Date().toLocaleTimeString()}] 🏛️ getErfsByLmPcode ---queryFn FINISHED for ${lmPcode}`,
    //       );
    //       return {
    //         data: {
    //           metaEntries: localMeta,
    //           geoEntries: localGeo,
    //           wards: ["ALL", ...Array.from(wardSet)].sort(),
    //         },
    //       };
    //     } catch (error) {
    //       return { error: { status: "CUSTOM_ERROR", error: error.message } };
    //     }
    //   },

    //   // async onCacheEntryAdded(
    //   //   { lmPcode },
    //   //   { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
    //   // ) {
    //   //   let unsubscribe = () => {};
    //   //   if (!lmPcode) return;

    //   //   console.log(` `);
    //   //   console.log(
    //   //     `🏛️ getErfsByLmPcode ---onCacheEntryAdded started for ${lmPcode}`,
    //   //   );
    //   //   try {
    //   //     await cacheDataLoaded;

    //   //     const q = query(
    //   //       collection(db, "ireps_erfs"),
    //   //       where("admin.localMunicipality.pcode", "==", lmPcode),
    //   //     );

    //   //     unsubscribe = onSnapshot(q, (snapshot) => {
    //   //       if (snapshot.empty && snapshot.docChanges().length === 0) return;

    //   //       updateCachedData((draft) => {
    //   //         // 🛡️ THE EVAPORATION SHIELD
    //   //         if (Object.keys(draft.geoEntries || {}).length === 0) {
    //   //           draft.geoEntries = erfMemory.getErfsGeoList(lmPcode) || {};
    //   //         }

    //   //         const indexMap = new Map(
    //   //           draft.metaEntries.map((m, i) => [m.id, i]),
    //   //         );

    //   //         // 🎯 THE VERIFIED TRINITY: Explicit Added, Modified, Removed
    //   //         snapshot.docChanges().forEach((change) => {
    //   //           const erf = change.doc.data();
    //   //           const id = erf.erfId || change.doc.id;

    //   //           if (change.type === "added") {
    //   //             if (!indexMap.has(id)) {
    //   //               draft.metaEntries.push(transformToMeta(id, erf));
    //   //             }
    //   //           }

    //   //           if (change.type === "modified") {
    //   //             const modIdx = indexMap.get(id);
    //   //             if (modIdx !== undefined) {
    //   //               draft.metaEntries[modIdx] = transformToMeta(id, erf);
    //   //             }
    //   //           }

    //   //           if (change.type === "removed") {
    //   //             const remIdx = indexMap.get(id);
    //   //             if (remIdx !== undefined) {
    //   //               draft.metaEntries.splice(remIdx, 1);
    //   //               delete draft.geoEntries[id];
    //   //             }
    //   //           }

    //   //           // 🛰️ GEOMETRY HANDLER: Keeping it isolated from the meta loop
    //   //           if (change.type !== "removed") {
    //   //             if (erf.geometry || erf.centroid) {
    //   //               draft.geoEntries[id] = {
    //   //                 centroid: erf.centroid,
    //   //                 bbox: erf.bbox,
    //   //                 geometry:
    //   //                   typeof erf.geometry === "string"
    //   //                     ? JSON.parse(erf.geometry)
    //   //                     : erf.geometry,
    //   //               };
    //   //             }
    //   //           }
    //   //         });

    //   //         // 💾 DISK PERSISTENCE: Save only if we have a valid state
    //   //         if (draft.metaEntries.length > 0) {
    //   //           erfMemory.saveBulkErfMeta(lmPcode, draft.metaEntries);
    //   //           erfMemory.saveBulkErfGeo(lmPcode, draft.geoEntries);
    //   //           erfMemory.saveSyncTimestamp(lmPcode);
    //   //         }

    //   //         // 📊 RE-CALCULATE WARDS
    //   //         const wardSet = new Set();
    //   //         draft.metaEntries.forEach((m) => {
    //   //           if (m.admin?.ward?.name) wardSet.add(m.admin.ward.name);
    //   //         });
    //   //         draft.wards = ["ALL", ...Array.from(wardSet)].sort();
    //   //       });
    //   //     });
    //   //     console.log(` `);
    //   //     console.log(
    //   //       `🏛️ getErfsByLmPcode ---onCacheEntryAdded finished for ${lmPcode}`,
    //   //     );
    //   //   } catch (error) {
    //   //     console.error("❌ [ERF STREAM ERROR]:", error);
    //   //   }

    //   //   await cacheEntryRemoved;
    //   //   unsubscribe();
    //   // },
    // }),

    getErfsByLmPcode: builder.query({
      async queryFn({ lmPcode }) {
        if (!lmPcode)
          return { data: { metaEntries: [], geoEntries: {}, wards: [] } };

        try {
          // ⚡ STEP 1: THE INSTANT STRIKE
          // Pull directly from the Vault. 0ms latency.

          const startTime = Date.now(); // ⏱️ Start timer

          const localMeta = erfMemory.getErfsMetaList(lmPcode) || [];
          const localGeo = erfMemory.getErfsGeoList(lmPcode) || {};

          // 🕵️ THE TRACE LOGS
          console.log(`🔍 [VAULT_TRACE]: Meta Count: ${localMeta.length}`);
          console.log(
            `🔍 [VAULT_TRACE]: Geo Keys: ${Object.keys(localGeo).length}`,
          );

          // Reconstruct the Ward list from local data
          const wardSet = new Set();
          localMeta.forEach((m) => {
            if (m.admin?.ward?.name) wardSet.add(m.admin.ward.name);
          });

          console.log(
            `🏛️ [SOVEREIGN HYDRATION]: ${lmPcode} - ${localMeta.length} items pulled from Disk.`,
          );

          // Check if the first item actually has a shape
          const firstKey = Object.keys(localGeo)[0];
          if (firstKey) {
            console.log(
              `🔍 [VAULT_TRACE]: Sample Geo Key [${firstKey}] exists:`,
              !!localGeo[firstKey],
            );
          }

          const duration = Date.now() - startTime; // 🏁 Calculate diff
          console.log(
            `[${new Date().toLocaleTimeString()}] 🏛️ [SOVEREIGN HYDRATION]: ${lmPcode} loaded in ${duration}ms`,
          );

          return {
            data: {
              metaEntries: localMeta,
              geoEntries: localGeo, // 🎯 This is the payload
              wards: ["ALL", ...Array.from(wardSet)].sort(),
            },
          };
        } catch (error) {
          return { error: { status: "CUSTOM_ERROR", error: error.message } };
        }
      },

      async onCacheEntryAdded(
        { lmPcode },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};
        try {
          await cacheDataLoaded;

          const q = query(
            collection(db, "ireps_erfs"),
            where("admin.localMunicipality.pcode", "==", lmPcode),
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            const firestoreCount = snapshot.docs.length;
            const registry = erfMemory?.getRegistry();
            const mmkvCount = registry?.lms[lmPcode]?.count || 0;

            // 🛡️ GATEKEEPER: Still protects the first boot
            if (snapshot.docChanges().length === firestoreCount) {
              if (firestoreCount === mmkvCount) {
                console.log(
                  `🏛️ [GATEKEEPER]: Vault is Sovereign (${firestoreCount}). Aborting Initial Blast.`,
                );
                return;
              }
            }

            updateCachedData((draft) => {
              // 🛡️ THE EVAPORATION SHIELD: Ensure Geo is present in cache
              if (Object.keys(draft.geoEntries || {}).length === 0) {
                draft.geoEntries = erfMemory.getErfsGeoList(lmPcode) || {};
              }

              const metaIndexMap = new Map(
                draft.metaEntries.map((m, i) => [m.id, i]),
              );
              let needsDiskUpdate = false;

              snapshot.docChanges().forEach((change) => {
                const erf = change.doc.data();
                const id = erf.erfId || change.doc.id;
                needsDiskUpdate = true;

                if (change.type === "removed") {
                  const idx = metaIndexMap.get(id);
                  if (idx !== undefined) draft.metaEntries.splice(idx, 1);
                  delete draft.geoEntries[id];
                } else {
                  // 🎯 THE FIX: Robust Meta & Geo Reconstruction
                  const meta = transformToMeta(id, erf);

                  // Re-parse geometry safely for the Map
                  const geo = {
                    centroid: erf.centroid,
                    bbox: erf.bbox,
                    geometry:
                      typeof erf.geometry === "string"
                        ? JSON.parse(erf.geometry)
                        : erf.geometry,
                  };

                  const existingIdx = metaIndexMap.get(id);
                  if (existingIdx !== undefined) {
                    draft.metaEntries[existingIdx] = meta;
                  } else {
                    draft.metaEntries.push(meta);
                  }

                  if (geo.geometry || geo.centroid) {
                    draft.geoEntries[id] = geo;
                  }
                }
              });

              // 📊 RE-CALCULATE WARDS: Ensure filters update for new/changed Erfs
              if (needsDiskUpdate) {
                const wardSet = new Set();
                draft.metaEntries.forEach((m) => {
                  if (m.admin?.ward?.name) wardSet.add(m.admin.ward.name);
                });
                draft.wards = ["ALL", ...Array.from(wardSet)].sort();

                // 💾 PERMANENT STORAGE
                erfMemory.saveBulkErfMeta(lmPcode, draft.metaEntries);
                erfMemory.saveBulkErfGeo(lmPcode, draft.geoEntries);
                console.log(
                  `🔄 [VAULT SYNC]: ${snapshot.docChanges().length} live updates secured.`,
                );
              }
            });
          });
        } catch (e) {
          console.error("❌ [SYNC ERROR]:", e);
        }
        await cacheEntryRemoved;
        unsubscribe();
      },

      // async onCacheEntryAdded(
      //   { lmPcode },
      //   { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      // ) {
      //   console.log(` `);
      //   console.log(`onCacheEntryAdded ---started `);
      //   let unsubscribe = () => {};
      //   try {
      //     await cacheDataLoaded;

      //     // 📡 STEP 2: THE SILENT SYNC
      //     // Now that the UI is already showing the local data, we start the stream.
      //     const q = query(
      //       collection(db, "ireps_erfs"),
      //       where("admin.localMunicipality.pcode", "==", lmPcode),
      //     );

      //     unsubscribe = onSnapshot(q, (snapshot) => {
      //       console.log(` `);
      //       console.log(`onSnapshot ---started `);
      //       const firestoreCount = snapshot.docs.length;

      //       // 🎯 THE FIX: Reach into the Master Index (Registry) to get the count

      //       const registry = erfMemory?.getRegistry();
      //       console.log(`onCacheEntryAdded ---registry `, registry);

      //       // const mmkvCount = erfMemory.getErfsMetaList(lmPcode)?.length || 0;
      //       const mmkvCount = registry?.lms[lmPcode]?.count || 0;

      //       // 🛡️ CASE 1: THE BOOT PHASE (The Initial Blast)
      //       // If the counts match, the Vault (MMKV) is already perfect.
      //       // We abort to save the Samsung A06 from the 20-minute freeze.
      //       console.log(`onCacheEntryAdded ---firestoreCount `, firestoreCount);
      //       console.log(`onCacheEntryAdded ---mmkvCount `, mmkvCount);
      //       if (snapshot.docChanges().length === firestoreCount) {
      //         if (firestoreCount === mmkvCount) {
      //           console.log(
      //             `🛡️ [GATEKEEPER]: Counts match (${firestoreCount}). Vault is Sovereign. Aborting Initial Blast.`,
      //           );
      //           return;
      //         }
      //       }

      //       updateCachedData((draft) => {
      //         // ⚡ CASE 2: THE UPDATE PHASE (Deltas/Changes)
      //         // If we are here, it means either MMKV was empty, or there's a real change.
      //         let needsDiskUpdate = false;
      //         const metaIndexMap = new Map(
      //           draft.metaEntries.map((m, i) => [m.id, i]),
      //         );

      //         snapshot.docChanges().forEach((change) => {
      //           const erf = change.doc.data();
      //           const id = erf.erfId || change.doc.id;
      //           needsDiskUpdate = true;

      //           if (change.type === "removed") {
      //             const idx = metaIndexMap.get(id);
      //             if (idx !== undefined) draft.metaEntries.splice(idx, 1);
      //             delete draft.geoEntries[id];
      //           } else {
      //             // This handles both 'added' (new Erfs) and 'modified' (Premise registration)
      //             const meta = transformToMeta(id, erf);
      //             const geo = erf.geometry || null;
      //             const existingIdx = metaIndexMap.get(id);

      //             if (existingIdx !== undefined) {
      //               draft.metaEntries[existingIdx] = meta;
      //             } else {
      //               draft.metaEntries.push(meta);
      //             }
      //             if (geo) draft.geoEntries[id] = geo;
      //           }
      //         });

      //         // 💾 SAVE THE GAINS
      //         if (needsDiskUpdate) {
      //           erfMemory.saveBulkErfMeta(lmPcode, draft.metaEntries);
      //           erfMemory.saveBulkErfGeo(lmPcode, draft.geoEntries);
      //           console.log(
      //             `🔄 [VAULT SYNC]: ${snapshot.docChanges().length} changes merged.`,
      //           );
      //         }
      //       });
      //     });

      //     // unsubscribe = onSnapshot(q, (snapshot) => {
      //     //   if (snapshot.docChanges().length === 0) return;

      //     //   updateCachedData((draft) => {
      //     //     const metaIndexMap = new Map(
      //     //       draft.metaEntries.map((m, i) => [m.id, i]),
      //     //     );
      //     //     let needsDiskUpdate = false;

      //     //     snapshot.docChanges().forEach((change) => {
      //     //       const erf = change.doc.data();
      //     //       const id = erf.erfId || change.doc.id;
      //     //       needsDiskUpdate = true;

      //     //       if (change.type === "removed") {
      //     //         // 1. Remove Meta
      //     //         const idx = metaIndexMap.get(id);
      //     //         if (idx !== undefined) draft.metaEntries.splice(idx, 1);
      //     //         // 2. Remove Geo
      //     //         delete draft.geoEntries[id];
      //     //       } else {
      //     //         // 🎯 THE FIX: Sync Meta AND Geo
      //     //         const meta = transformToMeta(id, erf);
      //     //         const geo = erf.geometry || null; // Capture the shape!

      //     //         // Update Meta List
      //     //         const existingIdx = metaIndexMap.get(id);
      //     //         if (existingIdx !== undefined) {
      //     //           draft.metaEntries[existingIdx] = meta;
      //     //         } else {
      //     //           draft.metaEntries.push(meta);
      //     //         }

      //     //         // Update Geo Library (The Map Shapes)
      //     //         if (geo) {
      //     //           draft.geoEntries[id] = geo;
      //     //         }
      //     //       }
      //     //     });

      //     //     // 💾 STEP 3: CONSOLIDATED BACKGROUND RECOVERY
      //     //     if (needsDiskUpdate) {
      //     //       // Save the List (Meta)
      //     //       erfMemory.saveBulkErfMeta(lmPcode, draft.metaEntries);

      //     //       // Save the Shapes (Geo)
      //     //       // This ensures the local vault stays 100% accurate for Zamo's Audit
      //     //       erfMemory.saveBulkErfGeo(lmPcode, draft.geoEntries);

      //     //       console.log(`📡 [SYNC]: Vault & Map Refreshed for ${lmPcode}`);
      //     //     }
      //     //   });
      //     // });
      //   } catch (e) {
      //     console.error("❌ [SYNC ERROR]:", e);
      //   }
      //   await cacheEntryRemoved;
      //   unsubscribe();
      // },
    }),

    // getErfsByLmPcode: builder.query({
    //   async queryFn({ lmPcode }) {
    //     if (!lmPcode)
    //       return { data: { metaEntries: [], geoEntries: {}, wards: [] } };

    //     // ⚡ THE 0ms STRIKE: Pull from MMKV first.
    //     // This is what Zamo sees the moment he taps the LM.
    //     const localMeta = erfMemory.getErfsMetaList(lmPcode) || [];
    //     const localGeo = erfMemory.getErfsGeoList(lmPcode) || {};

    //     const wardSet = new Set();
    //     localMeta.forEach((m) => {
    //       if (m.admin?.ward?.name) wardSet.add(m.admin.ward.name);
    //     });

    //     console.log(
    //       `🏛️ [VAULT BOOT]: ${lmPcode} - ${localMeta.length} items recovered.`,
    //     );

    //     return {
    //       data: {
    //         metaEntries: localMeta,
    //         geoEntries: localGeo,
    //         wards: ["ALL", ...Array.from(wardSet)].sort(),
    //       },
    //     };
    //   },

    //   async onCacheEntryAdded(
    //     { lmPcode },
    //     { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
    //   ) {
    //     let unsubscribe = () => {};
    //     try {
    //       await cacheDataLoaded; // Wait for the disk load above to finish

    //       // 📡 BACKGROUND SYNC: Only handles Deltas
    //       const q = query(
    //         collection(db, "ireps_erfs"),
    //         where("admin.localMunicipality.pcode", "==", lmPcode),
    //       );

    //       unsubscribe = onSnapshot(q, (snapshot) => {
    //         // 🛡️ GUARD 1: If cloud sends nothing, don't open the draft.
    //         if (snapshot.empty && snapshot.docChanges().length === 0) return;

    //         updateCachedData((draft) => {
    //           const indexMap = new Map(
    //             draft.metaEntries.map((m, i) => [m.id, i]),
    //           );
    //           let hasNewData = false;

    //           snapshot.docChanges().forEach((change) => {
    //             hasNewData = true;
    //             const erf = change.doc.data();
    //             const id = erf.erfId || change.doc.id;

    //             if (change.type === "removed") {
    //               const remIdx = indexMap.get(id);
    //               if (remIdx !== undefined) {
    //                 draft.metaEntries.splice(remIdx, 1);
    //                 delete draft.geoEntries[id];
    //               }
    //             } else {
    //               const meta = transformToMeta(id, erf);
    //               const existingIdx = indexMap.get(id);
    //               if (existingIdx !== undefined) {
    //                 draft.metaEntries[existingIdx] = meta;
    //               } else {
    //                 draft.metaEntries.push(meta);
    //               }

    //               // Geometry updates in background
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

    //           // 🛡️ GUARD 2: Only save if we actually processed something new.
    //           // This prevents the "0 items" overwrite during stream initialization.
    //           if (hasNewData && draft.metaEntries.length > 0) {
    //             erfMemory.saveBulkErfMeta(lmPcode, draft.metaEntries);
    //             erfMemory.saveBulkErfGeo(lmPcode, draft.geoEntries);
    //           }
    //         });
    //       });
    //     } catch (e) {
    //       console.error("❌ [SYNC ERROR]:", e);
    //     }
    //     await cacheEntryRemoved;
    //     unsubscribe();
    //   },
    // }),

    // getErfsByLmPcode: builder.query({
    //   async queryFn({ lmPcode }) {
    //     // 🎯 THE INSTANT STRIKE:
    //     // We pull from MMKV inside the queryFn.
    //     // This ensures the VERY FIRST thing the UI sees is the disk data.
    //     const localMeta = erfMemory.getErfsMetaList(lmPcode) || [];
    //     const localGeo = erfMemory.getErfsGeoList(lmPcode) || {};
    //     const wardSet = new Set();
    //     localMeta.forEach((m) => {
    //       if (m.admin?.ward?.name) wardSet.add(m.admin.ward.name);
    //     });

    //     return {
    //       data: {
    //         metaEntries: localMeta,
    //         geoEntries: localGeo,
    //         wards: ["ALL", ...Array.from(wardSet)].sort(),
    //       },
    //     };
    //   },

    //   async onCacheEntryAdded(
    //     { lmPcode },
    //     { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
    //   ) {
    //     let unsubscribe = () => {};
    //     try {
    //       await cacheDataLoaded;

    //       // 🛑 STEP 2: THE STREAM (Background Delta Sync only)
    //       const q = query(
    //         collection(db, "ireps_erfs"),
    //         where("admin.localMunicipality.pcode", "==", lmPcode),
    //       );

    //       unsubscribe = onSnapshot(q, (snapshot) => {
    //         if (snapshot.empty) return;

    //         updateCachedData((draft) => {
    //           const indexMap = new Map(
    //             draft.metaEntries.map((m, i) => [m.id, i]),
    //           );
    //           let hasChanges = false;

    //           snapshot.docChanges().forEach((change) => {
    //             hasChanges = true;
    //             const erf = change.doc.data();
    //             const id = erf.erfId || change.doc.id;

    //             if (change.type === "removed") {
    //               const remIdx = indexMap.get(id);
    //               if (remIdx !== undefined) {
    //                 draft.metaEntries.splice(remIdx, 1);
    //                 delete draft.geoEntries[id];
    //               }
    //             } else {
    //               const meta = transformToMeta(id, erf);
    //               const existingIdx = indexMap.get(id);
    //               if (existingIdx !== undefined) {
    //                 draft.metaEntries[existingIdx] = meta;
    //               } else {
    //                 draft.metaEntries.push(meta);
    //               }

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

    //           // 🏛️ PERSIST ONLY ON ACTUAL CHANGES
    //           if (hasChanges) {
    //             erfMemory.saveBulkErfMeta(lmPcode, draft.metaEntries);
    //             erfMemory.saveBulkErfGeo(lmPcode, draft.geoEntries);
    //           }
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
