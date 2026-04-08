import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  collection,
  doc,
  getDoc,
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
        tradingName,
        clients = [],
        creatorUid,
        creatorName,
        creatorRoleCode,
      }) {
        try {
          if (!tradingName?.trim()) {
            return {
              error: {
                message: "Trading Name is required.",
              },
            };
          }

          const spRef = doc(collection(db, "serviceProviders"));
          const spId = spRef.id;
          const timestamp = new Date().toISOString();

          const normalizedClients = (clients || []).map((client) => ({
            id: client?.id || "NAv",
            name: client?.name || "NAv",
            clientType: client?.clientType || "NAv",
            relationshipType: client?.relationshipType || "NAv",
          }));

          await setDoc(spRef, {
            id: spId,

            profile: {
              registeredName: "NAv",
              tradingName: tradingName.trim(),
              registrationNumber: "NAv",
            },

            owner: {
              id: "NAv",
              name: "NAv",
            },

            status: "ACTIVE",
            clients: normalizedClients,
            offices: [],

            metadata: {
              createdAt: timestamp,
              createdByUid: creatorUid || "NAv",
              createdByUser: creatorName || "NAv",
              updatedAt: timestamp,
              updatedByUid: creatorUid || "NAv",
              updatedByUser: creatorName || "NAv",
            },
          });

          return {
            data: {
              id: spId,
              creatorRoleCode: creatorRoleCode || "NAv",
            },
          };
        } catch (error) {
          return { error };
        }
      },
      // invalidatesTags: ["ServiceProvider"],
    }),

    updateServiceProvider: builder.mutation({
      async queryFn({
        id,
        patch = {},
        updaterUid,
        updaterName,
        updaterRoleCode,
      }) {
        try {
          if (!id) {
            return {
              error: {
                message: "Service Provider id is required.",
              },
            };
          }

          const spRef = doc(db, "serviceProviders", id);
          const spSnap = await getDoc(spRef);

          if (!spSnap.exists()) {
            return {
              error: {
                message: "Service Provider not found.",
              },
            };
          }

          const currentServiceProvider = spSnap.data() || {};
          const timestamp = new Date().toISOString();

          const canEditClients =
            updaterRoleCode === "SPU" || updaterRoleCode === "ADM";

          const canEditStatus =
            updaterRoleCode === "SPU" || updaterRoleCode === "ADM";

          const canEditProfile =
            updaterRoleCode === "SPU" ||
            updaterRoleCode === "ADM" ||
            updaterRoleCode === "MNG" ||
            updaterRoleCode === "SPV";

          const canEditOwner =
            updaterRoleCode === "SPU" ||
            updaterRoleCode === "ADM" ||
            updaterRoleCode === "MNG" ||
            updaterRoleCode === "SPV";

          const canEditOffices =
            updaterRoleCode === "SPU" ||
            updaterRoleCode === "ADM" ||
            updaterRoleCode === "MNG" ||
            updaterRoleCode === "SPV";

          const updates = {
            metadata: {
              createdAt:
                currentServiceProvider?.metadata?.createdAt || timestamp,
              createdByUid:
                currentServiceProvider?.metadata?.createdByUid || "NAv",
              createdByUser:
                currentServiceProvider?.metadata?.createdByUser || "NAv",
              updatedAt: timestamp,
              updatedByUid: updaterUid || "NAv",
              updatedByUser: updaterName || "NAv",
            },
          };

          if (canEditProfile && patch?.profile) {
            updates.profile = patch.profile;
          }

          if (canEditOwner && patch?.owner) {
            updates.owner = patch.owner;
          }

          if (canEditClients && Array.isArray(patch?.clients)) {
            updates.clients = patch.clients;
          }

          if (canEditOffices && Array.isArray(patch?.offices)) {
            updates.offices = patch.offices;
          }

          if (canEditStatus && patch?.status) {
            updates.status = patch.status;
          }

          await updateDoc(spRef, updates);

          return {
            data: {
              id,
              updated: true,
            },
          };
        } catch (error) {
          console.log("updateServiceProvider ERROR", error);

          return {
            error: {
              message:
                error?.message || "Service Provider update failed in spApi.",
            },
          };
        }
      },
    }),
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
