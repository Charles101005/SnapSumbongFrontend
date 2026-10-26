// Local-calendar date helpers for range filters. All ranges are inclusive
// { from, to } ISO date strings (YYYY-MM-DD) — the format the reports API
// accepts for from_date/to_date ("" = unbounded).

const pad = (n) => String(n).padStart(2, "0");

export const toISODate = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Date filters can't look ahead — reports don't exist yet. The input `max`
// attribute only blocks the calendar picker, not manually typed values, so
// change handlers accept only empty or not-after-today values (the controlled
// input then snaps back to its previous date on rejection).
export const notAfterToday = (iso) => !iso || iso <= toISODate(new Date());

export const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

// 1st through last day of the month containing `ofDate`.
export const monthRange = (ofDate = new Date()) => ({
  from: toISODate(new Date(ofDate.getFullYear(), ofDate.getMonth(), 1)),
  to: toISODate(new Date(ofDate.getFullYear(), ofDate.getMonth() + 1, 0)),
});

// Whole days from `from` to `to`, inclusive (minimum 1).
export const daySpan = (from, to) => {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
};

// Analytics period picker (default = first entry). A rolling 30-day window
// leads because it is always complete regardless of the day of the month;
// "last_7_days" is intentionally not offered here (too sparse to chart) —
// resolveRange still understands it, and Custom Range covers it.
export const RANGE_PRESETS = [
  { key: "last_30_days", label: "Last 30 Days" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "all", label: "All Time" },
  { key: "custom", label: "Custom Range" },
];

// Compact list-filter preset set (the "Date" dropdown shared by the
// All Reports / Audit Trail filter rows). Resolved by resolveRange below.
export const DATE_FILTER_PRESETS = [
  { key: "today", label: "Today" },
  { key: "last_7_days", label: "Last 7 Days" },
  { key: "this_month", label: "This Month" },
  { key: "all", label: "All Time" },
  { key: "custom", label: "Custom Range" },
];

// Resolve a preset key into an inclusive ISO date range, evaluated at request
// time so ranges stay correct across day/month boundaries. The optional
// `custom` bounds are only read for the "custom" preset ("" = unbounded,
// mirroring OperationsDashboard's CUSTOM date mode).
export const resolveRange = (preset, now = new Date(), custom = {}) => {
  const today = toISODate(now);
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "custom":
      return { from: custom.from || "", to: custom.to || "" };
    case "last_month": {
      // Day 1 of the previous month through its last day.
      const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        from: toISODate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: toISODate(new Date(firstThisMonth.getTime() - 86400000)),
      };
    }
    case "last_7_days":
      return { from: toISODate(addDays(now, -6)), to: today };
    case "last_30_days":
      return { from: toISODate(addDays(now, -29)), to: today };
    case "all":
      return { from: "", to: "" };
    case "this_month": {
      // Clamped to today: the volume chart must not show a dead zero-tail for
      // the rest of the month.
      const range = monthRange(now);
      const today = toISODate(now);
      return { from: range.from, to: today < range.to ? today : range.to };
    }
    default:
      return monthRange(now);
  }
};

const lastDayOfMonth = (year, month) => new Date(year, month + 1, 0).getDate();

// The comparison window for a range:
//  - Month-aligned ranges (starting on the 1st — "This Month"/"Last Month")
//    shift both bounds back one calendar month, so Oct 1–18 reads vs Sep 1–18
//    and a full month maps to the full previous month.
//  - Everything else shifts back by an equal number of days.
// Returns null for unbounded ranges.
export const previousPeriod = (range) => {
  if (!range?.from || !range?.to) return null;
  const start = new Date(`${range.from}T00:00:00`);
  const end = new Date(`${range.to}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  if (start.getDate() === 1) {
    const endYear = end.getFullYear();
    const endMonth = end.getMonth();
    const endIsMonthEnd = end.getDate() === lastDayOfMonth(endYear, endMonth);
    const shiftedStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
    const shiftedEnd = endIsMonthEnd && endMonth === start.getMonth()
      ? new Date(endYear, endMonth, 0) // day 0 of the start month = its previous month's last day
      : new Date(endYear, endMonth - 1, Math.min(end.getDate(), lastDayOfMonth(endYear, endMonth - 1)));
    return { from: toISODate(shiftedStart), to: toISODate(shiftedEnd) };
  }

  const span = daySpan(range.from, range.to);
  if (!span) return null;
  // Equal-length window ending the day BEFORE the current range starts, so
  // the two windows never overlap.
  const prevTo = addDays(start, -1);
  const prevFrom = addDays(prevTo, -(span - 1));
  return { from: toISODate(prevFrom), to: toISODate(prevTo) };
};

// "Oct 1 – Oct 18, 2026" (same-year ranges drop the trailing year on the
// first bound); "All Time" for unbounded ranges.
export const formatRange = (range) => {
  if (!range?.from || !range?.to) return "All Time";
  const opts = { month: "short", day: "numeric" };
  const start = new Date(`${range.from}T00:00:00`);
  const end = new Date(`${range.to}T00:00:00`);
  const startLabel = start.toLocaleDateString("en-US", start.getFullYear() === end.getFullYear() ? opts : { ...opts, year: "numeric" });
  const endLabel = end.toLocaleDateString("en-US", { ...opts, year: "numeric" });
  return `${startLabel} – ${endLabel}`;
};
