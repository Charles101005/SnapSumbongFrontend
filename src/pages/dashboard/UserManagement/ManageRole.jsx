import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import "./ManageRole.css";
import mockData from "../../../data/mock.json";

const { roles: MOCK_ROLES, permissionModules: PERMISSION_MODULES } = mockData;

function ChevronIcon({ expanded }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function ManageRole() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = MOCK_ROLES.find((r) => r.id === Number(id));

  const [roleName, setRoleName] = useState(role?.name || "");
  const [expandedModules, setExpandedModules] = useState({ audit: true });
  const [selectedPermissions, setSelectedPermissions] = useState(() => {
    const initial = {};
    if (role) {
      PERMISSION_MODULES.forEach((mod) => {
        mod.permissions.forEach((perm) => {
          initial[perm.id] = role.permissions.some(
            (rp) => rp.replace("/", "_") === perm.id || rp === perm.id
          );
        });
      });
    }
    return initial;
  });

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const togglePermission = (permId) => {
    setSelectedPermissions((prev) => ({ ...prev, [permId]: !prev[permId] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const permissions = Object.keys(selectedPermissions).filter((k) => selectedPermissions[k]);
    console.log("Saving role:", { id, name: roleName, permissions });
    navigate("/dashboard/users/roles");
  };

  if (!role) {
    return (
      <DashboardLayout title="Manage Role">
        <div className="breadcrumb">
          <Link to="/dashboard/users/roles" className="breadcrumb-link">User Management</Link>
          <span className="breadcrumb-separator">/</span>
          <Link to="/dashboard/users/roles" className="breadcrumb-link">View Roles</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Manage Role</span>
        </div>
        <p>Role not found.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Manage Role">
      <div className="breadcrumb">
        <Link to="/dashboard/users/roles" className="breadcrumb-link">User Management</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to="/dashboard/users/roles" className="breadcrumb-link">View Roles</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Manage Role</span>
      </div>

      <div className="manage-role-header">
        <h2 className="page-title">Manage Role: {role.name}</h2>
        <p className="page-subtitle">Modify role properties and define detailed functional permissions for this group.</p>
      </div>

      <div className="role-info-card">
        <div className="role-info-header">
          <div className="role-info-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div>
            <h3 className="role-info-title">General Information</h3>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Role Name</label>
            <input
              type="text"
              className="form-input"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
            />
            <span className="form-hint">This name will be displayed across the portal for all assigned users.</span>
          </div>

          <div className="permissions-section">
            <h4 className="permissions-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              Permissions
            </h4>

            {PERMISSION_MODULES.map((module) => (
              <div key={module.id} className="permission-module">
                <button
                  type="button"
                  className="module-header"
                  onClick={() => toggleModule(module.id)}
                >
                  <span className="module-name">{module.name}</span>
                  <ChevronIcon expanded={expandedModules[module.id]} />
                </button>

                {expandedModules[module.id] && (
                  <div className="module-permissions">
                    {module.permissions.map((perm) => (
                      <label key={perm.id} className="permission-item">
                        <div className="permission-info">
                          <span className="permission-label">{perm.label}</span>
                          <span className="permission-desc">{perm.description}</span>
                        </div>
                        <input
                          type="checkbox"
                          className="permission-checkbox"
                          checked={!!selectedPermissions[perm.id]}
                          onChange={() => togglePermission(perm.id)}
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel-form"
              onClick={() => navigate("/dashboard/users/roles")}
            >
              Cancel
            </button>
            <button type="submit" className="btn-save-changes">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
