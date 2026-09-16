import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import "./ReportsHistory.css";
import mockData from "../../../data/mock.json";

const { reportsHistory: MOCK_REPORTS, constants } = mockData;
const { categories: CATEGORIES, severities: SEVERITIES, historyStatuses: STATUSES } = constants;
const ROWS_PER_PAGE = 9;

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
    <DashboardLayout title="Report History">
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
                  <td><Link to="/dashboard/report-management" className="action-link">Manage</Link></td>
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
    </DashboardLayout>
  );
}
