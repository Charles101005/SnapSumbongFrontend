import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import { getReportLookups, getReports } from "../../../api/reports";
import "./MonitoringDashboard.css";

const PAGE_SIZE = 10;
const valueOf = (item) => item?.value || item;
const labelOf = (item) => item?.label || item;
const normalize = (value) => String(value || "").toLowerCase().replace(/[\s-]+/g, "_");

const prettifyStatus = (status) => normalize(status).split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ").replace(/^On Hold$/i, "On-Hold");
const displayStatus = (status, statuses = []) => {
  const match = statuses.find((s) => valueOf(s) === status || labelOf(s) === status);
  return match ? labelOf(match) : (status ? prettifyStatus(status) : "—");
};

const statusClass = (status) => normalize(status);

function ClipboardIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>; }
function CheckIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></svg>; }
function UnderReviewIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/></svg>; }
function DispatchedIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h15M13 6l6 6-6 6"/></svg>; }
function SearchIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>; }
function FilterIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M7 12h10M10 18h4"/></svg>; }

export default function MonitoringDashboard() {
  const [lookups, setLookups] = useState({ categories: [], statuses: [], severities: [] });
  const [statusStats, setStatusStats] = useState({});
  const [reports, setReports] = useState([]);
  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ category: "", severity: "", status: "", search: "", fromDate: "", toDate: "" });
  const [draft, setDraft] = useState(filters);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const reportData = await getReports({
        q: filters.search || undefined,
        category_id: filters.category || undefined,
        status: filters.status || undefined,
        severity: filters.severity || undefined,
        from_date: filters.fromDate || undefined,
        to_date: filters.toDate || undefined,
        // The API's exclude_closed flag filters out phase-four reports,
        // including both resolved and closed statuses.
        exclude_closed: true,
        page,
        page_size: PAGE_SIZE,
      });
      setReports(reportData.results || []);
      setCount(reportData.count || 0);
      setTotalPages(Math.max(1, reportData.total_pages || 1));
    } catch (err) {
      setError(err?.detail || err?.message || "Unable to load monitoring data.");
    } finally {
      setLoading(false);
    }
  };

  // The overview cards use the API's current status buckets. Fetch a count
  // per real status because the reports endpoint returns exact counts.
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
  const resolved = countFor("resolved", "closed");
  const underReview = countFor("under_review");
  const dispatched = countFor("dispatched");
  const totalReports = Object.values(statusStats).reduce((sum, n) => sum + Number(n || 0), 0) || count;
  const categories = lookups.categories || [];
  const statuses = lookups.statuses || [];
  const overviewStatuses = statuses.filter((status) => !["resolved", "closed"].includes(normalize(valueOf(status))));
  const severities = lookups.severities || [];

  const updateDraft = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const applyFilters = () => { setPage(1); setFilters(draft); };
  const reset = () => {
    const empty = { category: "", severity: "", status: "", search: "", fromDate: "", toDate: "" };
    setPage(1); setDraft(empty); setFilters(empty);
  };

  return (
    <DashboardLayout title="Monitoring Dashboard - Table View">
      <div className="section-header">
        <h2 className="section-title">Reports Overview</h2>
        <p className="section-subtitle">Manage and monitor citizen reports for community improvement.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon stat-icon-total"><ClipboardIcon /></div><div><span className="stat-label">TOTAL REPORTS</span><strong>{totalReports}</strong></div></div>
        <div className="stat-card"><div className="stat-icon stat-icon-resolved"><CheckIcon /></div><div><span className="stat-label">RESOLVED</span><strong>{resolved}</strong></div></div>
        <div className="stat-card"><div className="stat-icon stat-icon-under-review"><UnderReviewIcon /></div><div><span className="stat-label">UNDER REVIEW</span><strong>{underReview}</strong></div></div>
        <div className="stat-card"><div className="stat-icon stat-icon-dispatched"><DispatchedIcon /></div><div><span className="stat-label">DISPATCHED</span><strong>{dispatched}</strong></div></div>
      </div>

      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group"><label>Category</label><select value={draft.category} onChange={(e) => updateDraft("category", e.target.value)}><option value="">All Categories</option>{categories.map((c) => <option key={c.hazard_id} value={c.hazard_id}>{c.hazard_name}</option>)}</select></div>
          <div className="filter-group"><label>Severity</label><select value={draft.severity} onChange={(e) => updateDraft("severity", e.target.value)}><option value="">All Severities</option>{severities.map((s) => <option key={valueOf(s)} value={valueOf(s)}>{labelOf(s)}</option>)}</select></div>
          <div className="filter-group"><label>Status</label><select value={draft.status} onChange={(e) => updateDraft("status", e.target.value)}><option value="">All Statuses</option>{overviewStatuses.map((s) => <option key={valueOf(s)} value={valueOf(s)}>{labelOf(s)}</option>)}</select></div>
          <div className="filter-group filter-search"><label>Search</label><div className="search-wrap"><SearchIcon/><input placeholder="Search" value={draft.search} onChange={(e) => updateDraft("search", e.target.value)} onKeyDown={(e) => e.key === "Enter" && applyFilters()} /></div></div>
        </div>
        <div className="filters-row filter-bottom">
          <div className="filter-group"><label>Date Range</label><div className="date-range"><span>From</span><input type="date" value={draft.fromDate} onChange={(e) => updateDraft("fromDate", e.target.value)} /><span>to</span><input type="date" value={draft.toDate} onChange={(e) => updateDraft("toDate", e.target.value)} /></div></div>
          <div className="filter-actions"><button className="btn-apply" onClick={applyFilters}><FilterIcon/>Apply Filters</button><button className="btn-reset" onClick={reset}>Reset</button></div>
        </div>
      </div>

      {error && <div className="form-error">{typeof error === "string" ? error : JSON.stringify(error)}</div>}

      <div className="table-container">
        <table className="reports-table">
          <thead><tr><th>REPORT ID</th><th>CATEGORY</th><th>LOCATION</th><th>DATE REPORTED</th><th>STATUS</th><th>SEVERITY</th><th>ACTION</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="7" className="empty-table-message">Loading reports...</td></tr> : reports.length ? reports.map((report) => (
              <tr key={report.report_number}>
                <td className="report-number">{report.report_number}</td><td>{report.category}</td><td>{report.address || "—"}</td><td>{new Date(report.created_at).toLocaleDateString()}</td>
                <td><span className={`status-badge status-${statusClass(report.status)}`}>{displayStatus(report.status, statuses)}</span></td><td><span className={`severity-badge severity-${String(report.severity || "").toLowerCase()}`}>{report.severity || "—"}</span></td>
                <td><Link to={`/dashboard/report-management?report=${encodeURIComponent(report.report_number)}`} className="action-link">Manage</Link></td>
              </tr>
            )) : <tr><td colSpan="7" className="empty-table-message">No reports found.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="pagination"><span>Showing {reports.length ? ((page - 1) * PAGE_SIZE) + 1 : 0} to {Math.min(page * PAGE_SIZE, count)} of {count} reports</span><div><button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button><button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button></div></div>
    </DashboardLayout>
  );
}
