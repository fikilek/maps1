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

    getTrnsByPremiseId: builder.query({
      async queryFn() {
        return { data: [] };
      },
      async onCacheEntryAdded(
        { premiseId }, // 🎯 DESTRUCTURED OBJECT ARGUMENT
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};
        try {
          await cacheDataLoaded;

          // 🛡️ NATIVE GUARD: Ensure we don't start a ghost stream
          if (!premiseId) return;

          const q = query(
            collection(db, "trns"),
            where("accessData.premise.id", "==", premiseId),
            orderBy("accessData.metadata.created.at", "desc"),
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            updateCachedData((draft) => {
              return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
            });
          });
        } catch (error) {
          console.error("🛰️ Stream Error:", error);
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
  useGetTrnsByPremiseIdQuery,
} = trnsApi;
