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
            where("parents.lmId", "==", lmPcode),
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

          // 🎯 4. 📍 META-ONLY DISK SYNC (Respecting Domain Isolation)
          // 🎯 4. SAFE DISK SYNC
          await queryFulfilled;
          const state = getState();
          const result =
            erfsApi.endpoints.getErfsByLmPcode.select(queryArg)(state);
          const latestErfRam = result?.data;

          // 🛡️ THE SOVEREIGN GUARD: Only save if RAM is actually populated (e.g., > 1 Erf)
          if (latestErfRam?.metaEntries?.length > 1) {
            const metaUpdate = {
              metaEntries: [...latestErfRam.metaEntries],
              wards: latestErfRam.wards ? [...latestErfRam.wards] : [],
              // 🚫 WE DO NOT TOUCH GEO HERE
            };
            erfMemory.saveErfsMetaList(lmPcode, metaUpdate);
            console.log(
              `✅ [STABLE SYNC]: Premise linked. No refetch triggered.`,
            );
          }
        } catch (err) {
          console.error("❌ [OPTIMISTIC UPDATE FAILED]:", err);
        }
      },
    }),

    updatePremise: builder.mutation({
      async queryFn(updatedPremise) {
        try {
          const docRef = doc(db, "premises", updatedPremise.id);
          // 🛡️ Use merge: true to protect existing fields like 'services' or 'naCount'
          await setDoc(docRef, updatedPremise, { merge: true });
          return { data: updatedPremise };
        } catch (error) {
          return { error: error.message };
        }
      },

      async onQueryStarted(
        updatedPremise,
        { dispatch, queryFulfilled, getState },
      ) {
        const { id: premiseId, metadata } = updatedPremise;
        const lmPcode = metadata?.lmPcode;
        const queryArg = { lmPcode };

        try {
          // 1. 💾 DISK PATCH (Optimistic)
          const currentDiskPrems = premiseMemory.getLmList(lmPcode) || [];
          const updatedDiskList = currentDiskPrems.map((p) =>
            p.id === premiseId ? { ...p, ...updatedPremise } : p,
          );
          premiseMemory.saveLmList(lmPcode, updatedDiskList);

          // 2. 💉 RAM PATCH (Optimistic)
          dispatch(
            premisesApi.util.updateQueryData(
              "getPremisesByLmPcode",
              queryArg,
              (draft) => {
                const index = draft.findIndex((p) => p.id === premiseId);
                if (index !== -1) {
                  // 🎯 Merge the update into the existing record in RAM
                  draft[index] = { ...draft[index], ...updatedPremise };
                }
              },
            ),
          );

          // 3. 🏁 WAIT FOR CLOUD CONFIRMATION
          await queryFulfilled;
          console.log(
            `✅ [CLOUD SYNC]: Premise ${premiseId} updated successfully.`,
          );
        } catch (err) {
          console.error("❌ [UPDATE FAILED]:", err);
          // 🛡️ Note: In a production "Nuclear" fail, you would trigger a refetch here
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
  useSyncPremiseMutation, // The one for raw syncing
  useAddPremiseMutation, // 🎯 THE SMART ONE (Change your Form to use this!)
  useUpdatePremiseMutation,
} = premisesApi;
