import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import Pagination from "../../../components/shared/Pagination";
import {
  ActivityIcon,
  CheckIcon,
  ClipboardIcon,
  ClockIcon,
  EyeIcon,
  FilterIcon,
  FlagIcon,
  GavelIcon,
  PencilIcon,
  SearchIcon,
} from "../../../components/shared/icons";
import { getReportLookups, getReports } from "../../../api/reports";
import { REPORT_STATUSES, STATUS_VIEWS } from "../../../hooks/useStatusCounts";
import { formatDueDate, slaBadge } from "../../../utils/sla";
import { addDays, monthRange, notAfterToday, toISODate } from "../../../utils/dates";
import { normalizeStatusKey as normalize, prettifyStatus } from "../../../utils/format";
import { PERMISSIONS } from "../../../shared/constants";
import { usePermissions } from "../../../hooks/usePermissions";
import ReportManagementModal from "./ReportManagementModal";
import ReportModerationModal from "./ReportModerationModal";
import ReportDetail from "./ReportDetail";
import "./OperationsDashboard.css";

const PAGE_SIZE = 10;
const valueOf = (item) => item?.value || item;
const labelOf = (item) => item?.label || item;

// Date filter modes: quick presets plus a custom start/end range.
const DATE_MODES = { TODAY: "today", LAST_7_DAYS: "last_7_days", THIS_MONTH: "this_month", ALL: "all", CUSTOM: "custom" };
// Resolve the selected date mode into from/to ISO dates ("" = no bound).
// Presets are computed at request time so they stay correct across
// day/month boundaries; custom uses the From/to inputs as-is.
const resolveDateRange = (mode, fromDate, toDate) => {
  const now = new Date();
  switch (mode) {
    case DATE_MODES.TODAY: {
      const today = toISODate(now);
      return { from: today, to: today };
    }
    case DATE_MODES.LAST_7_DAYS:
      // Inclusive 7-day window: today and the 6 preceding days.
      return { from: toISODate(addDays(now, -6)), to: toISODate(now) };
    case DATE_MODES.THIS_MONTH:
      return monthRange(now);
    case DATE_MODES.CUSTOM:
      return { from: fromDate || "", to: toDate || "" };
    default:
      return { from: "", to: "" };
  }
};

const displayStatus = (status, statuses = []) => {
  const match = statuses.find((s) => valueOf(s) === status || labelOf(s) === status);
  return match ? labelOf(match) : (status ? prettifyStatus(status) : "—");
};

const statusClass = (status) => normalize(status);

export default function OperationsDashboard() {
  const { can, reportScope } = usePermissions();
  // Warn/ban the reporter of a flagged (Invalid) report in place.
  const canModerate = can(PERMISSIONS.USER_WARN) || can(PERMISSIONS.USER_DEACTIVATE_ANY);
  // Editing status/severity/remarks follows the same permission family the
  // backend PATCH endpoint enforces (report:update_assigned / update_own).
  const canEdit =
    can(PERMISSIONS.REPORT_UPDATE_ASSIGNED) || can(PERMISSIONS.REPORT_UPDATE_OWN);
  // The sidebar Status Views deep-link this table via ?status=…; the URL is
  // also how the Analytics page drills down (?severity=…&overdue=true and
  // ?range=…&from=…&to=…), so URL params mirror the applied deep-linkable
  // filters. Category/search stay page-local; status only reads from the URL
  // (a sidebar Status View sets it) and is never written back to it.
  const [searchParams, setSearchParams] = useSearchParams();
  const rawStatus = (searchParams.get("status") || "").trim().toLowerCase();
  const urlStatus = REPORT_STATUSES.includes(rawStatus) ? rawStatus.toUpperCase() : "";
  const rawSeverity = (searchParams.get("severity") || "").trim().toUpperCase();
  const urlSeverity = /^P[1-5]$/.test(rawSeverity) ? rawSeverity : "";
  const urlOverdue = (searchParams.get("overdue") || "").trim() === "true";
  const DATE_RANGE_VALUES = Object.values(DATE_MODES);
  const rawRange = (searchParams.get("range") || "").trim();
  const urlRange = rawRange && DATE_RANGE_VALUES.includes(rawRange) ? rawRange : "";
  const validDate = (value) => (/^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "");
  const urlFrom = validDate((searchParams.get("from") || "").trim());
  const urlTo = validDate((searchParams.get("to") || "").trim());
  // Default period is Today (the clean URL has no range param); an explicit
  // ?range=… or bare ?from=/?to= deep-link overrides it.
  const urlDateMode = urlRange || (urlFrom || urlTo ? DATE_MODES.CUSTOM : DATE_MODES.TODAY);
  // Status Views (?status=…) pre-filter the table via the URL. The compact
  // summary bar stays visible in both modes; only the page header adapts.
  const isStatusView = Boolean(urlStatus);
  const statusView = STATUS_VIEWS.find((v) => v.status === rawStatus);
  const [lookups, setLookups] = useState({ categories: [], statuses: [], severities: [] });
  const [statusStats, setStatusStats] = useState({});
  const [overdueCount, setOverdueCount] = useState(0);
  const [reports, setReports] = useState([]);
  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ category: "", severity: urlSeverity, status: urlStatus, search: "", dateMode: urlDateMode, fromDate: urlFrom, toDate: urlTo, overdue: urlOverdue });
  const [draft, setDraft] = useState(filters);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Report number whose Update modal is open, or null when closed.
  const [editingReport, setEditingReport] = useState(null);
  // Report number whose Moderation dialog is open (Invalid rows only), or null.
  const [moderatingReport, setModeratingReport] = useState(null);
  // Report number whose read-only detail dialog is open, or null when closed.
  const [viewingReport, setViewingReport] = useState(null);

  // Adjust state when the deep-link params change (sidebar click, Analytics
  // drill-down, or browser navigation) — see react.dev "adjusting some state
  // when a prop changes". Only the fields whose URL value actually changed are
  // applied, so a plain ?status= navigation leaves the other filters alone.
  const deepLink = `${urlStatus}|${urlSeverity}|${urlOverdue ? "1" : "0"}|${urlRange}|${urlFrom}|${urlTo}`;
  const [prevDeepLink, setPrevDeepLink] = useState(deepLink);
  if (prevDeepLink !== deepLink) {
    const [prevStatus, prevSeverity, prevOverdue, prevRange, prevFrom, prevTo] = prevDeepLink.split("|");
    setPrevDeepLink(deepLink);
    setPage(1);
    const dateChanged = `${urlRange}|${urlFrom}|${urlTo}` !== `${prevRange}|${prevFrom}|${prevTo}`;
    const applyUrl = (current) => {
      const next = { ...current };
      if (urlStatus !== prevStatus) next.status = urlStatus;
      if (urlSeverity !== prevSeverity) next.severity = urlSeverity;
      if ((urlOverdue ? "1" : "0") !== prevOverdue) next.overdue = urlOverdue;
      if (dateChanged) {
        // Deep-links are untrusted input: drop anything after today so a
        // shared URL can't seed the filters with future dates.
        const today = toISODate(new Date());
        next.dateMode = urlDateMode;
        next.fromDate = urlFrom > today ? "" : urlFrom;
        next.toDate = urlTo > today ? "" : urlTo;
      }
      return Object.keys(next).every((key) => next[key] === current[key]) ? current : next;
    };
    setFilters(applyUrl);
    setDraft(applyUrl);
  }

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      // Resolve the date range from the selected preset or custom inputs.
      const { from: fromDate, to: toDate } = resolveDateRange(filters.dateMode, filters.fromDate, filters.toDate);
      const reportData = await getReports({
        q: filters.search || undefined,
        category_id: filters.category || undefined,
        status: filters.status || undefined,
        severity: filters.severity || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
        // SLA: show only open reports past their due date.
        overdue: filters.overdue || undefined,
        // Reports Overview lists every report regardless of status (including
        // Resolved/Closed/Invalid), so exclude_closed is always off here.
        exclude_closed: false,
        page,
        page_size: PAGE_SIZE,
      });
      setReports(reportData.results || []);
      setCount(reportData.count || 0);
      const pages = Math.max(1, reportData.total_pages || 1);
      if (page > pages) {
        // Page is past the end (e.g. after filters shrink the set) — clamp
        // and let the [page, filters] effect refetch.
        setPage(pages);
        return;
      }
      setTotalPages(pages);
    } catch (err) {
      setError(err?.detail || err?.message || "Unable to load monitoring data.");
    } finally {
      setLoading(false);
    }
  };

  // The overview cards use the API's current status buckets. Fetch a count
  // per real status because the reports endpoint returns exact counts.
  // The overdue count (SLA) comes from the same endpoint's filter.
  const loadStatusStats = async (statusList) => {
    if (!statusList.length) return;
    try {
      const entries = await Promise.all(
        statusList.map(async (item) => {
          const value = valueOf(item);
          try {
            const data = await getReports({ status: value, exclude_closed: false, page: 1, page_size: 1 });
            return [normalize(value), Number(data.count || 0)];
          } catch {
            return [normalize(value), 0];
          }
        })
      );
      setStatusStats(Object.fromEntries(entries));
    } catch {
      // Overview cards just fall back to 0 — the table below still works.
    }
    try {
      const overdueData = await getReports({ overdue: true, exclude_closed: false, page: 1, page_size: 1 });
      setOverdueCount(Number(overdueData.count || 0));
    } catch {
      setOverdueCount(0);
    }
  };

  useEffect(() => {
    getReportLookups()
      .then((data) => {
        setLookups(data);
        loadStatusStats(data.statuses || []);
      })
      .catch(() => {});
  }, []);
  useEffect(() => { load(); }, [page, filters]);

  const countFor = (...keys) => keys.reduce((sum, key) => sum + Number(statusStats[normalize(key)] || 0), 0);
  // Active = every open report (not yet Resolved, Closed, or Invalid).
  const active = countFor("new", "assigned", "under_review", "on_hold", "dispatched", "ongoing");
  const invalid = countFor("invalid");
  const totalReports = Object.values(statusStats).reduce((sum, n) => sum + Number(n || 0), 0) || count;
  const categories = lookups.categories || [];
  const statuses = lookups.statuses || [];
  const severities = lookups.severities || [];

  const updateDraft = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  // Mirror the deep-linkable filters into the URL so sidebar links, Analytics
  // drill-downs and browser back/forward all read from one source of truth.
  // Category/status/search stay page-local and are never written to the URL.
  const syncParamsFrom = (source) => setSearchParams((prev) => {
    const next = new URLSearchParams(prev);
    const put = (key, value) => { if (value) next.set(key, String(value)); else next.delete(key); };
    put("severity", source.severity || "");
    if (source.overdue) next.set("overdue", "true");
    else next.delete("overdue");
    // Today is the default period, so it needs no param; every other mode
    // (including an explicit All Time) is written back for shareable URLs.
    if (source.dateMode && source.dateMode !== DATE_MODES.TODAY) put("range", source.dateMode);
    else next.delete("range");
    const custom = source.dateMode === DATE_MODES.CUSTOM;
    put("from", custom ? source.fromDate || "" : "");
    put("to", custom ? source.toDate || "" : "");
    return next;
  }, { replace: true });
  // Severity/overdue/date are URL-driven; Apply Filters commits the draft
  // (including the page-local category/status/search fields) and mirrors the
  // rest. Status is deliberately never written here: any ?status= would flip
  // the page into a Status View, which the sidebar/summary-bar own — so the
  // Status dropdown stays a local overview-only filter.
  const applyFilters = () => { setPage(1); setFilters(draft); syncParamsFrom(draft); };
  const reset = () => {
    // Status Views keep their locked status on reset — clearing it would
    // silently kick the user back to the Overview.
    const empty = { category: "", severity: "", status: isStatusView ? urlStatus : "", search: "", dateMode: DATE_MODES.TODAY, fromDate: "", toDate: "", overdue: false };
    setPage(1); setDraft(empty); setFilters(empty);
    syncParamsFrom(empty);
  };

  const openStatusView = (status) => setSearchParams((prev) => {
    const next = new URLSearchParams(prev);
    next.set("status", String(status).toLowerCase());
    return next;
  });
  // Total chip: leave the Status View and clear the local Status dropdown so
  // "all" really means all — the other filters stay applied.
  const openOverview = () => {
    setPage(1);
    setFilters((current) => (current.status ? { ...current, status: "" } : current));
    setDraft((current) => (current.status ? { ...current, status: "" } : current));
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("status");
      return next;
    }, { replace: true });
  };
  // Overdue chip: toggling writes ?overdue=… and the deep-link effect applies
  // it — a drill-down action like the other chips, not a pending draft edit.
  const toggleOverdue = () => {
    syncParamsFrom({ ...filters, overdue: !filters.overdue });
  };

  // Heading reflects the rows the API actually returns for this permission
  // set (ReportService._authorized_reports): all / assigned / own.
  const scopeLabel =
    reportScope === "assigned"
      ? "My Assigned Reports"
      : reportScope === "own"
        ? "My Reports"
        : "All Reports";

  return (
    <DashboardLayout title={isStatusView ? `Operations - ${statusView?.label || urlStatus}` : `Operations - ${scopeLabel}`}>
      <div className="section-header">
        <h2 className="section-title">
          {isStatusView ? `${statusView?.label || prettifyStatus(urlStatus)} Reports` : scopeLabel}
          {/* Scope badge: mirrors the server-side row scoping — officers only
              ever receive their assigned rows, so never label that "All". */}
          <span className={`scope-badge scope-${reportScope}`}>
            {reportScope === "assigned"
              ? "Assigned to me"
              : reportScope === "own"
                ? "Submitted by me"
                : "System-wide"}
          </span>
        </h2>
        <p className="section-subtitle">
          {isStatusView
            ? `Filtered to ${statusView?.label || prettifyStatus(urlStatus)} reports — counts are shown in the sidebar.`
            : reportScope === "assigned"
              ? "Reports assigned to you — update their status and attach resolution evidence."
              : "Manage and monitor citizen reports for community improvement."}
        </p>
      </div>

      {/* Compact summary strip — shown in Overview and Status Views. Total /
          Resolved / Invalid navigate, Overdue toggles its filter, Active is
          informational (no single status maps to it). */}
      <div className="summary-bar">
        <button type="button" className="summary-metric" title="Show all reports" onClick={openOverview}>
          <span className="summary-icon summary-icon-total"><ClipboardIcon size={18} /></span>
          <span className="summary-text"><span className="summary-label">TOTAL REPORTS</span><strong>{totalReports}</strong></span>
        </button>
        <div className="summary-metric summary-metric-static" title="New + Assigned + Under Review + On-Hold + Dispatched + Ongoing">
          <span className="summary-icon summary-icon-active"><ActivityIcon size={18} /></span>
          <span className="summary-text"><span className="summary-label">ACTIVE</span><strong>{active}</strong></span>
        </div>
        <button type="button" className="summary-metric" title="View Resolved reports" onClick={() => openStatusView("resolved")}>
          <span className="summary-icon summary-icon-resolved"><CheckIcon size={18} /></span>
          <span className="summary-text"><span className="summary-label">RESOLVED</span><strong>{countFor("resolved")}</strong></span>
        </button>
        <button type="button" className="summary-metric" title="View Invalid reports" onClick={() => openStatusView("invalid")}>
          <span className="summary-icon summary-icon-invalid"><FlagIcon size={18} /></span>
          <span className="summary-text"><span className="summary-label">INVALID</span><strong>{invalid}</strong></span>
        </button>
        <button type="button" className={`summary-metric${filters.overdue ? " summary-metric-toggled" : ""}`} title="Toggle the Overdue only filter" aria-pressed={filters.overdue} onClick={toggleOverdue}>
          <span className="summary-icon summary-icon-overdue"><ClockIcon size={18} /></span>
          <span className="summary-text"><span className="summary-label">OVERDUE (SLA)</span><strong>{overdueCount}</strong></span>
        </button>
      </div>

      {/* Sticky filter row — stays pinned while the table scrolls. On Status
          Views the status comes from the URL only (sidebar + summary-bar
          chips) and the Status dropdown is hidden; the overview shows it as a
          normal page-local filter alongside Category. */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group filter-search"><label>Search</label><div className="search-wrap"><SearchIcon size={16}/><input placeholder="Search by id, category, or location" value={draft.search} onChange={(e) => updateDraft("search", e.target.value)} onKeyDown={(e) => e.key === "Enter" && applyFilters()} /></div></div>
          {!isStatusView && (
            <div className="filter-group"><label>Status</label><select value={draft.status} onChange={(e) => updateDraft("status", e.target.value)}><option value="">All Statuses</option>{statuses.map((s) => <option key={valueOf(s)} value={valueOf(s)}>{labelOf(s)}</option>)}</select></div>
          )}
          <div className="filter-group"><label>Category</label><select value={draft.category} onChange={(e) => updateDraft("category", e.target.value)}><option value="">All Categories</option>{categories.map((c) => <option key={c.hazard_id} value={c.hazard_id}>{c.hazard_name}</option>)}</select></div>
          <div className="filter-group"><label>Severity</label><select value={draft.severity} onChange={(e) => updateDraft("severity", e.target.value)}><option value="">All Severities</option>{severities.map((s) => <option key={valueOf(s)} value={valueOf(s)}>{labelOf(s)}</option>)}</select></div>
          <div className="filter-group date-filter">
            <label>Date</label>
            <select value={draft.dateMode} onChange={(e) => updateDraft("dateMode", e.target.value)}>
              <option value={DATE_MODES.TODAY}>Today</option>
              <option value={DATE_MODES.LAST_7_DAYS}>Last 7 Days</option>
              <option value={DATE_MODES.THIS_MONTH}>This Month</option>
              <option value={DATE_MODES.ALL}>All Time</option>
              <option value={DATE_MODES.CUSTOM}>Custom Range</option>
            </select>
            {draft.dateMode === DATE_MODES.CUSTOM && (
              <div className="date-range">
                <span>From</span>
                <input
                  type="date"
                  value={draft.fromDate}
                  max={toISODate(new Date())}
                  onChange={(e) => {
                    if (notAfterToday(e.target.value)) updateDraft("fromDate", e.target.value);
                  }}
                />
                <span>to</span>
                <input
                  type="date"
                  value={draft.toDate}
                  max={toISODate(new Date())}
                  onChange={(e) => {
                    if (notAfterToday(e.target.value)) updateDraft("toDate", e.target.value);
                  }}
                />
              </div>
            )}
          </div>
          <div className="filter-actions">
            <label className="overdue-toggle" title="Show only open reports past their response time">
              <input type="checkbox" checked={draft.overdue} onChange={(e) => updateDraft("overdue", e.target.checked)} />
              Overdue only
            </label>
            <button className="btn-apply" onClick={applyFilters}><FilterIcon/>Apply Filters</button><button className="btn-reset" onClick={reset}>Reset</button>
          </div>
        </div>
      </div>

      {error && <div className="form-error">{typeof error === "string" ? error : JSON.stringify(error)}</div>}

      <div className="table-container">
        <table className="reports-table">
          <thead><tr><th>REPORT ID</th><th>CATEGORY</th><th>LOCATION</th><th>DATE REPORTED</th><th>DUE</th><th>STATUS</th><th>SEVERITY</th><th>ACTION</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="8" className="empty-table-message">Loading reports...</td></tr> : reports.length ? reports.map((report) => {
              const sla = slaBadge(report);
              const statusKey = normalize(report.status);
              return (
              <tr key={report.report_number}>
                <td className="report-number">{report.report_number}</td>
                <td className="cell-truncate" title={report.category || ""}>{report.category}</td>
                <td className="cell-truncate" title={report.address || ""}>{report.address || "—"}</td>
                <td>{new Date(report.created_at).toLocaleDateString()}</td>
                <td><span className={`sla-badge sla-${sla.tone}`} title={report.due_at ? `Due ${formatDueDate(report.due_at)}` : "No SLA set"}>{sla.text}</span></td>
                <td><span className={`status-badge status-${statusClass(report.status)}`}>{displayStatus(report.status, statuses)}</span></td><td><span className={`severity-badge severity-${String(report.severity || "").toLowerCase()}`}>{report.severity || "—"}</span></td>
                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      className="action-icon-btn"
                      title={`View ${report.report_number}`}
                      aria-label={`View ${report.report_number}`}
                      onClick={() => setViewingReport(report.report_number)}
                    >
                      <EyeIcon />
                    </button>
                    {/* Flagged (Invalid) rows: moderate the reporter in place instead
                        of editing a terminal status. Closed rows are permanent —
                        no action besides viewing. */}
                    {statusKey === "invalid" ? (
                      canModerate && (
                        <button
                          type="button"
                          className="action-icon-btn"
                          title={`Moderate reporter of ${report.report_number}`}
                          aria-label={`Moderate reporter of ${report.report_number}`}
                          onClick={() => setModeratingReport(report.report_number)}
                        >
                          <GavelIcon />
                        </button>
                      )
                    ) : statusKey !== "closed" && canEdit && (
                      <button
                        type="button"
                        className="action-icon-btn"
                        title={`Edit ${report.report_number}`}
                        aria-label={`Edit ${report.report_number}`}
                        onClick={() => setEditingReport(report.report_number)}
                      >
                        <PencilIcon />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
              );
            }) : <tr><td colSpan="8" className="empty-table-message">No reports found.</td></tr>}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} loading={loading} onPageChange={setPage}>
        Showing {count ? ((page - 1) * PAGE_SIZE) + 1 : 0} to {Math.min(page * PAGE_SIZE, count)} of {count.toLocaleString()} reports
      </Pagination>

      {editingReport && (
        <ReportManagementModal
          reportNumber={editingReport}
          lookups={lookups}
          onClose={() => setEditingReport(null)}
          onSaved={() => { load(); loadStatusStats(statuses); }}
        />
      )}

      {moderatingReport && (
        <ReportModerationModal
          reportNumber={moderatingReport}
          onClose={() => setModeratingReport(null)}
          onChanged={() => { load(); loadStatusStats(statuses); }}
        />
      )}

      {viewingReport && (
        <ReportDetail
          reportNumber={viewingReport}
          onClose={() => setViewingReport(null)}
          onChanged={() => { load(); loadStatusStats(statuses); }}
        />
      )}
    </DashboardLayout>
  );
}
