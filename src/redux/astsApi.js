import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

export const astsApi = createApi({
  reducerPath: "astsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/" }),
  endpoints: (builder) => ({
    getAstsByLmPcode: builder.query({
      queryFn: () => ({ data: [] }), // Initial data is handled by the stream
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe = () => {};
        try {
          await cacheDataLoaded;
          console.log(`getAstsByLmPcode----arg`, arg);

          // 🎯 The Real-Time Stream
          const q = query(
            collection(db, "asts"),
            where("accessData.metadata.lmPcode", "==", arg.lmPcode),
            orderBy("accessData.metadata.updated.at", "desc"),
          );

          unsubscribe = onSnapshot(q, (snapshot) => {
            updateCachedData((draft) => {
              const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              return data; // Overwrites the cache with the latest cloud state
            });
          });
        } catch (err) {
          console.error("Stream Error:", err);
        }
        await cacheEntryRemoved;
        unsubscribe();
      },
    }),
  }),
});

export const { useGetAstsByLmPcodeQuery } = astsApi;
