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
import {
  getMonthlyFromKV,
  getMonthlyLmFromKV,
  setMonthlyLmToKV,
  setMonthlyToKV,
} from "../storage/salesMonthlyKV";

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

function normalizeYm(ym) {
  const s = String(ym || "").trim();
  const m = s.match(/^(\d{4})-(\d{1,2})$/);
  if (!m) return s;
  return `${m[1]}-${m[2].padStart(2, "0")}`;
}

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

      getSalesAtomicByMeterMonth: builder.query({
        async queryFn({ lmPcode, ym, meterNo, limit: lim = 200 }) {
          try {
            if (!lmPcode || !ym || !meterNo) return { data: [] };

            // Compute month boundaries in ms (UTC-safe enough for ordering by txAtMs)
            const start = new Date(`${ym}-01T00:00:00.000Z`).getTime();
            const end = new Date(`${ym}-01T00:00:00.000Z`);
            end.setUTCMonth(end.getUTCMonth() + 1);
            const endMs = end.getTime();

            const HARD_LIMIT = 500;
            const pageLimit = Math.min(Number(lim || 200), HARD_LIMIT);

            const col = collection(db, "conlog_sales_atomic");
            const q = query(
              col,
              where("lmPcode", "==", lmPcode),
              where("meterNo", "==", String(meterNo)), // meterNo stays string
              where("txAtMs", ">=", start),
              where("txAtMs", "<", endMs),
              orderBy("txAtMs", "desc"),
              limit(pageLimit),
            );

            const snap = await getDocs(q);
            return {
              data: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
            };
          } catch (e) {
            console.log(e);
            return { error: { message: e?.message || String(e) } };
          }
        },

        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          const { lmPcode, ym, meterNo } = queryArgs || {};
          return `${endpointName}_${lmPcode}_${ym}_${String(meterNo || "")}`;
        },

        keepUnusedDataFor: 60,
      }),

      getSalesMonthlyByLmAndYm: builder.query({
        async queryFn(rawArgs, api) {
          try {
            const lmPcode = String(rawArgs?.lmPcode ?? "").trim();
            const ym = normalizeYm(rawArgs?.ym);

            if (!lmPcode || !ym) return { data: [] };

            // 1) MMKV first
            const cached = getMonthlyFromKV(lmPcode, ym);
            const cachedRows = Array.isArray(cached?.rows) ? cached.rows : [];

            if (cachedRows.length > 0) {
              console.log("📦 MONTHLY CACHE HIT", {
                lmPcode,
                ym,
                size: cachedRows.length,
              });
              return { data: cachedRows };
            }

            // 2) Only block when online state is explicitly false
            const isOnline = api.getState()?.offline?.isOnline;
            if (isOnline === false) {
              console.log("⚠️ MONTHLY FETCH SKIPPED (offline)", {
                lmPcode,
                ym,
              });
              return { data: [] };
            }

            // 3) Firestore fetch
            console.log("🚀 MONTHLY FIRESTORE FETCH (cache-miss)", {
              lmPcode,
              ym,
            });

            const colRef = collection(db, "conlog_sales_monthly");
            const q = query(
              colRef,
              where("lmPcode", "==", lmPcode),
              where("ym", "==", ym),
              orderBy("amountTotalC", "asc"),
            );

            const snap = await getDocs(q);

            console.log("✅ MONTHLY FIRESTORE DONE (cache-miss)", {
              lmPcode,
              ym,
              size: snap.size,
            });

            const rows = snap.docs.map((d) => {
              const x = d.data();
              return {
                id: d.id,
                meterNo: x.meterNo,
                ym: x.ym,
                lmPcode: x.lmPcode,
                amountTotalC: x.amountTotalC,
                purchasesCount: x.purchasesCount,
                salesGroupId: x.salesGroupId,
              };
            });

            if (rows.length > 0) {
              setMonthlyToKV(lmPcode, ym, rows);
            }

            return { data: rows };
          } catch (e) {
            console.log("❌ getSalesMonthlyByLmAndYm error:", e);

            const lmPcode = String(rawArgs?.lmPcode ?? "").trim();
            const ym = normalizeYm(rawArgs?.ym);

            const cached = getMonthlyFromKV(lmPcode, ym);
            if (Array.isArray(cached?.rows) && cached.rows.length > 0) {
              return { data: cached.rows };
            }

            return { error: { message: e?.message ?? String(e) } };
          }
        },

        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          const lmPcode = String(queryArgs?.lmPcode ?? "").trim();
          const ym = normalizeYm(queryArgs?.ym);
          return `${endpointName}_${lmPcode}_${ym}`;
        },

        keepUnusedDataFor: 60 * 60 * 24 * 30,
      }),

      // getSalesMonthlyByLmAndYm: builder.query({
      //   async queryFn(rawArgs, api) {
      //     try {
      //       const lmPcode = String(rawArgs?.lmPcode ?? "").trim();
      //       const ym = String(rawArgs?.ym ?? "").trim();
      //       if (!lmPcode || !ym) return { data: [] };

      //       // 1) Cache first (MMKV)
      //       const cached = getMonthlyFromKV(lmPcode, ym);
      //       const cachedRows = cached?.rows || [];

      //       // ✅ If cache exists, we are DONE. No Firestore reads.
      //       if (cachedRows.length) {
      //         return { data: cachedRows };
      //       }

      //       // 2) If offline and no cache
      //       const isOnline = api.getState()?.offline?.isOnline;
      //       // if (!isOnline) return { data: [] };
      //       if (isOnline === false) return { data: [] };

      //       // 3) Cache miss + online => Firestore fetch ONCE
      //       console.log("🚀 MONTHLY FIRESTORE FETCH (cache-miss)", {
      //         lmPcode,
      //         ym,
      //       });

      //       const colRef = collection(db, "conlog_sales_monthly");
      //       const q = query(
      //         colRef,
      //         where("lmPcode", "==", lmPcode),
      //         where("ym", "==", ym),
      //         orderBy("amountTotalC", "asc"),
      //       );

      //       const snap = await getDocs(q);

      //       console.log("✅ MONTHLY FIRESTORE DONE (cache-miss)", {
      //         lmPcode,
      //         ym,
      //         size: snap.size,
      //       });

      //       const rows = snap.docs.map((d) => {
      //         const x = d.data();
      //         return {
      //           id: d.id,
      //           meterNo: x.meterNo,
      //           ym: x.ym,
      //           lmPcode: x.lmPcode,
      //           amountTotalC: x.amountTotalC,
      //           purchasesCount: x.purchasesCount,
      //           salesGroupId: x.salesGroupId,
      //         };
      //       });

      //       // 4) Save only if non-empty (avoid poisoning cache)
      //       if (rows.length > 0) setMonthlyToKV(lmPcode, ym, rows);

      //       return { data: rows };
      //     } catch (e) {
      //       console.log("❌ getSalesMonthlyByLmAndYm error:", e);

      //       // fallback to cache if any
      //       const lmPcode = String(rawArgs?.lmPcode ?? "").trim();
      //       const ym = String(rawArgs?.ym ?? "").trim();
      //       const cached = getMonthlyFromKV(lmPcode, ym);
      //       if (cached?.rows?.length) return { data: cached.rows };

      //       return { error: { message: e?.message ?? String(e) } };
      //     }
      //   },

      //   keepUnusedDataFor: 60 * 60 * 24 * 30,
      // }),

      getSalesMonthlyLmByLmAndYms: builder.query({
        async queryFn({ lmPcode, yms }, api) {
          try {
            const lm = String(lmPcode || "").trim();
            if (!lm) return { data: [] };

            // Normalize yms for:
            // - stable cache key
            // - consistent Firestore query behavior
            const normYms = Array.isArray(yms)
              ? Array.from(
                  new Set(yms.map((x) => String(x).trim()).filter(Boolean)),
                )
                  .sort()
                  .reverse()
              : [];

            // Firestore "in" max 10 (only applies when yms is provided)
            if (normYms.length > 10) {
              console.warn(
                "⚠️ yms too large for Firestore 'in':",
                normYms.length,
              );
              return { data: [] };
            }

            // 1) Cache-first (MMKV)
            const cached = getMonthlyLmFromKV(lm, normYms);
            const cachedRows = cached?.rows || [];

            // ✅ If cache exists, STOP here. No Firestore reads.
            if (cachedRows.length) {
              return { data: cachedRows };
            }

            // 2) Offline guard (cache-miss + offline => empty)
            const isOnline = api.getState()?.offline?.isOnline;
            if (!isOnline) return { data: [] };

            // 3) Firestore fetch ONCE (cache-miss + online)
            console.log("🚀 MONTHLY_LM FIRESTORE FETCH (cache-miss)", {
              lmPcode: lm,
              yms: normYms.length ? normYms : "LAST24",
            });

            const base = collection(db, "conlog_sales_monthly_lm");

            const q =
              normYms.length > 0
                ? query(
                    base,
                    where("lmPcode", "==", lm),
                    where("ym", "in", normYms),
                    orderBy("ym", "desc"),
                  )
                : query(
                    base,
                    where("lmPcode", "==", lm),
                    orderBy("ym", "desc"),
                    limit(24),
                  );

            const snap = await getDocs(q);

            console.log("✅ MONTHLY_LM FIRESTORE DONE (cache-miss)", {
              lmPcode: lm,
              size: snap.size,
            });

            const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

            // 4) Save only if non-empty (avoid poisoning cache)
            if (items.length > 0) setMonthlyLmToKV(lm, normYms, items);

            return { data: items };
          } catch (error) {
            console.error("❌ getSalesMonthlyLmByLmAndYms failed", error);

            // Fallback to cache if any
            try {
              const lm = String(lmPcode || "").trim();
              const normYms = Array.isArray(yms)
                ? Array.from(
                    new Set(yms.map((x) => String(x).trim()).filter(Boolean)),
                  )
                    .sort()
                    .reverse()
                : [];

              const cached = getMonthlyLmFromKV(lm, normYms);
              if (cached?.rows?.length) return { data: cached.rows };
            } catch {
              // ignore
            }

            return { error: { message: error?.message || String(error) } };
          }
        },

        // Optional: stable cache key (recommended)
        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          const lm = String(queryArgs?.lmPcode || "").trim();
          const yms = Array.isArray(queryArgs?.yms) ? queryArgs.yms : [];
          const norm = Array.from(
            new Set(yms.map((x) => String(x).trim()).filter(Boolean)),
          )
            .sort()
            .reverse();
          return `${endpointName}_${lm}_${norm.length ? norm.join("|") : "LAST24"}`;
        },

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

      getSalesMonthlyLmGroupsByLmAndYms: builder.query({
        async queryFn({ lmPcode, yms }) {
          try {
            const lm = String(lmPcode || "").trim();
            const list = Array.isArray(yms)
              ? Array.from(new Set(yms.map((x) => String(x).trim()))).filter(
                  Boolean,
                )
              : [];

            if (!lm) return { data: [] };
            if (list.length === 0) return { data: [] };

            // Firestore "in" max 10
            if (list.length > 10) {
              console.warn("⚠️ yms too large for Firestore 'in':", list.length);
              return { data: [] };
            }

            const base = collection(db, "conlog_sales_monthly_lm_groups");

            const q = query(
              base,
              where("lmPcode", "==", lm),
              where("ym", "in", list),
              orderBy("ym", "desc"),
              orderBy("salesGroupId", "asc"),
            );

            const snap = await getDocs(q);
            const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            return { data: items };
          } catch (e) {
            console.error("❌ getSalesMonthlyLmGroupsByLmAndYms failed", e);
            return { error: { message: e?.message || String(e) } };
          }
        },

        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          const lm = String(queryArgs?.lmPcode || "").trim();
          const yms = Array.isArray(queryArgs?.yms) ? queryArgs.yms : [];
          const norm = Array.from(new Set(yms.map((x) => String(x).trim())))
            .filter(Boolean)
            .sort()
            .reverse();
          return `${endpointName}_${lm}_${norm.join("|")}`;
        },

        keepUnusedDataFor: 3600,
      }),

      getSalesAtomicByMeterNo: builder.query({
        async queryFn(astNo) {
          // console.log(`getSalesAtomicByMeterNo --astNo`, astNo);
          try {
            const meterNo = String(astNo || "").trim();
            if (!meterNo) return { data: [] };

            const col = collection(db, "conlog_sales_atomic");

            const q = query(
              col,
              where("meterNo", "==", meterNo),
              orderBy("txAtMs", "desc"),
              // limit(200),
            );

            const snap = await getDocs(q);

            const items = snap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }));
            // console.log(`getSalesAtomicByMeterNo --items`, items);

            return { data: items };
          } catch (e) {
            console.log("❌ getSalesAtomicByAstNo failed", e);
            return { error: { message: e?.message || String(e) } };
          }
        },

        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          return `${endpointName}_${String(queryArgs || "").trim()}`;
        },

        keepUnusedDataFor: 60,
      }),

      getSalesMonthlyByLmAndMeterNo: builder.query({
        async queryFn({ lmPcode, meterNo }) {
          try {
            const lm = String(lmPcode || "").trim();
            const meter = String(meterNo || "").trim();

            if (!lm || !meter) return { data: [] };

            const colRef = collection(db, "conlog_sales_monthly");

            const q = query(
              colRef,
              where("lmPcode", "==", lm),
              where("meterNo", "==", meter),
              orderBy("ym", "desc"),
            );

            const snap = await getDocs(q);

            const items = snap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }));
            return { data: items };
          } catch (e) {
            console.error("❌ getSalesMonthlyByLmAndMeterNo failed", e);
            return { error: { message: e?.message || String(e) } };
          }
        },

        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          const lm = String(queryArgs?.lmPcode || "").trim();
          const meter = String(queryArgs?.meterNo || "").trim();
          return `${endpointName}_${lm}_${meter}`;
        },

        keepUnusedDataFor: 60 * 10,
      }),
    };
  },
});

export const {
  useGetSalesAtomicLimitedQuery,
  useGetSalesAtomicByMeterMonthQuery,
  useGetSalesMonthlyByLmAndYmQuery,
  useGetSalesMonthlyLmByLmAndYmsQuery,
  useGetMetersForMonthQuery,
  useGetSalesMonthlyLmGroupsByLmAndYmQuery,
  useGetSalesMonthlyLmGroupsByLmAndYmsQuery,
  useGetSalesAtomicByMeterNoQuery,
  useGetSalesMonthlyByLmAndMeterNoQuery,
} = salesApi;
