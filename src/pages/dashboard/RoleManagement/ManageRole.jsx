import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import "./ManageRole.css";
import { getRole, getPermissionLookup, updateRole } from "../../../api/roles";
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

export default function ManageRole() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [role, setRole] = useState(null);
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [modules, setModules] = useState([]);
  const [expandedModules, setExpandedModules] = useState({});
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError("");
      setNotFound(false);
      try {
        // The API returns 200 with { detail } for unknown role ids — check role_id.
        const [roleData, lookup] = await Promise.all([getRole(id), getPermissionLookup()]);
        if (cancelled) return;
        if (!roleData || !roleData.role_id) {
          setNotFound(true);
          return;
        }
        setRole(roleData);
        setRoleName(roleData.role_name || "");
        setDescription(roleData.description || "");

        const built = permissionModulesFromLookup(lookup);
        setModules(built);
        if (built.length > 0) {
          setExpandedModules({ [built[0].id]: true });
        }
        const assigned = new Set(roleData.permissions || []);
        const initial = {};
        built.forEach((mod) => {
          mod.permissions.forEach((perm) => {
            initial[perm.id] = assigned.has(perm.id);
          });
        });
        setSelectedPermissions(initial);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err?.detail || "Failed to load role. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

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
      await updateRole(id, {
        role_name: trimmedName,
        description: trimmedDescription,
        permission_names: permissionNames,
      });
      navigate("/dashboard/role-management");
    } catch (err) {
      const mapped = mapApiErrors(err, {
        codes: {
          ROLE_NOT_FOUND: "form",
          ROLE_ALREADY_EXISTS: "form",
          PERMISSION_NOT_FOUND: "form",
          SYSTEM_PROTECTED_ROLE_MODIFICATION_DENIED: "form",
          DEACTIVATED_ROLE_MODIFICATION_DENIED: "form",
        },
      });
      setFormError(mapped.form || "Failed to save role. Please try again.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Manage Role">
        <div className="breadcrumb">
          <Link to="/dashboard/role-management" className="breadcrumb-link">Role Management</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Manage Role</span>
        </div>
        <p className="page-status-message">Loading role...</p>
      </DashboardLayout>
    );
  }

  if (notFound) {
    return (
      <DashboardLayout title="Manage Role">
        <div className="breadcrumb">
          <Link to="/dashboard/role-management" className="breadcrumb-link">Role Management</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Manage Role</span>
        </div>
        <p className="page-status-message">Role not found.</p>
      </DashboardLayout>
    );
  }

  if (loadError || !role) {
    return (
      <DashboardLayout title="Manage Role">
        <div className="breadcrumb">
          <Link to="/dashboard/role-management" className="breadcrumb-link">Role Management</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Manage Role</span>
        </div>
        <p className="page-status-message">
          {loadError || "Failed to load role. Please try again."}{" "}
          <button
            type="button"
            className="action-link retry-link"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </p>
      </DashboardLayout>
    );
  }

  const isProtected = role.is_protected;
  const isInactive = role.is_active === false;
  // Inactive roles reject every edit server-side; render read-only like protected.
  const readOnly = isProtected || isInactive;

  return (
    <DashboardLayout title="Manage Role">
      <div className="breadcrumb">
        <Link to="/dashboard/role-management" className="breadcrumb-link">Role Management</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Manage Role</span>
      </div>

      <div className="manage-role-header">
        <h2 className="page-title">
          Manage Role: {role.role_name}
          {isProtected && <span className="protected-badge">Protected</span>}
          {isInactive && <span className="status-badge status-deactivated">Deactivated</span>}
        </h2>
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

        {isProtected && (
          <div className="page-banner page-banner-info">
            This is a system protected role. Its name and permissions cannot be modified.
          </div>
        )}
        {isInactive && (
          <div className="page-banner page-banner-info">
            This role is deactivated. It is hidden from employee role assignment and
            cannot be modified.
          </div>
        )}
        {formError && <div className="page-banner page-banner-error">{formError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Role Name</label>
            <input
              type="text"
              className="form-input"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              disabled={readOnly || saving}
            />
            <span className="form-hint">This name will be displayed across the portal for all assigned users.</span>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input form-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={readOnly || saving}
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

            {modules.map((module) => (
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
                          disabled={readOnly || saving}
                          onChange={() => togglePermission(perm.id)}
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {!readOnly && (
            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel-form"
                onClick={() => navigate("/dashboard/role-management")}
              >
                Cancel
              </button>
              <button type="submit" className="btn-save-changes" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </form>
      </div>
    </DashboardLayout>
  );
}
