import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import { getEmployee, updateEmployee } from "../../../api/users";
import { getRoleLookup } from "../../../api/roles";
import { formatDate, formatLastActive } from "../../../utils/format";
import { mapApiErrors } from "../../../utils/apiErrors";
import "./EmployeeProfile.css";

function UserIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [roleOptions, setRoleOptions] = useState([]);
  const [roleId, setRoleId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError("");
      setNotFound(false);
      try {
        const [detail, lookup] = await Promise.all([getEmployee(id), getRoleLookup()]);
        if (cancelled) return;
        if (!detail || !detail.user_number) {
          setNotFound(true);
          return;
        }
        setEmployee(detail);
        setRoleId(detail.role_id ? String(detail.role_id) : "");
        setIsActive(detail.is_active !== false);
        setRoleOptions(lookup.map((role) => ({ value: String(role.role_id), label: role.role_name })));
      } catch (err) {
        if (cancelled) return;
        setLoadError(err?.detail || "Failed to load employee. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSave = async () => {
    setSaveError("");
    setSaveSuccess("");
    setSaving(true);
    try {
      await updateEmployee(id, {
        role_id: Number(roleId),
        is_active: isActive,
      });
      setEmployee((current) => ({
        ...current,
        role_id: Number(roleId),
        role: roleOptions.find((option) => option.value === String(roleId))?.label || current.role,
        is_active: isActive,
      }));
      setSaveSuccess("Account actions saved successfully.");
    } catch (err) {
      const mapped = mapApiErrors(err, {
        codes: {
          SELF_UPDATE_DENIED: "form",
          ROLE_NOT_FOUND: "form",
          USER_NOT_FOUND: "form",
        },
      });
      setSaveError(mapped.form || "Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="User Profile">
        <p className="profile-status-message">Loading employee...</p>
      </DashboardLayout>
    );
  }

  if (notFound) {
    return (
      <DashboardLayout title="User Profile">
        <div className="profile-not-found">
          <p>Employee not found.</p>
          <button className="btn-back-to-list" onClick={() => navigate("/dashboard/users/employees")}>
            Back to User List
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (loadError || !employee) {
    return (
      <DashboardLayout title="User Profile">
        <div className="profile-not-found">
          <p>{loadError || "Failed to load employee. Please try again."}</p>
          <button className="btn-back-to-list" onClick={() => navigate("/dashboard/users/employees")}>
            Back to User List
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const fullName = [employee.first_name, employee.middle_name ? `${employee.middle_name.charAt(0)}.` : "", employee.last_name]
    .filter(Boolean)
    .join(" ");

  const roleClass = (employee.role || "").toLowerCase().replace(/\s+/g, "-");
  const statusClass = employee.is_active ? "active" : "deactivated";

  return (
    <DashboardLayout title="User Profile">
      <button className="back-link" onClick={() => navigate("/dashboard/users/employees")}>
        ← Back to User List
      </button>

      <div className="profile-header-card">
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar">
            <UserIcon />
          </div>
        </div>
        <div className="profile-header-info">
          <h1 className="profile-name">{fullName}</h1>
          <div className="profile-badges">
            <span className={`role-badge role-${roleClass}`}>{employee.role || "—"}</span>
            <span className={`status-badge status-${statusClass}`}>
              {employee.is_active ? "Active" : "Deactivated"}
            </span>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-left-column">
          <div className="profile-card">
            <div className="card-header">
              <ClockIcon />
              <h2 className="card-title">Account Information</h2>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">FIRST NAME</span>
                <span className="info-value">{employee.first_name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">LAST NAME</span>
                <span className="info-value">{employee.last_name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">MIDDLE NAME</span>
                <span className="info-value">{employee.middle_name || "N/A"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">EMPLOYEE NUMBER</span>
                <span className="info-value">{employee.user_number}</span>
              </div>
              <div className="info-item">
                <span className="info-label">JOINED DATE</span>
                <span className="info-value">{formatDate(employee.created_at)}</span>
              </div>
              <div className="info-item info-item-full">
                <span className="info-label">EMAIL ADDRESS</span>
                <span className="info-value">{employee.email}</span>
              </div>
            </div>
          </div>

          <div className="profile-card">
            <div className="card-header">
              <ChartIcon />
              <h2 className="card-title">Activity Summary</h2>
            </div>
            <div className="activity-stats">
              <div className="activity-stat">
                <span className="activity-stat-label">REPORTS HANDLED</span>
                <span className="activity-stat-value">—</span>
              </div>
              <div className="activity-stat">
                <span className="activity-stat-label">REPORTS RESOLVED</span>
                <span className="activity-stat-value">—</span>
              </div>
            </div>
            <p className="last-active-text">Last Active Timestamp: {formatLastActive(employee.last_active)}</p>
          </div>
        </div>

        <div className="profile-right-column">
          <div className="profile-card">
            <div className="card-header">
              <SettingsIcon />
              <h2 className="card-title">Account Actions</h2>
            </div>

            {saveError && <div className="page-banner page-banner-error">{saveError}</div>}
            {saveSuccess && <div className="page-banner page-banner-success">{saveSuccess}</div>}

            <div className="action-section">
              <label className="action-label" htmlFor="profile-role-select">USER ROLE</label>
              <select
                id="profile-role-select"
                className="form-input form-select"
                value={roleId}
                onChange={(event) => setRoleId(event.target.value)}
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p className="action-hint">Roles control what this employee can view and manage in the portal.</p>
            </div>

            <div className="action-section">
              <label className="action-label">ACCOUNT STATUS</label>
              <div className="radio-group">
                <label className={`radio-option ${isActive ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="status"
                    checked={isActive}
                    onChange={() => setIsActive(true)}
                  />
                  <span className="radio-circle" />
                  <span>Activate</span>
                </label>
                <label className={`radio-option ${!isActive ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="status"
                    checked={!isActive}
                    onChange={() => setIsActive(false)}
                  />
                  <span className="radio-circle" />
                  <span>Deactivated</span>
                </label>
              </div>
            </div>

            <button
              type="button"
              className="btn-back-to-list btn-save-actions"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
