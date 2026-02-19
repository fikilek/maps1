import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase";

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["User"],
  endpoints: (builder) => ({
    getUsers: builder.query({
      // 🎯 INITIAL DATA: We start with an empty array.
      // The real intelligence happens in the stream below.
      async queryFn() {
        return { data: [] };
      },

      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};

        try {
          // Wait for the initial cache entry to be established
          await cacheDataLoaded;

          // 🛰️ THE LIVE STREAM
          const q = query(collection(db, "users"));

          unsubscribe = onSnapshot(q, (snapshot) => {
            updateCachedData((draft) => {
              // 🧪 TACTICAL REFILL: We replace the RAM list with the latest cloud state.
              // This handles creations, updates, and removals automatically.
              const users = snapshot.docs.map((doc) => ({
                uid: doc.id,
                ...doc.data(),
              }));

              // We return the new array to replace the entire 'draft'
              return users;
            });
          });
        } catch (error) {
          console.error("❌ [USERS STREAM ERROR]:", error);
        }

        // 💀 CLEANUP: Close the satellite link when the component unmounts
        await cacheEntryRemoved;
        unsubscribe();
      },
      providesTags: ["User"],
    }),
  }),
});

export const { useGetUsersQuery } = usersApi;
