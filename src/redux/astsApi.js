import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { REHYDRATE } from "redux-persist";
import { db } from "../firebase";

function toMillis(value) {
  if (!value) return 0;

  if (typeof value?.toMillis === "function") {
    return value.toMillis();
  }

  if (typeof value?.seconds === "number") {
    return value.seconds * 1000;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getAstUpdatedAt(ast) {
  return (
    ast?.metadata?.updatedAt ||
    ast?.accessData?.metadata?.updatedAt ||
    ast?.metadata?.createdAt ||
    ast?.accessData?.metadata?.createdAt ||
    null
  );
}

function getAstUpdatedByUser(ast) {
  return (
    ast?.metadata?.updatedByUser ||
    ast?.metadata?.createdByUser ||
    ast?.accessData?.metadata?.updatedByUser ||
    ast?.accessData?.metadata?.createdByUser ||
    "Agent"
  );
}

function sortAstsByUpdatedAtDesc(list) {
  if (!Array.isArray(list)) return;

  list.sort(
    (a, b) => toMillis(getAstUpdatedAt(b)) - toMillis(getAstUpdatedAt(a)),
  );
}

function mapAstDoc(docSnap) {
  return {
    id: docSnap.id,
    ...docSnap.data(),
  };
}

export const astsApi = createApi({
  reducerPath: "astsApi",
  baseQuery: fakeBaseQuery(),

  extractRehydrationInfo(action, { reducerPath }) {
    if (action.type === REHYDRATE) {
      return action.payload?.[reducerPath];
    }
  },

  endpoints: (builder) => ({
    getAstsByLmPcode: builder.query({
      queryFn: () => ({ data: [] }),

      async onCacheEntryAdded(
        lmPcode,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch },
      ) {
        let unsubscribe = () => {};

        try {
          await cacheDataLoaded;

          if (!lmPcode) return;

          const q = query(
            collection(db, "asts"),
            where("accessData.parents.lmPcode", "==", lmPcode),
          );

          unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              updateCachedData((draft) => {
                if (snapshot.docChanges().length === snapshot.docs.length) {
                  const next = snapshot.docs.map(mapAstDoc);
                  sortAstsByUpdatedAtDesc(next);
                  return next;
                }

                snapshot.docChanges().forEach((change) => {
                  const ast = mapAstDoc(change.doc);
                  const index = draft.findIndex((item) => item.id === ast.id);

                  if (change.type === "added") {
                    if (index === -1) draft.unshift(ast);
                  } else if (change.type === "modified") {
                    if (index > -1) draft[index] = ast;
                  } else if (change.type === "removed") {
                    if (index > -1) draft.splice(index, 1);
                  }
                });

                sortAstsByUpdatedAtDesc(draft);
              });

              const { premisesApi } = require("./premisesApi");
              const { erfsApi } = require("./erfsApi");

              snapshot.docChanges().forEach((change) => {
                if (change.type !== "added" && change.type !== "modified") {
                  return;
                }

                const astData = change.doc.data() || {};

                const premiseId = astData?.accessData?.premise?.id || null;
                const erfId = astData?.accessData?.erfId || null;
                const wardPcode =
                  astData?.accessData?.parents?.wardPcode || null;
                const agentName = getAstUpdatedByUser(astData);

                if (premiseId) {
                  try {
                    dispatch(
                      premisesApi.util.updateQueryData(
                        "getPremisesByLmPcode",
                        lmPcode,
                        (draft) => {
                          const targetPrem = draft?.find?.(
                            (p) => p.id === premiseId,
                          );

                          if (targetPrem) {
                            if (!targetPrem.metadata) targetPrem.metadata = {};
                            targetPrem.metadata.updatedAt =
                              new Date().toISOString();
                            targetPrem.metadata.updatedBy = agentName;
                          }
                        },
                      ),
                    );
                  } catch (error) {
                    console.log(
                      "⚠️ Could not patch premise cache from AST stream:",
                      error.message,
                    );
                  }
                }

                if (erfId && wardPcode) {
                  try {
                    dispatch(
                      erfsApi.util.updateQueryData(
                        "getErfsByLmPcodeWardPcode",
                        { lmPcode, wardPcode },
                        (draft) => {
                          const targetErf = draft?.metaEntries?.find?.(
                            (e) => e.id === erfId,
                          );

                          if (targetErf) {
                            if (!targetErf.metadata) targetErf.metadata = {};
                            targetErf.metadata.updatedAt =
                              new Date().toISOString();
                            targetErf.metadata.updatedBy = agentName;
                          }
                        },
                      ),
                    );
                  } catch (error) {
                    console.log(
                      "⚠️ Could not patch ERF cache from AST stream:",
                      error.message,
                    );
                  }
                }
              });
            },
            (error) => {
              console.error("❌ [AST_LM_SNAPSHOT_ERROR]:", error);
            },
          );
        } catch (err) {
          console.error("❌ [AST_STREAM_ERROR]:", err);
        }

        await cacheEntryRemoved;
        unsubscribe();
      },
    }),

    getAstsByCountryCode: builder.query({
      queryFn: () => ({ data: [] }),

      async onCacheEntryAdded(
        { id },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};

        try {
          await cacheDataLoaded;

          if (!id) return;

          const q = query(
            collection(db, "asts"),
            where("accessData.parents.countryPcode", "==", id),
          );

          unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              updateCachedData((draft) => {
                if (snapshot.docChanges().length === snapshot.docs.length) {
                  const next = snapshot.docs.map(mapAstDoc);
                  sortAstsByUpdatedAtDesc(next);
                  return next;
                }

                snapshot.docChanges().forEach((change) => {
                  const ast = mapAstDoc(change.doc);
                  const index = draft.findIndex((item) => item.id === ast.id);

                  if (change.type === "added" || change.type === "modified") {
                    if (index > -1) {
                      draft[index] = ast;
                    } else {
                      draft.push(ast);
                    }
                  } else if (change.type === "removed") {
                    if (index > -1) draft.splice(index, 1);
                  }
                });

                sortAstsByUpdatedAtDesc(draft);
              });
            },
            (error) => {
              console.error("❌ [NATIONAL_ASSET_SNAPSHOT_ERROR]:", error);
            },
          );
        } catch (error) {
          console.error("❌ [NATIONAL_ASSET_ERROR]:", error);
        }

        await cacheEntryRemoved;
        unsubscribe();
      },
    }),

    getAstById: builder.query({
      queryFn: () => ({ data: null }),

      async onCacheEntryAdded(
        id,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};

        try {
          await cacheDataLoaded;

          if (!id) return;

          const docRef = doc(db, "asts", id);

          unsubscribe = onSnapshot(
            docRef,
            (docSnap) => {
              updateCachedData(() => {
                if (docSnap.exists()) {
                  return mapAstDoc(docSnap);
                }

                return null;
              });
            },
            (error) => {
              console.error("❌ [AST_DOCUMENT_SNAPSHOT_ERROR]:", error);
            },
          );
        } catch (error) {
          console.error("❌ [AST_DOCUMENT_ERROR]:", error);
        }

        await cacheEntryRemoved;
        unsubscribe();
      },
    }),

    getAstsByLmPcodeWardPcode: builder.query({
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
            collection(db, "asts"),
            where("accessData.parents.lmPcode", "==", lmPcode),
            where("accessData.parents.wardPcode", "==", wardPcode),
          );

          unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              updateCachedData(() => {
                const next = snapshot.docs.map(mapAstDoc);
                sortAstsByUpdatedAtDesc(next);
                return next;
              });
            },
            (error) => {
              console.error("❌ [AST_WARD_SNAPSHOT_ERROR]:", error);
            },
          );
        } catch (err) {
          console.error("❌ [AST_WARD_STREAM_ERROR]:", err);
        }

        await cacheEntryRemoved;
        unsubscribe();
      },
    }),
  }),
});

export const {
  useGetAstsByLmPcodeQuery,
  useGetAstsByLmPcodeWardPcodeQuery,
  useGetAstsByCountryCodeQuery,
  useGetAstByIdQuery,
} = astsApi;
