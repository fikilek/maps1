import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
// import { db, functions } from "../../firebase";

export const spApi = createApi({
  reducerPath: "spApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["ServiceProvider"],
  endpoints: (builder) => ({
    getServiceProviders: builder.query({
      queryFn: () => ({ data: [] }),

      async onCacheEntryAdded(
        _,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};
        try {
          await cacheDataLoaded;
          const ref = collection(db, "serviceProviders");

          unsubscribe = onSnapshot(ref, (snap) => {
            updateCachedData((draft) => {
              // 🛡️ Safety Check: Ensure draft is an array
              if (!Array.isArray(draft)) return;

              snap.docChanges().forEach((change) => {
                const docData = { id: change.doc.id, ...change.doc.data() };

                switch (change.type) {
                  case "added": {
                    const exists = draft.some((sp) => sp.id === docData.id);
                    if (!exists) {
                      draft.push(docData);
                    }
                    break;
                  }

                  case "modified": {
                    const index = draft.findIndex((sp) => sp.id === docData.id);
                    if (index !== -1) {
                      // 🎯 Surgical Replacement: Using splice ensures the linter is happy
                      // and Immer tracks the change perfectly.
                      draft.splice(index, 1, docData);
                    }
                    break;
                  }

                  case "removed": {
                    const index = draft.findIndex((sp) => sp.id === docData.id);
                    if (index !== -1) {
                      draft.splice(index, 1);
                    }
                    break;
                  }
                }
              });
            });
          });
        } catch (error) {
          console.error("Registry Stream Error:", error);
        }

        await cacheEntryRemoved;
        unsubscribe();
      },
    }),

    createServiceProvider: builder.mutation({
      async queryFn({
        registeredName,
        tradingName,
        registeredNumber,
        clients,
        userUid,
        userDisplayName,
      }) {
        try {
          const spRef = doc(collection(db, "serviceProviders"));
          const spId = spRef.id;
          const timestamp = new Date().toISOString();

          await setDoc(spRef, {
            id: spId,
            profile: {
              registeredName: registeredName.trim(),
              tradingName: tradingName.trim(),
              tradingNumber: registeredNumber?.trim() || "", // Field 14 ✅
            },
            // 🛡️ SCHEMA ALIGNMENT: Fulfilling v0.2 without misrepresentation
            // These fields stay neutral until a real owner is onboarded/linked.
            owner: {
              id: "PENDING",
              name: "UNASSIGNED",
            },
            status: "ACTIVE", // Field 10 ✅
            clients: clients || [], // Field 11 ✅
            offices: [], // Field 7 ✅ (per CSV spelling 'ofices')
            metadata: {
              createAt: timestamp, // Field 1 ✅
              createdByUser: userDisplayName, // Field 2 ✅ (The Registrar)
              createdByUid: userUid, // Field 3 ✅ (The Registrar)
              updateAt: timestamp, // Field 4 ✅
              updatedByUser: userDisplayName, // Field 5 ✅
              updatedByUid: userUid, // Field 6 ✅
            },
          });
          return { data: spId };
        } catch (error) {
          return { error };
        }
      },
      // invalidatesTags: ["ServiceProvider"],
    }),

    updateServiceProvider: builder.mutation({
      async queryFn({ id, updates, userUid, userDisplayName }) {
        try {
          const spRef = doc(db, "serviceProviders", id);
          const timestamp = new Date().toISOString();

          // 🛡️ SCHEMA ENFORCEMENT: Merging updates with mandatory v0.2 metadata
          await updateDoc(spRef, {
            ...updates,
            "metadata.updateAt": timestamp, // Field 4 ✅
            "metadata.updatedByUid": userUid, // Field 6 ✅
            "metadata.updatedByUser": userDisplayName, // Field 5 ✅
          });

          return { data: "SUCCESS" };
        } catch (error) {
          return { error };
        }
      },
    }),

    // updateServiceProvider: builder.mutation({
    //   async queryFn({ spId, patch }) {
    //     try {
    //       const fn = httpsCallable(functions, "updateServiceProvider");
    //       const res = await fn({ spId, patch });
    //       return { data: res.data };
    //     } catch (error) {
    //       return { error };
    //     }
    //   },
    //   invalidatesTags: (r, e, { spId }) => [
    //     { type: "ServiceProvider", id: spId },
    //   ],
    // }),
  }),
});

/* =====================================================
   EXPORT HOOKS
   ===================================================== */
export const {
  useGetServiceProvidersQuery,
  useCreateServiceProviderMutation,
  useUpdateServiceProviderMutation,
} = spApi;
