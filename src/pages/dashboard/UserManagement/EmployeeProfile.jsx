import { useParams, useNavigate, Link } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import "./EmployeeProfile.css";

const MOCK_EMPLOYEES = {
  1: {
    firstName: "Juan Dela",
    lastName: "Cruz",
    middleName: "Mirito",
    email: "juan.delacruz@lgu.gov.ph",
    role: "REPORT OFFICER",
    status: "DEACTIVATED",
    joinedDate: "Jan 10, 2026",
    lastActive: "2 mins ago",
    reportsHandled: 43,
    reportsResolved: 36,
  },
  2: {
    firstName: "Maria",
    lastName: "Santos",
    middleName: "",
    email: "maria.santos@lgu.gov.ph",
    role: "REPORT OFFICER",
    status: "DEACTIVATED",
    joinedDate: "Mar 5, 2025",
    lastActive: "15 hours ago",
    reportsHandled: 28,
    reportsResolved: 22,
  },
  3: {
    firstName: "Ricardo",
    lastName: "Ramos",
    middleName: "",
    email: "ricardo.ramos@lgu.gov.ph",
    role: "REPORT OFFICER",
    status: "ACTIVE",
    joinedDate: "Jun 20, 2025",
    lastActive: "3 days ago",
    reportsHandled: 67,
    reportsResolved: 59,
  },
  4: {
    firstName: "Elena",
    lastName: "Gomez",
    middleName: "",
    email: "elena.gomez@lgu.gov.ph",
    role: "ADMIN",
    status: "ACTIVE",
    joinedDate: "Feb 14, 2025",
    lastActive: "5 mins ago",
    reportsHandled: 12,
    reportsResolved: 12,
  },
  5: {
    firstName: "Carlos",
    lastName: "Reyes",
    middleName: "",
    email: "carlos.reyes@lgu.gov.ph",
    role: "SUPERVISOR",
    status: "ACTIVE",
    joinedDate: "Jan 3, 2025",
    lastActive: "1 hour ago",
    reportsHandled: 85,
    reportsResolved: 78,
  },
};

function UserIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
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
  const employee = MOCK_EMPLOYEES[id];

  if (!employee) {
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

  const fullName = [employee.firstName, employee.middleName ? `${employee.middleName.charAt(0)}.` : "", employee.lastName]
    .filter(Boolean)
    .join(" ");

  const roleClass = employee.role.toLowerCase().replace(" ", "-");
  const statusClass = employee.status.toLowerCase();

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
          <button className="avatar-edit-btn">
            <CameraIcon />
          </button>
        </div>
        <div className="profile-header-info">
          <h1 className="profile-name">{fullName}</h1>
          <div className="profile-badges">
            <span className={`role-badge role-${roleClass}`}>{employee.role}</span>
            <span className={`status-badge status-${statusClass}`}>{employee.status}</span>
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
                <span className="info-value">{employee.firstName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">LAST NAME</span>
                <span className="info-value">{employee.lastName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">MIDDLE NAME</span>
                <span className="info-value">{employee.middleName || "N/A"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">JOINED DATE</span>
                <span className="info-value">{employee.joinedDate}</span>
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
                <span className="activity-stat-value">{employee.reportsHandled}</span>
              </div>
              <div className="activity-stat">
                <span className="activity-stat-label">REPORTS RESOLVED</span>
                <span className="activity-stat-value">{employee.reportsResolved}</span>
              </div>
            </div>
            <p className="last-active-text">Last Active Timestamp: {employee.lastActive}</p>
          </div>
        </div>

        <div className="profile-right-column">
          <div className="profile-card">
            <div className="card-header">
              <SettingsIcon />
              <h2 className="card-title">Account Actions</h2>
            </div>

            <div className="action-section">
              <label className="action-label">USER ROLE</label>
              <select className="form-input form-select" defaultValue={employee.role}>
                <option value="ADMIN">Admin</option>
                <option value="REPORT OFFICER">Report Officer</option>
                <option value="SUPERVISOR">Supervisor</option>
              </select>
              <p className="action-hint">Moderators can manage reports and resolve citizen issues.</p>
            </div>

            <div className="action-section">
              <label className="action-label">ACCOUNT STATUS</label>
              <div className="radio-group">
                <label className={`radio-option ${employee.status === "ACTIVE" ? "selected" : ""}`}>
                  <input type="radio" name="status" value="ACTIVE" defaultChecked={employee.status === "ACTIVE"} />
                  <span className="radio-circle" />
                  <span>Activate</span>
                </label>
                <label className={`radio-option ${employee.status === "DEACTIVATED" ? "selected" : ""}`}>
                  <input type="radio" name="status" value="DEACTIVATED" defaultChecked={employee.status === "DEACTIVATED"} />
                  <span className="radio-circle" />
                  <span>Deactivated</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
