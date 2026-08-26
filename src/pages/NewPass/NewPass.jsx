import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { resetPassword } from "../../api/passwordReset";
import { getAuthFlow, clearAuthFlow } from "../../shared/authFlowStorage";
import "./NewPass.css";

export default function NewPass() {
    const navigate = useNavigate();
    const location = useLocation();
    const flow = getAuthFlow();
    const email = flow?.email ?? location.state?.email;
    const otp = flow?.otp ?? location.state?.otp;

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    if (!email || !otp) {
        return (
            <div className="newpass-page">
                <div className="newpass-wrapper">
                    <div className="newpass-card">
                        <p className="error-text">
                            No reset session found. Please start over.
                        </p>
                        <Link to="/forgot-password">Back to Forgot Password</Link>
                    </div>
                </div>
            </div>
        );
    }

    const validateForm = () => {
        const newErrors = {};

        if (!newPassword) {
            newErrors.password = "Password is required";
        } else if (newPassword.length < 8) {
            newErrors.password = "Password must be at least 8 characters long";
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = "Confirm Password is required";
        } else if (confirmPassword !== newPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = validateForm();
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        setSubmitting(true);
        try {
            await resetPassword(email, otp, newPassword);
            clearAuthFlow();
            navigate("/", { state: { justResetPassword: true } });
        } catch (err) {
            setErrors({
                form: err?.detail || err?.message || "Couldn't reset your password. Please try again.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
    <div className="newpass-page">
      <div className="newpass-wrapper">
        {/* Logo */}
        <div className="newpass-logo">
          <RocketIcon />
        </div>
 
        <div className="newpass-card">
          <h1 className="newpass-title">SnapSumbong</h1>
          <h2 className="newpass-card-title">Create New Password</h2>
          <p className="newpass-subtitle">Please enter your new password below.</p>
 
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                New Password
              </label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className={`form-input ${errors.password ? "input-error" : ""}`}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>
 
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm New Password
              </label>
              <div className="input-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className={`form-input ${errors.confirmPassword ? "input-error" : ""}`}
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="error-text">{errors.confirmPassword}</p>
              )}
            </div>
 
            {errors.form && <p className="error-text">{errors.form}</p>}

            <button type="submit" className="continue-btn" disabled={submitting}>
              {submitting ? "Saving..." : "Continue"}
              <ArrowRightIcon />
            </button>
          </form>
 
          <p className="back-to-login">
            <Link to="/">← Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function RocketIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}
 
function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
 
function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.62 21.62 0 0 1 5.06-6.06M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 8 11 8a21.6 21.6 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
 
function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}