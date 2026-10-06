import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import { getReports } from "../../../api/reports";
import { getReportMetrics } from "../../../api/analytics";
import mockData from "../../../data/mock.json";
import "./DashboardHome.css";

const { employees, citizens, monitoringReports } = mockData;

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const pad = (n) => String(n).padStart(2, "0");
const toISODate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const normalize = (value) => String(value || "").toLowerCase().replace(/[\s-]+/g, "_");
const prettify = (value) => normalize(value).split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
const pct = (part, whole) => (Number(whole) > 0 ? Math.round((Number(part) / Number(whole)) * 100) : 0);

const weekDates = (() => {
  const dates = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    dates.push(day);
  }
  return dates;
})();
const WEEK_LABELS = weekDates.map((d) => WEEKDAYS[d.getDay()]);
const CHART_FROM = toISODate(weekDates[0]);

// Catmull-Rom smoothed line through the points, plus the matching area fill.
function buildChart(values, width, height) {
  if (!values.length) return { line: "", area: "" };
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;
  const points = values.map((v, i) => [
    i * stepX,
    height - ((v - min) / range) * (height - 24) - 12,
  ]);

  let line = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    line += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  const last = points[points.length - 1];
  const area = `${line} L ${last[0]},${height} L 0,${height} Z`;
  return { line, area };
}

function UsersIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
function ClipboardIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>;
}
function EyeIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>;
}
function DispatchIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="14" height="11" rx="1" /><path d="M15 10h4l3 3v4h-7" /><circle cx="6" cy="18.5" r="1.8" /><circle cx="18" cy="18.5" r="1.8" /></svg>;
}
function CheckIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></svg>;
}
function AlertIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
}
function DiamondIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 22 12 12 22 2 12z" /></svg>;
}

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [recent, setRecent] = useState([]);
  const [activity, setActivity] = useState(WEEK_LABELS.map(() => 0));
  const [alerts, setAlerts] = useState([]);
  const [criticalCount, setCriticalCount] = useState(0);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const [metricsRes, recentRes, activityRes, p1Res, p2Res] = await Promise.allSettled([
        getReportMetrics(),
        getReports({ page_size: 5 }),
        getReports({ from_date: CHART_FROM, page_size: 100, exclude_closed: false }),
        getReports({ severity: "P1", exclude_closed: true, page_size: 4 }),
        getReports({ severity: "P2", exclude_closed: true, page_size: 4 }),
      ]);
      if (cancelled) return;
      const errs = {};

      if (metricsRes.status === "fulfilled") {
        setMetrics(metricsRes.value);
      } else {
        errs.metrics = "Report metrics are unavailable right now.";
      }

      if (recentRes.status === "fulfilled") {
        setRecent(recentRes.value.results || []);
      } else {
        errs.recent = "Recent reports could not be loaded.";
      }

      if (activityRes.status === "fulfilled") {
        const buckets = WEEK_LABELS.map(() => 0);
        (activityRes.value.results || []).forEach((report) => {
          const when = report.created_at ? new Date(report.created_at) : null;
          if (!when || Number.isNaN(when.getTime())) return;
          const index = weekDates.findIndex((d) => d.toDateString() === when.toDateString());
          if (index >= 0) buckets[index] += 1;
        });
        setActivity(buckets);
      } else {
        errs.activity = "Activity data unavailable.";
      }

      if (p1Res.status === "fulfilled" || p2Res.status === "fulfilled") {
        const liveItems = [p1Res, p2Res]
          .filter((r) => r.status === "fulfilled")
          .flatMap((r) => r.value.results || []);
        const p1Count = p1Res.status === "fulfilled" ? Number(p1Res.value.count || 0) : 0;
        const p2Count = p2Res.status === "fulfilled" ? Number(p2Res.value.count || 0) : 0;
        setCriticalCount(p1Count + p2Count);
        setAlerts(
          liveItems
            .filter((r) => r.created_at)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 4)
        );
      } else {
        const mockAlerts = monitoringReports.filter(
          (r) => ["P1", "P2"].includes(String(r.severity).toUpperCase()) && normalize(r.status) !== "resolved"
        );
        setCriticalCount(mockAlerts.length);
        setAlerts(
          mockAlerts.slice(0, 4).map((r) => ({
            report_number: r.id,
            category: r.category,
            address: r.location,
            severity: r.severity,
            created_at: null,
          }))
        );
        errs.alerts = "Live alerts unavailable — showing sample data.";
      }

      setErrors(errs);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, []);

  const counts = metrics?.count_by_status || {};
  const total = metrics?.total_count ?? null;
  const resolved = Number(counts.resolved || 0) + Number(counts.closed || 0);
  const underReview = Number(counts.under_review || 0);
  const dispatched = Number(counts.dispatched || 0);
  const totalUsers = employees.length + citizens.length;
  const activeEmployees = employees.filter((e) => normalize(e.status) === "active").length;

  const display = (value) => (loading ? "—" : (value ?? "—"));
  const { line, area } = buildChart(activity, 700, 190);
  const overviewBars = [
    { label: "Reports Resolved", value: pct(resolved, total) },
    { label: "Reports Dispatched", value: pct(dispatched, total) },
    { label: "Reports Under Review", value: pct(underReview, total) },
    { label: "Staff Accounts Active", value: pct(activeEmployees, employees.length) },
  ];
  const bannerError = errors.metrics || errors.recent;

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="dash-home">
        {bannerError && <div className="dh-error" role="alert">{bannerError}</div>}

        <div className="dh-kpi-grid">
          <div className="dh-kpi-card">
            <div className="dh-kpi-top"><span className="dh-kpi-icon dh-tone-blue"><UsersIcon /></span><span className="dh-kpi-hint">Staff + Citizens</span></div>
            <span className="dh-kpi-label">Total Users</span>
            <strong className="dh-kpi-value">{display(totalUsers)}</strong>
          </div>
          <div className="dh-kpi-card">
            <div className="dh-kpi-top"><span className="dh-kpi-icon dh-tone-indigo"><ClipboardIcon /></span><span className="dh-kpi-hint">All submissions</span></div>
            <span className="dh-kpi-label">Total Reports</span>
            <strong className="dh-kpi-value">{loading ? "—" : display(total)}</strong>
          </div>
          <div className="dh-kpi-card">
            <div className="dh-kpi-top"><span className="dh-kpi-icon dh-tone-purple"><EyeIcon /></span><span className="dh-kpi-hint">Awaiting assessment</span></div>
            <span className="dh-kpi-label">Under Review</span>
            <strong className="dh-kpi-value">{display(underReview)}</strong>
          </div>
          <div className="dh-kpi-card">
            <div className="dh-kpi-top"><span className="dh-kpi-icon dh-tone-cyan"><DispatchIcon /></span><span className="dh-kpi-hint">Teams deployed</span></div>
            <span className="dh-kpi-label">Dispatched</span>
            <strong className="dh-kpi-value">{display(dispatched)}</strong>
          </div>
          <div className="dh-kpi-card">
            <div className="dh-kpi-top"><span className="dh-kpi-icon dh-tone-green"><CheckIcon /></span><span className="dh-kpi-hint">Closed &amp; verified</span></div>
            <span className="dh-kpi-label">Resolved</span>
            <strong className="dh-kpi-value">{display(resolved)}</strong>
          </div>
          <div className="dh-kpi-card dh-accent">
            <div className="dh-kpi-top"><span className="dh-kpi-icon dh-tone-red"><AlertIcon /></span><span className="dh-kpi-hint">Open P1 — P2</span></div>
            <span className="dh-kpi-label">Critical Alerts</span>
            <strong className="dh-kpi-value">{display(criticalCount)}</strong>
          </div>
        </div>

        <div className="dh-mid-grid">
          <section className="dh-panel">
            <div className="dh-panel-head">
              <h2 className="dh-panel-title">Report Activity</h2>
              <select className="dh-select" defaultValue="7" aria-label="Activity range">
                <option value="7">Last 7 Days</option>
              </select>
            </div>
            {loading ? (
              <p className="dh-muted">Loading activity...</p>
            ) : (
              <>
                <svg className="dh-chart" viewBox="0 0 700 190" preserveAspectRatio="none" role="img" aria-label="Reports submitted over the last 7 days">
                  <defs>
                    <linearGradient id="dhChartFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  {area && <path d={area} fill="url(#dhChartFill)" />}
                  {line && <path d={line} fill="none" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
                </svg>
                <div className="dh-chart-days">
                  {WEEK_LABELS.map((label, i) => <span key={`${label}-${i}`}>{label}</span>)}
                </div>
                {errors.activity && <p className="dh-chart-note">{errors.activity} Showing an empty baseline.</p>}
              </>
            )}
          </section>

          <section className="dh-panel">
            <div className="dh-panel-head">
              <h2 className="dh-panel-title">Management Overview</h2>
              <Link to="/dashboard/operations/analytics" className="dh-panel-link">View Report</Link>
            </div>
            <div className="dh-progress-list">
              {overviewBars.map((bar) => (
                <div className="dh-progress-row" key={bar.label}>
                  <div className="dh-progress-head">
                    <span>{bar.label}</span>
                    <strong>{loading ? "—" : `${bar.value}%`}</strong>
                  </div>
                  <div className="dh-progress-track">
                    <div className="dh-progress-fill" style={{ width: `${loading ? 0 : bar.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            {errors.metrics && <p className="dh-chart-note">{errors.metrics}</p>}
          </section>
        </div>

        <div className="dh-bottom-grid">
          <section className="dh-panel">
            <div className="dh-panel-head">
              <h2 className="dh-panel-title">Recent Reports</h2>
              <Link to="/dashboard/operations" className="dh-panel-link">View All</Link>
            </div>
            <div className="dh-table-wrap">
              <table className="dh-table">
                <thead>
                  <tr><th>REPORT ID</th><th>CATEGORY</th><th>DATE</th><th>STATUS</th><th>SEVERITY</th><th>ACTION</th></tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" className="dh-empty">Loading reports...</td></tr>
                  ) : recent.length ? (
                    recent.map((report) => (
                      <tr key={report.report_number}>
                        <td className="dh-report-id">{report.report_number}</td>
                        <td>{report.category}</td>
                        <td>{report.created_at ? new Date(report.created_at).toLocaleDateString() : "—"}</td>
                        <td><span className={`status-badge status-${normalize(report.status)}`}>{prettify(report.status)}</span></td>
                        <td><span className={`severity-badge severity-${String(report.severity || "").toLowerCase()}`}>{report.severity || "—"}</span></td>
                        <td>
                          <Link
                            to="/dashboard/operations"
                            className="dh-action-link"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="6" className="dh-empty">No reports found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="dh-alerts">
            <div className="dh-alerts-header"><DiamondIcon /> CRITICAL ALERTS</div>
            <div className="dh-alerts-body">
              {loading ? (
                <p className="dh-muted">Loading alerts...</p>
              ) : alerts.length ? (
                alerts.map((alert) => (
                  <div className="dh-alert-item" key={alert.report_number}>
                    <span className={`severity-badge severity-${String(alert.severity || "").toLowerCase()}`}>{alert.severity}</span>
                    <div className="dh-alert-info">
                      <strong>{alert.report_number} · {alert.category}</strong>
                      <span>{alert.address || "Location unavailable"}</span>
                    </div>
                    <Link
                      to="/dashboard/operations"
                      className="dh-alert-view"
                    >
                      View
                    </Link>
                  </div>
                ))
              ) : (
                <p className="dh-muted">No open critical reports. All clear.</p>
              )}
              {errors.alerts && <p className="dh-chart-note">{errors.alerts}</p>}
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
