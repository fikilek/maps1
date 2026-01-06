import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: fakeBaseQuery(),

  endpoints: (builder) => ({
    getUsers: builder.query({
      async queryFn() {
        // initial empty load – data comes from snapshot
        return { data: [] };
      },

      async onCacheEntryAdded(
        _arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) {
        await cacheDataLoaded;

        console.log("usersApi ---- SNAPSHOT LISTENER START");

        const q = query(
          collection(db, "users"),
          orderBy("metadata.updatedAt", "desc")
        );

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const usersList = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            updateCachedData(() => usersList);
          },
          (error) => {
            console.error("usersApi snapshot error:", error);
          }
        );

        await cacheEntryRemoved;
        console.log("usersApi ---- SNAPSHOT LISTENER STOP");
        unsubscribe();
      },
    }),
  }),
});

export const { useGetUsersQuery } = usersApi;
