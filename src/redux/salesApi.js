// src/redux/salesApi.js
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import { REHYDRATE } from "redux-persist";
import { db } from "../firebase";

/**
 * Notes:
 * - meterNo is STRING (never parse it).
 * - amounts are CENTS.
 * - currency assumed ZAR (you can still display currency from docs).
 *
 * Why mixed strategy?
 * - Atomic is huge => paging via getDocs (one-time fetch per page).
 * - Monthly aggregates are small => realtime snapshot is OK and offline-friendly.
 */
const ENABLE_LIVE_LISTENERS = false; // ✅ DEMO SAFE

export const salesApi = createApi({
  reducerPath: "salesApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: [
    "SALES_ATOMIC",
    "SALES_MONTHLY",
    "SALES_MONTHLY_LM",
    "SALES_METERS",
  ],
  refetchOnMountOrArgChange: false,
  extractRehydrationInfo(action, { reducerPath }) {
    if (action.type === REHYDRATE) {
      return action.payload?.[reducerPath];
    }
  },
  endpoints: (builder) => {
    return {
      getSalesAtomicLimited: builder.query({
        async queryFn({ lmPcode, limit = 200 }) {
          try {
            if (!lmPcode) return { data: [] };
            const HARD_LIMIT = 200;
            const lim = Math.min(Number(limit || 200), HARD_LIMIT);

            const col = collection(db, "conlog_sales_atomic");

            const q = query(
              col,
              where("lmPcode", "==", lmPcode),
              orderBy("txAtMs", "desc"),
              limit(lim),
            );

            const snap = await getDocs(q);

            const items = snap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }));

            return { data: items };
          } catch (e) {
            return { error: { message: e?.message || String(e) } };
          }
        },
      }),

      // src/redux/salesApi.js  (REPLACE ONLY this endpoint)
      getSalesMonthlyByLmAndYms: builder.query({
        async queryFn({ lmPcode, yms }) {
          try {
            if (!lmPcode) return { data: [] };
            if (!Array.isArray(yms) || yms.length === 0) return { data: [] };

            const normYms = Array.from(new Set(yms.map(String)))
              .sort()
              .reverse();

            // Firestore "in" max 10
            if (normYms.length > 10) {
              console.warn(
                "⚠️ yms too large for Firestore 'in':",
                normYms.length,
              );
              return { data: [] };
            }

            const base = collection(db, "conlog_sales_monthly");

            // NOTE: add a reasonable limit so you don't pull the entire LM
            const q = query(
              base,
              where("lmPcode", "==", lmPcode),
              where("ym", "in", normYms),
              orderBy("ym", "desc"),
              orderBy("meterNo", "asc"),
              limit(1000),
            );

            const snap = await getDocs(q);
            const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

            return { data: rows };
          } catch (e) {
            console.error("❌ getSalesMonthlyByLmAndYms getDocs failed", e);
            return { error: { message: e?.message || String(e) } };
          }
        },

        // ✅ stable cache key
        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          const lmPcode = String(queryArgs?.lmPcode || "");
          const yms = Array.isArray(queryArgs?.yms) ? queryArgs.yms : [];
          const norm = Array.from(new Set(yms.map(String)))
            .sort()
            .reverse();
          return `${endpointName}_${lmPcode}_${norm.join("|")}`;
        },

        keepUnusedDataFor: 60,
      }),

      getSalesMonthlyLmByLmAndYms: builder.query({
        async queryFn({ lmPcode, yms }) {
          try {
            if (!lmPcode) return { data: [] };

            if (Array.isArray(yms) && yms.length > 10) {
              console.warn("⚠️ yms too large for Firestore 'in':", yms.length);
              return { data: [] };
            }

            const base = collection(db, "conlog_sales_monthly_lm");

            let q = null;
            if (Array.isArray(yms) && yms.length > 0) {
              q = query(
                base,
                where("lmPcode", "==", lmPcode),
                where("ym", "in", yms.map(String)),
                orderBy("ym", "desc"),
              );
            } else {
              q = query(
                base,
                where("lmPcode", "==", lmPcode),
                orderBy("ym", "desc"),
                limit(24),
              );
            }

            const snap = await getDocs(q);
            const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            return { data: items };
          } catch (error) {
            console.error(
              "❌ getSalesMonthlyLmByLmAndYms getDocs failed",
              error,
            );
            return { error };
          }
        },

        // async onCacheEntryAdded(
        //   { lmPcode, yms },
        //   { updateCachedData, cacheEntryRemoved },
        // ) {
        //   if (!lmPcode) return;

        //   if (Array.isArray(yms) && yms.length > 10) {
        //     console.warn("⚠️ yms too large for Firestore 'in':", yms.length);
        //     return;
        //   }

        //   const base = collection(db, "conlog_sales_monthly_lm");

        //   let q = null;
        //   if (Array.isArray(yms) && yms.length > 0) {
        //     q = query(
        //       base,
        //       where("lmPcode", "==", lmPcode),
        //       where("ym", "in", yms.map(String)),
        //       orderBy("ym", "desc"),
        //     );
        //   } else {
        //     q = query(
        //       base,
        //       where("lmPcode", "==", lmPcode),
        //       orderBy("ym", "desc"),
        //       limit(24),
        //     );
        //   }

        //   const unsubscribe = onSnapshot(
        //     q,
        //     (snap) => {
        //       updateCachedData(() =>
        //         snap.docs.map((d) => ({ id: d.id, ...d.data() })),
        //       );
        //     },
        //     (error) => {
        //       console.error(
        //         "❌ conlog_sales_monthly_lm snapshot error:",
        //         error,
        //       );
        //     },
        //   );

        //   await cacheEntryRemoved;
        //   unsubscribe();
        // },

        keepUnusedDataFor: 3600,
      }),

      getMetersForMonth: builder.query({
        async queryFn({
          lmPcode,
          ym,
          salesGroupId = "ALL",
          pageSize = 50,
          cursor,
        }) {
          try {
            if (!lmPcode || !ym)
              return { data: { items: [], nextCursor: null } };

            const base = [
              collection(db, "conlog_sales_monthly"),
              where("lmPcode", "==", lmPcode),
              where("ym", "==", String(ym)),
            ];

            if (salesGroupId !== "ALL") {
              base.push(where("salesGroupId", "==", salesGroupId));
            }

            // stable order for paging
            const q = cursor
              ? query(
                  ...base,
                  orderBy("amountTotalC", "desc"),
                  startAfter(cursor),
                  limit(pageSize),
                )
              : query(
                  ...base,
                  orderBy("amountTotalC", "desc"),
                  limit(pageSize),
                );

            const snap = await getDocs(q);
            const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            const nextCursor = snap.docs.length
              ? snap.docs[snap.docs.length - 1]
              : null;

            return { data: { items, nextCursor } };
          } catch (e) {
            console.error("❌ getMetersForMonth failed", e);
            return { error: e };
          }
        },

        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          const { lmPcode, ym, salesGroupId = "ALL" } = queryArgs;
          return `${endpointName}_${lmPcode}_${ym}_${salesGroupId}`;
        },

        providesTags: (res, err, { lmPcode, ym, salesGroupId = "ALL" }) => [
          { type: "SALES_METERS", id: `${lmPcode}_${ym}_${salesGroupId}` },
        ],

        keepUnusedDataFor: 60,
      }),

      getSalesMonthlyLmGroupsByLmAndYm: builder.query({
        async queryFn({ lmPcode, ym }) {
          try {
            if (!lmPcode || !ym) return { data: [] };

            const base = collection(db, "conlog_sales_monthly_lm_groups");

            const q = query(
              base,
              where("lmPcode", "==", lmPcode),
              where("ym", "==", ym),
              orderBy("salesGroupId", "asc"),
            );

            const snap = await getDocs(q);
            const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            return { data: items };
          } catch (error) {
            console.error("❌ getSalesMonthlyLmGroupsByLmAndYm failed", error);
            return { error };
          }
        },
        keepUnusedDataFor: 60,
      }),
    };
  },
});

export const {
  useGetSalesAtomicLimitedQuery,
  useGetSalesMonthlyByLmAndYmsQuery,
  useGetSalesMonthlyLmByLmAndYmsQuery,
  useGetMetersForMonthQuery,
  useGetSalesMonthlyLmGroupsByLmAndYmQuery,
} = salesApi;
