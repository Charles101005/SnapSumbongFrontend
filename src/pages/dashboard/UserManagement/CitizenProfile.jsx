import { useParams, useNavigate, Link } from "react-router-dom";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import "./CitizenProfile.css";
import mockData from "../../../data/mock.json";

const { citizenProfiles: MOCK_CITIZENS } = mockData;

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

export default function CitizenProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const citizen = MOCK_CITIZENS[id];

  if (!citizen) {
    return (
      <DashboardLayout title="Citizen Profile">
        <div className="profile-not-found">
          <p>Citizen not found.</p>
          <button className="btn-back-to-list" onClick={() => navigate("/dashboard/users/citizens")}>
            Back to Citizen List
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const fullName = [citizen.firstName, citizen.middleName ? `${citizen.middleName.charAt(0)}.` : "", citizen.lastName]
    .filter(Boolean)
    .join(" ");

  const statusClass = citizen.status.toLowerCase();

  return (
    <DashboardLayout title="Citizen Profile">
      <button className="back-link" onClick={() => navigate("/dashboard/users/citizens")}>
        ← Back to Citizen List
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
            <span className={`status-badge status-${statusClass}`}>{citizen.status === "ACTIVE" ? "Active" : "Deactivated"}</span>
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
                <span className="info-value">{citizen.firstName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">LAST NAME</span>
                <span className="info-value">{citizen.lastName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">MIDDLE NAME</span>
                <span className="info-value">{citizen.middleName || "N/A"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">JOINED DATE</span>
                <span className="info-value">{citizen.joinedDate}</span>
              </div>
              <div className="info-item info-item-full">
                <span className="info-label">EMAIL ADDRESS</span>
                <span className="info-value">{citizen.email}</span>
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
                <span className="activity-stat-label">REPORTS SUBMITTED</span>
                <span className="activity-stat-value">{citizen.reportsSubmitted}</span>
              </div>
              <div className="activity-stat">
                <span className="activity-stat-label">REPORTS RESOLVED</span>
                <span className="activity-stat-value">{citizen.reportsResolved}</span>
              </div>
            </div>
            <p className="last-active-text">Last Active Timestamp: {citizen.lastActive}</p>
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
              <input type="text" className="form-input" value="Citizen" readOnly disabled />
              <p className="action-hint">Citizen accounts have limited access to report hazards.</p>
            </div>

            <div className="action-section">
              <label className="action-label">ACCOUNT STATUS</label>
              <div className="radio-group">
                <label className={`radio-option ${citizen.status === "ACTIVE" ? "selected" : ""}`}>
                  <input type="radio" name="status" value="ACTIVE" defaultChecked={citizen.status === "ACTIVE"} />
                  <span className="radio-circle" />
                  <span>Activate</span>
                </label>
                <label className={`radio-option ${citizen.status === "DEACTIVATED" ? "selected" : ""}`}>
                  <input type="radio" name="status" value="DEACTIVATED" defaultChecked={citizen.status === "DEACTIVATED"} />
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
