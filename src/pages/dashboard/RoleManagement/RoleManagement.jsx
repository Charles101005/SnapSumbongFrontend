import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import "./RoleManagement.css";
import RolePermissionsModal from "./RolePermissionsModal";
import DeactivateRoleModal from "./DeactivateRoleModal";
import { getRoles, duplicateRole } from "../../../api/roles";
import { useAuth } from "../../../context/authContext";
import { PERMISSIONS } from "../../../shared/constants";
import { MOCK_ALL_ACCESS } from "../../../shared/config/env";

const ROWS_PER_PAGE = 8;
const ROLE_COLORS = ["#7c3aed", "#2563eb", "#16a34a", "#d97706", "#dc2626", "#0891b2"];

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "true", label: "Active" },
  { value: "false", label: "Deactivated" },
];

const colorForRole = (roleId) => ROLE_COLORS[roleId % ROLE_COLORS.length];

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
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

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  );
}

export default function RoleManagement() {
  const { user } = useAuth();
  const permissions = user?.permissions || [];
  // MOCK_ALL_ACCESS short-circuits the permission check (same as Sidebar).
  const can = (permission) => MOCK_ALL_ACCESS || permissions.includes(permission);
  const canDeactivate = can(PERMISSIONS.ROLE_DEACTIVATE_ANY);

  const [roles, setRoles] = useState([]);
  const [count, setCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [duplicatingId, setDuplicatingId] = useState(null);
  // Role whose permissions are being viewed in the modal (null = closed).
  const [viewRole, setViewRole] = useState(null);
  // Role being deactivated in the confirmation modal (null = closed).
  const [deactivatingRole, setDeactivatingRole] = useState(null);
  // Filter drafts apply on "Apply Filters" so typing doesn't refetch per keystroke.
  const [draftSearch, setDraftSearch] = useState("");
  const [draftStatus, setDraftStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "true" | "false" | ""
  // Bumped by event handlers (retry, duplicate, deactivate) to re-run the fetch effect.
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getRoles({
          q: searchQuery || undefined,
          is_active: statusFilter || undefined,
          page: currentPage,
          page_size: ROWS_PER_PAGE,
        });
        if (cancelled) return;
        const pages = data.total_pages || 1;
        if (currentPage > pages) {
          // Page is past the end (e.g. after deletions) — clamp and refetch.
          setCurrentPage(pages);
          return;
        }
        setRoles(data.results || []);
        setCount(data.count || 0);
        setTotalPages(pages);
      } catch (err) {
        if (cancelled) return;
        setRoles([]);
        setCount(0);
        setTotalPages(1);
        setError(err?.detail || "Failed to load roles. Please try again.");
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

  const handleDeactivated = () => {
    const roleName = deactivatingRole?.role_name;
    setDeactivatingRole(null);
    setNotice(`Role "${roleName}" has been deactivated.`);
    setRefreshKey((key) => key + 1);
  };

  const handleDuplicate = async (roleId) => {
    setDuplicatingId(roleId);
    setNotice("");
    try {
      const created = await duplicateRole(roleId);
      setNotice(`Duplicated role as "${created.role_name}".`);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setError(err?.detail || "Failed to duplicate role. Please try again.");
    } finally {
      setDuplicatingId(null);
    }
  };

  const safePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const startRow = count === 0 ? 0 : (safePage - 1) * ROWS_PER_PAGE + 1;
  const endRow = Math.min(safePage * ROWS_PER_PAGE, count);

  return (
    <DashboardLayout title="Role Management">
      <div className="breadcrumb">
        <span className="breadcrumb-current">Role Management</span>
      </div>

      <div className="section-header">
        <h2 className="section-title">Role Management</h2>
        <p className="section-subtitle">
          Configure and manage administrative roles and their specific access permissions.
        </p>
      </div>

      {notice && <div className="page-banner page-banner-success">{notice}</div>}
      {error && roles.length > 0 && (
        <div className="page-banner page-banner-error">{error}</div>
      )}

      <div className="filter-card">
        <div className="filter-row">
          <div className="filter-field filter-field-search">
            <label className="filter-label" htmlFor="role-search">Search Roles</label>
            <div className="filter-search-wrap">
              <SearchIcon />
              <input
                id="role-search"
                type="text"
                className="filter-input"
                placeholder="Search by role name..."
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
              />
            </div>
          </div>
          <div className="filter-field">
            <label className="filter-label" htmlFor="role-status">Role Status</label>
            <select
              id="role-status"
              className="filter-select"
              value={draftStatus}
              onChange={(e) => setDraftStatus(e.target.value)}
            >
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

      <div className="roles-header-row">
        <div className="roles-count-info">
          <ShieldIcon />
          <span>{count} roles configured</span>
        </div>
        <Link to="/dashboard/role-management/add" className="btn-create-role">
          <PlusIcon />
          Create New Role
        </Link>
      </div>

      <div className="table-container">
        <table className="reports-table">
          <thead>
            <tr>
              <th>ROLE NAME</th>
              <th>DESCRIPTION</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="empty-table-message">Loading roles...</td>
              </tr>
            ) : error && roles.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty-table-message">
                  {error}{" "}
                  <button
                    type="button"
                    className="action-link retry-link"
                    onClick={() => setRefreshKey((key) => key + 1)}
                  >
                    Try again
                  </button>
                </td>
              </tr>
            ) : roles.length > 0 ? (
              roles.map((role) => (
                <tr key={role.role_id} className={role.is_active === false ? "role-row-inactive" : ""}>
                  <td>
                    <div className="role-name-cell">
                      <div
                        className="role-avatar"
                        style={{
                          backgroundColor: colorForRole(role.role_id) + "18",
                          color: colorForRole(role.role_id),
                        }}
                      >
                        {role.role_name.charAt(0)}
                      </div>
                      <span className="role-name">{role.role_name}</span>
                      {role.is_protected && <span className="protected-badge">Protected</span>}
                    </div>
                  </td>
                  <td className="role-description-cell">{role.description || "—"}</td>
                  <td>
                    <span className={`status-badge status-${role.is_active === false ? "deactivated" : "active"}`}>
                      {role.is_active === false ? "Deactivated" : "Active"}
                    </span>
                  </td>
                  <td>
                    <div className="role-actions">
                      <button
                        type="button"
                        className="role-action-btn"
                        title="View permissions"
                        aria-label={`View permissions for ${role.role_name}`}
                        onClick={() => setViewRole(role)}
                      >
                        <EyeIcon />
                      </button>
                      <Link
                        to={`/dashboard/role-management/${role.role_id}`}
                        className="role-action-btn"
                        title="Manage role"
                        aria-label={`Manage ${role.role_name}`}
                      >
                        <PencilIcon />
                      </Link>
                      <button
                        type="button"
                        className="role-action-btn"
                        title={duplicatingId === role.role_id ? "Duplicating..." : "Duplicate role"}
                        aria-label={`Duplicate ${role.role_name}`}
                        disabled={duplicatingId === role.role_id}
                        onClick={() => handleDuplicate(role.role_id)}
                      >
                        <CopyIcon />
                      </button>
                      {canDeactivate && role.is_active !== false && !role.is_protected && (
                        <button
                          type="button"
                          className="role-action-btn role-action-btn-danger"
                          title="Deactivate role"
                          aria-label={`Deactivate ${role.role_name}`}
                          onClick={() => setDeactivatingRole(role)}
                        >
                          <PowerIcon />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="empty-table-message">No roles found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span className="pagination-info">
          Showing {startRow} to {endRow} of {count} items
        </span>
        <div className="pagination-buttons">
          <button
            className="pagination-btn"
            disabled={loading || safePage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`pagination-btn ${page === safePage ? "active" : ""}`}
              disabled={loading}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
          <button
            className="pagination-btn"
            disabled={loading || safePage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {viewRole && (
        <RolePermissionsModal role={viewRole} onClose={() => setViewRole(null)} />
      )}

      {deactivatingRole && (
        <DeactivateRoleModal
          role={deactivatingRole}
          onClose={() => setDeactivatingRole(null)}
          onDeactivated={handleDeactivated}
        />
      )}
    </DashboardLayout>
  );
}
