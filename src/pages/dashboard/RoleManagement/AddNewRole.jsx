import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import "./AddNewRole.css";
import { createRole, getPermissionLookup } from "../../../api/roles";
import { permissionModulesFromLookup } from "../../../shared/constants";
import { mapApiErrors } from "../../../utils/apiErrors";

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
  const [description, setDescription] = useState("");
  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [modulesError, setModulesError] = useState("");
  const [expandedModules, setExpandedModules] = useState({});
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadPermissions = async () => {
      setModulesLoading(true);
      setModulesError("");
      try {
        const lookup = await getPermissionLookup();
        if (cancelled) return;
        const built = permissionModulesFromLookup(lookup);
        setModules(built);
        if (built.length > 0) {
          setExpandedModules({ [built[0].id]: true });
        }
      } catch (err) {
        if (cancelled) return;
        setModulesError(err?.detail || "Failed to load permissions. Please try again.");
      } finally {
        if (!cancelled) setModulesLoading(false);
      }
    };
    loadPermissions();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const togglePermission = (permId) => {
    setSelectedPermissions((prev) => ({ ...prev, [permId]: !prev[permId] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const trimmedName = roleName.trim();
    const trimmedDescription = description.trim();
    const permissionNames = Object.keys(selectedPermissions).filter((key) => selectedPermissions[key]);

    if (!trimmedName) {
      setFormError("Role name is required.");
      return;
    }
    if (!trimmedDescription) {
      setFormError("Description is required.");
      return;
    }
    if (permissionNames.length === 0) {
      setFormError("Select at least one permission.");
      return;
    }

    setSaving(true);
    try {
      await createRole({
        role_name: trimmedName,
        description: trimmedDescription,
        permission_names: permissionNames,
      });
      navigate("/dashboard/role-management");
    } catch (err) {
      const mapped = mapApiErrors(err, {
        codes: {
          ROLE_ALREADY_EXISTS: "form",
          PERMISSION_NOT_FOUND: "form",
        },
      });
      setFormError(mapped.form || "Failed to create role. Please try again.");
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Add New Role">
      <div className="breadcrumb">
        <Link to="/dashboard/role-management" className="breadcrumb-link">Role Management</Link>
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

        {formError && <div className="page-banner page-banner-error">{formError}</div>}
        {modulesError && (
          <div className="page-banner page-banner-error">
            {modulesError}{" "}
            <button
              type="button"
              className="action-link retry-link"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        )}

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

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input form-textarea"
              placeholder="Describe what this role is responsible for."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <span className="form-hint">Explain the role's purpose so it is clear across the portal.</span>
          </div>

          <div className="permissions-section">
            <h4 className="permissions-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              Permissions
            </h4>

            {modulesLoading ? (
              <p className="permissions-loading">Loading permissions...</p>
            ) : modules.length > 0 ? (
              modules.map((module) => (
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
              ))
            ) : (
              !modulesError && <p className="permissions-loading">No permissions available.</p>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel-form"
              onClick={() => navigate("/dashboard/role-management")}
            >
              Cancel
            </button>
            <button type="submit" className="btn-create-role" disabled={saving || modulesLoading}>
              {saving ? "Creating..." : "+ Create Role"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
