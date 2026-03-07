import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { REHYDRATE } from "redux-persist";
import { db } from "../firebase";
import { fsError, fsLog } from "./firestoreLogger";

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
    premises: Array.isArray(erf?.premises) ? erf.premises : [],
    metadata: erf?.metadata || {},
  };
};

const makeWardPackKey = ({ lmPcode, wardPcode }) => `${lmPcode}__${wardPcode}`;

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
    getErfsByLmPcode: builder.query({
      queryFn: (lmPcode) => {
        console.log(`erfsApi --getErfsByLmPcode --queryFn --lmPcode`, lmPcode);
        return {
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
        };
      },

      async onCacheEntryAdded(
        lmPcode,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        console.log(
          `erfsApi --getErfsByLmPcode --onCacheEntryAdded --lmPcode`,
          lmPcode,
        );
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
          limit(100),
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

    getErfsByLmPcodeWardPcode: builder.query({
      queryFn: ({ lmPcode, wardPcode }) => ({
        data: {
          metaEntries: [],
          geoEntries: {},
          sync: {
            status: "idle", // idle | syncing | ready | error
            lmPcode: lmPcode || null,
            wardPcode: wardPcode || null,
            wardCacheKey:
              lmPcode && wardPcode
                ? makeWardPackKey({ lmPcode, wardPcode })
                : null,
            firstSnapshotAt: 0,
            lastSyncAt: 0,
            lastError: null,
            size: 0,
          },
        },
      }),

      async onCacheEntryAdded(
        args,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        const lmPcode = args?.lmPcode;
        const wardPcode = args?.wardPcode;
        if (!lmPcode || !wardPcode) return;

        const wardCacheKey = makeWardPackKey({ lmPcode, wardPcode });
        const scope = `ERFsPackLive(${wardCacheKey})`;

        await cacheDataLoaded;

        // 1) immediately mark syncing
        updateCachedData((draft) => {
          draft.sync = draft.sync || {};
          draft.sync.status = "syncing";
          draft.sync.lmPcode = lmPcode;
          draft.sync.wardPcode = wardPcode;
          draft.sync.wardCacheKey = wardCacheKey;
          draft.sync.lastError = null;
        });

        let isFirstSnapshot = true;
        let unsubscribe = () => {};

        try {
          const q = query(
            collection(db, "ireps_erfs"),
            where("admin.localMunicipality.pcode", "==", lmPcode),
            where("admin.ward.pcode", "==", wardPcode),
            orderBy("metadata.updatedAt", "desc"),
          );

          unsubscribe = onSnapshot(
            q,
            (snap) => {
              // ✅ FIRST SNAPSHOT = full authoritative rebuild
              if (isFirstSnapshot) {
                isFirstSnapshot = false;

                const metaEntries = [];
                const geoEntries = {};

                snap.docs.forEach((docSnap) => {
                  const erf = docSnap.data() || {};
                  const id = erf?.erfId || erf?.erf?.erfId || docSnap.id;

                  metaEntries.push(transformToMeta(id, erf));

                  let parsedGeometry = null;
                  const rawGeometry =
                    erf?.geometry ?? erf?.erf?.geometry ?? null;

                  if (typeof rawGeometry === "string") {
                    try {
                      parsedGeometry = JSON.parse(rawGeometry);
                    } catch {
                      parsedGeometry = null;
                    }
                  } else {
                    parsedGeometry = rawGeometry || null;
                  }

                  geoEntries[id] = {
                    bbox: erf?.bbox ?? erf?.erf?.bbox ?? null,
                    centroid: erf?.centroid ?? erf?.erf?.centroid ?? null,
                    geometry: parsedGeometry,
                  };
                });

                // ✅ final sort by updatedAt desc (extra safety)
                metaEntries.sort((a, b) =>
                  String(b?.metadata?.updatedAt || "").localeCompare(
                    String(a?.metadata?.updatedAt || ""),
                  ),
                );

                updateCachedData((draft) => {
                  draft.metaEntries = metaEntries;
                  draft.geoEntries = geoEntries;
                  draft.sync.status = "ready";
                  draft.sync.firstSnapshotAt =
                    draft.sync.firstSnapshotAt || Date.now();
                  draft.sync.lastSyncAt = Date.now();
                  draft.sync.lastError = null;
                  draft.sync.size = snap.size;
                });

                fsLog(scope, "first snapshot loaded", { size: snap.size });
                return;
              }

              // ✅ LATER SNAPSHOTS = surgical patching via docChanges()
              const changes = snap.docChanges();
              if (!changes.length) return;

              updateCachedData((draft) => {
                draft.metaEntries = draft.metaEntries || [];
                draft.geoEntries = draft.geoEntries || {};
                draft.sync = draft.sync || {};

                changes.forEach((change) => {
                  const erf = change.doc.data() || {};
                  const id = erf?.erfId || erf?.erf?.erfId || change.doc.id;

                  if (change.type === "removed") {
                    const idx = draft.metaEntries.findIndex((e) => e.id === id);
                    if (idx !== -1) draft.metaEntries.splice(idx, 1);
                    delete draft.geoEntries[id];
                    return;
                  }

                  // --- META ---
                  const nextMeta = transformToMeta(id, erf);
                  const existingIdx = draft.metaEntries.findIndex(
                    (e) => e.id === id,
                  );

                  if (existingIdx !== -1) {
                    draft.metaEntries[existingIdx] = nextMeta;
                  } else {
                    draft.metaEntries.push(nextMeta);
                  }

                  // --- GEO ---
                  let parsedGeometry = null;
                  const rawGeometry =
                    erf?.geometry ?? erf?.erf?.geometry ?? null;

                  if (typeof rawGeometry === "string") {
                    try {
                      parsedGeometry = JSON.parse(rawGeometry);
                    } catch {
                      parsedGeometry = null;
                    }
                  } else {
                    parsedGeometry = rawGeometry || null;
                  }

                  draft.geoEntries[id] = {
                    bbox: erf?.bbox ?? erf?.erf?.bbox ?? null,
                    centroid: erf?.centroid ?? erf?.erf?.centroid ?? null,
                    geometry: parsedGeometry,
                  };
                });

                // ✅ ALWAYS RE-SORT AFTER PATCHING
                // This is what moves a newly updated ERF to the top
                draft.metaEntries.sort((a, b) =>
                  String(b?.metadata?.updatedAt || "").localeCompare(
                    String(a?.metadata?.updatedAt || ""),
                  ),
                );

                draft.sync.status = "ready";
                draft.sync.lastSyncAt = Date.now();
                draft.sync.lastError = null;
                draft.sync.size = snap.size;
              });
              fsLog(scope, "docChanges applied", {
                changes: changes.length,
                ward: wardPcode,
                lm: lmPcode,
              });
            },
            (error) => {
              fsError(scope, "onSnapshot error", error);

              updateCachedData((draft) => {
                draft.sync = draft.sync || {};
                draft.sync.status = "error";
                draft.sync.lastError = String(error?.message || error);
              });
            },
          );
        } catch (error) {
          fsError(scope, "listener setup error", error);

          updateCachedData((draft) => {
            draft.sync = draft.sync || {};
            draft.sync.status = "error";
            draft.sync.lastError = String(error?.message || error);
          });
        }

        await cacheEntryRemoved;
        unsubscribe();
      },

      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const lmPcode = queryArgs?.lmPcode;
        const wardPcode = queryArgs?.wardPcode;
        const wardCacheKey =
          lmPcode && wardPcode ? makeWardPackKey({ lmPcode, wardPcode }) : "NA";
        return `${endpointName}(${wardCacheKey})`;
      },

      keepUnusedDataFor: 60 * 60 * 24 * 30,
    }),
  }),
});

export const {
  useGetErfsByLmPcodeQuery,
  useGetErfsByCountryCodeQuery,
  useGetErfsByLmPcodeWardPcodeQuery,
} = erfsApi;
