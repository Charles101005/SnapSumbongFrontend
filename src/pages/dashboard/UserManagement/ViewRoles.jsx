import { useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import "./ViewRoles.css";
import mockData from "../../../data/mock.json";

const { roles: MOCK_ROLES } = mockData;
const ROWS_PER_PAGE = 4;

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

export default function ViewRoles() {
  const [currentPage, setCurrentPage] = useState(1);

  const totalRoles = MOCK_ROLES.length;
  const totalPages = Math.ceil(totalRoles / ROWS_PER_PAGE);
  const safePage = Math.max(1, Math.min(currentPage, totalPages || 1));
  const startRow = (safePage - 1) * ROWS_PER_PAGE + 1;
  const endRow = Math.min(safePage * ROWS_PER_PAGE, totalRoles);

  const paginatedRoles = MOCK_ROLES.slice(startRow - 1, endRow);

  return (
    <DashboardLayout title="Role Management">
      <div className="breadcrumb">
        <Link to="/dashboard/users/roles" className="breadcrumb-link">User Management</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">View Roles</span>
      </div>

      <div className="section-header">
        <h2 className="section-title">Role Management</h2>
        <p className="section-subtitle">
          Configure and manage administrative roles and their specific access permissions.
        </p>
      </div>

      <div className="roles-header-row">
        <div className="roles-count-info">
          <ShieldIcon />
          <span>{totalRoles} roles configured</span>
        </div>
        <Link to="/dashboard/users/roles/add" className="btn-create-role">
          <PlusIcon />
          Create New Role
        </Link>
      </div>

      <div className="table-container">
        <table className="reports-table">
          <thead>
            <tr>
              <th>ROLE NAME</th>
              <th>PERMISSIONS SUMMARY</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRoles.length > 0 ? (
              paginatedRoles.map((role) => (
                <tr key={role.id}>
                  <td>
                    <div className="role-name-cell">
                      <div className="role-avatar" style={{ backgroundColor: role.color + "18", color: role.color }}>
                        {role.name.charAt(0)}
                      </div>
                      <span className="role-name">{role.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className="permissions-cell">
                      {role.permissions.map((perm, idx) => (
                        <span key={idx} className="permission-tag">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </td>
                    <td>
                      <Link to={`/dashboard/users/roles/${role.id}`} className="action-link">Manage</Link>
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
          Showing {startRow} to {endRow} of {totalRoles} items
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
    </DashboardLayout>
  );
}
