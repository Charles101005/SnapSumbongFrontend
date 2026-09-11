import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import "./AddNewRole.css";

const PERMISSION_MODULES = [
  {
    id: "report",
    name: "Report Module",
    permissions: [
      { id: "REPORT_VIEW", label: "REPORT_VIEW", description: "View all reports in the system" },
      { id: "REPORT_MANAGE", label: "REPORT_MANAGE", description: "Create, update, and delete reports" },
      { id: "REPORT_ASSIGN", label: "REPORT_ASSIGN", description: "Assign reports to personnel" },
    ],
  },
  {
    id: "user",
    name: "User Module",
    permissions: [
      { id: "USER_VIEW", label: "USER_VIEW", description: "View user accounts" },
      { id: "USER_MANAGE", label: "USER_MANAGE", description: "Create, update, and delete user accounts" },
      { id: "USER_ASSIGN", label: "USER_ASSIGN", description: "Assign roles to users" },
    ],
  },
  {
    id: "audit",
    name: "Audit Trail Module",
    permissions: [
      { id: "AUDIT_VIEW_ALL", label: "AUDIT_VIEW_ALL", description: "Access to all audit logs of the system" },
    ],
  },
];

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

function ShieldInfoIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}

export default function AddNewRole() {
  const navigate = useNavigate();
  const [roleName, setRoleName] = useState("");
  const [expandedModules, setExpandedModules] = useState({ audit: true });
  const [selectedPermissions, setSelectedPermissions] = useState({});

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const togglePermission = (permId) => {
    setSelectedPermissions((prev) => ({ ...prev, [permId]: !prev[permId] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const permissions = Object.keys(selectedPermissions).filter((k) => selectedPermissions[k]);
    const newRole = { name: roleName, permissions };
    console.log("Creating role:", newRole);
    navigate("/dashboard/users/roles");
  };

  return (
    <DashboardLayout title="Add New Role">
      <div className="breadcrumb">
        <Link to="/dashboard/users/roles" className="breadcrumb-link">User Management</Link>
        <span className="breadcrumb-separator">/</span>
        <Link to="/dashboard/users/roles" className="breadcrumb-link">View Roles</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Add New Role</span>
      </div>

      <h2 className="page-title">Add New Role</h2>

      <div className="role-info-card">
        <div className="role-info-header">
          <div className="role-info-icon">
            <ShieldInfoIcon />
          </div>
          <div>
            <h3 className="role-info-title">Role Information</h3>
            <p className="role-info-subtitle">Configure the name and functional capabilities of the role.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Role Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Moderator, Field Staff, Dept. Head"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
            />
            <span className="form-hint">Use a descriptive title that clearly identifies the job function.</span>
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
            <button type="submit" className="btn-create-role">
              + Create Role
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
