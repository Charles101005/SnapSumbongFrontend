import { useState } from "react";
import DashboardLayout from "../../../components/DashboardLayout/DashboardLayout";
import "./ReportManagement.css";
import mockData from "../../../data/mock.json";

const { reportManagement, constants } = mockData;
const { severityOptions: SEVERITY_OPTIONS, statusOptions: STATUS_OPTIONS } = constants;

function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export default function ReportManagement() {
  const [severity, setSeverity] = useState(reportManagement.severity);
  const [status, setStatus] = useState(reportManagement.status);
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
    setSeverity(reportManagement.severity);
    setStatus(reportManagement.status);
    setRemarks("");
    setResolutionPhoto(null);
    alert("Changes discarded.");
  };

  return (
    <DashboardLayout title="Management Overview">
      <div className="section-header">
        <h2 className="section-title">Report Management</h2>
        <p className="section-subtitle">Review and update citizen reports for community improvement.</p>
      </div>

      <div className="report-detail-card">
        <div className="report-detail-header">
          <div>
            <h3 className="report-title">{reportManagement.title}</h3>
            <p className="report-meta">
              {reportManagement.location} &middot; {reportManagement.dateReported} &middot; {reportManagement.timeReported}
            </p>
          </div>
          <span className={`status-badge status-${status.toLowerCase().replace(" ", "_")}`}>
            {status.replace("_", " ")}
          </span>
        </div>

        <p className="report-description">{reportManagement.description}</p>

        <div className="report-meta-grid">
          <div className="meta-item">
            <span className="meta-label">Report ID</span>
            <span className="meta-value">{reportManagement.id}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Reported by</span>
            <span className="meta-value">{reportManagement.reportedBy}</span>
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
              {reportManagement.originalImage ? (
                <img src={reportManagement.originalImage} alt="Original report" />
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
    </DashboardLayout>
  );
}
