import React, { useState } from "react";
import "./DeactivateAccount.css";
import { deactivateAccount } from "../../../api/accounts";
import { logoutUser } from "../../../api/login";

export default function DeactivateAccount({ onBack }) {
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [error, setError] = useState("");

  const handleDeactivate = async () => {
    setError("");
    setIsDeactivating(true);
    try {
      await deactivateAccount();

      // The account is now inactive server-side; also end this session's
      // auth cookies rather than just clearing local storage, which never
      // actually touched the httpOnly refresh/access cookies.
      try {
        await logoutUser();
      } catch {
        // Even if logout fails, the account is already deactivated — proceed
        // with the local cleanup and redirect regardless.
      }

      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    } catch {
      setError("Couldn't deactivate your account. Please try again.");
      setIsDeactivating(false);
    }
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
          This will hide your profile and reports immediately, and can't be
          undone from here — you'll need to contact support to reactivate.
        </p>

        {error && <p className="deactivate-description" style={{ color: "#dc2626" }}>{error}</p>}

        {/* Actions */}
        <div className="deactivate-actions">
          <button
            type="button"
            className="btn-deactivate-cancel"
            onClick={onBack}
            disabled={isDeactivating}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-deactivate-confirm"
            onClick={handleDeactivate}
            disabled={isDeactivating}
          >
            {isDeactivating ? "Deactivating..." : "Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}