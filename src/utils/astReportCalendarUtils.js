// src/utils/astReportCalendarUtils.js

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

export const getYmFromDate = (value = new Date()) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "NAv";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export const getMonthStartDate = (ym) => {
  const norm = normalizeYm(ym);
  if (norm === "NAv") return null;

  return new Date(`${norm}-01T00:00:00`);
};

export const addMonthsToYm = (ym, offset = 0) => {
  const start = getMonthStartDate(ym);
  if (!start) return "NAv";

  const d = new Date(start);
  d.setMonth(d.getMonth() + Number(offset || 0));

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
};

export const getMonthLabel = (ym) => {
  const start = getMonthStartDate(ym);
  if (!start) return "NAv";

  return start.toLocaleDateString("en-ZA", {
    month: "long",
    year: "numeric",
  });
};

export const getDaysInMonth = (ym) => {
  const norm = normalizeYm(ym);
  if (norm === "NAv") return 0;

  const [year, month] = norm.split("-").map(Number);
  return new Date(year, month, 0).getDate();
};

export const getWeekdayIndex = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return 0;

  // Sunday = 0, Saturday = 6
  return d.getDay();
};

export const getDateKeyFromDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "NAv";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const isSameYm = (dateKey, ym) => {
  const normYm = normalizeYm(ym);
  const key = String(dateKey || "").trim();

  if (normYm === "NAv" || !key) return false;

  return key.slice(0, 7) === normYm;
};

export const getVisibleYms = (anchorYm) => {
  const normAnchor = normalizeYm(anchorYm);
  if (normAnchor === "NAv") return [];

  return [
    addMonthsToYm(normAnchor, 0),
    addMonthsToYm(normAnchor, -1),
    addMonthsToYm(normAnchor, -2),
  ].filter((x) => x !== "NAv");
};

export const groupCalendarEventsByDate = (events = []) => {
  const grouped = {};

  (events || []).forEach((event) => {
    const dateKey = getDateKeyFromDate(event?.updatedAt);
    if (dateKey === "NAv") return;

    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(event);
  });

  Object.keys(grouped).forEach((dateKey) => {
    grouped[dateKey] = grouped[dateKey].sort((a, b) => {
      const aMs = new Date(a?.updatedAt || 0).getTime();
      const bMs = new Date(b?.updatedAt || 0).getTime();
      return bMs - aMs;
    });
  });

  return grouped;
};

export const getCalendarEventsForYm = (eventsByDate = {}, ym) => {
  const normYm = normalizeYm(ym);
  if (normYm === "NAv") return [];

  return Object.entries(eventsByDate)
    .filter(([dateKey]) => isSameYm(dateKey, normYm))
    .flatMap(([, events]) => events || []);
};

export const buildCalendarDay = ({
  date,
  ym,
  eventsByDate = {},
  inCurrentMonth = true,
}) => {
  const d = date instanceof Date ? date : new Date(date);
  const dateKey = getDateKeyFromDate(d);
  const events = dateKey !== "NAv" ? eventsByDate[dateKey] || [] : [];

  return {
    dateKey,
    ym: normalizeYm(ym),
    dayNumber: Number.isNaN(d.getTime()) ? 0 : d.getDate(),
    inCurrentMonth,
    hasActivity: events.length > 0,
    events,
  };
};

export const buildMonthDays = ({ ym, eventsByDate = {} }) => {
  const normYm = normalizeYm(ym);
  if (normYm === "NAv") return [];

  const totalDays = getDaysInMonth(normYm);

  return Array.from({ length: totalDays }, (_, index) => {
    const dayNumber = index + 1;
    const date = new Date(
      `${normYm}-${String(dayNumber).padStart(2, "0")}T00:00:00`,
    );

    return buildCalendarDay({
      date,
      ym: normYm,
      eventsByDate,
      inCurrentMonth: true,
    });
  });
};

export const buildDenseMonthDays = ({ ym, eventsByDate = {} }) => {
  return buildMonthDaysDesc({ ym, eventsByDate }).filter(
    (day) => day.hasActivity,
  );
};

export const buildMonthDaysDesc = ({ ym, eventsByDate = {} }) => {
  return buildMonthDays({ ym, eventsByDate }).slice().reverse();
};

export const buildMonthWeeks = ({ ym, eventsByDate = {} }) => {
  const normYm = normalizeYm(ym);
  if (normYm === "NAv") return [];

  const monthDays = buildMonthDays({ ym: normYm, eventsByDate });
  if (!monthDays.length) return [];

  const firstDate = new Date(`${normYm}-01T00:00:00`);
  const firstWeekday = getWeekdayIndex(firstDate);

  const paddedDays = [];

  // leading pad days from previous month
  for (let i = 0; i < firstWeekday; i += 1) {
    const d = new Date(firstDate);
    d.setDate(firstDate.getDate() - (firstWeekday - i));

    paddedDays.push(
      buildCalendarDay({
        date: d,
        ym: normYm,
        eventsByDate,
        inCurrentMonth: false,
      }),
    );
  }

  paddedDays.push(...monthDays);

  // trailing pad days to complete final week
  while (paddedDays.length % 7 !== 0) {
    const last = paddedDays[paddedDays.length - 1];
    const d = new Date(`${last.dateKey}T00:00:00`);
    d.setDate(d.getDate() + 1);

    paddedDays.push(
      buildCalendarDay({
        date: d,
        ym: normYm,
        eventsByDate,
        inCurrentMonth: false,
      }),
    );
  }

  const weeks = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    weeks.push(paddedDays.slice(i, i + 7));
  }

  return weeks;
};

export const buildCalendarGridMonths = ({
  visibleYms = [],
  eventsByDate = {},
}) => {
  return (visibleYms || []).map((ym) => ({
    ym,
    monthLabel: getMonthLabel(ym),
    weeks: buildMonthWeeks({ ym, eventsByDate }),
    days: [],
  }));
};

export const buildCalendarListMonths = ({
  visibleYms = [],
  eventsByDate = {},
}) => {
  return (visibleYms || []).map((ym) => ({
    ym,
    monthLabel: getMonthLabel(ym),
    weeks: [],
    days: buildMonthDaysDesc({ ym, eventsByDate }),
  }));
};

export const buildCalendarDenseMonths = ({
  visibleYms = [],
  eventsByDate = {},
}) => {
  return (visibleYms || []).map((ym) => ({
    ym,
    monthLabel: getMonthLabel(ym),
    weeks: [],
    days: buildDenseMonthDays({ ym, eventsByDate }),
  }));
};

export const buildCalendarViewModel = ({
  events = [],
  anchorYm,
  viewMode = "list",
}) => {
  const safeAnchorYm =
    normalizeYm(anchorYm) !== "NAv"
      ? normalizeYm(anchorYm)
      : getYmFromDate(new Date());

  const visibleYms = getVisibleYms(safeAnchorYm);
  const eventsByDate = groupCalendarEventsByDate(events);

  let months = [];

  if (viewMode === "grid") {
    months = buildCalendarGridMonths({
      visibleYms,
      eventsByDate,
    });
  } else if (viewMode === "dense") {
    months = buildCalendarDenseMonths({
      visibleYms,
      eventsByDate,
    });
  } else {
    months = buildCalendarListMonths({
      visibleYms,
      eventsByDate,
    });
  }

  return {
    anchorYm: safeAnchorYm,
    viewMode,
    visibleYms,
    eventsByDate,
    months,
  };
};
