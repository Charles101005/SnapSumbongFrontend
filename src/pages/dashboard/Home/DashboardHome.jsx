import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import KpiCard from "../../../components/shared/KpiCard";
import {
  AlertIcon,
  CheckIcon,
  ClipboardIcon,
  DiamondIcon,
  DispatchIcon,
  EyeIcon,
  UsersIcon,
} from "../../../components/shared/icons";
import { getReports } from "../../../api/reports";
import { getAnalyticsOverview } from "../../../api/analytics";
import { getAuditLogs } from "../../../api/audits";
import { getEmployees, getCitizens } from "../../../api/users";
import { useCanAnalytics } from "../../../hooks/useCanAnalytics";
import { useCanAudit } from "../../../hooks/useCanAudit";
import { usePermissions } from "../../../hooks/usePermissions";
import { PERMISSIONS } from "../../../shared/constants";
import { formatDate, formatLastActive, normalizeStatusKey, prettifyStatus } from "../../../utils/format";
import { DATE_FILTER_PRESETS, formatRange, notAfterToday, resolveRange, toISODate } from "../../../utils/dates";
import "./DashboardHome.css";

export default function DashboardHome() {
  const canAnalytics = useCanAnalytics();
  const canAudit = useCanAudit();
  // Scope-aware dashboard: what's shown follows the user's permissions,
  // never their role name (custom roles behave correctly automatically).
  const { can, reportScope } = usePermissions();
  const canReadEmployees = can(PERMISSIONS.EMPLOYEE_READ_ALL);
  const canReadCitizens = can(PERMISSIONS.USER_READ_ALL);
  const canViewUsers = canReadEmployees || canReadCitizens;
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [recent, setRecent] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [criticalCount, setCriticalCount] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [totalUsers, setTotalUsers] = useState(null);
  const [errors, setErrors] = useState({});
  // Date scope for every report-derived widget (KPI cards, Recent Reports,
  // Critical Alerts, Recent Activity). Defaults to Today; local state —
  // nothing deep-links into the home dashboard. Total Users has no date
  // filter in the users API and stays all-time (its hint says so while a
  // range is active).
  const [dateMode, setDateMode] = useState("today");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      // Resolve the preset at request time so "Today" stays correct across
      // refetches; "custom" uses the From/to inputs as-is ("" = unbounded).
      const { from, to } = resolveRange(dateMode, new Date(), { from: dateFrom, to: dateTo });
      const dateParams = { from_date: from || undefined, to_date: to || undefined };
      const [metricsRes, recentRes, p1Res, p2Res, auditRes, employeesRes, citizensRes] = await Promise.allSettled([
        // The overview endpoint is the date-scoped twin of hazard-report
        // metrics (same three permissions): intake = reports FILED in the
        // range, grouped by their current status — the same date semantics
        // as the Recent Reports table below.
        getAnalyticsOverview({ from, to }),
        getReports({ page_size: 5, ...dateParams }),
        getReports({ severity: "P1", exclude_closed: true, page_size: 4, ...dateParams }),
        getReports({ severity: "P2", exclude_closed: true, page_size: 4, ...dateParams }),
        canAudit ? getAuditLogs({ page_size: 3, ...dateParams }) : Promise.resolve(null),
        canReadEmployees ? getEmployees({ page_size: 1 }) : Promise.resolve(null),
        canReadCitizens ? getCitizens({ page_size: 1 }) : Promise.resolve(null),
      ]);
      if (cancelled) return;
      const errs = {};

      if (metricsRes.status === "fulfilled") {
        // Normalize the overview payload into the shape the cards already
        // read (total_count / count_by_status).
        const overview = metricsRes.value || {};
        setMetrics({
          total_count: overview.intake?.total ?? null,
          count_by_status: overview.intake?.by_status || {},
        });
      } else {
        errs.metrics = "Report metrics are unavailable right now.";
      }

      if (recentRes.status === "fulfilled") {
        setRecent(recentRes.value.results || []);
      } else {
        errs.recent = "Recent reports could not be loaded.";
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
        setCriticalCount(null);
        setAlerts([]);
        errs.alerts = "Live alerts unavailable.";
      }

      if (canAudit) {
        if (auditRes.status === "fulfilled") {
          setAuditLogs(auditRes.value?.results || []);
        } else {
          errs.audit = "Recent activity could not be loaded.";
        }
      }

      if (canViewUsers) {
        const employeeCount =
          employeesRes.status === "fulfilled" ? Number(employeesRes.value?.count || 0) : null;
        const citizenCount =
          citizensRes.status === "fulfilled" ? Number(citizensRes.value?.count || 0) : null;
        if (employeeCount !== null || citizenCount !== null) {
          setTotalUsers((employeeCount || 0) + (citizenCount || 0));
        }
        // Silent on failure: the card simply shows "—".
      }

      setErrors(errs);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [canAudit, canReadEmployees, canReadCitizens, canViewUsers, dateMode, dateFrom, dateTo]);

  const counts = metrics?.count_by_status || {};
  const total = metrics?.total_count ?? null;
  const resolved = Number(counts.resolved || 0) + Number(counts.closed || 0);
  const underReview = Number(counts.under_review || 0);
  const dispatched = Number(counts.dispatched || 0);

  const display = (value) => (loading ? "—" : (value ?? "—"));
  const bannerError = errors.metrics || errors.recent;
  // Resolved at render for the toolbar note; requests re-resolve at fetch
  // time, so a "Today" selection stays correct after a day/month boundary.
  const activeRange = resolveRange(dateMode, new Date(), { from: dateFrom, to: dateTo });
  const isBounded = Boolean(activeRange.from || activeRange.to);

  // Title follows permissions: admins manage users, supervisors oversee the
  // full report queue, officers get their own workspace.
  const dashboardTitle = canReadCitizens
    ? "Admin Dashboard"
    : reportScope === "all"
      ? "Operations Dashboard"
      : "My Dashboard";
  // KPI wording mirrors the server-side scope of the analytics endpoints
  // (overview intake is scoped exactly like hazard-report metrics).
  const reportsLabel = reportScope === "assigned" ? "Assigned to Me" : "Total Reports";
  const reportsHint = reportScope === "assigned" ? "Your current queue" : "All submissions";

  // KPI tiles as data so the grid always knows how many cards it renders
  // (Total Users is permission-gated, so roles see 6 or 5 cards).
  const kpiCards = [
    ...(canViewUsers
      ? [{
          key: "users",
          icon: <UsersIcon />,
          tone: "blue",
          hint: isBounded ? "All time · Staff + Citizens" : "Staff + Citizens",
          label: "Total Users",
          value: display(totalUsers),
        }]
      : []),
    { key: "reports", icon: <ClipboardIcon />, tone: "indigo", hint: reportsHint, label: reportsLabel, value: display(total) },
    { key: "under-review", icon: <EyeIcon />, tone: "purple", hint: "Awaiting assessment", label: "Under Review", value: display(underReview) },
    { key: "dispatched", icon: <DispatchIcon />, tone: "cyan", hint: "Teams deployed", label: "Dispatched", value: display(dispatched) },
    { key: "resolved", icon: <CheckIcon />, tone: "green", hint: "Closed & verified", label: "Resolved", value: display(resolved) },
    { key: "critical", icon: <AlertIcon />, tone: "red", hint: "Open P1 — P2", label: "Critical Alerts", value: display(criticalCount), accent: true },
  ];

  return (
    <DashboardLayout title={dashboardTitle}>
      <div className="dash-home">
        {bannerError && <div className="dh-error" role="alert">{bannerError}</div>}

        {/* Date scope for the report widgets below — applies immediately on
            change (no Apply button), matching the Analytics Period control. */}
        <div className="dh-toolbar">
          <div className="dh-date-filter">
            <label htmlFor="dh-date">Date</label>
            <select id="dh-date" value={dateMode} onChange={(e) => setDateMode(e.target.value)}>
              {DATE_FILTER_PRESETS.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
            {dateMode === "custom" && (
              <div className="dh-date-range">
                <span>From</span>
                <input
                  type="date"
                  value={dateFrom}
                  max={toISODate(new Date())}
                  onChange={(e) => {
                    if (notAfterToday(e.target.value)) setDateFrom(e.target.value);
                  }}
                />
                <span>to</span>
                <input
                  type="date"
                  value={dateTo}
                  max={toISODate(new Date())}
                  onChange={(e) => {
                    if (notAfterToday(e.target.value)) setDateTo(e.target.value);
                  }}
                />
              </div>
            )}
          </div>
          <span className="dh-range-note">{formatRange(activeRange)}</span>
        </div>

        <div className="dh-kpi-grid" data-count={kpiCards.length}>
          {kpiCards.map(({ key, ...card }) => (
            <KpiCard key={key} {...card} />
          ))}
        </div>

        <div className="dh-bottom-grid">
          <section className="dh-panel">
            <div className="dh-panel-head">
              <h2 className="dh-panel-title">Recent Reports</h2>
              <div className="dh-panel-links">
                {canAnalytics && (
                  <Link to="/dashboard/operations/analytics" className="dh-panel-link">Full analytics</Link>
                )}
                <Link to="/dashboard/operations" className="dh-panel-link">View All</Link>
              </div>
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
                        <td><span className={`status-badge status-${normalizeStatusKey(report.status)}`}>{prettifyStatus(report.status)}</span></td>
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
                <p className="dh-muted">
                  {errors.alerts || "No open critical reports. All clear."}
                </p>
              )}
            </div>
          </aside>
        </div>

        {canAudit && (
          <section className="dh-panel">
            <div className="dh-panel-head">
              <h2 className="dh-panel-title">Recent Activity</h2>
              <Link to="/dashboard/audit-trail" className="dh-panel-link">View audit trail</Link>
            </div>
            <div className="dh-table-wrap">
              <table className="dh-table">
                <thead>
                  <tr><th>USER</th><th>ROLE</th><th>ACTION</th><th>MODULE</th><th>WHEN</th></tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" className="dh-empty">Loading activity...</td></tr>
                  ) : auditLogs.length ? (
                    auditLogs.map((log) => (
                      <tr key={log.audit_log_number}>
                        <td className="dh-report-id">{log.actor_name || "System"}</td>
                        <td>{log.actor_role || "—"}</td>
                        <td>{log.action || "—"}</td>
                        <td>{log.module || "—"}</td>
                        <td title={formatDate(log.created_at)}>{formatLastActive(log.created_at)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="dh-empty">{errors.audit || "No recent activity."}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
