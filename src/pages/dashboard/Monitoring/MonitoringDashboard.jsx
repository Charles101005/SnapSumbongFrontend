import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import ReportDetail from "./ReportDetail";
import "./MonitoringDashboard.css";

const MOCK_REPORTS = [
  { id: "HRZ-4421", category: "Uneven Roads", location: "Sampaloc, Manila", dateReported: "Oct 14, 2025", status: "PENDING", severity: "P5" },
  { id: "HRZ-4422", category: "Road Debris", location: "Ermita, Manila", dateReported: "Oct 15, 2025", status: "RESOLVED", severity: "P4" },
  { id: "HRZ-4423", category: "Potholes", location: "Brgy 724, Manila", dateReported: "Oct 16, 2025", status: "PENDING", severity: "P3" },
  { id: "HRZ-4424", category: "Uneven Roads", location: "Binondo, Manila", dateReported: "Oct 17, 2025", status: "PENDING", severity: "P2" },
  { id: "HRZ-4425", category: "Flooding", location: "Tondo, Manila", dateReported: "Oct 18, 2025", status: "RESOLVED", severity: "P5" },
  { id: "HRZ-4426", category: "Fallen Tree", location: "Quiapo, Manila", dateReported: "Oct 18, 2025", status: "IN_PROGRESS", severity: "P4" },
  { id: "HRZ-4427", category: "Garbage Buildup", location: "San Andres, Manila", dateReported: "Oct 19, 2025", status: "PENDING", severity: "P3" },
  { id: "HRZ-4428", category: "Road Debris", location: "Malate, Manila", dateReported: "Oct 19, 2025", status: "RESOLVED", severity: "P5" },
  { id: "HRZ-4429", category: "Potholes", location: "Paco, Manila", dateReported: "Oct 20, 2025", status: "IN_PROGRESS", severity: "P4" },
  { id: "HRZ-4430", category: "Flooding", location: "Sampaloc, Manila", dateReported: "Oct 20, 2025", status: "RESOLVED", severity: "P3" },
  { id: "HRZ-4431", category: "Uneven Roads", location: "Ermita, Manila", dateReported: "Oct 21, 2025", status: "PENDING", severity: "P2" },
  { id: "HRZ-4432", category: "Fallen Tree", location: "Binondo, Manila", dateReported: "Oct 21, 2025", status: "RESOLVED", severity: "P5" },
  { id: "HRZ-4433", category: "Garbage Buildup", location: "Tondo, Manila", dateReported: "Oct 22, 2025", status: "IN_PROGRESS", severity: "P4" },
  { id: "HRZ-4434", category: "Potholes", location: "Quiapo, Manila", dateReported: "Oct 22, 2025", status: "RESOLVED", severity: "P3" },
  { id: "HRZ-4435", category: "Road Debris", location: "San Andres, Manila", dateReported: "Oct 23, 2025", status: "PENDING", severity: "P2" },
  { id: "HRZ-4436", category: "Flooding", location: "Malate, Manila", dateReported: "Oct 23, 2025", status: "RESOLVED", severity: "P5" },
  { id: "HRZ-4437", category: "Uneven Roads", location: "Paco, Manila", dateReported: "Oct 24, 2025", status: "IN_PROGRESS", severity: "P4" },
  { id: "HRZ-4438", category: "Fallen Tree", location: "Sampaloc, Manila", dateReported: "Oct 24, 2025", status: "RESOLVED", severity: "P3" },
  { id: "HRZ-4439", category: "Garbage Buildup", location: "Ermita, Manila", dateReported: "Oct 25, 2025", status: "PENDING", severity: "P2" },
  { id: "HRZ-4440", category: "Potholes", location: "Binondo, Manila", dateReported: "Oct 25, 2025", status: "RESOLVED", severity: "P5" },
  { id: "HRZ-4441", category: "Road Debris", location: "Tondo, Manila", dateReported: "Oct 26, 2025", status: "IN_PROGRESS", severity: "P4" },
  { id: "HRZ-4442", category: "Flooding", location: "Quiapo, Manila", dateReported: "Oct 26, 2025", status: "RESOLVED", severity: "P3" },
  { id: "HRZ-4443", category: "Uneven Roads", location: "San Andres, Manila", dateReported: "Oct 27, 2025", status: "PENDING", severity: "P2" },
  { id: "HRZ-4444", category: "Fallen Tree", location: "Malate, Manila", dateReported: "Oct 27, 2025", status: "RESOLVED", severity: "P5" },
];

const CATEGORIES = ["All Categories", "Uneven Roads", "Road Debris", "Potholes", "Flooding", "Fallen Tree", "Garbage Buildup"];
const SEVERITIES = ["All Severities", "P1", "P2", "P3", "P4", "P5"];
const STATUSES = ["All Statuses", "PENDING", "IN_PROGRESS", "RESOLVED"];
const ROWS_PER_PAGE = 4;

const ROLE = "officer"; /*or "supervisor" for Action Buttons*/

function ClipboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
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

export default function MonitoringDashboard() {
  const [selectedReportId, setSelectedReportId] = useState(null);
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

  const stats = useMemo(() => {
    const total = MOCK_REPORTS.length;
    const resolved = MOCK_REPORTS.filter((r) => r.status === "RESOLVED").length;
    const inProgress = MOCK_REPORTS.filter((r) => r.status === "IN_PROGRESS").length;
    const pending = MOCK_REPORTS.filter((r) => r.status === "PENDING").length;
    return { total, resolved, inProgress, pending };
  }, []);

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
    <DashboardLayout title="Management Overview">
      {selectedReportId ? (
        <ReportDetail
          reportId={selectedReportId}
          onClose={() => setSelectedReportId(null)}
        />
      ) : (
        <>
          <div className="section-header">
            <h2 className="section-title">Reports Overview</h2>
            <p className="section-subtitle">Manage and monitor citizen reports for community improvement.</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card stat-total">
              <div className="stat-icon stat-icon-total">
                <ClipboardIcon />
              </div>
              <div className="stat-info">
                <span className="stat-label">TOTAL REPORTS</span>
                <span className="stat-value">{stats.total}</span>
              </div>
            </div>
            <div className="stat-card stat-resolved">
              <div className="stat-icon stat-icon-resolved">
                <CheckCircleIcon />
              </div>
              <div className="stat-info">
                <span className="stat-label">RESOLVED</span>
                <span className="stat-value">{stats.resolved}</span>
              </div>
            </div>
            <div className="stat-card stat-progress">
              <div className="stat-icon stat-icon-progress">
                <ClockIcon />
              </div>
              <div className="stat-info">
                <span className="stat-label">IN PROGRESS</span>
                <span className="stat-value">{stats.inProgress}</span>
              </div>
            </div>
            <div className="stat-card stat-pending">
              <div className="stat-icon stat-icon-pending">
                <AlertIcon />
              </div>
              <div className="stat-info">
                <span className="stat-label">PENDING</span>
                <span className="stat-value">{stats.pending}</span>
              </div>
            </div>
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
                      <td>
                        {ROLE === "officer" ? (
                          <Link to="/dashboard/report-management" className="action-link">Manage</Link>
                        ) : (
                          <button className="action-link action-view-btn" onClick={() => setSelectedReportId(report.id)}>
                            View Details
                          </button>
                        )}
                      </td>
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
        </>
      )}
    </DashboardLayout>
  );
}
