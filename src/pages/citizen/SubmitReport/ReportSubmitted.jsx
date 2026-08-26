import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./ReportSubmitted.css";

export default function ReportSubmitted() {
  const navigate = useNavigate();
  const location = useLocation();

  // Grab reference number passed via router state or fallback to a default
  const referenceNumber = location.state?.referenceNumber || "#HZ - 9123";

  return (
    <div className="success-page-wrapper">
      <div className="success-card-container">
        {/* Animated Checkmark Badge */}
        <div className="success-icon-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Header Titles */}
        <h1 className="success-title">Report Submitted Successfully!</h1>
        <p className="success-subtitle">
          Thank you for helping make our community safer.
        </p>

        {/* White Info Box */}
        <div className="info-box">
          <p className="info-description">
            The LGU has received your report and our maintenance crew will verify the
            details shortly. We will update you as the status of your report progresses via
            the activity tracker.
          </p>

          {/* Reference Number Banner */}
          <div className="reference-box">
            <span className="reference-label">REFERENCE NUMBER</span>
            <span className="reference-number">{referenceNumber}</span>
          </div>
        </div>

        {/* Action Button Group */}
        <div className="button-group">
          <button
            type="button"
            className="btn-primary-blue"
            onClick={() => navigate("/report-hazards")}
          >
            Go to Report Hazards
          </button>
          <button
            type="button"
            className="btn-secondary-gray"
            onClick={() => navigate("/my-reports")}
          >
            Go to My Reports
          </button>
        </div>
      </div>
    </div>
  );
}