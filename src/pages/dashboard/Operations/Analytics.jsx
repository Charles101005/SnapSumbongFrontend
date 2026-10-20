import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import { getHandlerCompliance } from "../../../api/analytics";
import { REPORT_STATUSES } from "../../../hooks/useStatusCounts";
import { formatDate } from "../../../utils/format";
import { formatDueDate, slaBadge } from "../../../utils/sla";
import { RANGE_PRESETS, formatRange, previousPeriod, resolveRange } from "../../../utils/dates";
import {
  bucketSeries,
  detectSpikes,
  fetchAllReports,
  formatDays,
  formatPct,
  granularityFor,
  openOverdue,
  pctDelta,
  ppDelta,
  resolutionStats,
  resolutionTrend,
  seriesBounds,
  severityCounts,
  slowestResolved,
  statusCounts,
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

const pct = (value) => (value === null || value === undefined ? "—" : `${value}%`);
const ratingSlug = (rating) => String(rating || "").toLowerCase().replace(/\s+/g, "-");
const fmtDay = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
const round1 = (value) => Math.round(value * 10) / 10;

/* ===== Icons (inline SVG — the app ships no icon package) ===== */
const ReportsIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>
);
const ClockIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></svg>
);
const ShieldIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
);
const DiamondIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 22 12 12 22 2 12z" /></svg>
);
const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
);
const RefreshIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
);
const BarsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
);
const ListIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
);
const ActivityIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
);
const TimerIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M9 2h6" /></svg>
);

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
      {payload
        .filter((item) => item.dataKey !== "spike")
        .map((item) => (
          <span key={item.dataKey}>
            {item.name}: <b>{item.value ?? "—"}</b>
          </span>
        ))}
      {row.spikeRatio ? <em>Spike — {row.spikeRatio}× typical volume</em> : null}
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

export default function Analytics() {
  const navigate = useNavigate();
  const [preset, setPreset] = useState("this_month");
  const [reloadKey, setReloadKey] = useState(0);
  const [current, setCurrent] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [prevError, setPrevError] = useState("");
  const [compliance, setCompliance] = useState(null);
  const [complianceNote, setComplianceNote] = useState("");

  const range = useMemo(() => resolveRange(preset), [preset]);
  const prevRange = useMemo(() => previousPeriod(range), [range]);

  useEffect(() => {
    let cancelled = false;
    const activeRange = resolveRange(preset);
    const activePrevRange = previousPeriod(activeRange);

    (async () => {
      setLoading(true);
      setDataError("");
      setPrevError("");
      const results = await Promise.allSettled([
        fetchAllReports(activeRange),
        activePrevRange ? fetchAllReports(activePrevRange) : Promise.resolve(null),
      ]);
      if (cancelled) return;

      if (results[0].status === "fulfilled") {
        setCurrent(results[0].value);
      } else {
        setCurrent(null);
        const err = results[0].reason;
        setDataError(err?.detail || err?.message || "Unable to load report data for this period.");
      }
      if (results[1].status === "fulfilled") {
        setPrevious(results[1].value);
      } else if (activePrevRange) {
        setPrevious(null);
        setPrevError("Previous-period comparison is unavailable right now.");
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [preset, reloadKey]);

  useEffect(() => {
    let cancelled = false;
    getHandlerCompliance()
      .then((data) => {
        if (!cancelled) setCompliance(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.status === 403) {
          setComplianceNote("Your role does not include handler-performance access — ask a Supervisor to review DO 47 compliance scores.");
        } else {
          setComplianceNote(err?.detail || err?.message || "Unable to load compliance metrics.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  /* ===== Derived series & stats ===== */
  const bounds = useMemo(
    () => (current ? seriesBounds(range, current.reports) : { from: "", to: "" }),
    [current, range]
  );
  const granularity = useMemo(() => granularityFor(bounds), [bounds]);
  const currentSeries = useMemo(
    () => (current ? bucketSeries(current.reports, bounds, granularity) : []),
    [current, bounds, granularity]
  );
  const prevSeries = useMemo(() => {
    if (!previous || !prevRange) return [];
    return bucketSeries(previous.reports, seriesBounds(prevRange, previous.reports), granularity);
  }, [previous, prevRange, granularity]);
  const spikes = useMemo(() => detectSpikes(currentSeries), [currentSeries]);
  const volumeData = useMemo(() => {
    const spikeByDate = new Map(spikes.map((s) => [s.date, s]));
    return currentSeries.map((bucket, index) => ({
      ...bucket,
      previous: prevSeries[index] ? prevSeries[index].count : null,
      spike: spikeByDate.has(bucket.date) ? bucket.count : null,
      spikeRatio: spikeByDate.get(bucket.date)?.ratio ?? null,
    }));
  }, [currentSeries, prevSeries, spikes]);

  const sevCounts = useMemo(() => severityCounts(current?.reports || []), [current]);
  const statusMixRaw = useMemo(() => statusCounts(current?.reports || []), [current]);
  const resolution = useMemo(() => resolutionStats(current?.reports || []), [current]);
  const prevResolution = useMemo(() => resolutionStats(previous?.reports || []), [previous]);
  const overdueList = useMemo(() => openOverdue(current?.reports || []), [current]);
  const slowest = useMemo(() => slowestResolved(current?.reports || [], 5), [current]);
  const trend = useMemo(() => (current ? resolutionTrend(current.reports, bounds) : []), [current, bounds]);

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

  const hasComparison = prevSeries.length > 0;
  const avgPerBucket = currentSeries.length
    ? round1(currentSeries.reduce((sum, b) => sum + b.count, 0) / currentSeries.length)
    : 0;

  const totalDelta = pctDelta(current?.total ?? null, previous?.total ?? null);
  const avgDelta = pctDelta(resolution.avgDays, prevResolution.avgDays);
  const slaDelta = ppDelta(resolution.slaPct, prevResolution.slaPct);
  const slaTone =
    resolution.slaPct === null ? "muted" : resolution.slaPct >= 90 ? "good" : resolution.slaPct >= 75 ? "warn" : "bad";

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

  const weights = compliance?.weights || {};

  return (
    <DashboardLayout title="Operations Dashboard">
      <div className="an-page">
        <div className="section-header an-header">
          <div className="an-header-text">
            <h2 className="section-title">Analytics</h2>
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
            <span className="an-kpi-icon an-tone-indigo"><ReportsIcon /></span>
            <div className="an-kpi-body">
              <span className="an-kpi-label">Total Reports</span>
              <div className="an-kpi-value-row">
                <strong className="an-kpi-value">{loading ? "—" : (current?.total ?? "—")}</strong>
                {!loading && <DeltaChip value={totalDelta} unit="%" goodDirection="neutral" />}
              </div>
              <span className="an-kpi-hint">
                {current?.truncated
                  ? `latest ${current.reports.length} of ${current.total} in period`
                  : "Filed in the selected period"}
              </span>
            </div>
          </div>

          <div className="an-kpi">
            <span className="an-kpi-icon an-tone-cyan"><ClockIcon /></span>
            <div className="an-kpi-body">
              <span className="an-kpi-label">Avg Resolution Time</span>
              <div className="an-kpi-value-row">
                <strong className="an-kpi-value">{loading ? "—" : formatDays(resolution.avgDays)}</strong>
                {!loading && <DeltaChip value={avgDelta} unit="%" goodDirection="down" />}
              </div>
              <span className="an-kpi-hint">
                {resolution.resolvedCount
                  ? `across ${resolution.resolvedCount} resolved${prevResolution.avgDays !== null ? ` · prev ${formatDays(prevResolution.avgDays)}` : ""}`
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
                <strong className={`an-kpi-value an-value-${slaTone}`}>{loading ? "—" : formatPct(resolution.slaPct)}</strong>
                {!loading && <DeltaChip value={slaDelta} unit="pp" goodDirection="up" />}
              </div>
              <span className="an-kpi-hint">
                {resolution.slaTotal
                  ? `${resolution.slaOnTime} of ${resolution.slaTotal} resolved on time`
                  : "No SLA-bound resolutions in period"}
              </span>
            </div>
          </div>

          <div className="an-kpi an-kpi-severity">
            <span className="an-kpi-icon an-tone-red"><DiamondIcon /></span>
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

        {current?.truncated && (
          <p className="an-note">
            Showing the latest {current.reports.length} of {current.total} reports filed in this period — totals and
            breakdowns still reflect the full period.
          </p>
        )}

        <div className="an-grid">
          {/* ===== Report volume (with prior-period comparison + spikes) ===== */}
          <section className="an-panel an-wide">
            <PanelHead
              icon={<BarsIcon />}
              tone="indigo"
              title="Report Volume"
              sub={`Reports per ${granularity === "week" ? "week" : "day"}${hasComparison ? " · dashed line = previous period" : ""}`}
              action={<Link to={operationsHref({})} className="an-panel-link">View these reports →</Link>}
            />
            {prevError && <p className="an-note an-note-warn">{prevError}</p>}
            {loading ? (
              <Skeleton height={250} />
            ) : dataError ? (
              <p className="an-empty">{dataError}</p>
            ) : volumeData.length ? (
              <div className="an-chart">
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={volumeData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="anVolumeFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.26} />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                      interval="preserveStartEnd"
                      minTickGap={22}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={34} />
                    <Tooltip content={<VolumeTooltip />} cursor={{ stroke: "#cbd5e1" }} />
                    {hasComparison && (
                      <Legend iconType="plain-line" wrapperStyle={{ fontSize: 11, color: "#64748b", paddingTop: 4 }} />
                    )}
                    <Area
                      type="monotone"
                      dataKey="current"
                      name="This period"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      fill="url(#anVolumeFill)"
                      activeDot={{ r: 4 }}
                    />
                    {hasComparison && (
                      <Line
                        type="monotone"
                        dataKey="previous"
                        name="Previous period"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="6 4"
                        dot={false}
                        activeDot={{ r: 3 }}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="spike"
                      name="Spike"
                      stroke="#dc2626"
                      strokeWidth={0}
                      dot={{ r: 4.5, fill: "#dc2626", strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                      isAnimationActive={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="an-empty">No reports were filed in this period.</p>
            )}
          </section>

          {/* ===== Severity distribution ===== */}
          <section className="an-panel">
            <PanelHead
              icon={<DiamondIcon />}
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
              sub="Weekly average of created → resolved"
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
                {resolution.resolvedCount
                  ? "Not enough resolved reports to chart a trend yet."
                  : "Resolution trends appear once reports resolve in this period."}
              </p>
            )}
          </section>

          {/* ===== Anomalies & spikes ===== */}
          <section className="an-panel">
            <PanelHead
              icon={<AlertIcon />}
              tone="amber"
              title="Anomalies & Spikes"
              sub="Days beyond 2× the period's typical volume"
            />
            {loading ? (
              <Skeleton height={120} />
            ) : spikes.length ? (
              <ul className="an-spike-list">
                {spikes.map((spike) => (
                  <li className="an-spike" key={spike.date}>
                    <span className="an-spike-badge"><AlertIcon /></span>
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

          {/* ===== Open past SLA ===== */}
          <section className="an-panel">
            <PanelHead
              icon={<ClockIcon />}
              tone="red"
              title="Open Past SLA"
              sub="Live list of open reports past their DO 47 due date"
              action={
                <Link to="/dashboard/operations?overdue=true" className="an-panel-link">
                  View all overdue →
                </Link>
              }
            />
            {loading ? (
              <Skeleton height={120} />
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
                      {overdueList.slice(0, 6).map((report) => {
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
                {overdueList.length > 6 && (
                  <p className="an-table-foot">
                    +{overdueList.length - 6} more overdue in your scope —{" "}
                    <Link to="/dashboard/operations?overdue=true">view all</Link>
                  </p>
                )}
              </>
            ) : (
              <p className="an-empty an-empty-good">All open reports are within their DO 47 due dates.</p>
            )}
          </section>

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
                    {slowest.map(({ report, days }) => (
                      <tr key={report.report_number}>
                        <td className="an-report-no" title={report.report_number}>{report.report_number}</td>
                        <td className="an-cell-truncate" title={report.category || ""}>{report.category}</td>
                        <td>{formatDate(report.resolved_at)}</td>
                        <td className="an-duration">{formatDays(days)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="an-empty">No resolved reports in this period yet.</p>
            )}
          </section>

          {/* ===== DO 47 handler compliance ===== */}
          <section className="an-panel an-wide">
            <PanelHead
              icon={<ShieldIcon />}
              tone="green"
              title="DO 47 Handler Compliance"
              sub={`Per-handler score = SLA on-time (${weights.sla_on_time ?? 60}%) + photolog completeness (${
                weights.photolog_completeness ?? 25
              }%) + declared validator (${weights.validation_independence ?? 15}%), ranked highest first. Transfers/referrals and pre-enforcement reports count as activity but are not scored.`}
            />
            {!compliance ? (
              <p className="an-empty">{complianceNote || "Loading compliance scores..."}</p>
            ) : compliance.handlers.length === 0 ? (
              <p className="an-empty">
                No resolved reports have been assigned to handlers yet — scores appear once rectification works are
                completed.
              </p>
            ) : (
              <div className="compliance-table-wrap">
                <table className="compliance-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Handler</th>
                      <th>Resolved</th>
                      <th>SLA On-Time</th>
                      <th>Photolog</th>
                      <th>Validation</th>
                      <th>Score</th>
                      <th>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compliance.handlers.map((row, index) => (
                      <tr key={row.user_number}>
                        <td>{index + 1}</td>
                        <td>{row.handler_name}</td>
                        <td>{row.resolved_count}</td>
                        <td>{pct(row.sla_on_time_pct)}</td>
                        <td>{pct(row.photolog_pct)}</td>
                        <td>{pct(row.validation_pct)}</td>
                        <td className="compliance-score">{row.score ?? "—"}</td>
                        <td>
                          <span className={`rating-badge rating-${ratingSlug(row.rating)}`}>{row.rating}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
