import { addDays, daySpan, toISODate } from "./dates";
import { round1 } from "./format";

const isoDay = (iso) => new Date(`${iso}T00:00:00`);

const shortDate = (iso) =>
  isoDay(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// Daily buckets are readable up to ~6 weeks; beyond that the chart folds into
// 7-day chunks anchored at the range start.
export const granularityFor = (bounds) => {
  const span = bounds?.from && bounds?.to ? daySpan(bounds.from, bounds.to) : null;
  return span && span > 42 ? "week" : "day";
};

// Zero-filled [{ date, label, count }] series over `bounds` from the server's
// per-day intake counts (GET /analytics/overview/ -> intake.daily). Day
// granularity indexes one bucket per day; week granularity floors each date
// into its 7-day chunk so mid-week counts land in the right bar.
export const zeroFillDaily = (daily = [], bounds, granularity = "day") => {
  if (!bounds?.from || !bounds?.to) return [];
  const step = granularity === "week" ? 7 : 1;
  const end = isoDay(bounds.to);
  let cursor = isoDay(bounds.from);
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(end.getTime()) || cursor > end) return [];

  const buckets = [];
  while (cursor <= end) {
    const date = toISODate(cursor);
    buckets.push({ date, label: shortDate(date), count: 0 });
    cursor = addDays(cursor, step);
  }

  for (const point of daily) {
    const count = Number(point?.count || 0);
    if (!point?.date || count <= 0) continue;
    const span = daySpan(bounds.from, point.date);
    if (span === null) continue;
    // Dates outside the window (clock skew) clamp to the edge bucket.
    const index = Math.min(buckets.length - 1, Math.max(0, Math.floor((span - 1) / step)));
    buckets[index].count += count;
  }

  if (granularity === "week") {
    return buckets.map((bucket) => {
      const weekEnd = addDays(isoDay(bucket.date), 6);
      const clamped = weekEnd > end ? end : weekEnd;
      return { ...bucket, label: `${shortDate(bucket.date)} – ${shortDate(toISODate(clamped))}` };
    });
  }
  return buckets;
};

// Days whose volume sits more than 2σ above the series mean (or double the
// mean for a flat series), with at least 3 reports so quiet periods don't
// produce noise. -> [{ date, label, count, ratio }] sorted by ratio desc.
export const detectSpikes = (buckets) => {
  if (buckets.length < 4) return [];
  const counts = buckets.map((b) => b.count);
  const mean = counts.reduce((sum, c) => sum + c, 0) / counts.length;
  if (mean <= 0) return [];
  const variance = counts.reduce((sum, c) => sum + (c - mean) ** 2, 0) / counts.length;
  const std = Math.sqrt(variance);
  const threshold = std > 0 ? mean + 2 * std : mean * 2;

  return buckets
    .filter((b) => b.count >= 3 && b.count > threshold)
    .map((b) => ({ ...b, ratio: round1(b.count / mean) }))
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 4);
};

// Period-over-period delta as a percentage. Null when either side is missing
// or the baseline is 0 (a % change from nothing is meaningless).
export const pctDelta = (current, previous) => {
  if (current === null || current === undefined || previous === null || previous === undefined) return null;
  const base = Number(previous);
  if (base === 0) return Number(current) === 0 ? 0 : null;
  return ((Number(current) - base) / base) * 100;
};

// Percentage-point delta (for rates like SLA compliance).
export const ppDelta = (current, previous) => {
  if (current === null || current === undefined || previous === null || previous === undefined) return null;
  return Number(current) - Number(previous);
};

// KPI value formatting: "—" | "5.3d" | "11h" (durations), "87%" (rates).
export const formatDays = (days) => {
  if (days === null || days === undefined) return "—";
  if (days < 1) return `${Math.max(1, Math.round(days * 24))}h`;
  return `${days.toFixed(1)}d`;
};

export const formatPct = (value) =>
  value === null || value === undefined ? "—" : `${Math.round(value)}%`;
