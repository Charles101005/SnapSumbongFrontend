import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import Pagination from "../../../components/shared/Pagination";
import EmployeeProfileModal from "./EmployeeProfileModal";
import "./ManageEmployees.css";
import { getEmployees } from "../../../api/users";
import { getRoleLookup } from "../../../api/roles";
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

function UserPlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
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

export default function ManageEmployees() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Bumped after a successful modal save to re-run the fetch effect.
  const [refreshKey, setRefreshKey] = useState(0);
  const [managing, setManaging] = useState(null); // { userNumber, mode }
  const [roleOptions, setRoleOptions] = useState([{ value: "", label: "All Roles" }]);
  const [draftSearch, setDraftSearch] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [draftRole, setDraftRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "true" | "false" | ""
  const [roleFilter, setRoleFilter] = useState(""); // role_id as string | ""

  useEffect(() => {
    let cancelled = false;
    const loadRoles = async () => {
      try {
        const lookup = await getRoleLookup({ exclude_citizen: true });
        if (cancelled) return;
        setRoleOptions([
          { value: "", label: "All Roles" },
          ...lookup.map((role) => ({ value: String(role.role_id), label: role.role_name })),
        ]);
      } catch {
        // Filter falls back to "All Roles" only.
      }
    };
    loadRoles();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getEmployees({
          q: searchQuery || undefined,
          is_active: statusFilter || undefined,
          role_id: roleFilter || undefined,
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
        setError(err?.detail || "Failed to load employees. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [searchQuery, statusFilter, roleFilter, currentPage, refreshKey]);

  const handleApplyFilters = () => {
    setSearchQuery(draftSearch.trim());
    setStatusFilter(draftStatus);
    setRoleFilter(draftRole);
    setCurrentPage(1);
  };

  const handleFilterKeyDown = (e) => {
    if(e.key === "Enter"){
      handleApplyFilters();
      if(e.target.tagName === "SELECT") e.preventDefault();
    }
  }

  const handleReset = () => {
    setDraftSearch("");
    setDraftStatus("");
    setDraftRole("");
    setSearchQuery("");
    setStatusFilter("");
    setRoleFilter("");
    setCurrentPage(1);
  };

  const safePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const startRow = count === 0 ? 0 : (safePage - 1) * ROWS_PER_PAGE + 1;
  const endRow = Math.min(safePage * ROWS_PER_PAGE, count);

  return (
    <DashboardLayout title="LGU Employees">
      <div className="manage-employees-page">
        <div className="breadcrumb">
          <Link to="/dashboard/users/employees" className="breadcrumb-link">User Management</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">LGU Employees</span>
        </div>

        <div className="section-header-row">
          <div className="section-header">
            <h2 className="section-title">LGU Employees</h2>
            <p className="section-subtitle">
              Manage staff roles, permissions and department assignments.
            </p>
          </div>
          <button className="btn-add-employee" onClick={() => navigate("/dashboard/users/employees/add")}>
            <UserPlusIcon />
            Add New Employee
          </button>
        </div>

        <div className="filter-card">
          <div className="filter-row">
            <div className="filter-field filter-field-search">
              <label className="filter-label">Search Employees</label>
              <div className="filter-search-wrap">
                <SearchIcon />
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Search by name or email..."
                  value={draftSearch}
                  onChange={(e) => setDraftSearch(e.target.value)}
                  onKeyDown={handleFilterKeyDown}
                />
              </div>
            </div>
            <div className="filter-field">
              <label className="filter-label">Role</label>
              <select className="filter-select" value={draftRole} onChange={(e) => setDraftRole(e.target.value)} onKeyDown={handleFilterKeyDown}>
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="filter-field">
              <label className="filter-label">Account Status</label>
              <select className="filter-select" value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)} onKeyDown={handleFilterKeyDown}>
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
                <th>ROLE</th>
                <th>ACCOUNT STATUS</th>
                <th>LAST ACTIVITY</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="empty-table-message">Loading employees...</td>
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
                rows.map((emp) => {
                  const status = emp.is_active ? "ACTIVE" : "DEACTIVATED";
                  const roleClass = (emp.role || "").toLowerCase().replace(/\s+/g, "-");
                  return (
                    <tr key={emp.user_number}>
                      <td>
                        <span className="employee-name">{emp.full_name}</span>
                      </td>
                      <td>{emp.email}</td>
                      <td>
                        <span className={`role-badge role-${roleClass}`}>
                          {emp.role || "—"}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-${status.toLowerCase()}`}>
                          {status === "ACTIVE" ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td className="last-activity-cell">{formatLastActive(emp.last_active)}</td>
                      <td>
                        <div className="action-icon-group">
                          <button
                            type="button"
                            className="action-icon-btn"
                            title={`View ${emp.full_name}`}
                            aria-label={`View ${emp.full_name}`}
                            onClick={() => setManaging({ userNumber: emp.user_number, mode: "view" })}
                          >
                            <EyeIcon />
                          </button>
                          <button
                            type="button"
                            className="action-icon-btn"
                            title={`Edit ${emp.full_name}`}
                            aria-label={`Edit ${emp.full_name}`}
                            onClick={() => setManaging({ userNumber: emp.user_number, mode: "edit" })}
                          >
                            <PencilIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="empty-table-message">No employees found matching your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination currentPage={safePage} totalPages={totalPages} loading={loading} onPageChange={setCurrentPage}>
          Showing {startRow} to {endRow} of {count.toLocaleString()} Employees
        </Pagination>
      </div>

      {managing?.userNumber && (
        <EmployeeProfileModal
          userNumber={managing.userNumber}
          mode={managing.mode}
          onClose={() => setManaging(null)}
          onSaved={() => setRefreshKey((key) => key + 1)}
        />
      )}
    </DashboardLayout>
  );
}
