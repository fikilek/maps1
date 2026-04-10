import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { REHYDRATE } from "redux-persist";
import { db } from "../firebase";

function sortTrnsByUpdatedAtDesc(list) {
  list.sort((a, b) => {
    const aAt = a?.accessData?.metadata?.updatedAt || "";
    const bAt = b?.accessData?.metadata?.updatedAt || "";

    return String(bAt).localeCompare(String(aAt));
  });
}

function normalizeMeterNo(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .trim()
    .toUpperCase();
}

function getUpdatedAt(meta) {
  return meta?.updatedAt || new Date().toISOString();
}

function getUpdatedByUid(meta) {
  return meta?.updatedByUid || "NAv";
}

function getUpdatedByUser(meta) {
  return meta?.updatedByUser || "NAv";
}

export const trnsApi = createApi({
  reducerPath: "trnsApi",
  baseQuery: fakeBaseQuery(),
  extractRehydrationInfo(action, { reducerPath }) {
    if (action.type === REHYDRATE) {
      return action.payload?.[reducerPath];
    }
  },
  tagTypes: ["Trns"],
  endpoints: (builder) => ({
    addTrn: builder.mutation({
      async queryFn(payload) {
        try {
          const { id, ...docData } = payload;

          await setDoc(doc(db, "trns", id), docData);

          return { data: payload };
        } catch (error) {
          return { error };
        }
      },

      async onQueryStarted(payload, { dispatch, queryFulfilled }) {
        const { id, accessData, ast, meterType } = payload;

        const trnId = id;
        const astId = id;

        const premise = accessData?.premise || null;
        const erfId = accessData?.erfId || null;
        const parents = accessData?.parents || {};
        const metadata = accessData?.metadata || {};

        const lmPcode = parents?.lmPcode || null;
        const wardPcode = parents?.wardPcode || null;

        const trnsArg = { lmPcode, wardPcode };
        const premisesArg = { lmPcode, wardPcode };
        const erfsArg = { lmPcode, wardPcode };
        const astsArg = { lmPcode, wardPcode };

        const isMeterDiscovery = accessData?.trnType === "METER_DISCOVERY";
        const isNoAccess = accessData?.access?.hasAccess === "no";
        const isAccessed = accessData?.access?.hasAccess === "yes";

        const updatedAt = getUpdatedAt(metadata);
        const updatedByUid = getUpdatedByUid(metadata);
        const updatedByUser = getUpdatedByUser(metadata);

        const normalizedMeterNo = normalizeMeterNo(ast?.astData?.astNo);

        let patchTrns = null;
        let patchPremises = null;
        let patchErfs = null;
        let patchAsts = null;

        try {
          const { premisesApi } = await import("./premisesApi");
          const { erfsApi } = await import("./erfsApi");
          const { astsApi } = await import("./astsApi");

          // 1. OPTIMISTIC TRN INSERT
          if (lmPcode && wardPcode) {
            patchTrns = dispatch(
              trnsApi.util.updateQueryData(
                "getTrnsByLmPcodeWardPcode",
                trnsArg,
                (draft) => {
                  if (!Array.isArray(draft)) return;

                  const exists = draft.some((t) => t.id === trnId);
                  if (!exists) {
                    draft.unshift({
                      ...payload,
                      derived:
                        isMeterDiscovery && isAccessed
                          ? {
                              astId,
                              master: {
                                id: normalizedMeterNo || "NAv",
                                visibility: "NAv",
                              },
                              processedAt: updatedAt,
                            }
                          : undefined,
                      isOptimistic: true,
                    });

                    sortTrnsByUpdatedAtDesc(draft);
                  }
                },
              ),
            );
          }

          // 2. NO ACCESS BRANCH
          if (
            isMeterDiscovery &&
            isNoAccess &&
            premise?.id &&
            lmPcode &&
            wardPcode
          ) {
            patchPremises = dispatch(
              premisesApi.util.updateQueryData(
                "getPremisesByLmPcodeWardPcode",
                premisesArg,
                (draft) => {
                  if (!Array.isArray(draft)) return;

                  const p = draft.find((item) => item.id === premise.id);
                  if (!p) return;

                  const existingNoAccessTrnIds = Array.isArray(
                    p?.metadata?.noAccessTrnIds,
                  )
                    ? p.metadata.noAccessTrnIds
                    : [];

                  if (!existingNoAccessTrnIds.includes(trnId)) {
                    p.metadata = {
                      ...p.metadata,
                      noAccessTrnIds: [...existingNoAccessTrnIds, trnId],
                      updatedAt,
                      updatedByUid,
                      updatedByUser,
                    };
                  }

                  draft.sort((a, b) => {
                    const aAt = a?.metadata?.updatedAt || "";
                    const bAt = b?.metadata?.updatedAt || "";
                    return String(bAt).localeCompare(String(aAt));
                  });
                },
              ),
            );

            if (erfId) {
              patchErfs = dispatch(
                erfsApi.util.updateQueryData(
                  "getErfsByLmPcodeWardPcode",
                  erfsArg,
                  (draft) => {
                    const list = Array.isArray(draft)
                      ? draft
                      : Array.isArray(draft?.metaEntries)
                        ? draft.metaEntries
                        : Array.isArray(draft?.items)
                          ? draft.items
                          : null;

                    if (!list) return;

                    const targetErf = list.find((e) => e?.id === erfId);
                    if (!targetErf) return;

                    targetErf.metadata = {
                      ...targetErf.metadata,
                      updatedAt,
                      updatedByUid,
                      updatedByUser,
                    };
                  },
                ),
              );
            }
          }

          // 3. ACCESS DISCOVERY BRANCH
          if (
            isMeterDiscovery &&
            isAccessed &&
            premise?.id &&
            lmPcode &&
            wardPcode
          ) {
            patchAsts = dispatch(
              astsApi.util.updateQueryData(
                "getAstsByLmPcodeWardPcode",
                astsArg,
                (draft) => {
                  if (!Array.isArray(draft)) return;

                  const exists = draft.some((a) => a.id === astId);
                  if (!exists) {
                    draft.unshift({
                      id: astId,
                      accessData,
                      ast,
                      meterType,
                      media: payload?.media || [],
                      trnId,
                      master: {
                        id: normalizedMeterNo || "NAv",
                        visibility: "NAv",
                      },
                      metadata: {
                        createdAt: metadata?.createdAt || updatedAt,
                        createdByUid: metadata?.createdByUid || updatedByUid,
                        createdByUser: metadata?.createdByUser || updatedByUser,
                        updatedAt,
                        updatedByUid,
                        updatedByUser,
                      },
                      isOptimistic: true,
                    });
                  }
                },
              ),
            );

            patchPremises = dispatch(
              premisesApi.util.updateQueryData(
                "getPremisesByLmPcodeWardPcode",
                premisesArg,
                (draft) => {
                  if (!Array.isArray(draft)) return;

                  const p = draft.find((item) => item.id === premise.id);
                  if (!p) return;

                  const serviceField =
                    meterType === "water" ? "waterMeters" : "electricityMeters";

                  if (!p.services) {
                    p.services = {
                      waterMeters: [],
                      electricityMeters: [],
                    };
                  }

                  if (!Array.isArray(p.services[serviceField])) {
                    p.services[serviceField] = [];
                  }

                  if (!p.services[serviceField].includes(astId)) {
                    p.services[serviceField].push(astId);
                  }

                  p.occupancy = {
                    ...p.occupancy,
                    status: "Accessed",
                  };

                  p.metadata = {
                    ...p.metadata,
                    updatedAt,
                    updatedByUid,
                    updatedByUser,
                  };

                  draft.sort((a, b) => {
                    const aAt = a?.metadata?.updatedAt || "";
                    const bAt = b?.metadata?.updatedAt || "";
                    return String(bAt).localeCompare(String(aAt));
                  });
                },
              ),
            );

            if (erfId) {
              patchErfs = dispatch(
                erfsApi.util.updateQueryData(
                  "getErfsByLmPcodeWardPcode",
                  erfsArg,
                  (draft) => {
                    const list = Array.isArray(draft)
                      ? draft
                      : Array.isArray(draft?.metaEntries)
                        ? draft.metaEntries
                        : Array.isArray(draft?.items)
                          ? draft.items
                          : null;

                    if (!list) return;

                    const targetErf = list.find((e) => e?.id === erfId);
                    if (!targetErf) return;

                    targetErf.metadata = {
                      ...targetErf.metadata,
                      updatedAt,
                      updatedByUid,
                      updatedByUser,
                    };
                  },
                ),
              );
            }
          }

          const { data: finalTrn } = await queryFulfilled;

          if (lmPcode && wardPcode) {
            dispatch(
              trnsApi.util.updateQueryData(
                "getTrnsByLmPcodeWardPcode",
                trnsArg,
                (draft) => {
                  if (!Array.isArray(draft)) return;

                  const index = draft.findIndex((t) => t.id === trnId);
                  if (index !== -1) {
                    draft[index] = finalTrn;
                    sortTrnsByUpdatedAtDesc(draft);
                  }
                },
              ),
            );
          }
        } catch (err) {
          console.error("❌ [ADD_TRN_OPTIMISTIC_FAIL]:", err);
          patchTrns?.undo?.();
          patchPremises?.undo?.();
          patchErfs?.undo?.();
          patchAsts?.undo?.();
        }
      },
    }),

    getTrnsByLmPcodeWardPcode: builder.query({
      queryFn: () => ({ data: [] }),
      async onCacheEntryAdded(
        { lmPcode, wardPcode },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};

        try {
          await cacheDataLoaded;

          if (!lmPcode || !wardPcode) return;

          const q = query(
            collection(db, "trns"),
            where("accessData.parents.lmPcode", "==", lmPcode),
            where("accessData.parents.wardPcode", "==", wardPcode),
            orderBy("accessData.metadata.updatedAt", "desc"),
          );

          unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              updateCachedData(() => {
                const next = snapshot.docs.map((docSnap) => ({
                  id: docSnap.id,
                  ...docSnap.data(),
                }));
                sortTrnsByUpdatedAtDesc(next);
                return next;
              });
            },
            (error) => {
              console.error("❌ [TRN_WARD_SNAPSHOT_ERROR]:", error);
            },
          );
        } catch (error) {
          console.error("❌ [TRN_WARD_STREAM_ERROR]:", error);
        }

        await cacheEntryRemoved;
        unsubscribe();
      },
    }),

    getTrnsByPremiseId: builder.query({
      async queryFn() {
        return { data: [] };
      },
      async onCacheEntryAdded(
        { premiseId },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};
        try {
          await cacheDataLoaded;
          if (!premiseId) return;

          const q = query(
            collection(db, "trns"),
            where("accessData.premise.id", "==", premiseId),
            orderBy("accessData.metadata.createdAt", "desc"),
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            updateCachedData((draft) => {
              snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                  const trn = { id: change.doc.id, ...change.doc.data() };
                  if (!draft.find((t) => t.id === trn.id)) {
                    draft.unshift(trn);
                  }
                }
              });

              sortTrnsByUpdatedAtDesc(draft);
            });
          });
        } catch (error) {
          console.error("❌ [PREMISE_TRN_ERROR]:", error);
        }
        await cacheEntryRemoved;
        unsubscribe();
      },
    }),

    getTrnsByCountryCode: builder.query({
      async queryFn() {
        return { data: [] };
      },
      async onCacheEntryAdded(
        country,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};
        try {
          await cacheDataLoaded;

          const countryId = country?.id;
          if (!countryId) return;

          const q = query(
            collection(db, "trns"),
            where("accessData.metadata.countryId", "==", countryId),
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
          console.error("❌ [NATIONAL STATS ERROR]:", error);
        }

        await cacheEntryRemoved;
        unsubscribe();
      },
    }),

    getTrnById: builder.query({
      async queryFn(id) {
        return { data: null };
      },
      async onCacheEntryAdded(
        id,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};
        try {
          await cacheDataLoaded;

          if (!id) return;

          const docRef = doc(db, "trns", id);

          unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
              updateCachedData(() => {
                return { id: docSnap.id, ...docSnap.data() };
              });
            }
          });
        } catch (error) {
          console.error("❌ [TRN REPORT ERROR]:", error);
        }

        await cacheEntryRemoved;
        unsubscribe();
      },
    }),

    getTrnsByAstNo: builder.query({
      async queryFn() {
        return { data: [] };
      },
      async onCacheEntryAdded(
        astNo,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};
        try {
          await cacheDataLoaded;
          if (!astNo) return;

          const q = query(
            collection(db, "trns"),
            where("ast.astData.astNo", "==", astNo),
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            updateCachedData((draft) => {
              snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                  const trn = { id: change.doc.id, ...change.doc.data() };
                  if (!draft.find((t) => t.id === trn.id)) {
                    draft.unshift(trn);
                  }
                }
              });

              sortTrnsByUpdatedAtDesc(draft);
            });
          });
        } catch (error) {
          console.error("❌ [AST_TRN_ERROR]:", error);
        }
        await cacheEntryRemoved;
        unsubscribe();
      },
    }),

    getTrnsByLmPcode: builder.query({
      queryFn: () => ({ data: [] }),
      async onCacheEntryAdded(
        lmPcode,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};
        try {
          await cacheDataLoaded;

          const q = query(
            collection(db, "trns"),
            where("accessData.metadata.lmPcode", "==", lmPcode),
            orderBy("accessData.metadata.updatedAt", "desc"),
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            updateCachedData((draft) => {
              if (snapshot.docChanges().length === snapshot.docs.length) {
                return snapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                }));
              }

              snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                  const trn = { id: change.doc.id, ...change.doc.data() };
                  const exists = draft.find((t) => t.id === trn.id);

                  if (!exists) draft.unshift(trn);
                } else if (change.type === "modified") {
                  const trn = { id: change.doc.id, ...change.doc.data() };
                  const index = draft.findIndex((t) => t.id === trn.id);
                  if (index !== -1) {
                    draft[index] = trn;
                  } else {
                    draft.unshift(trn);
                  }
                } else if (change.type === "removed") {
                  const index = draft.findIndex((t) => t.id === change.doc.id);
                  if (index !== -1) {
                    draft.splice(index, 1);
                  }
                }
              });

              sortTrnsByUpdatedAtDesc(draft);
            });
          });
        } catch (err) {
          console.error("❌ [TRN_STREAM_ERROR]:", err);
        }
        await cacheEntryRemoved;
        unsubscribe();
      },
    }),
  }),
});

export const {
  useAddTrnMutation,
  useGetTrnsByLmPcodeWardPcodeQuery,
  useGetTrnsByCountryCodeQuery,
  useGetTrnsByPremiseIdQuery,
  useGetTrnByIdQuery,
  useGetTrnsByAstNoQuery,
  useGetTrnsByLmPcodeQuery,
} = trnsApi;
