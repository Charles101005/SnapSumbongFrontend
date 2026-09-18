import React, { useState } from "react";
import "./SubmitReportModal.css";

export default function SubmitReportModal({
  isOpen,
  onClose,
  onConfirm,
  userName = "Marcus Chen",
  photos = [],
  categoryName = "",
  locationAddress = "",
  description = "",
}) {
  const [submissionType, setSubmissionType] = useState("named"); // 'named' | 'anonymous'
  const isAnonymous = submissionType === "anonymous";

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(submissionType);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Top Icon Badge */}
        <div className="modal-icon-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="#1d82f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </div>

        {/* Modal Header */}
        <h2 className="modal-title">Summary of Report</h2>
        <p className="modal-subtitle">
          Please review your report before submitting.
        </p>

        {/* Report Summary */}
        <div className="report-summary">
          <div className="summary-top-row">
            <div className="summary-photo">
              {photos.length > 0 ? (
                <img src={photos[0].previewUrl} alt="Hazard preview" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              )}
              {photos.length > 1 && (
                <span className="summary-photo-count">+{photos.length - 1}</span>
              )}
            </div>

            <div className="summary-fields">
              <div className="summary-field">
                <span className="summary-label">Category</span>
                <span className="summary-value">{categoryName || "Not selected"}</span>
              </div>
              <div className="summary-field">
                <span className="summary-label">Location</span>
                <span className="summary-value" title={locationAddress}>
                  {locationAddress || "Not set"}
                </span>
              </div>
            </div>
          </div>

          <div className="summary-field summary-description">
            <span className="summary-label">Description</span>
            <span className="summary-value">{description || "No description provided."}</span>
          </div>
        </div>

        {/* Anonymity toggle */}
        <label className="anonymous-toggle-row">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setSubmissionType(e.target.checked ? "anonymous" : "named")}
          />
          <span className="anonymous-checkbox"></span>
          Submit anonymously instead
        </label>

        {/* Action Buttons */}
        <div className="modal-actions">
          <button type="button" className="btn-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-confirm" onClick={handleConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}