import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./ChangePassword.css";
import { changePassword } from "../../../api/accounts";
import { validatePassword, getPasswordRuleStatuses } from "../../../utils/passwordValidation";
import { mapApiErrors } from "../../../utils/apiErrors";
import ConfirmDialog from "../../../components/shared/ConfirmDialog";

const PASSWORD_FIELDS = ["currentPassword", "newPassword", "confirmPassword"];

function focusField(key) {
  const element = document.getElementById(key);
  if (!element) return;
  element.focus({ preventScroll: true });
  element.scrollIntoView({ block: "center", behavior: "smooth" });
}

export default function ChangePassword({ onBack, onSaved, identity }) {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Which exit the confirm dialog is guarding: back to settings, or the
  // forgot-password flow.
  const [pendingExit, setPendingExit] = useState(null); // 'back' | 'forgot'

  const isDirty = Boolean(currentPassword || newPassword || confirmPassword);
  const ruleStatuses = getPasswordRuleStatuses(newPassword, identity);

  // Warn before a refresh/close throws away typed credentials.
  useEffect(() => {
    if (!isDirty) return undefined;
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const validate = () => {
    const newErrors = {};
    if (!currentPassword) newErrors.currentPassword = "Current password is required.";
    if (!newPassword) {
      newErrors.newPassword = "New password is required.";
    } else {
      const passwordError = validatePassword(newPassword, identity);
      if (passwordError) newErrors.newPassword = passwordError;
    }
    if (!confirmPassword) newErrors.confirmPassword = "Confirm new password is required.";
    else if (newPassword !== confirmPassword) newErrors.confirmPassword = "New passwords do not match.";
    return newErrors;
  };

  const clearError = (...fields) =>
    setErrors((prev) => {
      if (!fields.some((field) => prev[field])) return prev;
      const next = { ...prev };
      fields.forEach((field) => delete next[field]);
      return next;
    });

  const focusFirstError = (errorMap) => {
    const firstKey = PASSWORD_FIELDS.find((key) => errorMap[key]);
    if (firstKey) {
      focusField(firstKey);
    } else if (errorMap.form) {
      document
        .getElementById("cp-form-error")
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  };

  const requestBack = () => {
    if (isDirty) setPendingExit("back");
    else onBack();
  };

  const handleForgotClick = (event) => {
    if (!isDirty) return; // pristine — let the link navigate normally
    event.preventDefault();
    setPendingExit("forgot");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      focusFirstError(validationErrors);
      return;
    }

    setIsSaving(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // Parent flips back to settings and shows the success toast.
      if (onSaved) onSaved();
      else onBack();
    } catch (err) {
      const mapped = mapApiErrors(err, {
        fields: { current_password: "currentPassword", new_password: "newPassword" },
        codes: { INCORRECT_ACCOUNT_CREDENTIALS: "currentPassword" },
      });
      if (err?.error_code === "INCORRECT_ACCOUNT_CREDENTIALS") {
        mapped.currentPassword = "Current password is incorrect.";
      }
      setErrors(mapped);
      focusFirstError(mapped);
    } finally {
      setIsSaving(false);
    }
  };

  const exitConfig =
    pendingExit === "forgot"
      ? {
          title: "Leave change password?",
          message: "You have unsaved changes. Leaving now will discard what you've typed.",
          confirmLabel: "Leave",
          cancelLabel: "Stay",
          onConfirm: () => navigate("/forgot-password"),
        }
      : {
          title: "Discard your changes?",
          message: "You have typed information that hasn't been saved. Leaving now will discard it.",
          confirmLabel: "Discard",
          cancelLabel: "Keep Editing",
          onConfirm: onBack,
        };

  return (
    <div className="change-password-container">
      <div className="change-password-card">
        {/* Header */}
        <div className="change-password-header">
          <h1>Change Password</h1>
          <p>Update your account credentials to keep your portal secure.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="change-password-form" noValidate>
          {/* Current Password */}
          <div className="form-group">
            <label htmlFor="currentPassword">
              Current Password <span className="required-star" aria-hidden="true">*</span>
            </label>
            <div className="input-password-wrapper">
              <input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Enter current password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  clearError("currentPassword");
                }}
                aria-required="true"
                aria-invalid={errors.currentPassword ? "true" : undefined}
                aria-describedby={errors.currentPassword ? "currentPassword-error" : undefined}
                className={errors.currentPassword ? "input-error" : ""}
              />
              <button
                type="button"
                className="eye-toggle-btn"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
            {errors.currentPassword && (
              <p className="error-text" id="currentPassword-error">{errors.currentPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div className="form-group">
            <label htmlFor="newPassword">
              New Password <span className="required-star" aria-hidden="true">*</span>
            </label>
            <div className="input-password-wrapper">
              <input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  clearError("newPassword", "confirmPassword");
                }}
                aria-required="true"
                aria-invalid={errors.newPassword ? "true" : undefined}
                aria-describedby={errors.newPassword ? "newPassword-error" : "newPassword-rules"}
                className={errors.newPassword ? "input-error" : ""}
              />
              <button
                type="button"
                className="eye-toggle-btn"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? "Hide new password" : "Show new password"}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
            {errors.newPassword && (
              <p className="error-text" id="newPassword-error">{errors.newPassword}</p>
            )}
            {/* Live requirements checklist — ticks green as the user types */}
            <ul className="password-rules" id="newPassword-rules" aria-label="Password requirements">
              {ruleStatuses.map((rule) => (
                <li
                  key={rule.label}
                  className={`password-rule${rule.passed ? " rule-passed" : ""}`}
                >
                  <span className="rule-mark" aria-hidden="true">
                    {rule.passed ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <span className="rule-bullet" />
                    )}
                  </span>
                  {rule.label}
                  <span className="sr-only">{rule.passed ? " — met" : " — not met yet"}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Confirm New Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm New Password <span className="required-star" aria-hidden="true">*</span>
            </label>
            <div className="input-password-wrapper">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repeat new password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearError("confirmPassword");
                }}
                aria-required="true"
                aria-invalid={errors.confirmPassword ? "true" : undefined}
                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                className={errors.confirmPassword ? "input-error" : ""}
              />
              <button
                type="button"
                className="eye-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="error-text" id="confirmPassword-error">{errors.confirmPassword}</p>
            )}
          </div>

          {errors.form && (
            <p className="error-text" id="cp-form-error">{errors.form}</p>
          )}

          <p className="forgot-link-row">
            <Link to="/forgot-password" className="forgot-link" onClick={handleForgotClick}>
              Forgot current password?
            </Link>
          </p>

          {/* Action Buttons — same order as every other settings form */}
          <div className="form-actions-row">
            {isDirty && (
              <span className="unsaved-indicator">
                <span className="unsaved-dot" aria-hidden="true" />
                You have unsaved changes
              </span>
            )}
            <div className="form-actions-buttons">
              <button
                type="button"
                className="btn-cancel-flat"
                onClick={requestBack}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-save-changes"
                disabled={isSaving || !isDirty}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={Boolean(pendingExit)}
        title={exitConfig.title}
        message={exitConfig.message}
        confirmLabel={exitConfig.confirmLabel}
        cancelLabel={exitConfig.cancelLabel}
        onConfirm={() => {
          setPendingExit(null);
          exitConfig.onConfirm();
        }}
        onCancel={() => setPendingExit(null)}
      />
    </div>
  );
}
