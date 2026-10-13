import { useEffect, useState } from "react";
import { getRole } from "../../../api/roles";
import { PERMISSION_MODULE_LABELS } from "../../../shared/constants";
import "./RolePermissionsModal.css";

// "audit:read_report_logs" -> "AUDITS" -> "Audit Trail". Every registry prefix
// (user, employee, role, report, analytic, audit) maps by appending "S" to the
// lookup module keys; unknown prefixes fall back to themselves.
const moduleLabelFor = (permissionName) => {
  const prefix = String(permissionName).split(":")[0] || permissionName;
  return PERMISSION_MODULE_LABELS[`${prefix.toUpperCase()}S`] || prefix;
};

const groupPermissions = (permissions) => {
  const groups = new Map();
  [...permissions].sort().forEach((name) => {
    const label = moduleLabelFor(name);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(name);
  });
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
};

export default function RolePermissionsModal({ role, onClose }) {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Bumped by the retry button to re-run the fetch effect.
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getRole(role.role_id);
        if (cancelled) return;
        // Quirk: an unknown role_id returns 200 with { detail } instead of 404.
        if (!data?.role_id) {
          setPermissions([]);
          setError(data?.detail || "Role not found.");
          return;
        }
        setPermissions(data.permissions || []);
      } catch (err) {
        if (cancelled) return;
        setPermissions([]);
        setError(err?.detail || "Failed to load permissions. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [role.role_id, refreshKey]);

  const groups = loading || error ? [] : groupPermissions(permissions);

  return (
    <div className="rpm-modal-overlay" onClick={onClose}>
      <section
        className="rpm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rpm-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="rpm-modal-header">
          <div>
            <h2 id="rpm-modal-title" className="rpm-modal-title">
              {role.role_name}
              {role.is_protected && <span className="rpm-protected-badge">Protected</span>}
              {role.is_active === false && <span className="rpm-inactive-badge">Deactivated</span>}
            </h2>
            <p className="rpm-modal-subtitle">{role.description || "No description provided."}</p>
          </div>
          <button
            type="button"
            className="rpm-modal-close"
            onClick={onClose}
            aria-label="Close permissions view"
          >
            &times;
          </button>
        </header>

        <div className="rpm-body">
          <div className="rpm-permissions-heading">
            <span>Permissions</span>
            {!loading && !error && <span className="rpm-count-badge">{permissions.length}</span>}
          </div>

          {loading && <p className="rpm-status">Loading permissions...</p>}

          {!loading && error && (
            <div className="rpm-banner rpm-banner-error">
              {error}{" "}
              <button
                type="button"
                className="rpm-retry-btn"
                onClick={() => setRefreshKey((key) => key + 1)}
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && groups.length === 0 && (
            <p className="rpm-status">No permissions assigned.</p>
          )}

          {!loading && !error && groups.map(([moduleName, names]) => (
            <div key={moduleName} className="rpm-module-group">
              <h3 className="rpm-module-name">{moduleName}</h3>
              <div className="rpm-permission-tags">
                {names.map((name) => (
                  <span key={name} className="rpm-permission-tag">{name}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <footer className="rpm-modal-footer">
          <button type="button" className="rpm-btn-close" onClick={onClose}>Close</button>
        </footer>
      </section>
    </div>
  );
}
