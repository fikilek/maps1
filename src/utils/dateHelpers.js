// /src/utils/dateHelpers.js
export const getDateRange = (key) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (key) {
    case "TODAY":
      return {
        label: "TODAY",
        start: today.toISOString(),
        end: now.toISOString(),
      };
    case "YESTERDAY":
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        label: "YESTERDAY",
        start: yesterday.toISOString(),
        end: today.toISOString(),
      };
    case "WEEK":
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      return {
        label: "LAST 7 DAYS",
        start: lastWeek.toISOString(),
        end: now.toISOString(),
      };
    case "MONTH":
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        label: "THIS MONTH",
        start: firstOfMonth.toISOString(),
        end: now.toISOString(),
      };
    default:
      return { label: "ALL TIME", start: null, end: null };
  }
};
