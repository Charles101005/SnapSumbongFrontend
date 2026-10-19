import { getReports } from "../api/reports";
import { addDays, daySpan, toISODate } from "./dates";

// The reports endpoint caps page_size at 50 (backend max_page_size). Each
// Analytics window fetches at most MAX_PAGES pages so one range change can
// never turn into an unbounded request storm; totals still come from the
// authoritative `count` even when the rows are truncated.
const PAGE_SIZE = 50;
const MAX_PAGES = 20;

const CLOSED_PHASE = ["resolved", "closed", "invalid"];

// The list API returns status as a display label ("Under Review"); the app's
// filters and badge classes use the raw value (under_review).
export const normalizeStatus = (status) =>
  String(status || "").toLowerCase().replace(/[\s-]+/g, "_");

// Fetch every report row for an inclusive { from, to } range.
// -> { reports, total, truncated }
export const fetchAllReports = async ({ from = "", to = "" } = {}) => {
  const reports = [];
  let page = 1;
  let total = 0;
  let totalPages = 1;

  while (page <= MAX_PAGES) {
    const data = await getReports({
      from_date: from || undefined,
      to_date: to || undefined,
      exclude_closed: false,
      page,
      page_size: PAGE_SIZE,
    });
    total = Number(data.count || 0);
    totalPages = Math.max(1, Number(data.total_pages || 1));
    reports.push(...(data.results || []));
    if (page >= totalPages) break;
    page += 1;
  }

  return { reports, total, truncated: page < totalPages };
};

// Resolution duration in days (created_at -> resolved_at). Null when the
// report is unresolved or the timestamps are unusable/negative.
export const durationDays = (report) => {
  if (!report?.created_at || !report?.resolved_at) return null;
  const created = new Date(report.created_at);
  const resolved = new Date(report.resolved_at);
  if (Number.isNaN(created.getTime()) || Number.isNaN(resolved.getTime())) return null;
  const days = (resolved - created) / 86400000;
  return days >= 0 ? days : null;
};

const round1 = (value) => Math.round(value * 10) / 10;

// Average resolution duration + DO 47 SLA on-time rate over resolved reports.
// SLA = resolved_at <= due_at, measured only on reports that carry a due date.
// -> { resolvedCount, avgDays, slaPct, slaOnTime, slaTotal }
export const resolutionStats = (reports) => {
  const resolved = reports.filter((r) => r.resolved_at && r.created_at);
  const durations = resolved.map(durationDays).filter((d) => d !== null);
  const slaBound = resolved.filter((r) => r.due_at);
  const onTime = slaBound.filter((r) => new Date(r.resolved_at) <= new Date(r.due_at));

  return {
    resolvedCount: resolved.length,
    avgDays: durations.length ? round1(durations.reduce((sum, d) => sum + d, 0) / durations.length) : null,
    slaPct: slaBound.length ? Math.round((onTime.length / slaBound.length) * 100) : null,
    slaOnTime: onTime.length,
    slaTotal: slaBound.length,
  };
};

// -> { P1: n, ..., P5: n } (missing severities count as 0)
export const severityCounts = (reports) => {
  const counts = { P1: 0, P2: 0, P3: 0, P4: 0, P5: 0 };
  for (const report of reports) {
    const key = String(report.severity || "").toUpperCase();
    if (key in counts) counts[key] += 1;
  }
  return counts;
};

// -> { [raw status]: count } (display labels mapped back to raw values)
export const statusCounts = (reports) => {
  const counts = {};
  for (const report of reports) {
    const key = normalizeStatus(report.status);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
};

// Inclusive series bounds: the requested range, or the min/max created_at in
// the data when the range is unbounded ("All Time").
export const seriesBounds = (range, reports) => {
  if (range?.from && range?.to) return { from: range.from, to: range.to };
  const times = reports
    .map((r) => (r.created_at ? new Date(r.created_at).getTime() : NaN))
    .filter((t) => !Number.isNaN(t));
  if (!times.length) return { from: "", to: "" };
  return {
    from: toISODate(new Date(Math.min(...times))),
    to: toISODate(new Date(Math.max(...times))),
  };
};

// Daily buckets are readable up to ~6 weeks; beyond that the chart folds into
// 7-day chunks anchored at the range start.
export const granularityFor = (bounds) => {
  const span = bounds.from && bounds.to ? daySpan(bounds.from, bounds.to) : null;
  return span && span > 42 ? "week" : "day";
};

const shortDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// Zero-filled [{ date, label, count }] buckets over `bounds`, counting each
// report by its local created_at date.
export const bucketSeries = (reports, bounds, granularity = "day") => {
  if (!bounds.from || !bounds.to) return [];
  const buckets = [];
  const indexByDate = new Map();

  let cursor = new Date(`${bounds.from}T00:00:00`);
  const end = new Date(`${bounds.to}T00:00:00`);
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(end.getTime())) return [];

  while (cursor <= end) {
    const date = toISODate(cursor);
    const bucket = { date, label: shortDate(date), count: 0 };
    indexByDate.set(date, buckets.length);
    buckets.push(bucket);
    cursor = addDays(cursor, granularity === "week" ? 7 : 1);
  }

  for (const report of reports) {
    if (!report.created_at) continue;
    const when = new Date(report.created_at);
    if (Number.isNaN(when.getTime())) continue;
    const date = toISODate(when);
    let bucket = buckets[indexByDate.get(date)];
    if (!bucket) {
      // Created outside the zero-filled window (clock skew / open ranges):
      // snap it to the nearest chunk start so it still counts.
      if (date < bounds.from) bucket = buckets[0];
      else bucket = buckets[buckets.length - 1];
    }
    if (bucket) bucket.count += 1;
  }

  if (granularity === "week") {
    return buckets.map((bucket) => {
      const weekEnd = addDays(new Date(`${bucket.date}T00:00:00`), 6);
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

// Open reports past their DO 47 due date, most overdue first.
export const openOverdue = (reports) =>
  reports
    .filter((r) => r.is_overdue && !CLOSED_PHASE.includes(normalizeStatus(r.status)))
    .sort((a, b) => new Date(a.due_at || 0) - new Date(b.due_at || 0));

// Longest created_at -> resolved_at durations in the period.
export const slowestResolved = (reports, limit = 5) =>
  reports
    .map((report) => ({ report, days: durationDays(report) }))
    .filter((entry) => entry.days !== null)
    .sort((a, b) => b.days - a.days)
    .slice(0, limit);

// Weekly average resolution duration for reports resolved in the period.
// -> [{ date, label, avgDays, resolved }]
export const resolutionTrend = (reports, bounds) => {
  if (!bounds.from || !bounds.to) return [];
  const anchor = new Date(`${bounds.from}T00:00:00`);
  const groups = new Map();

  for (const report of reports) {
    const days = durationDays(report);
    if (days === null) continue;
    const resolved = new Date(report.resolved_at);
    const weekStart = addDays(anchor, Math.floor((new Date(resolved.getFullYear(), resolved.getMonth(), resolved.getDate()) - anchor) / 86400000 / 7) * 7);
    const key = toISODate(weekStart);
    const group = groups.get(key) || { sum: 0, count: 0 };
    group.sum += days;
    group.count += 1;
    groups.set(key, group);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, group]) => ({
      date,
      label: shortDate(date),
      avgDays: round1(group.sum / group.count),
      resolved: group.count,
    }));
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
