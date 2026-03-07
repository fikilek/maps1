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

export const premisesApi = createApi({
  reducerPath: "premisesApi",
  baseQuery: fakeBaseQuery(),
  extractRehydrationInfo(action, { reducerPath }) {
    if (action.type === REHYDRATE) {
      return action.payload?.[reducerPath];
    }
  },
  endpoints: (builder) => ({
    getPremisesByLmPcode: builder.query({
      queryFn: () => ({ data: [] }),
      async onCacheEntryAdded(
        lmPcode,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};
        try {
          await cacheDataLoaded;

          const q = query(
            collection(db, "premises"),
            where("parents.lmId", "==", lmPcode),
            orderBy("metadata.updated.at", "desc"),
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            updateCachedData((draft) => {
              // 🎯 1. INITIAL SYNC: Direct mapping
              if (snapshot.docChanges().length === snapshot.docs.length) {
                return snapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                }));
              }

              // 🎯 2. SURGICAL UPDATES: Only care about the Premise itself
              snapshot.docChanges().forEach((change) => {
                const p = { id: change.doc.id, ...change.doc.data() };
                const index = draft.findIndex((item) => item.id === p.id);

                if (change.type === "added") {
                  if (index === -1) draft.unshift(p);
                } else if (change.type === "modified") {
                  if (index > -1) draft[index] = p;
                } else if (change.type === "removed") {
                  if (index > -1) draft.splice(index, 1);
                }
              });
            });
            // ✂️ THE PULSE ERF SECTION IS REMOVED
          });
        } catch (e) {
          console.error("❌ [PREMISE_STREAM_ERROR]:", e);
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
        const lmPcode =
          newPremise.parents?.lmId ||
          newPremise.parents?.lmPcode ||
          newPremise.metadata?.lmPcode;

        const wardPcode =
          newPremise.parents?.wardPcode ||
          newPremise.parents?.wardId ||
          newPremise.metadata?.wardPcode;

        const erfId = newPremise.erfId;
        const premiseId = newPremise.id;

        // ✅ This MUST match exactly how your ERFs query is called now
        const erfsArg = { lmPcode, wardPcode };

        try {
          // (1) Optimistic Premise list (if you still use this query)
          dispatch(
            premisesApi.util.updateQueryData(
              "getPremisesByLmPcode",
              lmPcode,
              (draft) => {
                if (!Array.isArray(draft)) return;
                // avoid duplicates if mutation retriggers
                const exists = draft.some((p) => p.id === premiseId);
                if (!exists) draft.push(newPremise);
              },
            ),
          );

          // (2) ✅ Optimistic ERF update on the NEW endpoint
          dispatch(
            erfsApi.util.updateQueryData(
              "getErfsByLmPcodeWardPcode",
              erfsArg,
              (draft) => {
                // Your draft shape might be either:
                // A) { metaEntries: [...] }  OR  B) array
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

                if (!Array.isArray(targetErf.premises)) targetErf.premises = [];

                // prevent double push
                if (!targetErf.premises.includes(premiseId)) {
                  targetErf.premises.push(premiseId);
                }
              },
            ),
          );

          await queryFulfilled;
        } catch (err) {
          console.error("❌ [OPTIMISTIC_FAIL]:", err);
        }
      },
    }),

    // addPremise: builder.mutation({
    //   async queryFn(newPremise) {
    //     try {
    //       await setDoc(doc(db, "premises", newPremise.id), newPremise);
    //       return { data: newPremise };
    //     } catch (error) {
    //       return { error: error.message };
    //     }
    //   },

    //   async onQueryStarted(newPremise, { dispatch, queryFulfilled }) {
    //     const lmPcode =
    //       newPremise.parents?.lmId ||
    //       newPremise.parents?.lmPcode ||
    //       newPremise.metadata?.lmPcode;

    //     const wardPcode =
    //       newPremise.parents?.wardPcode ||
    //       newPremise.parents?.wardId ||
    //       newPremise.metadata?.wardPcode;

    //     const erfId = newPremise.erfId;
    //     const premiseId = newPremise.id;

    //     // ✅ This MUST match exactly how your ERFs query is called now
    //     const erfsArg = { lmPcode, wardPcode };

    //     try {
    //       // (1) Optimistic Premise list (if you still use this query)
    //       dispatch(
    //         premisesApi.util.updateQueryData(
    //           "getPremisesByLmPcode",
    //           lmPcode,
    //           (draft) => {
    //             if (!Array.isArray(draft)) return;
    //             // avoid duplicates if mutation retriggers
    //             const exists = draft.some((p) => p.id === premiseId);
    //             if (!exists) draft.push(newPremise);
    //           },
    //         ),
    //       );

    //       // (2) ✅ Optimistic ERF update on the NEW endpoint
    //       dispatch(
    //         erfsApi.util.updateQueryData(
    //           "getErfsByLmPcodeWardPcode",
    //           erfsArg,
    //           (draft) => {
    //             // Your draft shape might be either:
    //             // A) { metaEntries: [...] }  OR  B) array
    //             const list = Array.isArray(draft)
    //               ? draft
    //               : Array.isArray(draft?.metaEntries)
    //                 ? draft.metaEntries
    //                 : Array.isArray(draft?.items)
    //                   ? draft.items
    //                   : null;

    //             if (!list) return;

    //             const targetErf = list.find((e) => e?.id === erfId);
    //             if (!targetErf) return;

    //             if (!Array.isArray(targetErf.premises)) targetErf.premises = [];

    //             // prevent double push
    //             if (!targetErf.premises.includes(premiseId)) {
    //               targetErf.premises.push(premiseId);
    //             }
    //           },
    //         ),
    //       );

    //       await queryFulfilled;
    //     } catch (err) {
    //       console.error("❌ [OPTIMISTIC_FAIL]:", err);
    //     }
    //   },
    // }),

    // addPremise: builder.mutation({
    //   async queryFn(newPremise) {
    //     try {
    //       // Use setDoc to ensure the ID we generated in the form is the Firestore ID
    //       await setDoc(doc(db, "premises", newPremise.id), newPremise);
    //       return { data: newPremise };
    //     } catch (error) {
    //       return { error: error.message };
    //     }
    //   },
    //   async onQueryStarted(newPremise, { dispatch, queryFulfilled }) {
    //     // 🎯 Ensure these strings are clean
    //     const lmPcode =
    //       newPremise.parents?.lmId || newPremise.metadata?.lmPcode;
    //     const erfId = newPremise.erfId;
    //     const premiseId = newPremise.id;

    //     try {
    //       // 🎯 OPTIMISTIC PREMISE
    //       dispatch(
    //         premisesApi.util.updateQueryData(
    //           "getPremisesByLmPcode",
    //           lmPcode,
    //           (draft) => {
    //             // Ensure we aren't pushing into a non-array rehydrated state
    //             if (!Array.isArray(draft)) return [newPremise];
    //             draft.push(newPremise);
    //           },
    //         ),
    //       );

    //       // 🎯 OPTIMISTIC ERF COUNT
    //       const { erfsApi } = require("./erfsApi");
    //       dispatch(
    //         erfsApi.util.updateQueryData(
    //           "getErfsByLmPcode",
    //           lmPcode,
    //           (draft) => {
    //             const targetErf = draft?.metaEntries?.find(
    //               (e) => e.id === erfId,
    //             );
    //             if (targetErf) {
    //               if (!targetErf.premises) targetErf.premises = [];
    //               targetErf.premises.push(premiseId);
    //             }
    //           },
    //         ),
    //       );

    //       await queryFulfilled;
    //     } catch (err) {
    //       console.error("❌ [OPTIMISTIC_FAIL]:", err);
    //     }
    //   },
    // }),

    // addPremise: builder.mutation({
    //   async queryFn(newPremise) {
    //     try {
    //       const docRef = doc(db, "premises", newPremise.id);
    //       await setDoc(docRef, newPremise, { merge: true });
    //       return { data: newPremise };
    //     } catch (error) {
    //       return { error: error.message };
    //     }
    //   },
    //   async onQueryStarted(newPremise, { dispatch, queryFulfilled }) {
    //     const { erfId, id: premiseId, metadata } = newPremise;
    //     const lmPcode = metadata?.lmPcode;

    //     try {
    //       // 🎯 1. RAM: Premises List (Optimistic)
    //       dispatch(
    //         premisesApi.util.updateQueryData(
    //           "getPremisesByLmPcode",
    //           lmPcode,
    //           (draft) => {
    //             if (!Array.isArray(draft)) return;
    //             const index = draft.findIndex((p) => p.id === premiseId);
    //             if (index > -1) {
    //               draft[index] = { ...draft[index], ...newPremise };
    //             } else {
    //               draft.push(newPremise);
    //             }
    //           },
    //         ),
    //       );

    //       // 🎯 2. RAM: Erf Pulse (Optimistic)
    //       const { erfsApi } = require("./erfsApi");
    //       dispatch(
    //         erfsApi.util.updateQueryData(
    //           "getErfsByLmPcode",
    //           lmPcode,
    //           (draft) => {
    //             const targetErf = draft?.metaEntries?.find(
    //               (e) => e.id === erfId,
    //             );
    //             if (targetErf) {
    //               if (!targetErf.premises) targetErf.premises = [];
    //               if (!targetErf.premises.includes(premiseId)) {
    //                 targetErf.premises.push(premiseId);
    //               }
    //               targetErf.metadata = {
    //                 ...targetErf.metadata,
    //                 updatedAt: new Date().toISOString(),
    //                 updatedBy: metadata?.updated?.byUser || "System",
    //               };
    //             }
    //           },
    //         ),
    //       );

    //       await queryFulfilled;
    //     } catch (err) {
    //       console.error("❌ [OPTIMISTIC_FAIL]:", err);
    //     }
    //   },
    // }),

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
        const { id: premiseId, erfId, metadata } = updatedPremise;
        const lmPcode = metadata?.lmPcode;

        try {
          dispatch(
            premisesApi.util.updateQueryData(
              "getPremisesByLmPcode",
              lmPcode,
              (draft) => {
                const index = draft.findIndex((p) => p.id === premiseId);
                if (index !== -1) {
                  draft[index] = { ...draft[index], ...updatedPremise };
                }
              },
            ),
          );

          if (erfId) {
            dispatch(
              erfsApi.util.updateQueryData(
                "getErfsByLmPcodeWardPcode",
                lmPcode,
                (draft) => {
                  const targetErf = draft?.metaEntries?.find(
                    (e) => e.id === erfId,
                  );
                  if (targetErf) {
                    targetErf.metadata = {
                      ...targetErf.metadata,
                      updatedAt: new Date().toISOString(),
                    };
                  }
                },
              ),
            );
          }
          await queryFulfilled;
        } catch (err) {
          console.error("❌ [UPDATE_FAIL]:", err);
        }
      },
    }),

    getPremisesByCountryCode: builder.query({
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

          // 🛡️ Guard: Querying by National Hierarchy
          const q = query(
            collection(db, "premises"),
            where("parents.countryId", "==", id),
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
          console.error("❌ [NATIONAL PREMISE ERROR]:", error);
        }

        await cacheEntryRemoved;
        unsubscribe();
      },
    }),
  }),
});

export const {
  useGetPremisesByLmPcodeQuery,
  useGetPremisesByCountryCodeQuery,
  useAddPremiseMutation, // 🎯 THE SMART ONE (Change your Form to use this!)
  useUpdatePremiseMutation,
} = premisesApi;
