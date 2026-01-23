import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

export const trnsApi = createApi({
  reducerPath: "trnsApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Trns"],
  endpoints: (builder) => ({
    // 🎯 THE MUTATION: All uploads go through here

    // trnsApi.js
    addTrn: builder.mutation({
      async queryFn(payload) {
        try {
          const docRef = await addDoc(collection(db, "trns"), payload);
          return { data: { id: docRef.id, ...payload } };
        } catch (error) {
          return { error };
        }
      },
      invalidatesTags: ["Trns"],

      async onQueryStarted(payload, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;

          // 🎯 THE FIX: Use the 'util' from premisesApi inside the function
          // to avoid circular dependency at the top of the file
          const { premisesApi } = await import("./premisesApi");

          if (payload.trnType === "METER_DISCOVERY") {
            dispatch(
              premisesApi.util.updateQueryData(
                "getPremisesByLmPcode",
                { lmPcode: payload.metadata.lmPcode },
                (draft) => {
                  // Find the specific premise in the RAM cache
                  const p = draft.find(
                    (item) => item.id === payload.premise.id,
                  );
                  if (p) {
                    p.occupancy = {
                      status: payload.premise.status,
                      adverseCondition: payload.data.adverseCondition || false,
                    };
                    p.metadata = payload.metadata; // Standard 2026-01-21
                  }
                },
              ),
            );
          }
        } catch (err) {
          console.error("onQueryStarted Error:", err);
        }
      },
    }),

    // addTrn: builder.mutation({
    //   async queryFn(payload) {
    //     try {
    //       const docRef = await addDoc(collection(db, "trns"), payload);
    //       return { data: { id: docRef.id, ...payload } };
    //     } catch (error) {
    //       return { error };
    //     }
    //   },
    //   invalidatesTags: ["Trns"],

    //   // 🎯 THE MAGIC: Update the Premise when a Transaction is born
    //   async onQueryStarted(payload, { dispatch, queryFulfilled }) {
    //     console.log(`addTrn --onQueryStarted --payload`, payload);
    //     console.log(
    //       `addTrn --onQueryStarted --payload.metadata.lmPcode`,
    //       payload.metadata.lmPcode,
    //     );

    //     try {
    //       const { data: createdTrn } = await queryFulfilled;

    //       // Only update premise if the transaction is a METER_DISCOVERY
    //       if (payload.trnType === "METER_DISCOVERY") {
    //         dispatch(
    //           premisesApi.util.updateQueryData(
    //             "getPremises", // Use the actual name of your premises query
    //             { lmPcode: payload.metadata.lmPcode },
    //             (draft) => {
    //               console.log(`addTrn --onQueryStarted --draft`, draft);

    //               const premiseIndex = draft.findIndex(
    //                 (p) => p.id === payload.premise.id,
    //               );
    //               if (premiseIndex !== -1) {
    //                 // Apply updates to the draft
    //                 draft[premiseIndex].occupancy = {
    //                   status: payload.premise.status,
    //                   adverseCondition: payload.data.adverseCondition || false,
    //                 };
    //                 draft[premiseIndex].metadata = payload.metadata;
    //               }
    //             },
    //           ),
    //         );
    //       }
    //     } catch (err) {
    //       console.error("onQueryStarted Error:", err);
    //     }
    //   },
    // }),

    // 🎯 THE STREAM: Real-time sync
    getTrns: builder.query({
      async queryFn() {
        return { data: [] };
      },
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};
        try {
          await cacheDataLoaded;
          const q = query(
            collection(db, "trns"),
            where("metadata.lmPcode", "==", arg.lmPcode),
            orderBy("metadata.updated.at", "desc"),
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            updateCachedData((draft) => {
              return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
            });
          });
        } catch {}
        await cacheEntryRemoved;
        unsubscribe();
      },
    }),
  }),
});

export const { useAddTrnMutation, useGetTrnsQuery } = trnsApi;
