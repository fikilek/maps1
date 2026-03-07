// src/kv/salesKV.js  (or wherever your MMKV helpers live)
import { createMMKV } from "react-native-mmkv";

export const salesKV = createMMKV({ id: "sales-cache" });

function keyMonthly(lmPcode, ym) {
  return `sales_monthly:${String(lmPcode || "").trim()}:${String(ym || "").trim()}`;
}

function keyMonthlyMeta(lmPcode, ym) {
  return `${keyMonthly(lmPcode, ym)}:meta`;
}

/**
 * Returns:
 *   { rows: [...] } | null
 *
 * Backward compatible:
 * - If older cache entries were stored as an array, we wrap them into { rows }.
 */
export function getMonthlyFromKV(lmPcode, ym) {
  try {
    const raw = salesKV.getString(keyMonthly(lmPcode, ym));
    if (!raw) return null;

    const data = JSON.parse(raw);

    // New format: { rows: [...] }
    if (data && typeof data === "object" && Array.isArray(data.rows)) {
      return { rows: data.rows };
    }

    // Old format: [...]
    if (Array.isArray(data)) {
      return { rows: data };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Stores in NEW format:
 *   { rows: [...] }
 * Plus meta:
 *   { savedAtMs, count }
 */
export function setMonthlyToKV(lmPcode, ym, rows) {
  try {
    const list = Array.isArray(rows) ? rows : [];

    // Store NEW shape so queryFn can do cached?.rows
    salesKV.set(keyMonthly(lmPcode, ym), JSON.stringify({ rows: list }));

    salesKV.set(
      keyMonthlyMeta(lmPcode, ym),
      JSON.stringify({
        savedAtMs: Date.now(),
        count: list.length,
      }),
    );
  } catch {
    // ignore
  }
}

export function getMonthlyMetaFromKV(lmPcode, ym) {
  try {
    const raw = salesKV.getString(keyMonthlyMeta(lmPcode, ym));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Optional utility (nice for debugging / support):
 * Removes both rows + meta for a month key.
 */
export function clearMonthlyFromKV(lmPcode, ym) {
  try {
    salesKV.delete(keyMonthly(lmPcode, ym));
    salesKV.delete(keyMonthlyMeta(lmPcode, ym));
  } catch {
    // ignore
  }
}

function keyFor(lmPcode, yms) {
  const lm = String(lmPcode || "").trim();

  const norm = Array.isArray(yms)
    ? Array.from(new Set(yms.map((x) => String(x).trim())))
        .sort()
        .reverse()
    : [];

  return `sales_monthly_lm:${lm}:${norm.length ? norm.join("|") : "LAST24"}`;
}

export function getMonthlyLmFromKV(lmPcode, yms) {
  try {
    const raw = salesKV.getString(keyFor(lmPcode, yms));
    if (!raw) return null;

    const data = JSON.parse(raw);

    if (data && typeof data === "object" && Array.isArray(data.rows)) {
      return { rows: data.rows };
    }

    if (Array.isArray(data)) {
      return { rows: data };
    }

    return null;
  } catch {
    return null;
  }
}

function keyMonthlyLmMeta(lmPcode, yms) {
  return `${keyFor(lmPcode, yms)}:meta`;
}

export function setMonthlyLmToKV(lmPcode, yms, items) {
  try {
    const list = Array.isArray(items) ? items : [];
    if (!list.length) return;

    salesKV.set(keyFor(lmPcode, yms), JSON.stringify({ rows: list }));
    salesKV.set(
      keyMonthlyLmMeta(lmPcode, yms),
      JSON.stringify({ savedAtMs: Date.now(), count: list.length }),
    );
  } catch {}
}

export function getMonthlyLmMetaFromKV(lmPcode, yms) {
  try {
    const raw = salesKV.getString(keyMonthlyLmMeta(lmPcode, yms));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearMonthlyLmFromKV(lmPcode, yms) {
  try {
    salesKV.delete(keyFor(lmPcode, yms));
    salesKV.delete(keyMonthlyLmMeta(lmPcode, yms));
  } catch {}
}
