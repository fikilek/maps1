import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { REHYDRATE } from "redux-persist";
import { db } from "../firebase";

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

          // 🛰️ The Query: Target the correct path from your JSON
          const q = query(
            collection(db, "asts"),
            where("accessData.metadata.lmPcode", "==", lmPcode),
            orderBy("accessData.metadata.updated.at", "desc"),
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            // 🎯 1. SURGICAL RAM UPDATE (Asset List)

            updateCachedData((draft) => {
              // 🎯 1. INITIAL LOAD: Handle the bulk snapshot
              if (snapshot.docChanges().length === snapshot.docs.length) {
                return snapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                }));
              }

              // 🎯 2. SURGICAL UPDATES: Handle live changes
              snapshot.docChanges().forEach((change) => {
                const ast = { id: change.doc.id, ...change.doc.data() };
                const index = draft.findIndex((item) => item.id === ast.id);

                if (change.type === "added") {
                  if (index === -1) draft.unshift(ast); // 🛡️ Top-Insert
                } else if (change.type === "modified") {
                  if (index > -1) draft[index] = ast;
                } else if (change.type === "removed") {
                  if (index > -1) draft.splice(index, 1);
                }
              });
            });

            // updateCachedData((draft) => {
            //   snapshot.docChanges().forEach((change) => {
            //     const ast = { id: change.doc.id, ...change.doc.data() };
            //     const index = draft.findIndex((item) => item.id === ast.id);

            //     if (change.type === "added" || change.type === "modified") {
            //       if (index > -1) {
            //         draft[index] = ast;
            //       } else {
            //         draft.push(ast);
            //       }
            //     } else if (change.type === "removed") {
            //       if (index > -1) draft.splice(index, 1);
            //     }
            //   });
            // });

            // 🎯 2. THE COMMAND BRIDGE: Triple-Pulse
            const { premisesApi } = require("./premisesApi");
            const { erfsApi } = require("./erfsApi");

            snapshot.docChanges().forEach((change) => {
              if (change.type === "added" || change.type === "modified") {
                const astData = change.doc.data();

                // ✅ FIXED PATHS based on your JSON schema
                const premiseId = astData.accessData?.premise?.id;
                const erfId = astData.accessData?.erfId;
                const agentName =
                  astData.accessData?.metadata?.updated?.byUser || "Agent";

                // 🔥 PULSE PREMISE (The Parent)
                if (premiseId) {
                  dispatch(
                    premisesApi.util.updateQueryData(
                      "getPremisesByLmPcode",
                      lmPcode,
                      (draft) => {
                        const targetPrem = draft.find(
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
                }

                // 🔥 PULSE ERF (The Grandparent)
                if (erfId) {
                  dispatch(
                    erfsApi.util.updateQueryData(
                      "getErfsByLmPcode",
                      lmPcode,
                      (draft) => {
                        const targetErf = draft?.metaEntries?.find(
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
                }
              }
            });
          });
        } catch (err) {
          console.error("❌ [AST_STREAM_ERROR]:", err);
        }
        await cacheEntryRemoved;
        unsubscribe();
      },
    }),

    getAstsByCountryCode: builder.query({
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
          const q = query(
            collection(db, "asts"),
            where("accessData.metadata.countryId", "==", id),
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            updateCachedData((draft) => {
              snapshot.docChanges().forEach((change) => {
                const ast = { id: change.doc.id, ...change.doc.data() };
                const index = draft.findIndex((item) => item.id === ast.id);

                if (change.type === "added" || change.type === "modified") {
                  if (index > -1) {
                    draft[index] = ast; // 🔄 Surgical Update
                  } else {
                    draft.push(ast); // ➕ Surgical Addition
                  }
                } else if (change.type === "removed") {
                  if (index > -1) draft.splice(index, 1); // ➖ Surgical Removal
                }
              });
            });
          });
        } catch (error) {
          console.error("❌ [NATIONAL ASSET ERROR]:", error);
        }

        await cacheEntryRemoved;
        unsubscribe();
      },
    }),

    getAstById: builder.query({
      queryFn: () => ({ data: null }),
      async onCacheEntryAdded(
        id, // This is the docId passed from your router.push
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};
        try {
          await cacheDataLoaded;
          if (!id) return;

          // 🛰️ Direct link to the specific Asset Document
          const docRef = doc(db, "asts", id);

          unsubscribe = onSnapshot(docRef, (docSnap) => {
            updateCachedData((draft) => {
              if (docSnap.exists()) {
                // 🎯 Only update if the data actually changed
                const newData = { id: docSnap.id, ...docSnap.data() };
                return newData;
              } else {
                // 🚫 Document was removed from Cloud
                return null;
              }
            });
          });
        } catch (error) {
          console.error("❌ [AST DOCUMENT ERROR]:", error);
        }
        await cacheEntryRemoved;
        unsubscribe();
      },
    }),
  }),
});

export const {
  useGetAstsByLmPcodeQuery,
  useGetAstsByCountryCodeQuery,
  useGetAstByIdQuery,
} = astsApi;
