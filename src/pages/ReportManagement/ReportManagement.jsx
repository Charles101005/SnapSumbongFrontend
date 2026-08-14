import { useState } from "react";
import { Link } from "react-router-dom";
import "./ReportManagement.css";

const REPORT = {
  id: "HR-4302",
  category: "Potholes",
  location: "Sampaloc, Manila",
  dateReported: "Oct 14, 2025",
  timeReported: "8:45 AM",
  status: "ONGOING",
  severity: "P5",
  reportedBy: "Anonymous User",
  title: "Potholes - Sampaloc",
  description:
    "A large pothole has formed on the road near the intersection. Multiple vehicles have been damaged and it poses a safety hazard for pedestrians, especially at night. The area needs immediate repair and proper signage to warn oncoming traffic.",
  originalImage: null,
};

const SEVERITY_OPTIONS = ["P1", "P2", "P3", "P4", "P5"];
const STATUS_OPTIONS = ["PENDING", "ONGOING", "IN_PROGRESS", "RESOLVED"];

export default function ReportManagement() {
  const [activeNav, setActiveNav] = useState("reports");
  const [severity, setSeverity] = useState(REPORT.severity);
  const [status, setStatus] = useState(REPORT.status);
  const [remarks, setRemarks] = useState("");
  const [resolutionPhoto, setResolutionPhoto] = useState(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setResolutionPhoto(URL.createObjectURL(file));
    }
  };

  const handleSave = () => {
    alert("Report updates saved.");
  };

  const handleDiscard = () => {
    setSeverity(REPORT.severity);
    setStatus(REPORT.status);
    setRemarks("");
    setResolutionPhoto(null);
    alert("Changes discarded.");
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="sidebar-logo">
              <RocketIcon />
            </div>
            <span className="sidebar-brand-name">SnapSumbong</span>
          </div>

          <nav className="sidebar-nav">
            <Link to="/report-management" className={`sidebar-nav-item ${activeNav === "reports" ? "active" : ""}`} onClick={() => setActiveNav("reports")}>
              <ClipboardIcon />
              <span>Report Management</span>
            </Link>
            <div className="sidebar-nav-section">
              <Link to="/monitoring" className={`sidebar-nav-item parent ${["monitoring", "overview", "history"].includes(activeNav) ? "active" : ""}`}>
                <MonitorIcon />
                <span>Monitoring</span>
              </Link>
              <div className="sidebar-subnav">
                <Link to="/monitoring" className={`sidebar-subnav-item ${activeNav === "overview" ? "active" : ""}`} onClick={() => setActiveNav("overview")}>
                  Reports Overview
                </Link>
                <Link to="/monitoring/history" className={`sidebar-subnav-item ${activeNav === "history" ? "active" : ""}`} onClick={() => setActiveNav("history")}>
                  Reports History
                </Link>
              </div>
            </div>
          </nav>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              <UserIcon />
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">Report Officer</span>
              <span className="sidebar-user-role">admin</span>
            </div>
          </div>
          <button className="sidebar-logout">
            <LogoutIcon />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1 className="dashboard-page-title">Management Overview</h1>
        </header>

        <div className="dashboard-content">
          <div className="section-header">
            <h2 className="section-title">Report Management</h2>
            <p className="section-subtitle">Review and update citizen reports for community improvement.</p>
          </div>

          <div className="report-detail-card">
            <div className="report-detail-header">
              <div>
                <h3 className="report-title">{REPORT.title}</h3>
                <p className="report-meta">
                  {REPORT.location} &middot; {REPORT.dateReported} &middot; {REPORT.timeReported}
                </p>
              </div>
              <span className={`status-badge status-${status.toLowerCase().replace(" ", "_")}`}>
                {status.replace("_", " ")}
              </span>
            </div>

            <p className="report-description">{REPORT.description}</p>

            <div className="report-meta-grid">
              <div className="meta-item">
                <span className="meta-label">Report ID</span>
                <span className="meta-value">{REPORT.id}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Reported by</span>
                <span className="meta-value">{REPORT.reportedBy}</span>
              </div>
            </div>

            <div className="report-fields">
              <div className="field-group">
                <label className="field-label">Severity</label>
                <select className="field-select" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                  {SEVERITY_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Update Status</label>
                <select className="field-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="image-section">
              <div className="image-block">
                <span className="image-label">Original Report</span>
                <div className="image-placeholder">
                  {REPORT.originalImage ? (
                    <img src={REPORT.originalImage} alt="Original report" />
                  ) : (
                    <span>Original report image</span>
                  )}
                </div>
              </div>

              <div className="image-block">
                <span className="image-label">Resolution Photo</span>
                <label className="upload-area">
                  {resolutionPhoto ? (
                    <img src={resolutionPhoto} alt="Resolution" />
                  ) : (
                    <>
                      <UploadIcon />
                      <span>Click to upload resolution photo</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handlePhotoChange} />
                </label>
                {resolutionPhoto && (
                  <button className="btn-mark-complete" onClick={() => setStatus("RESOLVED")}>
                    MARK COMPLETE
                  </button>
                )}
              </div>
            </div>

            <div className="remarks-section">
              <label className="field-label">Remarks</label>
              <textarea
                className="remarks-textarea"
                rows="4"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add remarks about this hazard..."
              />
            </div>

            <div className="report-actions">
              <button className="btn-discard" onClick={handleDiscard}>DISCARD CHANGES</button>
              <button className="btn-save" onClick={handleSave}>SAVE ALL UPDATES</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

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

function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
