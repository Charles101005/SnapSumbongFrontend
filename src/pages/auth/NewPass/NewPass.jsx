import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { resetPassword } from "../../../api/passwordReset";
import { getAuthFlow, clearAuthFlow } from "../../../shared/authFlowStorage";
import { mapApiErrors } from "../../../utils/apiErrors";
import { validatePassword } from "../../../utils/passwordValidation";
import AuthShell from "../../../components/shared/AuthShell";
import PasswordChecklist from "../../../components/shared/PasswordChecklist";
import {
    AlertIcon,
    ArrowRightIcon,
    EyeIcon,
    EyeOffIcon,
    LockIcon,
    SpinnerIcon,
} from "../../../components/shared/icons";

export default function NewPass() {
    const navigate = useNavigate();
    const location = useLocation();
    const flow = getAuthFlow();
    const email = flow?.email ?? location.state?.email;
    const resetToken = flow?.resetToken ?? location.state?.resetToken;

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    if (!email || !resetToken) {
        return (
            <AuthShell subtitle="Reset your password">
                <section className="auth-card" aria-labelledby="newpass-missing-heading">
                    <h2 id="newpass-missing-heading" className="auth-card-title">Reset link expired</h2>
                    <div className="auth-alert auth-alert--spaced" role="alert">
                        <AlertIcon size={16} />
                        <span>No reset session found. Please start the password reset again.</span>
                    </div>
                    <Link
                        to="/forgot-password"
                        onClick={clearAuthFlow}
                        className="auth-secondary auth-secondary--spaced"
                    >
                        Start over
                        <ArrowRightIcon size={16} />
                    </Link>
                </section>
            </AuthShell>
        );
    }

    const validateForm = () => {
        const newErrors = {};

        if (!newPassword) {
            newErrors.password = "Password is required";
        } else {
            const passwordError = validatePassword(newPassword, { email });
            if (passwordError) newErrors.password = passwordError;
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
            await resetPassword(email, resetToken, newPassword);
            clearAuthFlow();
            navigate("/", { state: { justResetPassword: true } });
        } catch (err) {
            setErrors(mapApiErrors(err, {
                fields: { new_password: "password" },
                codes: { PASSWORD_REUSE: "password" },
            }));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthShell subtitle="Create a new password">
            <section className="auth-card" aria-labelledby="newpass-heading">
                <div className="auth-card-header">
                    <h2 id="newpass-heading" className="auth-card-title">Set a new password</h2>
                    <p className="auth-card-subtitle">
                        Choose a new password for <strong>{email}</strong>.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    {errors.form && (
                        <div className="auth-alert" role="alert">
                            <AlertIcon size={16} />
                            <span>{errors.form}</span>
                        </div>
                    )}

                    <div className="auth-field">
                        <label htmlFor="password" className="auth-label">New password</label>
                        <div className="auth-input-wrap">
                            <span className="auth-input-icon" aria-hidden="true">
                                <LockIcon size={16} />
                            </span>
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    setErrors((prev) => ({ ...prev, password: undefined, form: undefined }));
                                }}
                                placeholder="Enter new password"
                                className={`auth-input auth-input--icon auth-input--toggle ${errors.password ? "auth-input--error" : ""}`}
                                autoComplete="new-password"
                                aria-invalid={Boolean(errors.password)}
                                aria-describedby={errors.password ? "password-error" : undefined}
                            />
                            <button
                                type="button"
                                className="auth-toggle"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                            </button>
                        </div>
                        {errors.password && <p id="password-error" className="auth-error">{errors.password}</p>}
                        <p className="auth-hint">
                            Use 8+ characters with uppercase, lowercase, a number, and a symbol.
                        </p>
                        <PasswordChecklist password={newPassword} identity={{ email }} />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="confirmPassword" className="auth-label">Confirm new password</label>
                        <div className="auth-input-wrap">
                            <span className="auth-input-icon" aria-hidden="true">
                                <LockIcon size={16} />
                            </span>
                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    setErrors((prev) => ({ ...prev, confirmPassword: undefined, form: undefined }));
                                }}
                                placeholder="Re-enter new password"
                                className={`auth-input auth-input--icon auth-input--toggle ${errors.confirmPassword ? "auth-input--error" : ""}`}
                                autoComplete="new-password"
                                aria-invalid={Boolean(errors.confirmPassword)}
                                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                            />
                            <button
                                type="button"
                                className="auth-toggle"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                                {showConfirmPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p id="confirmPassword-error" className="auth-error">{errors.confirmPassword}</p>
                        )}
                    </div>

                    <button type="submit" className="auth-submit" disabled={submitting}>
                        {submitting ? (
                            <>
                                <SpinnerIcon size={16} className="auth-spinner" />
                                Saving...
                            </>
                        ) : (
                            <>
                                Update password
                                <ArrowRightIcon size={16} />
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>Changed your mind?</span>
                </div>

                <Link to="/" className="auth-secondary">
                    Back
                </Link>
            </section>
        </AuthShell>
    );
}
