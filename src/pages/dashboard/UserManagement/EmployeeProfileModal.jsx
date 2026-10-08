import { useEffect, useState } from "react";
import "./EmployeeProfileModal.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "REPORT OFFICER", label: "Report Officer" },
  { value: "SUPERVISOR", label: "Supervisor" },
];

export default function EmployeeProfileModal({ employee, profile, mode = "edit", onClose, onSaved }) {
  const isView = mode === "view";
  const [firstName, setFirstName] = useState(profile?.firstName || "");
  const [lastName, setLastName] = useState(profile?.lastName || "");
  const [middleName, setMiddleName] = useState(profile?.middleName || "");
  const [email, setEmail] = useState(employee?.email || profile?.email || "");
  const [role, setRole] = useState(employee?.role || profile?.role || "ADMIN");
  const [status, setStatus] = useState(employee?.status || profile?.status || "ACTIVE");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Reset the form when the dialog switches to a different employee or mode —
  // React's "adjusting state when a prop changes" pattern (same shape as
  // CitizenProfileModal), which keeps the reset out of an effect.
  const employeeId = employee?.id ?? null;
  const [loadedKey, setLoadedKey] = useState(`${employeeId}:${mode}`);
  if (loadedKey !== `${employeeId}:${mode}`) {
    setLoadedKey(`${employeeId}:${mode}`);
    setFirstName(profile?.firstName || "");
    setLastName(profile?.lastName || "");
    setMiddleName(profile?.middleName || "");
    setEmail(employee?.email || profile?.email || "");
    setRole(employee?.role || profile?.role || "ADMIN");
    setStatus(employee?.status || profile?.status || "ACTIVE");
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
    setEmail(employee?.email || profile?.email || "");
    setRole(employee?.role || profile?.role || "ADMIN");
    setStatus(employee?.status || profile?.status || "ACTIVE");
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
    setSuccess("Employee details saved successfully.");
    onSaved?.({
      firstName: trimmedFirst,
      lastName: trimmedLast,
      middleName: trimmedMiddle,
      email: trimmedEmail,
      role,
      status,
    });
  };

  return (
    <div className="epm-modal-overlay" onClick={onClose}>
      <section
        className="epm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="epm-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="epm-modal-header">
          <div>
            <h2 id="epm-modal-title" className="epm-modal-title">{isView ? "View Employee" : "Manage Employee"}</h2>
            <p className="epm-modal-subtitle">
              {isView ? "Employee information (read-only)." : "Update the employee information below."}
            </p>
          </div>
          <button
            type="button"
            className="epm-modal-close"
            onClick={onClose}
            aria-label="Close employee management"
          >
            &times;
          </button>
        </header>

        {error && <div className="epm-banner epm-banner-error">{error}</div>}
        {success && <div className="epm-banner epm-banner-success">{success}</div>}

        <form className="epm-form" onSubmit={handleSave} noValidate>
          <div className="epm-form-grid">
            <div className="epm-field">
              <label className="epm-label" htmlFor="epm-first-name">
                First Name {!isView && <span className="epm-required">*</span>}
              </label>
              <input
                id="epm-first-name"
                className="epm-input"
                type="text"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                readOnly={isView}
                disabled={isView}
              />
            </div>

            <div className="epm-field">
              <label className="epm-label" htmlFor="epm-last-name">
                Last Name {!isView && <span className="epm-required">*</span>}
              </label>
              <input
                id="epm-last-name"
                className="epm-input"
                type="text"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                readOnly={isView}
                disabled={isView}
              />
            </div>

            <div className="epm-field">
              <label className="epm-label" htmlFor="epm-middle-name">Middle Name</label>
              <input
                id="epm-middle-name"
                className="epm-input"
                type="text"
                value={middleName}
                onChange={(event) => setMiddleName(event.target.value)}
                readOnly={isView}
                disabled={isView}
              />
            </div>

            <div className="epm-field">
              <label className="epm-label" htmlFor="epm-email">
                Email {!isView && <span className="epm-required">*</span>}
              </label>
              <input
                id="epm-email"
                className="epm-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                readOnly={isView}
                disabled={isView}
              />
            </div>

            <div className="epm-field">
              <label className="epm-label" htmlFor="epm-joined-date">Joined Date</label>
              <input id="epm-joined-date" className="epm-input" type="text" value={profile?.joinedDate || "—"} readOnly disabled />
            </div>

            <div className="epm-field">
              <label className="epm-label" htmlFor="epm-role">
                Role {!isView && <span className="epm-required">*</span>}
              </label>
              <select
                id="epm-role"
                className="epm-input epm-select"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                disabled={isView}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="epm-field">
              <label className="epm-label" htmlFor="epm-status">
                Account Status {!isView && <span className="epm-required">*</span>}
              </label>
              <select
                id="epm-status"
                className="epm-input epm-select"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                disabled={isView}
              >
                <option value="ACTIVE">Active</option>
                <option value="DEACTIVATED">Deactivated</option>
              </select>
            </div>
          </div>

          <div className="epm-actions">
            {isView ? (
              <button type="button" className="epm-btn-discard" onClick={onClose}>Close</button>
            ) : (
              <>
                <button type="button" className="epm-btn-discard" onClick={handleDiscard}>Discard Changes</button>
                <button type="submit" className="epm-btn-save">Save Changes</button>
              </>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
