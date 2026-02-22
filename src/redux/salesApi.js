import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

export const salesApi = createApi({
  reducerPath: "salesApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Sale"],
  endpoints: (builder) => ({
    // 1. THE ATOMIC LEDGER (Main Sales List)
    getSales: builder.query({
      async queryFn({ lmPcode, spendGroup, lastVisible, limitCount = 20 }) {
        try {
          let salesQuery = query(
            collection(db, "sales"),
            where("lmPcode", "==", lmPcode),
            // orderBy("txnDate", "desc"),
            // limit(limitCount),
          );

          // Apply Mosi Filters (G1-R5) if selected
          if (spendGroup) {
            salesQuery = query(
              salesQuery,
              where("spendGroup", "==", spendGroup),
            );
          }

          // Handle Pagination (Lazy Loading)
          if (lastVisible) {
            salesQuery = query(salesQuery, startAfter(lastVisible));
          }

          const snapshot = await getDocs(salesQuery);
          const sales = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            // Convert Firestore Timestamp to JS Date for the UI
            txnDate: doc.data().txnDate?.toDate().toISOString(),
          }));

          return {
            data: {
              sales,
              lastVisible: snapshot.docs[snapshot.docs.length - 1],
            },
          };
        } catch (error) {
          return { error: error.message };
        }
      },
      providesTags: ["Sale"],
    }),

    // 2. METER PERFORMANCE REPORT (Specific Meter View)
    getSalesByAstNo: builder.query({
      async queryFn(astNo) {
        try {
          const q = query(
            collection(db, "sales"),
            where("astNo", "==", astNo),
            orderBy("txnDate", "desc"),
          );
          const snapshot = await getDocs(q);
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            txnDate: doc.data().txnDate?.toDate().toISOString(),
          }));
          return { data };
        } catch (error) {
          return { error: error.message };
        }
      },
    }),
  }),
});

export const { useGetSalesQuery, useGetSalesByAstNoQuery } = salesApi;
