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
import { erfsApi } from "./erfsApi";

function buildWardPremisesQuery(lmPcode, wardPcode) {
  return query(
    collection(db, "premises"),
    where("parents.lmPcode", "==", lmPcode),
    where("parents.wardPcode", "==", wardPcode),
    orderBy("metadata.updated.at", "desc"),
  );
}

function sortPremisesByUpdatedAt(list) {
  return list.sort((a, b) => {
    const aAt = new Date(a?.metadata?.updated?.at || 0).getTime();
    const bAt = new Date(b?.metadata?.updated?.at || 0).getTime();
    return bAt - aAt;
  });
}

export const premisesApi = createApi({
  reducerPath: "premisesApi",
  baseQuery: fakeBaseQuery(),

  extractRehydrationInfo(action, { reducerPath }) {
    if (action.type === REHYDRATE) {
      return action.payload?.[reducerPath];
    }
  },

  endpoints: (builder) => ({
    // -------------------------------------------------
    // OLD LM-WIDE ENDPOINT
    // Keep only temporarily for reports / backward compatibility
    // -------------------------------------------------
    getPremisesByLmPcode: builder.query({
      queryFn: () => ({ data: [] }),
      async onCacheEntryAdded(
        lmPcode,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};

        try {
          await cacheDataLoaded;
          if (!lmPcode) return;

          const q = query(
            collection(db, "premises"),
            where("parents.lmPcode", "==", lmPcode),
            orderBy("metadata.updated.at", "desc"),
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            updateCachedData((draft) => {
              if (snapshot.docChanges().length === snapshot.docs.length) {
                return snapshot.docs.map((snap) => ({
                  id: snap.id,
                  ...snap.data(),
                }));
              }

              snapshot.docChanges().forEach((change) => {
                const premise = {
                  id: change.doc.id,
                  ...change.doc.data(),
                };

                const index = draft.findIndex((item) => item.id === premise.id);

                if (change.type === "added") {
                  if (index === -1) draft.unshift(premise);
                } else if (change.type === "modified") {
                  if (index > -1) draft[index] = premise;
                } else if (change.type === "removed") {
                  if (index > -1) draft.splice(index, 1);
                }
              });
            });
          });
        } catch (e) {
          console.error("❌ [PREMISE_STREAM_ERROR][LM]:", e);
        }

        await cacheEntryRemoved;
        unsubscribe();
      },
    }),

    // -------------------------------------------------
    // NEW LM + WARD LIVE STREAM ENDPOINT
    // THIS is the operational architecture endpoint
    // -------------------------------------------------
    getPremisesByLmPcodeWardPcode: builder.query({
      queryFn: () => ({ data: [] }),
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const lmPcode = queryArgs?.lmPcode || "none";
        const wardPcode = queryArgs?.wardPcode || "none";
        return `${endpointName}(${lmPcode}__${wardPcode})`;
      },
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};

        try {
          await cacheDataLoaded;

          const lmPcode = arg?.lmPcode || null;

          const wardPcode = arg?.wardPcode || null;

          if (!lmPcode || !wardPcode) return;

          const q = buildWardPremisesQuery(lmPcode, wardPcode);

          unsubscribe = onSnapshot(q, (snapshot) => {
            updateCachedData((draft) => {
              // Initial hydration
              if (snapshot.docChanges().length === snapshot.docs.length) {
                return snapshot.docs.map((snap) => ({
                  id: snap.id,
                  ...snap.data(),
                }));
              }

              // Incremental updates
              snapshot.docChanges().forEach((change) => {
                const premise = {
                  id: change.doc.id,
                  ...change.doc.data(),
                };

                const index = draft.findIndex((item) => item.id === premise.id);

                if (change.type === "added") {
                  if (index === -1) {
                    draft.unshift(premise);
                  }
                } else if (change.type === "modified") {
                  if (index > -1) {
                    draft[index] = premise;
                  } else {
                    draft.unshift(premise);
                  }
                } else if (change.type === "removed") {
                  if (index > -1) {
                    draft.splice(index, 1);
                  }
                }
              });
            });
          });
        } catch (e) {
          console.error("❌ [PREMISE_STREAM_ERROR][WARD]:", e);
        }

        await cacheEntryRemoved;
        unsubscribe();
      },
    }),

    addPremise: builder.mutation({
      async queryFn(newPremise) {
        try {
          await setDoc(doc(db, "premises", newPremise.id), newPremise);
          return { data: newPremise };
        } catch (error) {
          return { error: error.message };
        }
      },

      async onQueryStarted(newPremise, { dispatch, queryFulfilled }) {
        const lmPcode = newPremise?.parents?.lmPcode || null;
        const wardPcode = newPremise?.parents?.wardPcode || null;

        const erfId = newPremise?.erfId;
        const premiseId = newPremise?.id;

        const premisesArg = { lmPcode, wardPcode };
        const erfsArg = { lmPcode, wardPcode };

        let patchPremises = null;
        let patchErfs = null;

        try {
          // optimistic update: ward-scoped premises cache
          if (lmPcode && wardPcode) {
            patchPremises = dispatch(
              premisesApi.util.updateQueryData(
                "getPremisesByLmPcodeWardPcode",
                premisesArg,
                (draft) => {
                  if (!Array.isArray(draft)) return;
                  const exists = draft.some((p) => p.id === premiseId);
                  if (!exists) draft.unshift(newPremise);
                },
              ),
            );
          }

          // optimistic ERF pack update
          if (lmPcode && wardPcode && erfId) {
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

                  if (!Array.isArray(targetErf.premises)) {
                    targetErf.premises = [];
                  }

                  if (!targetErf.premises.includes(premiseId)) {
                    targetErf.premises.push(premiseId);
                  }

                  targetErf.metadata = {
                    ...targetErf.metadata,
                    updatedAt: new Date().toISOString(),
                  };
                },
              ),
            );
          }

          await queryFulfilled;
        } catch (err) {
          console.error("❌ [ADD_PREMISE_OPTIMISTIC_FAIL]:", err);
          patchPremises?.undo?.();
          patchErfs?.undo?.();
        }
      },
    }),

    updatePremise: builder.mutation({
      async queryFn(updatedPremise) {
        try {
          const docRef = doc(db, "premises", updatedPremise.id);
          await setDoc(docRef, updatedPremise, { merge: true });
          return { data: updatedPremise };
        } catch (error) {
          return { error: error.message };
        }
      },

      async onQueryStarted(updatedPremise, { dispatch, queryFulfilled }) {
        const premiseId = updatedPremise?.id;

        const erfId = updatedPremise?.erfId;

        const lmPcode = updatedPremise?.parents?.lmPcode || null;
        const wardPcode = updatedPremise?.parents?.wardPcode || null;

        const premisesArg = { lmPcode, wardPcode };

        const erfsArg = { lmPcode, wardPcode };

        let patchPremises = null;
        let patchErfs = null;

        try {
          // optimistic update: NEW ward-scoped cache
          if (lmPcode && wardPcode) {
            patchPremises = dispatch(
              premisesApi.util.updateQueryData(
                "getPremisesByLmPcodeWardPcode",
                premisesArg,
                (draft) => {
                  const index = draft.findIndex((p) => p.id === premiseId);
                  if (index !== -1) {
                    draft[index] = { ...draft[index], ...updatedPremise };
                  }
                  sortPremisesByUpdatedAt(draft);
                },
              ),
            );
          }

          // optimistic ERF pack metadata touch
          if (lmPcode && wardPcode && erfId) {
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
                    updatedAt: new Date().toISOString(),
                  };
                },
              ),
            );
          }

          await queryFulfilled;
        } catch (err) {
          console.error("❌ [UPDATE_PREMISE_OPTIMISTIC_FAIL]:", err);
          patchPremises?.undo?.();
          patchErfs?.undo?.();
        }
      },
    }),

    getPremisesByCountryCode: builder.query({
      async queryFn() {
        return { data: [] };
      },
      async onCacheEntryAdded(
        { id },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};

        try {
          await cacheDataLoaded;
          if (!id) return;

          const q = query(
            collection(db, "premises"),
            where("parents.countryId", "==", id),
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            updateCachedData(() => {
              return snapshot.docs.map((snap) => ({
                id: snap.id,
                ...snap.data(),
              }));
            });
          });
        } catch (error) {
          console.error("❌ [NATIONAL PREMISE ERROR]:", error);
        }

        await cacheEntryRemoved;
        unsubscribe();
      },
    }),
  }),
});

export const {
  useGetPremisesByLmPcodeQuery, // temporary backward compatibility
  useGetPremisesByLmPcodeWardPcodeQuery, // ✅ new operational endpoint
  useGetPremisesByCountryCodeQuery,
  useAddPremiseMutation,
  useUpdatePremiseMutation,
} = premisesApi;
