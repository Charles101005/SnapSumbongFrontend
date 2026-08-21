import React from "react";
import "./DeactivateAccount.css";

export default function DeactivateAccount({ onBack, onConfirmDeactivate }) {
  const handleDeactivate = () => {
    // 1. Call optional deactivation logic/callback
    if (onConfirmDeactivate) {
      onConfirmDeactivate();
    }

    // 2. Clear stored auth state/tokens if applicable
    localStorage.clear();
    sessionStorage.clear();

    // 3. Hard redirect to the standalone login page/root route
    window.location.href = "/";
  };

  return (
    <div className="deactivate-account-container">
      <div className="deactivate-card">
        {/* Warning Icon Circle */}
        <div className="warning-icon-wrapper">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        {/* Content */}
        <h1 className="deactivate-title">Deactivate Account</h1>
        <p className="deactivate-description">
          Are you sure you want to deactivate your account?
          <br />
          This action will hide your profile and reports, but you can reactivate anytime.
        </p>

        {/* Actions */}
        <div className="deactivate-actions">
          <button type="button" className="btn-deactivate-cancel" onClick={onBack}>
            Cancel
          </button>
          <button type="button" className="btn-deactivate-confirm" onClick={handleDeactivate}>
            Deactivate
          </button>
        </div>
      </div>
    </div>
  );
}