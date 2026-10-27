import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import {
  ActivityIcon,
  AlertIcon,
  BarsIcon,
  ClipboardIcon,
  ClockIcon,
  DiamondIcon,
  ListIcon,
  RefreshIcon,
  ShieldIcon,
  TimerIcon,
} from "../../../components/shared/icons";
import { getAnalyticsOverview, getHandlerWorkload } from "../../../api/analytics";
import { getReports } from "../../../api/reports";
import { REPORT_STATUSES } from "../../../hooks/useStatusCounts";
import { usePermissions } from "../../../hooks/usePermissions";
import { useAuth } from "../../../context/authContext";
import { formatDate, round1 } from "../../../utils/format";
import { formatDueDate, slaBadge } from "../../../utils/sla";
import { RANGE_PRESETS, addDays, formatRange, notAfterToday, previousPeriod, resolveRange, toISODate } from "../../../utils/dates";
import {
  detectSpikes,
  formatDays,
  formatPct,
  granularityFor,
  pctDelta,
  ppDelta,
  zeroFillDaily,
} from "../../../utils/analytics";
import "./Analytics.css";

const SEVERITY_ORDER = ["P1", "P2", "P3", "P4", "P5"];
const SEVERITY_COLORS = { P1: "#dc2626", P2: "#f97316", P3: "#ef4444", P4: "#3b82f6", P5: "#94a3b8" };
const STATUS_COLORS = {
  new: "#0369a1",
  assigned: "#4338ca",
  under_review: "#7e22ce",
  on_hold: "#b45309",
  dispatched: "#0e7490",
  ongoing: "#1d4ed4",
  resolved: "#15803d",
  closed: "#334155",
  invalid: "#9f1239",
};
const STATUS_LABELS = {
  new: "New",
  assigned: "Assigned",
  under_review: "Under Review",
  on_hold: "On-Hold",
  dispatched: "Dispatched",
  ongoing: "Ongoing",
  resolved: "Resolved",
  closed: "Closed",
  invalid: "Invalid",
};
const OPEN_STATUSES = REPORT_STATUSES.filter((s) => !["resolved", "closed", "invalid"].includes(s));

const fmtDay = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
const shortDay = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
// Server weekly buckets carry a Monday week_start; label the full span.
const weekLabel = (iso) => `${shortDay(iso)} – ${shortDay(toISODate(addDays(new Date(`${iso}T00:00:00`), 6)))}`;

// Inclusive FROM/TO bounds: the From day starts at 00:00:00.000 (>=) and the
// To day runs through 23:59:59.999 (<=), so both endpoint days count in full.
const rangeStart = (iso) => (iso ? new Date(`${iso}T00:00:00.000`) : null);
const rangeEnd = (iso) => (iso ? new Date(`${iso}T23:59:59.999`) : null);

// Inclusive containment test for a YYYY-MM-DD day or a full ISO timestamp
// against those bounds (null bound = unbounded on that side).
const withinRange = (value, start, end) => {
  if (!value) return false;
  const stamp = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000` : value;
  const ts = new Date(stamp);
  if (Number.isNaN(ts.getTime())) return false;
  return (!start || ts >= start) && (!end || ts <= end);
};

// One page of the live Open Past SLA list (staff-only filter server-side).
const OVERDUE_LIMIT = 6;

/* ===== Small building blocks ===== */
function DeltaChip({ value, unit = "%", goodDirection = "up" }) {
  if (value === null || value === undefined) return null;
  const rounded = round1(value);
  const flat = Math.abs(rounded) < 0.05;
  const up = rounded > 0;
  const good = goodDirection === "neutral" ? null : goodDirection === "up" ? up : !up;
  const tone = flat || good === null ? "flat" : good ? "good" : "bad";
  const arrow = flat ? "→" : up ? "▲" : "▼";
  const magnitude = Math.abs(rounded);
  const text = magnitude % 1 === 0 ? String(magnitude) : magnitude.toFixed(1);
  return (
    <span className={`an-delta an-delta-${tone}`} title={`${value > 0 ? "+" : ""}${round1(value)}${unit} vs previous period`}>
      {arrow} {text}{unit}
    </span>
  );
}

function PanelHead({ icon, tone, title, sub, action }) {
  return (
    <div className="an-panel-head">
      <div className="an-panel-heading">
        <span className={`an-panel-icon an-tone-${tone}`}>{icon}</span>
        <div>
          <h3 className="an-panel-title">{title}</h3>
          {sub && <p className="an-panel-sub">{sub}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function Skeleton({ height = 16 }) {
  return <div className="an-skeleton" style={{ height }} />;
}

function VolumeTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload || {};
  return (
    <div className="an-tooltip">
      <strong>{row.date ? fmtDay(row.date) : label}</strong>
      <span>
        {payload[0]?.name}: <b>{payload[0]?.value ?? "—"}</b>
      </span>
    </div>
  );
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload || {};
  return (
    <div className="an-tooltip">
      <strong>{row.label || label}</strong>
      <span>
        {formatDays(row.avgDays)} avg · {row.resolved} resolved
      </span>
    </div>
  );
}

function WorkloadTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload || {};
  const total = (row.resolved || 0) + (row.open || 0);
  return (
    <div className="an-tooltip">
      <strong>{row.handler_name || label}</strong>
      <span>
        {row.resolved} resolved · {row.open} open · {total} handled
      </span>
    </div>
  );
}

export default function Analytics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  // All widgets come from GET /analytics/overview/, scoped server-side the
  // same way as report reads — the badge tells them which set they're seeing.
  const { analyticsScope } = usePermissions();
  const isStaff = Boolean(user?.is_staff);
  const [preset, setPreset] = useState("last_30_days");
  // Custom Range bounds — prefilled to the default rolling 30-day window so
  // picking "Custom Range" keeps a meaningful window instead of dropping to
  // All Time.
  const [customFrom, setCustomFrom] = useState(() => toISODate(addDays(new Date(), -29)));
  const [customTo, setCustomTo] = useState(() => toISODate(new Date()));
  const [reloadKey, setReloadKey] = useState(0);
  const [overview, setOverview] = useState(null);
  const [prevOverview, setPrevOverview] = useState(null);
  const [overdue, setOverdue] = useState({ rows: [], count: 0, error: "" });
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [prevError, setPrevError] = useState("");
  const [workload, setWorkload] = useState(null);
  const [workloadError, setWorkloadError] = useState("");

  const range = useMemo(
    () => resolveRange(preset, new Date(), { from: customFrom, to: customTo }),
    [preset, customFrom, customTo]
  );
  const prevRange = useMemo(() => previousPeriod(range), [range]);

  useEffect(() => {
    let cancelled = false;
    const activeRange = resolveRange(preset, new Date(), { from: customFrom, to: customTo });
    const activePrevRange = previousPeriod(activeRange);

    (async () => {
      setLoading(true);
      setDataError("");
      setPrevError("");
      setWorkloadError("");
      const results = await Promise.allSettled([
        getAnalyticsOverview(activeRange),
        activePrevRange ? getAnalyticsOverview(activePrevRange) : Promise.resolve(null),
        // `overdue=true` is staff-only server-side; the panel is gated on it.
        isStaff
          ? getReports({ overdue: true, exclude_closed: false, page: 1, page_size: OVERDUE_LIMIT })
          : Promise.resolve(null),
        getHandlerWorkload({ from: activeRange.from, to: activeRange.to }),
      ]);
      if (cancelled) return;

      if (results[0].status === "fulfilled") {
        setOverview(results[0].value);
      } else {
        setOverview(null);
        const err = results[0].reason;
        setDataError(err?.detail || err?.message || "Unable to load analytics for this period.");
      }

      if (results[1].status === "fulfilled") {
        setPrevOverview(results[1].value);
      } else if (activePrevRange) {
        setPrevOverview(null);
        setPrevError("Previous-period comparison is unavailable right now.");
      }

      if (results[2].status === "fulfilled") {
        const payload = results[2].value || {};
        setOverdue({ rows: payload.results || [], count: payload.count ?? 0, error: "" });
      } else if (isStaff) {
        const err = results[2].reason;
        setOverdue({ rows: [], count: 0, error: err?.detail || err?.message || "Past-SLA list unavailable right now." });
      }

      if (results[3].status === "fulfilled") {
        setWorkload(results[3].value);
      } else {
        setWorkload(null);
        const err = results[3].reason;
        setWorkloadError(err?.detail || err?.message || "Unable to load handler workload.");
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [preset, customFrom, customTo, reloadKey, isStaff]);

  /* ===== Derived series & stats ===== */
  // Bounded selections fill the exact period; All Time falls back to the
  // span of intake the server actually saw.
  const bounds = useMemo(() => {
    if (range.from && range.to) return range;
    if (overview?.span?.from && overview?.span?.to) return overview.span;
    return { from: "", to: "" };
  }, [range, overview]);
  const granularity = useMemo(() => granularityFor(bounds), [bounds]);
  // Server intake days trimmed to the inclusive FROM/TO window (From 00:00:00
  // → To 23:59:59.999) so stray out-of-window days are dropped instead of
  // being clamped into the edge bars by zeroFillDaily.
  const intakeDaily = useMemo(() => {
    const daily = overview?.intake?.daily || [];
    if (!range.from || !range.to) return daily;
    const start = rangeStart(range.from);
    const end = rangeEnd(range.to);
    return daily.filter((point) => withinRange(point?.date, start, end));
  }, [overview, range]);
  const currentSeries = useMemo(
    () => zeroFillDaily(intakeDaily, bounds, granularity),
    [intakeDaily, bounds, granularity]
  );
  const spikes = useMemo(() => detectSpikes(currentSeries), [currentSeries]);

  const sevCounts = useMemo(() => overview?.intake?.by_severity || {}, [overview]);
  const statusMixRaw = useMemo(() => overview?.intake?.by_status || {}, [overview]);
  const delivery = overview?.delivery;
  const sla = overview?.sla;
  const prevDelivery = prevOverview?.delivery;
  const prevSla = prevOverview?.sla;
  const overdueList = overdue.rows;
  // Resolved-in-period rows re-checked against the same inclusive bounds so a
  // resolved_at that falls outside From 00:00:00 – To 23:59:59.999 never shows.
  const slowest = useMemo(() => {
    const rows = delivery?.slowest || [];
    if (!rows.length || !range.from || !range.to) return rows;
    const start = rangeStart(range.from);
    const end = rangeEnd(range.to);
    return rows.filter((row) => withinRange(row?.resolved_at, start, end));
  }, [delivery, range]);
  // Same granularity as the volume chart: short ranges chart daily points
  // (weekly buckets would collapse to a single dot), long ones go weekly.
  const trend = useMemo(() => {
    if (!delivery) return [];
    return granularity === "day"
      ? (delivery.daily || []).map((point) => ({
          label: shortDay(point.date),
          avgDays: point.avg_days,
          resolved: point.resolved,
        }))
      : (delivery.weekly || []).map((week) => ({
          label: weekLabel(week.week_start),
          avgDays: week.avg_days,
          resolved: week.resolved,
        }));
  }, [delivery, granularity]);

  const severityData = useMemo(
    () => SEVERITY_ORDER.map((s) => ({ severity: s, count: sevCounts[s], fill: SEVERITY_COLORS[s] })),
    [sevCounts]
  );
  const statusMixData = useMemo(() => {
    const toRow = (status) => ({
      status,
      label: STATUS_LABELS[status] || status,
      count: statusMixRaw[status] || 0,
      fill: STATUS_COLORS[status] || "#64748b",
    });
    const open = OPEN_STATUSES.map(toRow).filter((row) => row.count > 0);
    if (open.length) return open;
    return ["resolved", "closed", "invalid"].map(toRow).filter((row) => row.count > 0);
  }, [statusMixRaw]);

  const slaPct = sla?.on_time_pct ?? null;
  const prevSlaPct = prevSla?.on_time_pct ?? null;

  // Workload roster (alphabetical server-side) plus the stack split the
  // "Reports per Handler" chart draws: resolved vs what is still open.
  const workloadRows = workload?.handlers || [];
  const workloadChart = workloadRows.map((row) => ({
    handler_name: row.handler_name,
    resolved: row.resolved || 0,
    open: Math.max(0, (row.handled || 0) - (row.resolved || 0)),
  }));

  const volumeDelta =
    overview && prevOverview && !prevError
      ? (overview.intake.total ?? 0) - (prevOverview.intake.total ?? 0)
      : null;
  const avgPerBucket = currentSeries.length
    ? round1(currentSeries.reduce((sum, b) => sum + b.count, 0) / currentSeries.length)
    : 0;

  const totalDelta = pctDelta(overview?.intake?.total ?? null, prevOverview?.intake?.total ?? null);
  const avgDelta = pctDelta(delivery?.avg_days ?? null, prevDelivery?.avg_days ?? null);
  const slaDelta = ppDelta(slaPct, prevSlaPct);
  const slaTone = slaPct === null ? "muted" : slaPct >= 90 ? "good" : slaPct >= 75 ? "warn" : "bad";

  // Drill-downs keep the selected period so the Operations table matches the
  // chart. The overdue list is a live state (any creation date), so it does not.
  const operationsHref = (extra = {}) => {
    const params = new URLSearchParams();
    if (range.from && range.to) {
      params.set("from", range.from);
      params.set("to", range.to);
    }
    for (const [key, value] of Object.entries(extra)) {
      if (value) params.set(key, String(value));
      else params.delete(key);
    }
    const query = params.toString();
    return `/dashboard/operations${query ? `?${query}` : ""}`;
  };

  return (
    <DashboardLayout title="Operations Dashboard">
      <div className="an-page">
        <div className="section-header an-header">
          <div className="an-header-text">
            <h2 className="section-title">
              Analytics
              <span className={`scope-badge scope-${analyticsScope}`}>
                {analyticsScope === "assigned"
                  ? "My assigned reports"
                  : analyticsScope === "own"
                    ? "My submitted reports"
                    : "System-wide"}
              </span>
            </h2>
            <p className="section-subtitle">
              Actionable hazard-report insights for {formatRange(range)}
              {prevRange ? ` vs ${formatRange(prevRange)}` : ""}.
            </p>
          </div>
          <div className="an-header-actions">
            <label className="an-range">
              <span>Period</span>
              <select value={preset} onChange={(e) => setPreset(e.target.value)}>
                {RANGE_PRESETS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {preset === "custom" && (
              <div className="an-range-custom">
                <span>From</span>
                <input
                  type="date"
                  value={customFrom}
                  max={toISODate(new Date())}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!notAfterToday(value)) return;
                    setCustomFrom(value);
                    // A From past the To moves the To with it so the window
                    // stays a valid inclusive From → To range.
                    if (value && customTo && value > customTo) setCustomTo(value);
                  }}
                />
                <span>to</span>
                <input
                  type="date"
                  value={customTo}
                  max={toISODate(new Date())}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!notAfterToday(value)) return;
                    setCustomTo(value);
                    if (value && customFrom && value < customFrom) setCustomFrom(value);
                  }}
                />
              </div>
            )}
            <button type="button" className="an-refresh" onClick={() => setReloadKey((key) => key + 1)}>
              <RefreshIcon /> Refresh
            </button>
          </div>
        </div>

        {dataError && (
          <div className="an-error" role="alert">
            {typeof dataError === "string" ? dataError : JSON.stringify(dataError)}
          </div>
        )}

        {/* Compact KPI summary bar */}
        <div className="an-kpi-bar">
          <div className="an-kpi">
            <span className="an-kpi-icon an-tone-indigo"><ClipboardIcon /></span>
            <div className="an-kpi-body">
              <span className="an-kpi-label">Total Reports</span>
              <div className="an-kpi-value-row">
                <strong className="an-kpi-value">{loading ? "—" : (overview?.intake?.total ?? "—")}</strong>
                {!loading && <DeltaChip value={totalDelta} unit="%" goodDirection="neutral" />}
              </div>
              <span className="an-kpi-hint">Filed in the selected period</span>
            </div>
          </div>

          <div className="an-kpi">
            <span className="an-kpi-icon an-tone-cyan"><ClockIcon /></span>
            <div className="an-kpi-body">
              <span className="an-kpi-label">Avg Resolution Time</span>
              <div className="an-kpi-value-row">
                <strong className="an-kpi-value">{loading ? "—" : formatDays(delivery?.avg_days)}</strong>
                {!loading && <DeltaChip value={avgDelta} unit="%" goodDirection="down" />}
              </div>
              <span className="an-kpi-hint">
                {delivery?.resolved
                  ? `across ${delivery.resolved} resolved${
                      typeof prevDelivery?.avg_days === "number" ? ` · prev ${formatDays(prevDelivery.avg_days)}` : ""
                    }`
                  : "No resolved reports in period"}
              </span>
            </div>
          </div>

          <div className="an-kpi">
            <span className={`an-kpi-icon an-tone-${slaTone === "good" ? "green" : slaTone === "warn" ? "amber" : slaTone === "bad" ? "red" : "slate"}`}>
              <ShieldIcon />
            </span>
            <div className="an-kpi-body">
              <span className="an-kpi-label">SLA Compliance</span>
              <div className="an-kpi-value-row">
                <strong className={`an-kpi-value an-value-${slaTone}`}>{loading ? "—" : formatPct(slaPct)}</strong>
                {!loading && <DeltaChip value={slaDelta} unit="pp" goodDirection="up" />}
              </div>
              <span className="an-kpi-hint">
                {sla && (sla.judged || sla.pending)
                  ? `${sla.on_time} on time · ${sla.late} late · ${sla.breach} open past due · ${sla.pending} pending`
                  : "No reports fall due in this period"}
              </span>
            </div>
          </div>

          <div className="an-kpi an-kpi-severity">
            <span className="an-kpi-icon an-tone-red"><DiamondIcon size={15} /></span>
            <div className="an-kpi-body">
              <span className="an-kpi-label">Severity Breakdown</span>
              <div className="an-sev-row">
                {SEVERITY_ORDER.map((level) => (
                  <Link
                    key={level}
                    to={operationsHref({ severity: level })}
                    className={`an-sev-chip an-sev-${level.toLowerCase()}`}
                    title={`View ${level} reports in Operations`}
                  >
                    <span>{level}</span>
                    <strong>{sevCounts[level]}</strong>
                  </Link>
                ))}
              </div>
              <span className="an-kpi-hint">Click a level to drill down</span>
            </div>
          </div>
        </div>

        <div className="an-grid">
          {/* ===== Report volume ===== */}
          <section className="an-panel an-wide">
            <PanelHead
              icon={<BarsIcon />}
              tone="indigo"
              title="Report Volume"
              sub={`Reports per ${granularity === "week" ? "week" : "day"}`}
              action={<Link to={operationsHref({})} className="an-panel-link">View these reports →</Link>}
            />
            {prevError && <p className="an-note an-note-warn">{prevError}</p>}
            {loading ? (
              <Skeleton height={250} />
            ) : dataError ? (
              <p className="an-empty">{dataError}</p>
            ) : currentSeries.length ? (
              <>
                <div className="an-volume-summary">
                  <p className="an-volume-total">{overview?.intake?.total ?? currentSeries.reduce((sum, b) => sum + b.count, 0)} reports received</p>
                  {volumeDelta !== null && (
                    <p className={`an-volume-delta ${volumeDelta > 0 ? "up" : volumeDelta < 0 ? "down" : "flat"}`}>
                      {volumeDelta > 0 ? `↑ +${volumeDelta}` : volumeDelta < 0 ? `↓ ${volumeDelta}` : "→ 0"} compared to
                      previous period
                    </p>
                  )}
                </div>
                <div className="an-chart">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={currentSeries} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={{ stroke: "#e2e8f0" }}
                        interval="preserveStartEnd"
                        minTickGap={22}
                      />
                      <YAxis hide allowDecimals={false} />
                      <Tooltip content={<VolumeTooltip />} cursor={{ fill: "rgba(15,23,42,.04)" }} />
                      <Bar dataKey="count" name="Reports" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <p className="an-empty">No reports were filed in this period.</p>
            )}
          </section>

          {/* ===== Severity distribution ===== */}
          <section className="an-panel">
            <PanelHead
              icon={<DiamondIcon size={15} />}
              tone="red"
              title="Severity Distribution"
              sub="Reports filed in period — click a bar to drill down"
            />
            {loading ? (
              <Skeleton height={190} />
            ) : severityData.some((row) => row.count > 0) ? (
              <div className="an-chart">
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={severityData} layout="vertical" margin={{ top: 4, right: 34, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f7" />
                    <XAxis type="number" hide allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="severity"
                      width={34}
                      tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip cursor={{ fill: "rgba(15,23,42,.04)" }} />
                    <Bar
                      dataKey="count"
                      name="Reports"
                      barSize={16}
                      radius={[0, 6, 6, 0]}
                      cursor="pointer"
                      onClick={(item) => {
                        const level = item?.payload?.severity;
                        if (level) navigate(operationsHref({ severity: level }));
                      }}
                    >
                      {severityData.map((row) => (
                        <Cell key={row.severity} fill={row.fill} />
                      ))}
                      <LabelList dataKey="count" position="right" style={{ fontSize: 11, fontWeight: 700, fill: "#334155" }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="an-empty">No severity-tagged reports in this period.</p>
            )}
          </section>

          {/* ===== Open status mix ===== */}
          <section className="an-panel">
            <PanelHead
              icon={<ListIcon />}
              tone="blue"
              title="Status Mix"
              sub="Where reports sit in the workflow — click a bar to drill down"
            />
            {loading ? (
              <Skeleton height={190} />
            ) : statusMixData.length ? (
              <div className="an-chart">
                <ResponsiveContainer width="100%" height={Math.max(150, statusMixData.length * 34)}>
                  <BarChart data={statusMixData} layout="vertical" margin={{ top: 4, right: 34, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f7" />
                    <XAxis type="number" hide allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={100}
                      tick={{ fontSize: 10.5, fill: "#64748b" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip cursor={{ fill: "rgba(15,23,42,.04)" }} />
                    <Bar
                      dataKey="count"
                      name="Reports"
                      barSize={14}
                      radius={[0, 6, 6, 0]}
                      cursor="pointer"
                      onClick={(item) => {
                        const status = item?.payload?.status;
                        if (status) navigate(operationsHref({ status }));
                      }}
                    >
                      {statusMixData.map((row) => (
                        <Cell key={row.status} fill={row.fill} />
                      ))}
                      <LabelList dataKey="count" position="right" style={{ fontSize: 11, fontWeight: 700, fill: "#334155" }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="an-empty">No reports in this period.</p>
            )}
          </section>

          {/* ===== Resolution time trend ===== */}
          <section className="an-panel">
            <PanelHead
              icon={<ActivityIcon />}
              tone="cyan"
              title="Resolution Time Trend"
              sub={`${granularity === "week" ? "Weekly" : "Daily"} average of created → resolved`}
            />
            {loading ? (
              <Skeleton height={190} />
            ) : trend.length ? (
              <div className="an-chart">
                <ResponsiveContainer width="100%" height={190}>
                  <LineChart data={trend} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                      minTickGap={18}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                      width={40}
                      tickFormatter={(value) => `${value}d`}
                    />
                    <Tooltip content={<TrendTooltip />} cursor={{ stroke: "#cbd5e1" }} />
                    <Line
                      type="monotone"
                      dataKey="avgDays"
                      name="Avg resolution"
                      stroke="#0e7490"
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: "#0e7490" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="an-empty">
                {delivery?.resolved
                  ? "Not enough resolved reports to chart a trend yet."
                  : "Resolution trends appear once reports resolve in this period."}
              </p>
            )}
          </section>

          {/* ===== Anomalies & spikes ===== */}
          <section className="an-panel">
            <PanelHead
              icon={<AlertIcon size={16} />}
              tone="amber"
              title="Report Surges"
              sub="Sudden jumps in report volume"
            />
            {loading ? (
              <Skeleton height={120} />
            ) : spikes.length ? (
              <ul className="an-spike-list">
                {spikes.map((spike) => (
                  <li className="an-spike" key={spike.date}>
                    <span className="an-spike-badge"><AlertIcon size={16} /></span>
                    <div className="an-spike-body">
                      <strong>
                        {fmtDay(spike.date)} — {spike.count} report{spike.count === 1 ? "" : "s"}
                      </strong>
                      <span>
                        {spike.ratio}× the period average of {avgPerBucket} per{" "}
                        {granularity === "week" ? "week" : "day"}.
                      </span>
                    </div>
                    <Link className="an-spike-link" to={operationsHref({ from: spike.date, to: spike.date })}>
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="an-empty an-empty-good">
                {currentSeries.length >= 4
                  ? "No volume spikes detected — intake is within its typical range."
                  : "Not enough days in this period to detect spikes."}
              </p>
            )}
          </section>

          {/* ===== Open past SLA (staff-only: overdue=true is popped for others) ===== */}
          {isStaff && (
            <section className="an-panel">
              <PanelHead
                icon={<ClockIcon />}
                tone="red"
                title="Open Past SLA"
                sub="Live list of open reports past their due dates"
                action={
                  <Link to="/dashboard/operations?overdue=true" className="an-panel-link">
                    View all overdue →
                  </Link>
                }
              />
              {loading ? (
                <Skeleton height={120} />
              ) : overdue.error ? (
                <p className="an-empty">{overdue.error}</p>
              ) : overdueList.length ? (
                <>
                  <div className="an-table-wrap">
                    <table className="an-table">
                      <thead>
                        <tr>
                          <th>REPORT</th>
                          <th>CATEGORY</th>
                          <th>SEV</th>
                          <th>DUE</th>
                          <th>SLA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overdueList.map((report) => {
                          const sla = slaBadge(report);
                          return (
                            <tr key={report.report_number}>
                              <td className="an-report-no" title={report.report_number}>{report.report_number}</td>
                              <td className="an-cell-truncate" title={report.category || ""}>{report.category}</td>
                              <td>
                                <span className={`severity-badge severity-${String(report.severity || "").toLowerCase()}`}>
                                  {report.severity || "—"}
                                </span>
                              </td>
                              <td>{formatDueDate(report.due_at)}</td>
                              <td>
                                <span className={`sla-badge sla-${sla.tone}`} title={`Due ${formatDueDate(report.due_at)}`}>
                                  {sla.text}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {overdue.count > overdueList.length && (
                    <p className="an-table-foot">
                      +{overdue.count - overdueList.length} more overdue in your scope —{" "}
                      <Link to="/dashboard/operations?overdue=true">view all</Link>
                    </p>
                  )}
                </>
              ) : (
                <p className="an-empty an-empty-good">All open reports are within their due dates.</p>
              )}
            </section>
          )}
          {/* ===== Slowest resolutions ===== */}
          <section className="an-panel">
            <PanelHead
              icon={<TimerIcon />}
              tone="purple"
              title="Slowest Resolutions"
              sub="Longest created → resolved durations in period"
              action={
                <Link to={operationsHref({ status: "resolved" })} className="an-panel-link">
                  View resolved →
                </Link>
              }
            />
            {loading ? (
              <Skeleton height={120} />
            ) : slowest.length ? (
              <div className="an-table-wrap">
                <table className="an-table">
                  <thead>
                    <tr>
                      <th>REPORT</th>
                      <th>CATEGORY</th>
                      <th>RESOLVED</th>
                      <th>DURATION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slowest.map((row) => (
                      <tr key={row.report_number}>
                        <td className="an-report-no" title={row.report_number}>{row.report_number}</td>
                        <td className="an-cell-truncate" title={row.category || ""}>{row.category}</td>
                        <td>{formatDate(row.resolved_at)}</td>
                        <td className="an-duration">{formatDays(row.days)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="an-empty">No resolved reports in this period yet.</p>
            )}
          </section>

          {/* ===== Handler workload (team view — counts, no ranking) ===== */}
          <section className="an-panel an-wide">
            <PanelHead
              icon={<ShieldIcon />}
              tone="green"
              title="Handler Workload"
              sub={`Reports due ${formatRange(range)} attributed to their current handler — Resolved counts those already closed.`}
            />
            {!workload ? (
              <p className="an-empty">{workloadError || "Loading workload..."}</p>
            ) : workloadRows.length === 0 ? (
              <p className="an-empty">No assigned reports fall due in this period.</p>
            ) : (
              <div className="workload-split">
                <div className="workload-chart-col">
                  <div className="wl-legend">
                    <span className="wl-legend-item"><i className="wl-dot wl-dot-resolved" />Resolved</span>
                    <span className="wl-legend-item"><i className="wl-dot wl-dot-open" />Still open</span>
                  </div>
                  <div className="workload-chart-wrap">
                    <ResponsiveContainer width="100%" height={Math.max(160, workloadChart.length * 34)}>
                      <BarChart data={workloadChart} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eef2f7" />
                        <XAxis type="number" hide allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="handler_name"
                          width={110}
                          tick={{ fontSize: 10.5, fill: "#64748b" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip content={<WorkloadTooltip />} cursor={{ fill: "rgba(15,23,42,.04)" }} />
                        <Bar dataKey="resolved" name="Resolved" stackId="load" fill="#15803d" barSize={16} />
                        <Bar dataKey="open" name="Still open" stackId="load" fill="#e2e8f0" barSize={16} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="workload-table-col">
                  <div className="workload-table-wrap">
                    <table className="workload-table">
                      <thead>
                        <tr>
                          <th>Handler</th>
                          <th>Handled</th>
                          <th>Resolved</th>
                          <th>Resolved %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workloadRows.map((row) => (
                          <tr key={row.user_number}>
                            <td>{row.handler_name}</td>
                            <td>{row.handled}</td>
                            <td>{row.resolved}</td>
                            <td>{row.handled ? `${round1((row.resolved / row.handled) * 100)}%` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
