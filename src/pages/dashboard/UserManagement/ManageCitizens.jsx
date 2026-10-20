import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import Pagination from "../../../components/shared/Pagination";
import CitizenProfileModal from "./CitizenProfileModal";
import "./ManageCitizens.css";
import { getCitizens } from "../../../api/users";
import { useAuth } from "../../../context/authContext";
import { PERMISSIONS } from "../../../shared/constants";
import { MOCK_ALL_ACCESS } from "../../../shared/config/env";
import { formatLastActive } from "../../../utils/format";

const ROWS_PER_PAGE = 8;

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "true", label: "Active" },
  { value: "false", label: "Deactivated" },
];

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
  const { user: authUser } = useAuth();
  const permissions = authUser?.permissions || [];
  // MOCK_ALL_ACCESS short-circuits the permission check (same as Sidebar).
  const can = (permission) => MOCK_ALL_ACCESS || permissions.includes(permission);
  // Only the account status is editable in the modal — gate the Edit action
  // on the same permissions the save endpoint requires.
  const canEditStatus = can(PERMISSIONS.USER_DEACTIVATE_ANY) || can(PERMISSIONS.USER_ACTIVATE_ANY);

  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Bumped after a successful modal save to re-run the fetch effect.
  const [refreshKey, setRefreshKey] = useState(0);
  const [managing, setManaging] = useState(null); // { userNumber, mode }
  const [draftSearch, setDraftSearch] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "true" | "false" | ""

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getCitizens({
          q: searchQuery || undefined,
          is_active: statusFilter || undefined,
          page: currentPage,
          page_size: ROWS_PER_PAGE,
        });
        if (cancelled) return;
        const pages = data.total_pages || 1;
        if (currentPage > pages) {
          // Page is past the end (e.g. after deactivations) — clamp and refetch.
          setCurrentPage(pages);
          return;
        }
        setRows(data.results || []);
        setCount(data.count || 0);
        setTotalPages(pages);
      } catch (err) {
        if (cancelled) return;
        setRows([]);
        setCount(0);
        setTotalPages(1);
        setError(err?.detail || "Failed to load citizens. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [searchQuery, statusFilter, currentPage, refreshKey]);

  const handleApplyFilters = () => {
    setSearchQuery(draftSearch.trim());
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

  const safePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const startRow = count === 0 ? 0 : (safePage - 1) * ROWS_PER_PAGE + 1;
  const endRow = Math.min(safePage * ROWS_PER_PAGE, count);

  return (
    <DashboardLayout title="Citizen Users">
      <div className="manage-citizens-page">
        <div className="breadcrumb">
          <Link to="/dashboard/users/employees" className="breadcrumb-link">User Management</Link>
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
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
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
                <th>WARNINGS</th>
                <th>LAST ACTIVITY</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="empty-table-message">Loading citizens...</td>
                </tr>
              ) : error && rows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-table-message">
                    {error}{" "}
                    <button
                      type="button"
                      className="retry-link"
                      onClick={() => setRefreshKey((key) => key + 1)}
                    >
                      Try again
                    </button>
                  </td>
                </tr>
              ) : rows.length > 0 ? (
                rows.map((citizen) => {
                  const status = citizen.is_active ? "ACTIVE" : "DEACTIVATED";
                  const warnings = Number(citizen.warning_count || 0);
                  return (
                    <tr key={citizen.user_number}>
                      <td>
                        <span className="citizen-name">{citizen.full_name}</span>
                      </td>
                      <td>{citizen.email}</td>
                      <td>
                        <span className={`status-badge status-${status.toLowerCase()}`}>
                          {status === "ACTIVE" ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`warning-count-pill ${warnings >= 3 ? "warning-count-danger" : warnings > 0 ? "warning-count-warn" : ""}`}
                          title={warnings > 0 ? `${warnings} warning${warnings === 1 ? "" : "s"} on record` : "No warnings on record"}
                        >
                          {warnings}
                        </span>
                      </td>
                      <td className="last-activity-cell">{formatLastActive(citizen.last_active)}</td>
                      <td>
                        <div className="action-icon-group">
                          <button
                            type="button"
                            className="action-icon-btn"
                            title={`View ${citizen.full_name}`}
                            aria-label={`View ${citizen.full_name}`}
                            onClick={() => setManaging({ userNumber: citizen.user_number, mode: "view" })}
                          >
                            <EyeIcon />
                          </button>
                          {canEditStatus && (
                            <button
                              type="button"
                              className="action-icon-btn"
                              title={`Edit ${citizen.full_name}`}
                              aria-label={`Edit ${citizen.full_name}`}
                              onClick={() => setManaging({ userNumber: citizen.user_number, mode: "edit" })}
                            >
                              <PencilIcon />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="empty-table-message">No citizens found matching your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination currentPage={safePage} totalPages={totalPages} loading={loading} onPageChange={setCurrentPage}>
          Showing {startRow} to {endRow} of {count.toLocaleString()} Citizens
        </Pagination>
      </div>

      {managing?.userNumber && (
        <CitizenProfileModal
          userNumber={managing.userNumber}
          mode={managing.mode}
          onClose={() => setManaging(null)}
          onSaved={() => setRefreshKey((key) => key + 1)}
        />
      )}
    </DashboardLayout>
  );
}
