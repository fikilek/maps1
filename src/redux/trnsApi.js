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
          // The payload now includes lmId, districtId, provinceId, and countryId
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

          // 🏗️ 2. DESTRUCTURING THE 3-SECTION PAYLOAD
          const { accessData } = payload;
          const { premise, metadata, trnType, access } = accessData;

          // 🛰️ We need the API reference for surgical RAM updates
          const { premisesApi } = await import("./premisesApi");

          if (trnType === "METER_DISCOVERY") {
            dispatch(
              premisesApi.util.updateQueryData(
                "getPremisesByLmPcode",
                { lmPcode: metadata.lmPcode }, // Still scoped by LM
                (draft) => {
                  const p = draft.find((item) => item.id === premise.id);
                  if (p) {
                    // 🏛️ SOVEREIGN CACHE UPDATE
                    // Update metadata with the new full lineage (lmId, districtId, etc.)
                    p.metadata = {
                      ...p.metadata,
                      ...metadata,
                    };

                    // 🛡️ ACCURACY OVERRIDE: Update occupancy based on access results
                    if (access.hasAccess === "no") {
                      p.occupancy = {
                        ...p.occupancy,
                        status: "NO_ACCESS",
                        lastAttempt: metadata.updated.at,
                      };
                    } else {
                      p.occupancy = {
                        ...p.occupancy,
                        status: "OCCUPIED",
                      };
                    }

                    console.log(
                      `✅ [RAM PATCH]: Premise ${p.id} updated with new lineage.`,
                    );
                  }
                },
              ),
            );
          }
        } catch (err) {
          console.error("❌ [MUTATION SYNC ERROR]:", err);
        }
      },
    }),

    // addTrn: builder.mutation({
    //   async queryFn(payload) {
    //     try {
    //       // 🚀 1. Hits Firestore "trns" collection
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

    //       // 🏗️ 2. DESTRICTURING THE 3-SECTION PAYLOAD
    //       // We reach into Section 1 (accessData) for the goodies
    //       const { accessData } = payload;
    //       const { premise, metadata, trnType } = accessData;

    //       const { premisesApi } = await import("./premisesApi");

    //       if (trnType === "METER_DISCOVERY") {
    //         dispatch(
    //           premisesApi.util.updateQueryData(
    //             "getPremisesByLmPcode",
    //             { lmPcode: metadata.lmPcode },
    //             (draft) => {
    //               const p = draft.find((item) => item.id === premise.id);
    //               if (p) {
    //                 // Update the local RAM so the UI looks fresh immediately
    //                 p.metadata = metadata;

    //                 // Optional: Update occupancy status in cache for the demo?
    //                 if (accessData.access.hasAccess === "no") {
    //                   p.occupancy = { status: "NO_ACCESS" };
    //                 }
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
        // console.log(`getTrnsByLmPcode ----arg`, arg);
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

    // 🎯 INDIVIDUAL TRN REPORT FETCH
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
  }),
});

export const {
  useAddTrnMutation,
  useGetTrnsByLmPcodeQuery,
  useGetTrnsByCountryCodeQuery,
  useGetTrnsByPremiseIdQuery,
  useGetTrnByIdQuery,
} = trnsApi;
