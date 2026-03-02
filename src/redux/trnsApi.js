import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { REHYDRATE } from "redux-persist";
import { db } from "../firebase";

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
          const docRef = await addDoc(collection(db, "trns"), payload);
          return { data: { id: docRef.id, ...payload } };
        } catch (error) {
          return { error };
        }
      },
      async onQueryStarted(payload, { dispatch, queryFulfilled }) {
        const { accessData, ast, meterType } = payload;
        const { premise, metadata, erfId } = accessData;
        const lmPcode = metadata?.lmPcode;

        // 🆔 Temporary IDs for immediate UI feedback
        const tempTrnId = `TEMP_TRN_${Date.now()}`;
        const tempAstId = `TEMP_AST_${Date.now()}`;

        try {
          // 🛰️ Bridge imports
          const { premisesApi } = await import("./premisesApi");
          const { erfsApi } = await import("./erfsApi");
          const { astsApi } = await import("./astsApi");

          // 🎯 1. OPTIMISTIC TRANSACTION (The Audit Log)
          // We unshift to the top so Zamo sees his latest work instantly
          dispatch(
            trnsApi.util.updateQueryData(
              "getTrnsByLmPcode",
              lmPcode,
              (draft) => {
                draft.unshift({
                  id: tempTrnId,
                  ...payload,
                  isOptimistic: true,
                });
              },
            ),
          );

          // 🎯 2. OPTIMISTIC ASSET (The Map Circle)
          if (
            accessData.trnType === "METER_DISCOVERY" &&
            accessData.access.hasAccess === "yes"
          ) {
            dispatch(
              astsApi.util.updateQueryData(
                "getAstsByLmPcode",
                lmPcode,
                (draft) => {
                  draft.push({
                    id: tempAstId,
                    accessData,
                    ast,
                    meterType,
                    metadata: { ...metadata, isOptimistic: true },
                  });
                },
              ),
            );
          }

          // 🎯 3. OPTIMISTIC PREMISE (Occupancy + Service Link)
          if (premise?.id) {
            dispatch(
              premisesApi.util.updateQueryData(
                "getPremisesByLmPcode",
                lmPcode,
                (draft) => {
                  const p = draft.find((item) => item.id === premise.id);
                  if (p) {
                    p.occupancy = { ...p.occupancy, status: "ACCESSED" };
                    if (!p.services)
                      p.services = { waterMeters: [], electricityMeters: [] };
                    const field =
                      meterType === "water"
                        ? "waterMeters"
                        : "electricityMeters";
                    if (!p.services[field]) p.services[field] = [];
                    p.services[field].push(tempAstId);
                  }
                },
              ),
            );
          }

          // 🎯 4. OPTIMISTIC ERF (Timestamp Pulse)
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
                    targetErf.metadata = {
                      ...targetErf.metadata,
                      updatedAt: new Date().toISOString(),
                    };
                  }
                },
              ),
            );
          }

          // 🏁 THE HANDSHAKE
          const { data: finalTrn } = await queryFulfilled;

          // Replace the TEMP Transaction with the REAL one to avoid duplicates
          dispatch(
            trnsApi.util.updateQueryData(
              "getTrnsByLmPcode",
              lmPcode,
              (draft) => {
                const index = draft.findIndex((t) => t.id === tempTrnId);
                if (index > -1) draft[index] = finalTrn;
              },
            ),
          );
        } catch (err) {
          console.error("❌ [TRN_PULSE_ERROR]:", err);
          // Optional: You could trigger a manual refetch here to clean up the TEMP data if it fails
        }
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

          // 🎯 1. CLOUD SORT: Newest first (Ensure you have a composite index for this!)
          const q = query(
            collection(db, "trns"),
            where("accessData.metadata.lmPcode", "==", lmPcode),
            orderBy("accessData.metadata.updated.at", "desc"),
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            updateCachedData((draft) => {
              // 🎯 2. INITIAL SYNC: Direct mapping of the sorted snapshot
              if (snapshot.docChanges().length === snapshot.docs.length) {
                return snapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                }));
              }

              // 🎯 3. SURGICAL UPDATES: New transactions unshifted to index 0
              snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                  const trn = { id: change.doc.id, ...change.doc.data() };
                  const exists = draft.find((t) => t.id === trn.id);

                  // 🛡️ Always unshift to the top for "Audit Log" feel
                  if (!exists) draft.unshift(trn);
                }
              });
            });
          });
        } catch (err) {
          console.error("❌ [TRN_STREAM_ERROR]:", err);
        }
        await cacheEntryRemoved;
        unsubscribe();
      },
    }),

    // getTrnsByLmPcode: builder.query({
    //   queryFn: () => ({ data: [] }),
    //   async onCacheEntryAdded(
    //     lmPcode,
    //     { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
    //   ) {
    //     let unsubscribe = () => {};
    //     try {
    //       await cacheDataLoaded;
    //       const q = query(
    //         collection(db, "trns"),
    //         where("accessData.metadata.lmPcode", "==", lmPcode),
    //         // orderBy("accessData.metadata.updated.at", "desc"),
    //       );
    //       unsubscribe = onSnapshot(q, (snapshot) => {
    //         updateCachedData((draft) => {
    //           snapshot.docChanges().forEach((change) => {
    //             const trn = { id: change.doc.id, ...change.doc.data() };
    //             if (change.type === "added") {
    //               // Transactions are immutable, so we only care about 'added'
    //               const exists = draft.find((t) => t.id === trn.id);
    //               if (!exists) draft.unshift(trn);
    //             }
    //           });
    //         });
    //       });
    //     } catch {}
    //     await cacheEntryRemoved;
    //     unsubscribe();
    //   },
    // }),

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
            orderBy("accessData.metadata.created.at", "desc"),
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            updateCachedData((draft) => {
              snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                  const trn = { id: change.doc.id, ...change.doc.data() };
                  if (!draft.find((t) => t.id === trn.id)) {
                    draft.unshift(trn); // 🎯 Surgical Top-Insert
                  }
                }
              });
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
        country, // 🎯 Standard: Expects { id: "ZA", name: "South Africa" }
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};
        try {
          await cacheDataLoaded;

          // 🛡️ Guard: Ensure the ID exists before opening the stream
          const countryId = country?.id;
          if (!countryId) return;

          const q = query(
            collection(db, "trns"),
            where("accessData.metadata.countryId", "==", countryId), // 🎯 Compare ID to ID
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
        // We return empty initially as onCacheEntryAdded will populate it
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

          // 🛰️ Direct Real-time Link to the specific Transaction doc
          const docRef = doc(db, "trns", id);

          unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
              updateCachedData((draft) => {
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
            // Note: If you add orderBy, ensure you have the Firestore Index
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            updateCachedData((draft) => {
              snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                  const trn = { id: change.doc.id, ...change.doc.data() };
                  if (!draft.find((t) => t.id === trn.id)) {
                    draft.unshift(trn); // 🎯 Surgical Top-Insert
                  }
                }
              });
            });
          });
        } catch (error) {
          console.error("❌ [AST_TRN_ERROR]:", error);
        }
        await cacheEntryRemoved;
        unsubscribe();
      },
    }),
  }),
});

export const {
  useAddTrnMutation,
  useGetTrnsByLmPcodeQuery,
  useGetTrnsByCountryCodeQuery,
  useGetTrnsByPremiseIdQuery,
  useGetTrnByIdQuery,
  useGetTrnsByAstNoQuery,
} = trnsApi;
