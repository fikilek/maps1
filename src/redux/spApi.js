import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";
// import { db, functions } from "../../firebase";

export const spApi = createApi({
  reducerPath: "spApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["ServiceProvider"],
  endpoints: (builder) => ({
    /* =========================================================
       STREAMING QUERIES
       ========================================================= */

    /**
     * Stream ALL Service Providers
     * Used by:
     * - FlatList
     * - Dashboards
     * - Map (offices)
     */
    getServiceProviders: builder.query({
      async queryFn(_, { signal }) {
        return new Promise((resolve, reject) => {
          const ref = collection(db, "serviceProviders");

          const unsubscribe = onSnapshot(
            ref,
            (snap) => {
              const data = snap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
              }));
              resolve({ data });
            },
            (error) => reject({ error })
          );

          signal.addEventListener("abort", () => {
            unsubscribe();
          });
        });
      },
      providesTags: ["ServiceProvider"],
    }),

    /**
     * Stream ONE Service Provider
     * Used by:
     * - Edit SP screen
     * - SP profile
     */
    getServiceProviderById: builder.query({
      async queryFn(spId, { signal }) {
        return new Promise((resolve, reject) => {
          const ref = doc(db, "serviceProviders", spId);

          const unsubscribe = onSnapshot(
            ref,
            (snap) => {
              if (!snap.exists()) {
                reject({ error: "Service Provider not found" });
                return;
              }

              resolve({
                data: {
                  id: snap.id,
                  ...snap.data(),
                },
              });
            },
            (error) => reject({ error })
          );

          signal.addEventListener("abort", () => {
            unsubscribe();
          });
        });
      },
      providesTags: (r, e, spId) => [{ type: "ServiceProvider", id: spId }],
    }),

    /* =========================================================
       MUTATIONS (CALLABLE FUNCTIONS ONLY)
       ========================================================= */

    createServiceProvider: builder.mutation({
      async queryFn(payload) {
        try {
          const fn = httpsCallable(functions, "createServiceProvider");
          const res = await fn(payload);
          return { data: res.data };
        } catch (error) {
          return { error };
        }
      },
      invalidatesTags: ["ServiceProvider"],
    }),

    updateServiceProvider: builder.mutation({
      async queryFn({ spId, patch }) {
        try {
          const fn = httpsCallable(functions, "updateServiceProvider");
          const res = await fn({ spId, patch });
          return { data: res.data };
        } catch (error) {
          return { error };
        }
      },
      invalidatesTags: (r, e, { spId }) => [
        { type: "ServiceProvider", id: spId },
      ],
    }),
  }),
});

/* =====================================================
   EXPORT HOOKS
   ===================================================== */
export const {
  useGetServiceProvidersQuery,
  useGetServiceProviderByIdQuery,
  useCreateServiceProviderMutation,
  useUpdateServiceProviderMutation,
} = spApi;
