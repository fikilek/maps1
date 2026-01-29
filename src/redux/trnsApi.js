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

    addTrn: builder.mutation({
      async queryFn(payload) {
        try {
          // 🚀 1. Hits Firestore "trns" collection
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

          // 🏗️ 2. DESTRICTURING THE 3-SECTION PAYLOAD
          // We reach into Section 1 (accessData) for the goodies
          const { accessData } = payload;
          const { premise, metadata, trnType } = accessData;

          const { premisesApi } = await import("./premisesApi");

          if (trnType === "METER_DISCOVERY") {
            dispatch(
              premisesApi.util.updateQueryData(
                "getPremisesByLmPcode",
                { lmPcode: metadata.lmPcode },
                (draft) => {
                  const p = draft.find((item) => item.id === premise.id);
                  if (p) {
                    // Update the local RAM so the UI looks fresh immediately
                    p.metadata = metadata;

                    // Optional: Update occupancy status in cache for the demo?
                    if (accessData.access.hasAccess === "no") {
                      p.occupancy = { status: "NO_ACCESS" };
                    }
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

    //   async onQueryStarted(payload, { dispatch, queryFulfilled }) {
    //     try {
    //       await queryFulfilled;

    //       // 🎯 THE FIX: Use the 'util' from premisesApi inside the function
    //       // to avoid circular dependency at the top of the file
    //       const { premisesApi } = await import("./premisesApi");

    //       if (payload.trnType === "METER_DISCOVERY") {
    //         dispatch(
    //           premisesApi.util.updateQueryData(
    //             "getPremisesByLmPcode",
    //             { lmPcode: payload.metadata.lmPcode },
    //             (draft) => {
    //               // Find the specific premise in the RAM cache
    //               const p = draft.find(
    //                 (item) => item.id === payload.premise.id,
    //               );
    //               if (p) {
    //                 // p.occupancy = {
    //                 //   status: payload.premise.status,
    //                 //   adverseCondition: payload.data.adverseCondition || false,
    //                 // };
    //                 p.metadata = payload.metadata; // Standard 2026-01-21
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

    getTrnsByLmPcode: builder.query({
      async queryFn() {
        return { data: [] };
      },
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};
        console.log(`getTrnsByLmPcode ----arg`, arg);
        try {
          await cacheDataLoaded;

          const q = query(
            collection(db, "trns"),
            where("accessData.metadata.lmPcode", "==", arg.lmPcode),
            orderBy("accessData.metadata.updated.at", "desc"),
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

export const { useAddTrnMutation, useGetTrnsByLmPcodeQuery } = trnsApi;
