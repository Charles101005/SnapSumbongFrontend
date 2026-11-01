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
import { REPORT_STATUSES, STATUS_VIEWS, useStatusCounts } from "../../../context/statusCountsContext";
import { formatDueDate, slaBadge } from "../../../utils/sla";
import { DATE_FILTER_PRESETS, notAfterToday, resolveRange, sanitizeDateBounds, toISODate } from "../../../utils/dates";
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

// Date presets and their resolution (today / last_7_days / this_month / all /
// custom) come from utils/dates.js — the same DATE_FILTER_PRESETS list the
// Dashboard Home and Audit Trail dropdowns render. This page previously kept
// its own DATE_MODES + resolveDateRange copy of the identical five keys; the
// shared helper is now the only implementation, so the table, the badge counts
// and every other filter row can never resolve a preset differently.
// Presets are evaluated at request time, so "Today" stays correct across a
// day/month boundary while the tab is open.

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
  const DATE_RANGE_VALUES = DATE_FILTER_PRESETS.map((preset) => preset.key);
  const rawRange = (searchParams.get("range") || "").trim();
  const urlRange = rawRange && DATE_RANGE_VALUES.includes(rawRange) ? rawRange : "";
  // Sanitised at derivation, not in the deep-link block below: the useState
  // seeds for filters/draft run on the FIRST render, where that block never
  // fires (prevDeepLink starts equal to deepLink). Same rules as the date
  // inputs and StatusCountsProvider — drop future dates, repair an inverted
  // pair (From wins, To moves) — so every consumer of this URL resolves the
  // identical window. See sanitizeDateBounds.
  const { from: urlFrom, to: urlTo } = sanitizeDateBounds(
    searchParams.get("from") || "",
    searchParams.get("to") || ""
  );
  // Default period is Today (the clean URL has no range param); an explicit
  // ?range=… or bare ?from=/?to= deep-link overrides it. StatusCountsProvider
  // resolves the very same URL with the very same rule, so the badge counts
  // and this table always describe the same window.
  const urlDateMode = urlRange || (urlFrom || urlTo ? "custom" : "today");
  // Status Views (?status=…) pre-filter the table via the URL. The compact
  // summary bar stays visible in both modes; only the page header adapts.
  const isStatusView = Boolean(urlStatus);
  const statusView = STATUS_VIEWS.find((v) => v.status === rawStatus);
  const [lookups, setLookups] = useState({ categories: [], statuses: [], severities: [] });
  const [reports, setReports] = useState([]);
  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ category: "", severity: urlSeverity, status: urlStatus, search: "", dateMode: urlDateMode, fromDate: urlFrom, toDate: urlTo, overdue: urlOverdue });
  const [draft, setDraft] = useState(filters);
  // Transient explanation for a date-input correction — the custom range
  // corrects the user as they edit (see updateCustomBound), and this is what
  // makes that correction visible instead of silent. Set on a drag or a
  // rejected future date, cleared by the next valid date edit, a preset
  // change, Apply and Reset; only rendered inside Custom Range.
  const [dateHint, setDateHint] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Bumped by reloadAll() after a mutation so the fetch effect below refetches
  // — the same refreshTick pattern MyReport uses, which keeps the loader out
  // of the effect's dependency list.
  const [refreshTick, setRefreshTick] = useState(0);
  // Report number whose Update modal is open, or null when closed.
  const [editingReport, setEditingReport] = useState(null);
  // Report number whose Moderation dialog is open (Invalid rows only), or null.
  const [moderatingReport, setModeratingReport] = useState(null);
  // Report number whose read-only detail dialog is open, or null when closed.
  const [viewingReport, setViewingReport] = useState(null);

  // Shared status counts: the sidebar Status Views badges and the summary
  // chips below read one store (see StatusCountsProvider), so the two can
  // never disagree and both refresh off the same triggers.
  const {
    counts: statusCounts,
    total: countsTotal,
    overdue: overdueCount,
    loaded: countsLoaded,
    refresh: refreshCounts,
  } = useStatusCounts();
  // Single post-mutation refresh for every modal on this page: bump the tick
  // so the table refetches and tell the counts store to refetch, so the
  // table, chips and sidebar badges all land on the new numbers together
  // (they used to wait up to 60s for the badge poll).
  const reloadAll = () => {
    setRefreshTick((tick) => tick + 1);
    refreshCounts();
  };

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
        // Already sanitised at derivation (future dates dropped, inverted
        // pairs repaired) — the seed just takes the values as they are.
        next.dateMode = urlDateMode;
        next.fromDate = urlFrom;
        next.toDate = urlTo;
      }
      return Object.keys(next).every((key) => next[key] === current[key]) ? current : next;
    };
    setFilters(applyUrl);
    setDraft(applyUrl);
  }

  // Fetch the rows for the current page and filters. The body is inlined into
  // an async IIFE — the shape every list page in this codebase uses (MyReport,
  // DashboardHome) — because calling a setState-ing helper synchronously from
  // the effect body (the old `useEffect(() => { load(); })`) trips
  // react-hooks/set-state-in-effect. `cancelled` discards a response that
  // lands after the user already changed page or filters; refreshTick re-runs
  // the fetch after a modal save without putting a loader in the deps list.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        // Resolve the date range from the selected preset or custom inputs —
        // the shared resolver, so this table and the badge counts (which read
        // the same URL) can never interpret a preset differently.
        const { from: fromDate, to: toDate } = resolveRange(filters.dateMode, new Date(), { from: filters.fromDate, to: filters.toDate });
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
        if (cancelled) return;
        setReports(reportData.results || []);
        setCount(reportData.count || 0);
        const pages = Math.max(1, reportData.total_pages || 1);
        if (page > pages) {
          // Page is past the end (e.g. after filters shrink the set) — clamp
          // and let this effect refetch.
          setPage(pages);
          return;
        }
        setTotalPages(pages);
      } catch (err) {
        if (cancelled) return;
        setError(err?.detail || err?.message || "Unable to load monitoring data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, filters, refreshTick]);

  // Filter-dropdown lookups load once per mount. Status counts deliberately
  // do NOT come from here anymore: StatusCountsProvider owns them (one request
  // for all nine buckets instead of the old request-per-status fan-out), and
  // its data has to outlive this page to keep the sidebar badges stable.
  useEffect(() => {
    let cancelled = false;
    getReportLookups()
      .then((data) => {
        if (!cancelled) setLookups(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const countFor = (...keys) => keys.reduce((sum, key) => sum + Number(statusCounts[normalize(key)] || 0), 0);
  // Active = every open report (not yet Resolved, Closed, or Invalid).
  const active = countFor("new", "assigned", "under_review", "on_hold", "dispatched", "ongoing");
  const invalid = countFor("invalid");
  const totalReports = Number(countsTotal || 0);
  // Summary chips show "—" until the shared store has a real answer instead
  // of the old fabricated 0, and hold the last known number through a failed
  // refresh (the store's failure rule).
  const chipValue = (value) => (countsLoaded ? value : "—");
  const categories = lookups.categories || [];
  const statuses = lookups.statuses || [];
  const severities = lookups.severities || [];

  const updateDraft = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  // Custom-range correction — the exact rule Analytics applies in its From/To
  // handlers (Analytics.jsx:424,436): the window must stay a valid inclusive
  // From → To pair, so whichever bound the user just set wins and the other
  // drags with it — From past To moves To forward, To before From moves From
  // back. An inverted window (which the API would read as an empty result)
  // therefore can never be applied, and because both values already passed
  // notAfterToday, a dragged bound can never be in the future either. The
  // hint surfaces the otherwise-silent correction to the user.
  const updateCustomBound = (bound, value) => {
    if (bound === "from") {
      const dragged = Boolean(value && draft.toDate && value > draft.toDate);
      setDateHint(dragged ? "To adjusted to match From" : "");
      setDraft((current) => ({ ...current, fromDate: value, toDate: dragged ? value : current.toDate }));
      return;
    }
    const dragged = Boolean(value && draft.fromDate && value < draft.fromDate);
    setDateHint(dragged ? "From adjusted to match To" : "");
    setDraft((current) => ({ ...current, toDate: value, fromDate: dragged ? value : current.fromDate }));
  };
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
    if (source.dateMode && source.dateMode !== "today") put("range", source.dateMode);
    else next.delete("range");
    const custom = source.dateMode === "custom";
    put("from", custom ? source.fromDate || "" : "");
    put("to", custom ? source.toDate || "" : "");
    return next;
  }, { replace: true });
  // Severity/overdue/date are URL-driven; Apply Filters commits the draft
  // (including the page-local category/status/search fields) and mirrors the
  // rest. Status is deliberately never written here: any ?status= would flip
  // the page into a Status View, which the sidebar/summary-bar own — so the
  // Status dropdown stays a local overview-only filter.
  const applyFilters = () => { setDateHint(""); setPage(1); setFilters(draft); syncParamsFrom(draft); };
  const reset = () => {
    // Status Views keep their locked status on reset — clearing it would
    // silently kick the user back to the Overview.
    const empty = { category: "", severity: "", status: isStatusView ? urlStatus : "", search: "", dateMode: "today", fromDate: "", toDate: "", overdue: false };
    setDateHint(""); setPage(1); setDraft(empty); setFilters(empty);
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
          <span className="summary-text"><span className="summary-label">TOTAL REPORTS</span><strong>{chipValue(totalReports)}</strong></span>
        </button>
        <div className="summary-metric summary-metric-static" title="New + Assigned + Under Review + On-Hold + Dispatched + Ongoing">
          <span className="summary-icon summary-icon-active"><ActivityIcon size={18} /></span>
          <span className="summary-text"><span className="summary-label">ACTIVE</span><strong>{chipValue(active)}</strong></span>
        </div>
        <button type="button" className="summary-metric" title="View Resolved reports" onClick={() => openStatusView("resolved")}>
          <span className="summary-icon summary-icon-resolved"><CheckIcon size={18} /></span>
          <span className="summary-text"><span className="summary-label">RESOLVED</span><strong>{chipValue(countFor("resolved"))}</strong></span>
        </button>
        <button type="button" className="summary-metric" title="View Invalid reports" onClick={() => openStatusView("invalid")}>
          <span className="summary-icon summary-icon-invalid"><FlagIcon size={18} /></span>
          <span className="summary-text"><span className="summary-label">INVALID</span><strong>{chipValue(invalid)}</strong></span>
        </button>
        <button type="button" className={`summary-metric${filters.overdue ? " summary-metric-toggled" : ""}`} title="Toggle the Overdue only filter" aria-pressed={filters.overdue} onClick={toggleOverdue}>
          <span className="summary-icon summary-icon-overdue"><ClockIcon size={18} /></span>
          <span className="summary-text"><span className="summary-label">OVERDUE (SLA)</span><strong>{chipValue(overdueCount)}</strong></span>
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
            <select value={draft.dateMode} onChange={(e) => { setDateHint(""); updateDraft("dateMode", e.target.value); }}>
              {DATE_FILTER_PRESETS.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
            {draft.dateMode === "custom" && (
              <div className="date-range">
                <span>From</span>
                <input
                  type="date"
                  value={draft.fromDate}
                  max={toISODate(new Date())}
                  onChange={(e) => {
                    // Same rejection as Analytics: the controlled input snaps
                    // back to its previous date — say why instead of leaving
                    // the user to guess.
                    if (!notAfterToday(e.target.value)) {
                      setDateHint("Dates can't be in the future");
                      return;
                    }
                    updateCustomBound("from", e.target.value);
                  }}
                />
                <span>to</span>
                <input
                  type="date"
                  value={draft.toDate}
                  max={toISODate(new Date())}
                  onChange={(e) => {
                    if (!notAfterToday(e.target.value)) {
                      setDateHint("Dates can't be in the future");
                      return;
                    }
                    updateCustomBound("to", e.target.value);
                  }}
                />
              </div>
            )}
            {draft.dateMode === "custom" && dateHint && (
              <p className="date-range-hint" role="status">{dateHint}</p>
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
                <td title={report.category || ""}><span className="cell-truncate">{report.category}</span></td>
                <td title={report.address || ""}><span className="cell-truncate">{report.address || "—"}</span></td>
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
          onSaved={reloadAll}
        />
      )}

      {moderatingReport && (
        <ReportModerationModal
          reportNumber={moderatingReport}
          onClose={() => setModeratingReport(null)}
          onChanged={reloadAll}
        />
      )}

      {viewingReport && (
        <ReportDetail
          reportNumber={viewingReport}
          onClose={() => setViewingReport(null)}
          onChanged={reloadAll}
        />
      )}
    </DashboardLayout>
  );
}
