// src/features/reports/prepaidRevenue/months/monthUtils.js

/**
 * ym format in your data: "YYYY-MM" (e.g. "2025-12")
 * We will never use Date objects in state; we keep ym strings.
 */

export function ymToLabel(ym) {
  if (!ym || typeof ym !== "string") return "";
  const parts = ym.split("-");
  if (parts.length !== 2) return ym;

  const [y, m] = parts;
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const idx = Number(m) - 1;

  if (!Number.isFinite(idx) || idx < 0 || idx > 11) return ym;
  return `${monthNames[idx]} ${y}`;
}

/**
 * Sort yms descending (latest first).
 */
export function sortYmsDesc(yms) {
  return [...(yms || [])].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}

/**
 * Get last N months from an available list (descending list assumed).
 * Example: available=["2026-01","2025-12","2025-11"...]
 */
export function getDefaultLastNMonths(availableYms, n = 3) {
  const desc = sortYmsDesc(availableYms);
  return desc.slice(0, n);
}

/**
 * Given available months (desc) and a selected month (ym),
 * return that month + the two previous months (if available).
 *
 * Example:
 * available desc: ["2026-01","2025-12","2025-11","2025-10","2025-09"]
 * select "2025-12" => ["2025-12","2025-11","2025-10"]
 */
export function getThreeMonthBatchFromSelected(availableYms, selectedYm) {
  const desc = sortYmsDesc(availableYms);
  const idx = desc.indexOf(selectedYm);
  if (idx === -1) return [];
  return desc.slice(idx, idx + 3); // idx, idx+1, idx+2 in DESC order
}

/**
 * Toggle a month in a multi-select array, max = 3.
 * - If month exists => remove
 * - If month doesn't exist => add (if under max)
 */
export function toggleMonthWithMax(prevSelected, ym, max = 3) {
  const prev = Array.isArray(prevSelected) ? prevSelected : [];
  const has = prev.includes(ym);

  if (has) return prev.filter((x) => x !== ym);
  if (prev.length >= max) return prev; // refuse adding more than max
  return [...prev, ym];
}

/**
 * Normalize selection:
 * - Remove months not in available
 * - Sort descending (to keep UI consistent)
 */
export function normalizeSelectedMonths(selected, availableYms) {
  const avail = new Set(availableYms || []);
  const clean = (selected || []).filter((ym) => avail.has(ym));
  return sortYmsDesc(clean);
}
