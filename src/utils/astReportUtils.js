// src/utils/astReportUtils.js

export const createEmptyReportContext = () => ({
  astId: "NAv",
  meterNo: "NAv",

  premiseId: "NAv",
  premiseAddress: "NAv",

  erfId: "NAv",
  erfNo: "NAv",

  wardId: "NAv",
  wardPcode: "NAv",
  wardNo: "NAv",

  lmId: "NAv",
  lmPcode: "NAv",
  lmNo: "NAv",

  masterId: "NAv",
  visibility: "NAv",

  territoryLine: "NAv",
});

export const createEmptyReportTileMetrics = () => ({
  timelineCount: 0,
  activeDaysThisMonth: 0,
  latestMonthRevenue: 0,
  latestPurchaseAt: "NAv",
  daysSinceLastPurchase: "NAv",
});

export const normalizeText = (value) => {
  const x = String(value || "").trim();
  return x || "NAv";
};

export const normalizeMeterNo = (value) => {
  const x = String(value || "").trim();
  return x || "NAv";
};

export const toSafeNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const toMillis = (value) => {
  if (!value || value === "NAv") return 0;
  if (typeof value === "number") return value;

  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
};

export const getYmFromDate = (value = new Date()) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "NAv";

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

export const getDateKey = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "NAv";

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const formatCurrencyR = (value) => {
  const amount = toSafeNumber(value, 0);
  return `R${amount.toFixed(2)}`;
};

export const formatDaysGap = (value) => {
  if (value === "NAv") return "No sales yet";
  return `${value} days gap`;
};

export const getReportAstId = (ast, params = {}) =>
  normalizeText(ast?.id || ast?.ast?.id || params?.id);

export const getReportMeterNo = (ast, params = {}) =>
  normalizeMeterNo(
    ast?.ast?.astData?.astNo || ast?.astData?.astNo || params?.astNo,
  );

export const getReportMasterId = (ast) =>
  normalizeText(ast?.master?.id || ast?.masterId);

export const getReportVisibility = (ast) =>
  normalizeText(ast?.master?.visibility || ast?.visibility);

export const getReportPremiseId = (ast) =>
  normalizeText(
    ast?.master?.refs?.premise?.id ||
      ast?.accessData?.premiseId ||
      ast?.premiseId,
  );

export const getReportErfId = (ast, premise) =>
  normalizeText(
    ast?.master?.refs?.erf?.id ||
      ast?.accessData?.erfId ||
      ast?.erfId ||
      premise?.parent?.erfId ||
      premise?.territory?.erfId,
  );

export const getReportWardId = (ast, premise, erf, activeWard) =>
  normalizeText(
    ast?.master?.refs?.ward?.id ||
      ast?.accessData?.wardId ||
      ast?.wardId ||
      premise?.territory?.wardId ||
      erf?.territory?.wardId ||
      activeWard?.id,
  );

export const getReportLmId = (ast, premise, erf, activeLm) =>
  normalizeText(
    ast?.master?.refs?.lm?.id ||
      ast?.accessData?.lmId ||
      ast?.lmId ||
      premise?.territory?.lmId ||
      erf?.territory?.lmId ||
      activeLm?.id,
  );

const buildPremiseAddressFromDoc = (premise) => {
  const strNo = premise?.address?.strNo || "NAv";
  const strName = premise?.address?.strName || "NAv";
  const strType = premise?.address?.strType || "NAv";
  const labelFirst = `${strNo} ${strName} ${strType} `;
  if (labelFirst) return normalizeText(labelFirst);

  const parts = [
    premise?.address?.strNo,
    premise?.address?.strName,
    premise?.address?.strType,
    premise?.address?.suburb,
    premise?.address?.town,
    premise?.address?.city,
  ]
    .map((x) => String(x || "").trim())
    .filter(Boolean);

  return parts.length ? parts.join(", ") : "NAv";
};

export const getReportPremiseAddress = (ast, premise) =>
  normalizeText(
    ast?.accessData?.premise?.address || buildPremiseAddressFromDoc(premise),
  );

export const getReportErfNo = (ast, premise, erf) =>
  normalizeText(
    ast?.accessData?.erfNo ||
      ast?.erfNo ||
      premise?.territory?.erfNo ||
      erf?.erfNo,
  );

export const getReportWardNo = (ast, premise, erf, activeWard) =>
  normalizeText(
    ast?.accessData?.wardNo ||
      ast?.wardNo ||
      premise?.territory?.wardNo ||
      erf?.admin?.ward?.name?.split(" ")[1] ||
      activeWard?.wardNo,
  );

export const getReportWardPcode = (ast, premise, erf, activeWard) =>
  normalizeText(
    ast?.accessData?.wardPcode ||
      ast?.wardPcode ||
      premise?.territory?.wardPcode ||
      erf?.territory?.wardPcode ||
      activeWard?.pcode,
  );

export const getReportLmNo = (ast, premise, erf, activeLm) =>
  normalizeText(
    ast?.accessData?.parents?.lmPcode ||
      premise?.parents?.lmPcode ||
      erf?.admin?.localMunicipality?.pcode,
  );

export const getReportLmPcode = (ast, premise, erf, activeLm) =>
  normalizeText(
    ast?.accessData?.parents?.lmPcode ||
      premise?.parents?.lmPcode ||
      erf?.admin?.localMunicipality?.pcode,
  );

export const buildReportTerritoryLine = ({ erfNo, wardNo, lmNo, lmPcode }) => {
  const lmLabel = lmNo !== "NAv" ? lmNo : lmPcode;

  const parts = [
    erfNo !== "NAv" ? `ERF ${erfNo}` : null,
    wardNo !== "NAv" ? `Ward ${wardNo}` : null,
    lmLabel !== "NAv" ? `LM ${lmLabel}` : null,
  ].filter(Boolean);

  return parts.length ? parts.join(" • ") : "NAv";
};

export const findReportAstById = (asts = [], id) =>
  (asts || []).find(
    (x) =>
      String(x?.id || "") === String(id || "") ||
      String(x?.ast?.id || "") === String(id || ""),
  ) || null;

export const findReportPremiseById = (premises = [], premiseId) =>
  (premises || []).find(
    (x) => String(x?.id || "") === String(premiseId || ""),
  ) || null;

export const findReportErfById = (erfs = [], erfId) =>
  (erfs || []).find((x) => String(x?.id || "") === String(erfId || "")) || null;

export const buildReportContext = ({
  ast,
  premise,
  erf,
  activeWard,
  activeLm,
  params = {},
}) => {
  const astId = getReportAstId(ast, params);
  const meterNo = getReportMeterNo(ast, params);

  const premiseId = getReportPremiseId(ast);
  const premiseAddress = getReportPremiseAddress(ast, premise);

  const erfId = getReportErfId(ast, premise);
  const erfNo = getReportErfNo(ast, premise, erf);

  const wardId = getReportWardId(ast, premise, erf, activeWard);
  const wardPcode = getReportWardPcode(ast, premise, erf, activeWard);
  const wardNo = getReportWardNo(ast, premise, erf, activeWard);

  const lmId = getReportLmId(ast, premise, erf, activeLm);
  const lmPcode = getReportLmPcode(ast, premise, erf, activeLm);
  const lmNo = getReportLmNo(ast, premise, erf, activeLm);

  const masterId = getReportMasterId(ast);
  const visibility = getReportVisibility(ast);

  const territoryLine = buildReportTerritoryLine({
    erfNo,
    wardNo,
    lmNo,
    lmPcode,
  });

  return {
    astId,
    meterNo,

    premiseId,
    premiseAddress,

    erfId,
    erfNo,

    wardId,
    wardPcode,
    wardNo,

    lmId,
    lmPcode,
    lmNo,

    masterId,
    visibility,

    territoryLine,
  };
};

export const getTrnMeterNo = (trn) =>
  normalizeMeterNo(
    trn?.ast?.astData?.astNo ||
      trn?.accessData?.astData?.astNo ||
      trn?.meterNo ||
      trn?.derived?.meterNo,
  );

export const getTrnUpdatedAt = (trn) =>
  trn?.metadata?.updatedAt || trn?.metadata?.createdAt || "NAv";

export const getSaleUpdatedAt = (sale) =>
  sale?.txAtISO || sale?.ingestedAtISO || sale?.updatedAt || "NAv";

export const buildHubTimelineRowsForMetrics = ({
  trns = [],
  sales = [],
  meterNo,
}) => {
  const normalizedMeterNo = normalizeMeterNo(meterNo);
  if (!normalizedMeterNo || normalizedMeterNo === "NAv") return [];

  const trnRows = (trns || [])
    .filter((trn) => getTrnMeterNo(trn) === normalizedMeterNo)
    .map((trn, index) => ({
      id: trn?.id || `TRN_${index}`,
      source: "TRN",
      updatedAt: getTrnUpdatedAt(trn),
    }));

  const saleRows = (sales || []).map((sale, index) => ({
    id: sale?.id || sale?.txnId || `SALE_${index}`,
    source: "SALE",
    updatedAt: getSaleUpdatedAt(sale),
  }));

  return [...trnRows, ...saleRows].sort(
    (a, b) => toMillis(b?.updatedAt) - toMillis(a?.updatedAt),
  );
};

export const getTimelineEventCount = (timelineRows = []) => {
  return Array.isArray(timelineRows) ? timelineRows.length : 0;
};

export const getCalendarActiveDaysCount = ({
  timelineRows = [],
  ym = getYmFromDate(),
}) => {
  if (!Array.isArray(timelineRows) || !ym || ym === "NAv") return 0;

  const dayKeys = new Set();

  timelineRows.forEach((row) => {
    const updatedAt = row?.updatedAt;
    const dayKey = getDateKey(updatedAt);
    const rowYm = dayKey !== "NAv" ? dayKey.slice(0, 7) : "NAv";

    if (dayKey !== "NAv" && rowYm === ym) {
      dayKeys.add(dayKey);
    }
  });

  return dayKeys.size;
};

export const groupSalesByYm = (sales = []) => {
  const grouped = {};

  (sales || []).forEach((sale) => {
    const when = sale?.txAtISO || sale?.ingestedAtISO || sale?.updatedAt;
    const ym = getYmFromDate(when);
    if (ym === "NAv") return;

    const amountR = toSafeNumber(sale?.amountTotalC, 0) / 100;

    if (!grouped[ym]) {
      grouped[ym] = {
        ym,
        amountTotalR: 0,
        purchasesCount: 0,
      };
    }

    grouped[ym].amountTotalR += amountR;
    grouped[ym].purchasesCount += 1;
  });

  return Object.values(grouped).sort((a, b) => b.ym.localeCompare(a.ym));
};

export const getLatestMonthRevenueAmount = (sales = []) => {
  const grouped = groupSalesByYm(sales);
  if (!grouped.length) return 0;

  return toSafeNumber(grouped[0]?.amountTotalR, 0);
};

export const getLatestPurchaseAt = (sales = []) => {
  if (!Array.isArray(sales) || sales.length === 0) return "NAv";

  let latestMs = 0;
  let latestValue = "NAv";

  sales.forEach((sale) => {
    const raw = sale?.txAtISO || sale?.ingestedAtISO || sale?.updatedAt;
    const ms = toMillis(raw);

    if (ms > latestMs) {
      latestMs = ms;
      latestValue = raw || "NAv";
    }
  });

  return latestValue;
};

export const getDaysSinceLastPurchase = (sales = [], now = new Date()) => {
  const latestPurchaseAt = getLatestPurchaseAt(sales);
  const latestMs = toMillis(latestPurchaseAt);
  const nowMs = toMillis(now);

  if (!latestMs || !nowMs) return "NAv";

  const diffMs = nowMs - latestMs;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return days >= 0 ? days : 0;
};

export const getTimelineTileMiniText = ({ timelineCount = 0 }) => {
  if (!timelineCount) return "No events";
  return `${timelineCount} ${timelineCount === 1 ? "event" : "events"}`;
};

export const getCalendarTileMiniText = ({ activeDaysThisMonth = 0 }) => {
  if (!activeDaysThisMonth) return "No activity";
  return `${activeDaysThisMonth} active days`;
};

export const getMonthlyRevenueTileMiniText = ({ latestMonthRevenue = 0 }) => {
  if (!latestMonthRevenue) return "No sales yet";
  return `${formatCurrencyR(latestMonthRevenue)} latest month`;
};

export const getStatsTileMiniText = ({ daysSinceLastPurchase = "NAv" }) => {
  return formatDaysGap(daysSinceLastPurchase);
};

export const getInspectTileMiniText = () => {
  return "Create inspection TRN";
};

export const buildReportTileMetrics = ({
  timelineRows = [],
  sales = [],
  ym = getYmFromDate(),
  now = new Date(),
}) => {
  const timelineCount = getTimelineEventCount(timelineRows);
  const activeDaysThisMonth = getCalendarActiveDaysCount({
    timelineRows,
    ym,
  });
  const latestMonthRevenue = getLatestMonthRevenueAmount(sales);
  const latestPurchaseAt = getLatestPurchaseAt(sales);
  const daysSinceLastPurchase = getDaysSinceLastPurchase(sales, now);

  return {
    timelineCount,
    activeDaysThisMonth,
    latestMonthRevenue,
    latestPurchaseAt,
    daysSinceLastPurchase,
  };
};

export const buildReportTiles = ({ reportContext = {}, metrics = {} }) => {
  const astId = reportContext?.astId || "NAv";

  const timelineCount = Number(metrics?.timelineCount || 0);
  const activeDaysThisMonth = Number(metrics?.activeDaysThisMonth || 0);
  const latestMonthRevenue = Number(metrics?.latestMonthRevenue || 0);
  const daysSinceLastPurchase = metrics?.daysSinceLastPurchase ?? "NAv";

  return [
    {
      key: "timeline",
      title: "Timeline",
      icon: "history",
      miniText: getTimelineTileMiniText({ timelineCount }),
      pathname: "/(tabs)/asts/[id]/timeline",
      params: {
        id: astId,
      },
      fullWidth: false,
      accent: false,
    },

    {
      key: "calendar",
      title: "Calendar",
      icon: "calendar",
      miniText: getCalendarTileMiniText({ activeDaysThisMonth }),
      pathname: "/(tabs)/asts/[id]/calendar",
      params: {
        id: astId,
      },
      fullWidth: false,
      accent: false,
    },

    {
      key: "monthlyRevenue",
      title: "Monthly Revenue",
      icon: "cash-multiple",
      miniText: getMonthlyRevenueTileMiniText({ latestMonthRevenue }),
      pathname: "/(tabs)/asts/[id]/monthly-revenue",
      params: {
        id: astId,
      },
      fullWidth: false,
      accent: false,
    },

    {
      key: "stats",
      title: "Stats",
      icon: "chart-line",
      miniText: getStatsTileMiniText({ daysSinceLastPurchase }),
      pathname: "/(tabs)/asts/[id]/stats",
      params: {
        id: astId,
      },
      fullWidth: false,
      accent: false,
    },

    {
      key: "inspect",
      title: "Inspect",
      icon: "wrench",
      miniText: getInspectTileMiniText(),
      pathname: "/(tabs)/asts/[id]/inspect-prep",
      params: {
        id: astId,
        meterNo: reportContext?.meterNo || "NAv",
        masterId: reportContext?.masterId || "NAv",
        premiseId: reportContext?.premiseId || "NAv",
        erfId: reportContext?.erfId || "NAv",
        wardPcode: reportContext?.wardPcode || "NAv",
        lmPcode: reportContext?.lmPcode || "NAv",
      },
      fullWidth: true,
      accent: true,
    },
  ];
};
