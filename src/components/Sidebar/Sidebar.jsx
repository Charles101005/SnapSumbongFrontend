import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { getCurrentUser, getProfile } from "../../api/accounts";
import { useAuth } from "../../context/authContext";
import { STATUS_VIEWS, useStatusCounts } from "../../hooks/useStatusCounts";
import { useCanAnalytics } from "../../hooks/useCanAnalytics";
import { usePermissions } from "../../hooks/usePermissions";
import "./Sidebar.css";

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function UserManagementIcon() {  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function RoleManagementIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <circle cx="12" cy="10" r="2" />
      <path d="M12 12v3" />
    </svg>
  );
}

function AuditTrailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ChevronIcon({ expanded }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();
  const canAnalytics = useCanAnalytics();
  const [user, setUser] = useState(null);
  const [profilePicture, setProfilePicture] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    let cancelled = false;

    // Profile picture is optional — fetch it alongside the user so the
    // avatar matches the citizen sidebar without blocking the name/role.
    getCurrentUser()
      .then((data) => { if (!cancelled) setUser(data); })
      .catch(() => { if (!cancelled) setUser(null); });
    getProfile()
      .then((data) => { if (!cancelled) setProfilePicture(data.profile_picture || ""); })
      .catch(() => { /* keep the generic icon */ });

    return () => { cancelled = true; };
  }, []);
  const { counts: statusCounts, loaded: statusCountsLoaded } = useStatusCounts();
  const path = location.pathname;

  const isActive = (route) => path === route;
  const isOperationsActive = path.startsWith("/dashboard/operations");
  const isUserMgmtActive = path.startsWith("/dashboard/users");
  const activeSection = isOperationsActive ? "operations" : isUserMgmtActive ? "users" : null;
  const [openSections, setOpenSections] = useState(() => ({
    users: activeSection === "users",
    operations: activeSection === "operations",
  }));

  const toggleSection = (section) =>
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  // Status views deep-link the shared table via /dashboard/operations?status=…
  const statusParam = (new URLSearchParams(location.search).get("status") || "").toLowerCase();
  const activeStatus = STATUS_VIEWS.some((view) => view.status === statusParam) ? statusParam : "";
  const isOverviewActive = isActive("/dashboard/operations") && !activeStatus;
  const { can } = usePermissions();
  const canUsers = can("user:read_all") || can("employee:read_all");

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError("");
    try {
      await logout();
    } catch {
      setLogoutError("Couldn't log out. Please try again.");
      setLoggingOut(false);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <img src="/SnapSumbongLogo.png" alt="SnapSumbong" className="brand-logo-img" />
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">SnapSumbong</span>
            <span className="sidebar-brand-tagline">LGU Monitoring</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/dashboard"
            className={`sidebar-nav-item ${isActive("/dashboard") ? "active" : ""}`}
          >
            <GridIcon />
            <span>Dashboard</span>
          </Link>

          {canUsers && <div className="sidebar-nav-section">
            <button
              type="button"
              className={`sidebar-nav-item parent ${isUserMgmtActive ? "active" : ""}`}
              onClick={() => toggleSection("users")}
              aria-expanded={openSections.users}
              aria-controls="sidebar-subnav-users"
            >
              <UserManagementIcon />
              <span>User Management</span>
              <span className="sidebar-nav-chevron">
                <ChevronIcon expanded={openSections.users} />
              </span>
            </button>
            {openSections.users && <div className="sidebar-subnav" id="sidebar-subnav-users">
              <Link
                to="/dashboard/users/employees"
                className={`sidebar-subnav-item ${isActive("/dashboard/users/employees") ? "active" : ""}`}
              >
                Employees
              </Link>
              <Link
                to="/dashboard/users/citizens"
                className={`sidebar-subnav-item ${isActive("/dashboard/users/citizens") ? "active" : ""}`}
              >
                Citizens
              </Link>
            </div>}
          </div>}

          {canAnalytics && <div className="sidebar-nav-section">
            <button
              type="button"
              className={`sidebar-nav-item parent ${isOperationsActive ? "active" : ""}`}
              onClick={() => toggleSection("operations")}
              aria-expanded={openSections.operations}
              aria-controls="sidebar-subnav-operations"
            >
              <MonitorIcon />
              <span>Operations</span>
              <span className="sidebar-nav-chevron">
                <ChevronIcon expanded={openSections.operations} />
              </span>
            </button>
            {openSections.operations && <div className="sidebar-subnav" id="sidebar-subnav-operations">
              <Link
                to="/dashboard/operations"
                className={`sidebar-subnav-item ${isOverviewActive ? "active" : ""}`}
              >
                All Reports
              </Link>
              <Link
                to="/dashboard/operations/analytics"
                className={`sidebar-subnav-item ${isActive("/dashboard/operations/analytics") ? "active" : ""}`}
              >
                Analytics
              </Link>
              <div className="sidebar-subnav-group">
                <span className="sidebar-subnav-label">Status Views</span>
                {STATUS_VIEWS.map((view) => {
                  const count = statusCountsLoaded ? statusCounts[view.key] : null;
                  return (
                    <Link
                      key={view.status}
                      to={{ pathname: "/dashboard/operations", search: `?status=${view.status}` }}
                      className={`sidebar-subnav-item with-badge ${isActive("/dashboard/operations") && activeStatus === view.status ? "active" : ""}`}
                    >
                      <span>{view.label}</span>
                      <span className={`sidebar-count-badge${count === 0 ? " is-zero" : ""}`}>{statusCountsLoaded ? statusCounts[view.key] : "—"}</span>
                    </Link>
                  );
                })}
              </div>
            </div>}
          </div>}

          {can("role:read_all") && <Link
            to="/dashboard/role-management"
            className={`sidebar-nav-item ${path.startsWith("/dashboard/role-management") ? "active" : ""}`}
          >
            <RoleManagementIcon />
            <span>Role Management</span>
          </Link>}

          {can("audit:read_report_logs") || can("audit:read_system_logs") ? <Link
            to="/dashboard/audit-trail"
            className={`sidebar-nav-item ${isActive("/dashboard/audit-trail") ? "active" : ""}`}
          >
            <AuditTrailIcon />
            <span>Audit Trail</span>
          </Link> : null}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {profilePicture ? (
              <img
                src={profilePicture}
                alt=""
                onError={() => setProfilePicture("")}
              />
            ) : (
              <UserIcon />
            )}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email : "Loading..."}</span>
            <span className="sidebar-user-role">{user?.role || "Field Officer"}</span>
          </div>
        </div>
        <NavLink
          to="/dashboard/account-settings"
          className={({ isActive }) => `sidebar-account-settings ${isActive ? "active" : ""}`}
        >
          <SettingsIcon />
          <span>Account Settings</span>
        </NavLink>
        <button className="sidebar-logout" type="button" onClick={handleLogout} disabled={loggingOut}>
          <LogoutIcon />
          <span>{loggingOut ? "Logging out..." : "Logout"}</span>
        </button>
        {logoutError && <span className="sidebar-logout-error" role="alert">{logoutError}</span>}
      </div>
    </aside>
  );
}
