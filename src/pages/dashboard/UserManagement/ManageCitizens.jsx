import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import CitizenProfileModal from "./CitizenProfileModal";
import "./ManageCitizens.css";
import mockData from "../../../data/mock.json";

const { citizens: MOCK_CITIZENS, citizenProfiles: MOCK_CITIZEN_PROFILES } = mockData;
const ROWS_PER_PAGE = 8;

const buildFullName = ({ firstName, middleName, lastName }) =>
  [firstName, middleName ? `${middleName.charAt(0)}.` : "", lastName].filter(Boolean).join(" ");

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

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

export default function ManageCitizens() {
  const [citizens, setCitizens] = useState(MOCK_CITIZENS);
  const [citizenProfiles, setCitizenProfiles] = useState(MOCK_CITIZEN_PROFILES);
  const [managing, setManaging] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [draftSearch, setDraftSearch] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredCitizens = useMemo(() => {
    return citizens.filter((citizen) => {
      if (statusFilter && citizen.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!citizen.name.toLowerCase().includes(q) && !citizen.email.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [citizens, statusFilter, searchQuery]);

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

  // Merge the modal's edits into the table row + profile store so the list
  // reflects the change without a reload (mock data, session state only).
  const handleSaved = (updates) => {
    const managingId = managing?.id;
    setCitizenProfiles((current) => ({
      ...current,
      [managingId]: { ...current[managingId], ...updates },
    }));
    setCitizens((current) =>
      current.map((citizen) =>
        citizen.id === managingId
          ? { ...citizen, name: buildFullName(updates), email: updates.email, status: updates.status }
          : citizen
      )
    );
  };

  const managingCitizen = citizens.find((citizen) => citizen.id === managing?.id) || null;

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
                      <div className="action-icon-group">
                        <button
                          type="button"
                          className="action-icon-btn"
                          title={`View ${citizen.name}`}
                          aria-label={`View ${citizen.name}`}
                          onClick={() => setManaging({ id: citizen.id, mode: "view" })}
                        >
                          <EyeIcon />
                        </button>
                        <button
                          type="button"
                          className="action-icon-btn"
                          title={`Edit ${citizen.name}`}
                          aria-label={`Edit ${citizen.name}`}
                          onClick={() => setManaging({ id: citizen.id, mode: "edit" })}
                        >
                          <PencilIcon />
                        </button>
                      </div>
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

      {managing?.id != null && managingCitizen && (
        <CitizenProfileModal
          citizen={managingCitizen}
          profile={citizenProfiles[managing.id]}
          mode={managing.mode}
          onClose={() => setManaging(null)}
          onSaved={handleSaved}
        />
      )}
    </DashboardLayout>
  );
}
