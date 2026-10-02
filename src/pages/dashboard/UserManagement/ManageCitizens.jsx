import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import "./ManageCitizens.css";
import mockData from "../../../data/mock.json";

const { citizens: MOCK_CITIZENS } = mockData;
const ROWS_PER_PAGE = 8;

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

export default function ManageCitizens() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [draftSearch, setDraftSearch] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredCitizens = useMemo(() => {
    return MOCK_CITIZENS.filter((citizen) => {
      if (statusFilter && citizen.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!citizen.name.toLowerCase().includes(q) && !citizen.email.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [statusFilter, searchQuery]);

  const totalCitizens = filteredCitizens.length;
  const totalPages = Math.ceil(totalCitizens / ROWS_PER_PAGE);
  const safePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const startRow = (safePage - 1) * ROWS_PER_PAGE + 1;
  const endRow = Math.min(safePage * ROWS_PER_PAGE, totalCitizens);

  const paginatedCitizens = filteredCitizens.slice(startRow - 1, endRow);

  const handleApplyFilters = () => {
    setSearchQuery(draftSearch);
    setStatusFilter(draftStatus);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setDraftSearch("");
    setDraftStatus("");
    setSearchQuery("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  return (
    <DashboardLayout title="Citizen Users">
      <div className="manage-citizens-page">
        <div className="breadcrumb">
          <Link to="/dashboard/users/roles" className="breadcrumb-link">User Management</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Citizens</span>
        </div>

        <div className="section-header">
          <h2 className="section-title">Citizen Users</h2>
          <p className="section-subtitle">
            Manage registered citizen accounts and monitor their reporting activity.
          </p>
        </div>

        <div className="filter-card">
          <div className="filter-row">
            <div className="filter-field filter-field-search">
              <label className="filter-label">Search Citizens</label>
              <div className="filter-search-wrap">
                <SearchIcon />
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Search by name or email..."
                  value={draftSearch}
                  onChange={(e) => setDraftSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                />
              </div>
            </div>
            <div className="filter-field">
              <label className="filter-label">Account Status</label>
              <select className="filter-select" value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="DEACTIVATED">Deactivated</option>
              </select>
            </div>
            <div className="filter-buttons">
              <button className="btn-filter-apply" onClick={handleApplyFilters}>
                <FilterIcon />
                Apply Filters
              </button>
              <button className="btn-filter-reset" onClick={handleReset}>Reset</button>
            </div>
          </div>
        </div>

        <div className="table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>USER</th>
                <th>EMAIL ADDRESS</th>
                <th>ACCOUNT STATUS</th>
                <th>LAST ACTIVITY</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCitizens.length > 0 ? (
                paginatedCitizens.map((citizen) => (
                  <tr key={citizen.id}>
                    <td>
                      <span className="citizen-name">{citizen.name}</span>
                    </td>
                    <td>{citizen.email}</td>
                    <td>
                      <span className={`status-badge status-${citizen.status.toLowerCase()}`}>
                        {citizen.status === "ACTIVE" ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="last-activity-cell">{citizen.lastActivity}</td>
                    <td>
                      <button className="action-link" onClick={() => navigate(`/dashboard/users/citizens/${citizen.id}`)}>Manage</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-table-message">No citizens found matching your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span className="pagination-info">
            Showing {startRow} to {endRow} of {totalCitizens.toLocaleString()} Citizens
          </span>
          <div className="pagination-buttons">
            <button
              className="pagination-btn"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
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
            <button
              className="pagination-btn"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
