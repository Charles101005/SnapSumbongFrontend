import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import "./ReportsHistory.css";

const MOCK_REPORTS = [
  { id: "HIZ-4421", category: "Uneven Roads", location: "Sampaloc, Manila", dateReported: "Oct 14, 2025", status: "RESOLVED", severity: "P5" },
  { id: "HIZ-4422", category: "Road Debris", location: "Ermita, Manila", dateReported: "Oct 15, 2025", status: "ONGOING", severity: "P3" },
  { id: "HIZ-4423", category: "Potholes", location: "Brgy 724, Manila", dateReported: "Oct 16, 2025", status: "PENDING", severity: "P1" },
  { id: "HIZ-4424", category: "Uneven Roads", location: "Binondo, Manila", dateReported: "Oct 17, 2025", status: "PENDING", severity: "P3" },
  { id: "HIZ-4425", category: "Road Debris", location: "Sampaloc, Manila", dateReported: "Oct 18, 2025", status: "ONGOING", severity: "P5" },
  { id: "HIZ-4426", category: "Potholes", location: "Malate, Manila", dateReported: "Oct 19, 2025", status: "PENDING", severity: "P1" },
  { id: "HIZ-4427", category: "Uneven Roads", location: "Santa Cruz, Manila", dateReported: "Oct 20, 2025", status: "RESOLVED", severity: "P5" },
  { id: "HIZ-4428", category: "Road Debris", location: "Intramuros, Manila", dateReported: "Oct 21, 2025", status: "ONGOING", severity: "P3" },
  { id: "HIZ-4429", category: "Potholes", location: "Tondo, Manila", dateReported: "Oct 22, 2025", status: "PENDING", severity: "P1" },
  { id: "HIZ-4430", category: "Flooding", location: "Quiapo, Manila", dateReported: "Oct 23, 2025", status: "RESOLVED", severity: "P4" },
  { id: "HIZ-4431", category: "Fallen Tree", location: "San Andres, Manila", dateReported: "Oct 24, 2025", status: "ONGOING", severity: "P2" },
  { id: "HIZ-4432", category: "Garbage Buildup", location: "Paco, Manila", dateReported: "Oct 25, 2025", status: "RESOLVED", severity: "P5" },
  { id: "HIZ-4433", category: "Flooding", location: "Sampaloc, Manila", dateReported: "Oct 26, 2025", status: "ONGOING", severity: "P3" },
  { id: "HIZ-4434", category: "Potholes", location: "Ermita, Manila", dateReported: "Oct 27, 2025", status: "RESOLVED", severity: "P4" },
  { id: "HIZ-4435", category: "Uneven Roads", location: "Binondo, Manila", dateReported: "Oct 28, 2025", status: "PENDING", severity: "P2" },
  { id: "HIZ-4436", category: "Road Debris", location: "Tondo, Manila", dateReported: "Oct 29, 2025", status: "RESOLVED", severity: "P5" },
  { id: "HIZ-4437", category: "Fallen Tree", location: "Quiapo, Manila", dateReported: "Oct 30, 2025", status: "ONGOING", severity: "P1" },
  { id: "HIZ-4438", category: "Garbage Buildup", location: "Malate, Manila", dateReported: "Oct 31, 2025", status: "RESOLVED", severity: "P3" },
  { id: "HIZ-4439", category: "Flooding", location: "Santa Cruz, Manila", dateReported: "Nov 1, 2025", status: "PENDING", severity: "P4" },
  { id: "HIZ-4440", category: "Potholes", location: "Intramuros, Manila", dateReported: "Nov 2, 2025", status: "RESOLVED", severity: "P2" },
  { id: "HIZ-4441", category: "Uneven Roads", location: "San Andres, Manila", dateReported: "Nov 3, 2025", status: "ONGOING", severity: "P5" },
  { id: "HIZ-4442", category: "Road Debris", location: "Paco, Manila", dateReported: "Nov 4, 2025", status: "PENDING", severity: "P1" },
  { id: "HIZ-4443", category: "Garbage Buildup", location: "Sampaloc, Manila", dateReported: "Nov 5, 2025", status: "RESOLVED", severity: "P3" },
  { id: "HIZ-4444", category: "Fallen Tree", location: "Ermita, Manila", dateReported: "Nov 6, 2025", status: "ONGOING", severity: "P4" },
];

const CATEGORIES = ["All Categories", "Uneven Roads", "Road Debris", "Potholes", "Flooding", "Fallen Tree", "Garbage Buildup"];
const SEVERITIES = ["All Severities", "P1", "P2", "P3", "P4", "P5"];
const STATUSES = ["All Statuses", "RESOLVED", "ONGOING", "PENDING"];
const ROWS_PER_PAGE = 9;

export default function ReportsHistory() {
  const [draftCategory, setDraftCategory] = useState("All Categories");
  const [draftSeverity, setDraftSeverity] = useState("All Severities");
  const [draftStatus, setDraftStatus] = useState("All Statuses");
  const [draftSearch, setDraftSearch] = useState("");
  const [draftDateFrom, setDraftDateFrom] = useState("");
  const [draftDateTo, setDraftDateTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [severityFilter, setSeverityFilter] = useState("All Severities");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeNav, setActiveNav] = useState("history");

  const filteredReports = useMemo(() => {
    return MOCK_REPORTS.filter((report) => {
      if (categoryFilter !== "All Categories" && report.category !== categoryFilter) return false;
      if (severityFilter !== "All Severities" && report.severity !== severityFilter) return false;
      if (statusFilter !== "All Statuses" && report.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          report.id.toLowerCase().includes(q) ||
          report.category.toLowerCase().includes(q) ||
          report.location.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [categoryFilter, severityFilter, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / ROWS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedReports = filteredReports.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);
  const startRow = filteredReports.length === 0 ? 0 : (safePage - 1) * ROWS_PER_PAGE + 1;
  const endRow = Math.min(safePage * ROWS_PER_PAGE, filteredReports.length);

  const handleApplyFilters = () => {
    setCategoryFilter(draftCategory);
    setSeverityFilter(draftSeverity);
    setStatusFilter(draftStatus);
    setSearchQuery(draftSearch);
    setDateFrom(draftDateFrom);
    setDateTo(draftDateTo);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setDraftCategory("All Categories");
    setDraftSeverity("All Severities");
    setDraftStatus("All Statuses");
    setDraftSearch("");
    setDraftDateFrom("");
    setDraftDateTo("");
    setCategoryFilter("All Categories");
    setSeverityFilter("All Severities");
    setStatusFilter("All Statuses");
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="sidebar-logo">
              <RocketIcon />
            </div>
            <span className="sidebar-brand-name">SnapSumbong</span>
          </div>

          <nav className="sidebar-nav">
            <Link to="/report-management" className={`sidebar-nav-item ${activeNav === "reports" ? "active" : ""}`} onClick={() => setActiveNav("reports")}>
              <ClipboardIcon />
              <span>Report Management</span>
            </Link>
            <div className="sidebar-nav-section">
              <Link to="/monitoring" className={`sidebar-nav-item parent ${["monitoring", "overview", "history"].includes(activeNav) ? "active" : ""}`}>
                <MonitorIcon />
                <span>Monitoring</span>
              </Link>
              <div className="sidebar-subnav">
                <Link to="/monitoring" className={`sidebar-subnav-item ${activeNav === "overview" ? "active" : ""}`} onClick={() => setActiveNav("overview")}>
                  Reports Overview
                </Link>
                <Link to="/monitoring/history" className={`sidebar-subnav-item ${activeNav === "history" ? "active" : ""}`} onClick={() => setActiveNav("history")}>
                  Reports History
                </Link>
              </div>
            </div>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              <UserIcon />
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">Report Officer</span>
              <span className="sidebar-user-role">admin</span>
            </div>
          </div>
          <button className="sidebar-logout">
            <LogoutIcon />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1 className="dashboard-page-title">Report History</h1>
        </header>

        <div className="dashboard-content">
          <div className="section-header">
            <h2 className="section-title">Report History Overview</h2>
            <p className="section-subtitle">View historical logs and status updates for all submitted reports.</p>
          </div>

          <div className="filters-section">
            <div className="filters-row">
              <div className="filter-group">
                <label className="filter-label">Category</label>
                <select className="filter-select" value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">Severity</label>
                <select className="filter-select" value={draftSeverity} onChange={(e) => setDraftSeverity(e.target.value)}>
                  {SEVERITIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">Status</label>
                <select className="filter-select" value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group filter-group-search">
                <label className="filter-label">Search</label>
                <div className="search-input-wrapper">
                  <SearchIcon />
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="Search"
                    value={draftSearch}
                    onChange={(e) => setDraftSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="filters-row filters-row-secondary">
              <div className="filter-group">
                <label className="filter-label">Date Range</label>
                <div className="date-range-wrapper">
                  <input type="date" className="filter-date" value={draftDateFrom} onChange={(e) => setDraftDateFrom(e.target.value)} placeholder="mm/dd/yyyy" />
                  <span className="date-range-separator">to</span>
                  <input type="date" className="filter-date" value={draftDateTo} onChange={(e) => setDraftDateTo(e.target.value)} placeholder="mm/dd/yyyy" />
                </div>
              </div>
              <div className="filter-actions">
                <button className="btn-apply" onClick={handleApplyFilters}>
                  <FilterIcon />
                  Apply Filters
                </button>
                <button className="btn-reset" onClick={handleReset}>Reset</button>
              </div>
            </div>
          </div>

          <div className="table-container">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>REPORT ID</th>
                  <th>CATEGORY</th>
                  <th>LOCATION</th>
                  <th>DATE REPORTED</th>
                  <th>STATUS</th>
                  <th>SEVERITY</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReports.length > 0 ? (
                  paginatedReports.map((report) => (
                    <tr key={report.id}>
                      <td><span className="report-id-link">{report.id}</span></td>
                      <td>{report.category}</td>
                      <td>{report.location}</td>
                      <td>{report.dateReported}</td>
                      <td>
                        <span className={`status-badge status-${report.status.toLowerCase()}`}>
                          {report.status.replace("_", " ")}
                        </span>
                      </td>
                      <td>
                        <span className={`severity-badge severity-${report.severity.toLowerCase()}`}>
                          {report.severity}
                        </span>
                      </td>
                      <td><Link to="/report-management" className="action-link">Manage</Link></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-table-message">No reports found matching your filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <span className="pagination-info">
              Showing {startRow} to {endRow} of {filteredReports.length} reports
            </span>
            <div className="pagination-buttons">
              <button className="pagination-btn" disabled={safePage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`pagination-btn ${page === safePage ? "active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button className="pagination-btn" disabled={safePage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function RocketIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}
