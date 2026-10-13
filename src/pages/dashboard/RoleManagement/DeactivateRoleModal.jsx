import { useEffect, useState } from "react";
import { deactivateRole } from "../../../api/roles";
import "./DeactivateRoleModal.css";

// Confirmation dialog for the row-level Deactivate action. Deactivation is
// one-way (the API has no reactivate endpoint), so the copy makes that clear
// and API errors (ROLE_IN_USE, protected role) render inline before closing.
export default function DeactivateRoleModal({ role, onClose, onDeactivated }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, submitting]);

  const handleConfirm = async () => {
    setError("");
    setSubmitting(true);
    try {
      await deactivateRole(role.role_id);
      onDeactivated();
    } catch (err) {
      setError(err?.detail || "Failed to deactivate role. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="drm-modal-overlay" onClick={submitting ? undefined : onClose}>
      <section
        className="drm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="drm-modal-title"
        aria-describedby="drm-modal-desc"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="drm-modal-header">
          <div className="drm-warning-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h2 id="drm-modal-title" className="drm-modal-title">Deactivate Role</h2>
            <p className="drm-modal-subtitle">
              You are about to deactivate <strong>{role.role_name}</strong>.
            </p>
          </div>
        </header>

        <div className="drm-body">
          {error && <div className="drm-banner drm-banner-error">{error}</div>}
          <p id="drm-modal-desc" className="drm-desc">
            Deactivated roles are removed from employee role assignment and can no
            longer be edited. This action cannot be undone — there is no way to
            reactivate a role.
          </p>
          <ul className="drm-consequences">
            <li>All users must be reassigned to another role first — the API rejects deactivation while users are still assigned.</li>
            <li>The role's name and permissions become read-only.</li>
            <li>The role stays visible in Role Management when filtering by "Deactivated".</li>
          </ul>
        </div>

        <footer className="drm-modal-footer">
          <button
            type="button"
            className="drm-btn-cancel"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="drm-btn-confirm"
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? "Deactivating..." : "Deactivate Role"}
          </button>
        </footer>
      </section>
    </div>
  );
}
