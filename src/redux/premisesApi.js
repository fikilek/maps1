import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { erfMemory } from "../storage/erfMemory";
import { premiseMemory } from "../storage/premiseMemory";

export const premisesApi = createApi({
  reducerPath: "premisesApi",
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    getPremisesByLmPcode: builder.query({
      async queryFn({ lmPcode }) {
        // ✅ Correct: Uses Object
        return { data: [] };
      },
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};
        try {
          await cacheDataLoaded;
          const { lmPcode } = arg; // ✅ Extract from object
          const q = query(
            collection(db, "premises"),
            where("parents.localMunicipalityId", "==", lmPcode),
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            const rawPremises = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            updateCachedData((draft) => {
              return rawPremises;
            });
            if (rawPremises.length > 0) {
              premiseMemory.saveLmList(lmPcode, rawPremises);
            }
          });
        } catch (e) {
          console.error(e);
        }
        await cacheEntryRemoved;
        unsubscribe();
      },
    }),

    syncPremise: builder.mutation({
      async queryFn(premiseData) {
        try {
          console.log(
            `📡 [CLOUD]: Attempting to sync premise ${premiseData.id}`,
          );

          // 1. Reference the doc using the ID we generated in the form
          const docRef = doc(db, "premises", premiseData.id);

          // 2. Upload the full rich object + a server timestamp
          await setDoc(
            docRef,
            {
              ...premiseData,
              _syncInfo: {
                syncedAt: serverTimestamp(),
                status: "SYNCED",
              },
            },
            { merge: true },
          );
          console.log(
            `📡 [CLOUD]: Succesfully synced premise ${premiseData.id}`,
          );
          return { data: "SUCCESS" };
        } catch (error) {
          console.error("❌ [CLOUD SYNC FAILED]:", error);
          return { error: error.message };
        }
      },
    }),

    // 🎯 THE SMART MUTATION (Handles Updates & Adds)
    addPremise: builder.mutation({
      async queryFn(newPremise) {
        try {
          const docRef = doc(db, "premises", newPremise.id);

          // 🎯 CRITICAL: We use { merge: true } to ensure we don't wipe
          // out existing fields (like services) during a Discovery update.
          await setDoc(docRef, newPremise, { merge: true });

          return { data: newPremise };
        } catch (error) {
          return { error: error.message };
        }
      },

      async onQueryStarted(newPremise, { dispatch, queryFulfilled, getState }) {
        const { erfId, id: premiseId, metadata } = newPremise;
        const lmPcode = metadata?.lmPcode;
        const queryArg = { lmPcode };

        try {
          // 1. 💾 DISK: Premise Vault (Optimistic Update)
          const currentDiskPrems = premiseMemory.getLmList(lmPcode) || [];
          const existsDisk = currentDiskPrems.find((p) => p.id === premiseId);

          const updatedDiskList = existsDisk
            ? currentDiskPrems.map((p) => (p.id === premiseId ? newPremise : p))
            : [...currentDiskPrems, newPremise];

          premiseMemory.saveLmList(lmPcode, updatedDiskList);

          // 2. 💉 RAM PATCH: Premise List (Optimistic Update)
          dispatch(
            premisesApi.util.updateQueryData(
              "getPremisesByLmPcode",
              queryArg,
              (draft) => {
                if (Array.isArray(draft)) {
                  const index = draft.findIndex((p) => p.id === premiseId);
                  if (index !== -1) {
                    // 🎯 UPDATE: Merge existing data with new data
                    draft[index] = { ...draft[index], ...newPremise };
                  } else {
                    // 🎯 ADD: Insert new record
                    draft.push(newPremise);
                  }
                }
              },
            ),
          );

          // 3. 💉 RAM PATCH: Erf Link
          const { erfsApi } = require("./erfsApi");
          dispatch(
            erfsApi.util.updateQueryData(
              "getErfsByLmPcode",
              queryArg,
              (draft) => {
                const targetErf = draft?.metaEntries?.find(
                  (e) => e.id === erfId,
                );
                if (targetErf) {
                  if (!targetErf.premises) targetErf.premises = [];
                  if (!targetErf.premises.includes(premiseId)) {
                    targetErf.premises.push(premiseId);
                  }
                }
              },
            ),
          );

          // 4. 📍 SYNC ERF RAM TO DISK (After Firestore Success)
          await queryFulfilled;
          const state = getState();
          const result =
            erfsApi.endpoints.getErfsByLmPcode.select(queryArg)(state);
          const latestErfRam = result?.data;

          if (latestErfRam?.metaEntries?.length > 0) {
            const cleanData = {
              metaEntries: [...latestErfRam.metaEntries],
              geoEntries: latestErfRam.geoEntries
                ? { ...latestErfRam.geoEntries }
                : {},
              wards: latestErfRam.wards ? [...latestErfRam.wards] : [],
            };
            erfMemory.saveErfsMetaList(lmPcode, cleanData);
            console.log(
              `💾 [DISK SYNC]: Premise ${premiseId} committed to Erf Meta.`,
            );
          }
        } catch (err) {
          console.error("❌ [OPTIMISTIC UPDATE FAILED]:", err);
        }
      },
    }),

    // addPremise: builder.mutation({
    //   async queryFn(newPremise) {
    //     try {
    //       const docRef = doc(db, "premises", newPremise.id);
    //       await setDoc(docRef, newPremise);
    //       return { data: newPremise };
    //     } catch (error) {
    //       return { error: error.message };
    //     }
    //   },

    //   async onQueryStarted(newPremise, { dispatch, queryFulfilled, getState }) {
    //     const { erfId, id: premiseId, metadata } = newPremise;
    //     const lmPcode = metadata?.lmPcode;

    //     // 🎯 THE CONTRACT: Everything uses the Object key now
    //     const queryArg = { lmPcode };

    //     try {
    //       // 1. 💾 DISK: Premise Vault
    //       const currentDiskPrems = premiseMemory.getLmList(lmPcode) || [];
    //       premiseMemory.saveLmList(lmPcode, [...currentDiskPrems, newPremise]);

    //       // 2. 💉 RAM PATCH: Premise List
    //       dispatch(
    //         premisesApi.util.updateQueryData(
    //           "getPremisesByLmPcode",
    //           queryArg,
    //           (draft) => {
    //             if (Array.isArray(draft)) {
    //               if (!draft.find((p) => p.id === premiseId)) {
    //                 draft.push(newPremise);
    //               }
    //             }
    //           },
    //         ),
    //       );

    //       // 3. 💉 RAM PATCH: Erf Link
    //       const { erfsApi } = require("./erfsApi");

    //       dispatch(
    //         erfsApi.util.updateQueryData(
    //           "getErfsByLmPcode",
    //           queryArg,
    //           (draft) => {
    //             const targetErf = draft?.metaEntries?.find(
    //               (e) => e.id === erfId,
    //             );
    //             if (targetErf) {
    //               if (!targetErf.premises) targetErf.premises = [];
    //               if (!targetErf.premises.includes(premiseId)) {
    //                 targetErf.premises.push(premiseId);
    //               }
    //             }
    //           },
    //         ),
    //       );

    //       // 4. 📍 SYNC ERF RAM TO DISK

    //       // 4. 📍 SYNC ERF RAM TO DISK
    //       // 4. 📍 SYNC ERF RAM TO DISK
    //       await queryFulfilled;
    //       const state = getState();

    //       const result =
    //         erfsApi.endpoints.getErfsByLmPcode.select(queryArg)(state);
    //       const latestErfRam = result?.data;

    //       // 🎯 ONLY PROCEED IF WE HAVE THE ACTUAL DATA
    //       if (
    //         latestErfRam &&
    //         Array.isArray(latestErfRam.metaEntries) &&
    //         latestErfRam.metaEntries.length > 0
    //       ) {
    //         // Create a clean, flat POJO (Plain Old JavaScript Object)
    //         const cleanData = {
    //           metaEntries: [...latestErfRam.metaEntries],
    //           geoEntries: latestErfRam.geoEntries
    //             ? { ...latestErfRam.geoEntries }
    //             : {},
    //           wards: latestErfRam.wards ? [...latestErfRam.wards] : [],
    //         };

    //         console.log(
    //           `💾 [DISK SYNC]: Committing ${cleanData.metaEntries.length} items to Disk...`,
    //         );

    //         // Send the CLEAN object
    //         erfMemory.saveErfsMetaList(lmPcode, cleanData);
    //       } else {
    //         console.warn(
    //           "⚠️ [SYNC ABORTED]: RAM data was empty or invalid. Disk remains untouched.",
    //         );
    //       }

    //       // await queryFulfilled;
    //       // const state = getState();
    //       // console.log(" ");
    //       // console.log(`addPremise----onQueryStarted----state`, state);
    //       // const latestErfRam =
    //       //   erfsApi.endpoints.getErfsByLmPcode.select(queryArg)(state)?.data;
    //       // console.log(
    //       //   `addPremise----onQueryStarted----latestErfRam?.length`,
    //       //   latestErfRam?.length,
    //       // );
    //       // if (latestErfRam) {
    //       //   erfMemory.saveErfsMetaList(lmPcode, latestErfRam);
    //       // }
    //     } catch (err) {
    //       console.error("❌ ERROR:", err);
    //     }
    //   },
    // }),
  }),
});

export const {
  useGetPremisesByLmPcodeQuery,
  useSyncPremiseMutation, // The one for raw syncing
  useAddPremiseMutation, // 🎯 THE SMART ONE (Change your Form to use this!)
} = premisesApi;
