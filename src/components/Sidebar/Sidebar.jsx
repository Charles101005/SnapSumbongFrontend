import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../../api/accounts";
import { logoutUser } from "../../api/login";
import { clearAccessToken } from "../../api/authToken";
import "./Sidebar.css";

function RocketIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

function UserManagementIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
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

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);
  const path = location.pathname;

  const isActive = (route) => path === route;
  const isMonitoringActive = path.startsWith("/dashboard/monitoring");
  const isUserMgmtActive = path.startsWith("/dashboard/users");
  const permissions = user?.permissions || [];
  const can = (permission) => permissions.includes(permission);
  const canReports = can("report:read_all") || can("report:read_assigned") || can("report:read_own");
  const canAnalytics = can("analytic:read_dashboard") || can("analytic:read_all_metrics") || can("analytic:read_assigned_metrics") || can("analytic:read_own_metrics");
  const canUsers = can("user:read_all") || can("employee:read_all") || can("role:read_all");

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError("");
    try {
      await logoutUser();
      clearAccessToken();
      navigate("/", { replace: true });
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
            <RocketIcon />
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">SnapSumbong</span>
            <span className="sidebar-brand-tagline">LGU Monitoring</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {canUsers && <div className="sidebar-nav-section">
            <Link
              to="/dashboard/users/roles"
              className={`sidebar-nav-item parent ${isUserMgmtActive ? "active" : ""}`}
            >
              <UserManagementIcon />
              <span>User Management</span>
            </Link>
            <div className="sidebar-subnav">
              <Link
                to="/dashboard/users/roles"
                className={`sidebar-subnav-item ${isActive("/dashboard/users/roles") ? "active" : ""}`}
              >
                View Roles
              </Link>
              <Link
                to="/dashboard/users/employees"
                className={`sidebar-subnav-item ${isActive("/dashboard/users/employees") ? "active" : ""}`}
              >
                Manage Employees
              </Link>
              <Link
                to="/dashboard/users/citizens"
                className={`sidebar-subnav-item ${isActive("/dashboard/users/citizens") ? "active" : ""}`}
              >
                Citizens
              </Link>
            </div>
          </div>}

          {canReports && <Link
            to="/dashboard/report-management"
            className={`sidebar-nav-item ${isActive("/dashboard/report-management") ? "active" : ""}`}
          >
            <ClipboardIcon />
            <span>Report Management</span>
          </Link>}

          {canAnalytics && <div className="sidebar-nav-section">
            <Link
              to="/dashboard/monitoring"
              className={`sidebar-nav-item parent ${isMonitoringActive ? "active" : ""}`}
            >
              <MonitorIcon />
              <span>Monitoring</span>
            </Link>
            <div className="sidebar-subnav">
              <Link
                to="/dashboard/monitoring"
                className={`sidebar-subnav-item ${isActive("/dashboard/monitoring") ? "active" : ""}`}
              >
                Reports Overview
              </Link>
              <Link
                to="/dashboard/monitoring/history"
                className={`sidebar-subnav-item ${isActive("/dashboard/monitoring/history") ? "active" : ""}`}
              >
                Reports History
              </Link>
              <Link
                to="/dashboard/monitoring/analytics"
                className={`sidebar-subnav-item ${isActive("/dashboard/monitoring/analytics") ? "active" : ""}`}
              >
                Analytics
              </Link>
            </div>
          </div>}

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
            <UserIcon />
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email : "Loading..."}</span>
            <span className="sidebar-user-role">{user?.role || "Field Officer"}</span>
          </div>
        </div>
        <button className="sidebar-logout" type="button" onClick={handleLogout} disabled={loggingOut}>
          <LogoutIcon />
          <span>{loggingOut ? "Logging out..." : "Logout"}</span>
        </button>
        {logoutError && <span className="sidebar-logout-error" role="alert">{logoutError}</span>}
      </div>
    </aside>
  );
}
