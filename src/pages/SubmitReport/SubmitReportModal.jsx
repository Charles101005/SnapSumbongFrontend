import React, { useState } from "react";
import "./SubmitReportModal.css";

export default function SubmitReportModal({ isOpen, onClose, onConfirm, userName = "Marcus Chen" }) {
  const [submissionType, setSubmissionType] = useState("named"); // 'named' | 'anonymous'

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
        <h2 className="modal-title">Submit Report</h2>
        <p className="modal-subtitle">
          Would you like to submit with your name or anonymously?
        </p>

        {/* Radio Option Cards */}
        <div className="options-group">
          {/* Option 1: Submit with Name */}
          <label className={`option-card ${submissionType === "named" ? "selected" : ""}`}>
            <input
              type="radio"
              name="submissionType"
              value="named"
              checked={submissionType === "named"}
              onChange={() => setSubmissionType("named")}
            />
            <div className="custom-radio"></div>
            <div className="option-text">
              <span className="option-label">Submit with Name</span>
              <span className="option-sublabel">{userName}</span>
            </div>
            <div className="option-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </label>

          {/* Option 2: Submit Anonymously */}
          <label className={`option-card ${submissionType === "anonymous" ? "selected" : ""}`}>
            <input
              type="radio"
              name="submissionType"
              value="anonymous"
              checked={submissionType === "anonymous"}
              onChange={() => setSubmissionType("anonymous")}
            />
            <div className="custom-radio"></div>
            <div className="option-text">
              <span className="option-label">Submit Anonymously</span>
              <span className="option-sublabel">Anonymous User</span>
            </div>
            <div className="option-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </div>
          </label>
        </div>

        {/* Action Buttons */}
        <button type="button" className="btn-confirm" onClick={handleConfirm}>
          Confirm
        </button>
        <button type="button" className="btn-modal-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}