import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export const settingsApi = createApi({
  reducerPath: "settingsApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Settings"],
  endpoints: (builder) => ({
    getSettings: builder.query({
      queryFn: () => ({ data: [] }), // Initial empty data
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        // Create the listener
        const unsubscribe = onSnapshot(
          collection(db, "settings"),
          (snapshot) => {
            updateCachedData((draft) => {
              // Update cache with new data
              return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
            });
          },
        );
        await cacheEntryRemoved;
        unsubscribe(); // Cleanup listener
      },
    }),
    updateSettings: builder.mutation({
      async queryFn({ id, data }) {
        try {
          const docRef = doc(db, "settings", id);
          await setDoc(docRef, data, { merge: true });
          return { data: "Document successfully updated and merged" };
        } catch (error) {
          return { error: error.message };
        }
      },
      invalidatesTags: ["Settings"], // Invalidate relevant cache tags
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingsMutation } = settingsApi;
