// src/utils/astReportMonthlyRevenueUtils.js

export const normalizeYm = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "NAv";

  const match = raw.match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return "NAv";

  const year = match[1];
  const month = String(Number(match[2])).padStart(2, "0");

  if (Number(month) < 1 || Number(month) > 12) return "NAv";

  return `${year}-${month}`;
};

export const formatMonthLabel = (ym) => {
  const norm = normalizeYm(ym);
  if (norm === "NAv") return "NAv";

  const [year, month] = norm.split("-");
  const monthIndex = Number(month) - 1;

  const shortMonths = [
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

  return `${shortMonths[monthIndex] || "NAv"} ${year}`;
};

export const toSafeNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const toCurrencyR = (value) => {
  const n = toSafeNumber(value, 0);
  return `R${n.toFixed(2)}`;
};

export const mapMonthlyRevenueRow = (row) => {
  const amountTotalC = toSafeNumber(row?.amountTotalC, 0);
  const purchasesCount = toSafeNumber(row?.purchasesCount, 0);
  const amountTotalR = amountTotalC / 100;
  const avgPurchaseR = purchasesCount > 0 ? amountTotalR / purchasesCount : 0;

  return {
    id: String(row?.id || "NAv"),
    ym: normalizeYm(row?.ym),
    monthLabel: formatMonthLabel(row?.ym),

    meterNo: String(row?.meterNo || "NAv"),
    lmPcode: String(row?.lmPcode || "NAv"),

    amountTotalC,
    amountTotalR,

    purchasesCount,
    avgPurchaseR,

    salesGroupId: String(row?.salesGroupId || "NAv"),

    raw: row,
  };
};

export const getMonthlyRevenueRowsSortedDesc = (rows = []) => {
  return [...(rows || [])].sort((a, b) =>
    String(b?.ym || "").localeCompare(String(a?.ym || "")),
  );
};

export const getMonthlyRevenueRowsSortedAsc = (rows = []) => {
  return [...(rows || [])].sort((a, b) =>
    String(a?.ym || "").localeCompare(String(b?.ym || "")),
  );
};

export const mapMonthlyRevenueRows = (rows = []) => {
  return getMonthlyRevenueRowsSortedDesc(
    (rows || []).map(mapMonthlyRevenueRow),
  );
};

export const getLatestMonthRevenue = (rows = []) => {
  const sorted = getMonthlyRevenueRowsSortedDesc(rows);
  return toSafeNumber(sorted?.[0]?.amountTotalR, 0);
};

export const getBestMonthRevenue = (rows = []) => {
  if (!Array.isArray(rows) || rows.length === 0) return 0;

  return rows.reduce((max, row) => {
    const value = toSafeNumber(row?.amountTotalR, 0);
    return value > max ? value : max;
  }, 0);
};

export const getAverageMonthlyRevenue = (rows = []) => {
  if (!Array.isArray(rows) || rows.length === 0) return 0;

  const total = rows.reduce(
    (sum, row) => sum + toSafeNumber(row?.amountTotalR, 0),
    0,
  );

  return rows.length > 0 ? total / rows.length : 0;
};

export const getActiveMonthsCount = (rows = []) => {
  return Array.isArray(rows) ? rows.length : 0;
};

export const getTotalMonthlyRevenue = (rows = []) => {
  if (!Array.isArray(rows) || rows.length === 0) return 0;

  return rows.reduce((sum, row) => sum + toSafeNumber(row?.amountTotalR, 0), 0);
};

export const getTotalMonthlyPurchasesCount = (rows = []) => {
  if (!Array.isArray(rows) || rows.length === 0) return 0;

  return rows.reduce(
    (sum, row) => sum + toSafeNumber(row?.purchasesCount, 0),
    0,
  );
};

export const getMonthlyRevenueChartData = (rows = []) => {
  return getMonthlyRevenueRowsSortedAsc(rows).map((row) => ({
    ym: row?.ym || "NAv",
    monthLabel: row?.monthLabel || "NAv",
    amountTotalR: toSafeNumber(row?.amountTotalR, 0),
    purchasesCount: toSafeNumber(row?.purchasesCount, 0),
  }));
};

export const buildMonthlyRevenueMetrics = (rows = []) => {
  return {
    latestMonthRevenue: getLatestMonthRevenue(rows),
    bestMonthRevenue: getBestMonthRevenue(rows),
    averageMonthlyRevenue: getAverageMonthlyRevenue(rows),
    activeMonthsCount: getActiveMonthsCount(rows),
    totalMonthlyRevenue: getTotalMonthlyRevenue(rows),
    totalMonthlyPurchasesCount: getTotalMonthlyPurchasesCount(rows),
  };
};
