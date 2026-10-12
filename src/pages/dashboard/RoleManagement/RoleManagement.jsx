import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import "./RoleManagement.css";
import RolePermissionsModal from "./RolePermissionsModal";
import { getRoles, duplicateRole } from "../../../api/roles";

const ROWS_PER_PAGE = 8;
const ROLE_COLORS = ["#7c3aed", "#2563eb", "#16a34a", "#d97706", "#dc2626", "#0891b2"];

const colorForRole = (roleId) => ROLE_COLORS[roleId % ROLE_COLORS.length];

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
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

export default function RoleManagement() {
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
  // Bumped by event handlers (retry, duplicate) to re-run the fetch effect.
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getRoles({ page: currentPage, page_size: ROWS_PER_PAGE });
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
  }, [currentPage, refreshKey]);

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
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3" className="empty-table-message">Loading roles...</td>
              </tr>
            ) : error && roles.length === 0 ? (
              <tr>
                <td colSpan="3" className="empty-table-message">
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
                <tr key={role.role_id}>
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
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="empty-table-message">No roles found.</td>
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
    </DashboardLayout>
  );
}
