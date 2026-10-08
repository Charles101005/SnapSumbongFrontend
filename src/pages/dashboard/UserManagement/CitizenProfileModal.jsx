import { useEffect, useState } from "react";
import "./CitizenProfileModal.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CitizenProfileModal({ citizen, profile, mode = "edit", onClose, onSaved }) {
  const isView = mode === "view";
  const [firstName, setFirstName] = useState(profile?.firstName || "");
  const [lastName, setLastName] = useState(profile?.lastName || "");
  const [middleName, setMiddleName] = useState(profile?.middleName || "");
  const [email, setEmail] = useState(profile?.email || citizen?.email || "");
  const [status, setStatus] = useState(profile?.status || citizen?.status || "ACTIVE");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Reset the form when the dialog switches to a different citizen or mode —
  // React's "adjusting state when a prop changes" pattern (same shape as
  // ReportManagementModal), which keeps the reset out of an effect.
  const citizenId = citizen?.id ?? null;
  const [loadedKey, setLoadedKey] = useState(`${citizenId}:${mode}`);
  if (loadedKey !== `${citizenId}:${mode}`) {
    setLoadedKey(`${citizenId}:${mode}`);
    setFirstName(profile?.firstName || "");
    setLastName(profile?.lastName || "");
    setMiddleName(profile?.middleName || "");
    setEmail(profile?.email || citizen?.email || "");
    setStatus(profile?.status || citizen?.status || "ACTIVE");
    setError("");
    setSuccess("");
  }

  // Escape closes the dialog.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Lock background scroll while the dialog is open.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  const handleDiscard = () => {
    setFirstName(profile?.firstName || "");
    setLastName(profile?.lastName || "");
    setMiddleName(profile?.middleName || "");
    setEmail(profile?.email || citizen?.email || "");
    setStatus(profile?.status || citizen?.status || "ACTIVE");
    setError("");
    setSuccess("");
  };

  const handleSave = (event) => {
    event.preventDefault();

    if (isView) return;

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedMiddle = middleName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFirst) {
      setError("First name is required.");
      setSuccess("");
      return;
    }
    if (!trimmedLast) {
      setError("Last name is required.");
      setSuccess("");
      return;
    }
    if (!trimmedEmail) {
      setError("Email address is required.");
      setSuccess("");
      return;
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      setSuccess("");
      return;
    }

    setError("");
    setSuccess("Citizen details saved successfully.");
    onSaved?.({
      firstName: trimmedFirst,
      lastName: trimmedLast,
      middleName: trimmedMiddle,
      email: trimmedEmail,
      status,
    });
  };

  return (
    <div className="cp-modal-overlay" onClick={onClose}>
      <section
        className="cp-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cp-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="cp-modal-header">
          <div>
            <h2 id="cp-modal-title" className="cp-modal-title">{isView ? "View Citizen" : "Manage Citizen"}</h2>
            <p className="cp-modal-subtitle">
              {isView ? "Citizen information (read-only)." : "Update the citizen information below."}
            </p>
          </div>
          <button
            type="button"
            className="cp-modal-close"
            onClick={onClose}
            aria-label="Close citizen management"
          >
            &times;
          </button>
        </header>

        {error && <div className="cp-banner cp-banner-error">{error}</div>}
        {success && <div className="cp-banner cp-banner-success">{success}</div>}

        <form className="cp-form" onSubmit={handleSave} noValidate>
          <div className="cp-form-grid">
            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-first-name">
                First Name {!isView && <span className="cp-required">*</span>}
              </label>
              <input
                id="cp-first-name"
                className="cp-input"
                type="text"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                readOnly={isView}
                disabled={isView}
              />
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-last-name">
                Last Name {!isView && <span className="cp-required">*</span>}
              </label>
              <input
                id="cp-last-name"
                className="cp-input"
                type="text"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                readOnly={isView}
                disabled={isView}
              />
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-middle-name">Middle Name</label>
              <input
                id="cp-middle-name"
                className="cp-input"
                type="text"
                value={middleName}
                onChange={(event) => setMiddleName(event.target.value)}
                readOnly={isView}
                disabled={isView}
              />
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-email">
                Email {!isView && <span className="cp-required">*</span>}
              </label>
              <input
                id="cp-email"
                className="cp-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                readOnly={isView}
                disabled={isView}
              />
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-joined-date">Joined Date</label>
              <input id="cp-joined-date" className="cp-input" type="text" value={profile?.joinedDate || "—"} readOnly disabled />
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-user-role">User Role</label>
              <input id="cp-user-role" className="cp-input" type="text" value="Citizen" readOnly disabled />
            </div>

            <div className="cp-field">
              <label className="cp-label" htmlFor="cp-status">
                Account Status {!isView && <span className="cp-required">*</span>}
              </label>
              <select
                id="cp-status"
                className="cp-input cp-select"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                disabled={isView}
              >
                <option value="ACTIVE">Active</option>
                <option value="DEACTIVATED">Deactivated</option>
              </select>
            </div>
          </div>

          <div className="cp-actions">
            {isView ? (
              <button type="button" className="cp-btn-discard" onClick={onClose}>Close</button>
            ) : (
              <>
                <button type="button" className="cp-btn-discard" onClick={handleDiscard}>Discard Changes</button>
                <button type="submit" className="cp-btn-save">Save Changes</button>
              </>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
