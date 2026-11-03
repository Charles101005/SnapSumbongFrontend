import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { requestPasswordReset } from "../../../api/passwordReset";
import { setAuthFlow } from "../../../shared/authFlowStorage";
import AuthShell from "../../../components/shared/AuthShell";
import {
    AlertIcon,
    ArrowRightIcon,
    LogInIcon,
    MailIcon,
    SpinnerIcon,
} from "../../../components/shared/icons";

export default function ResetPass() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const validate = () => {
        const newErrors = {};
        if (!email) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Enter a valid email address.";
        }
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = validate();
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            return;
        }

        setSubmitting(true);
        try {
            const result = await requestPasswordReset(email);
            // Persist when a resend becomes allowed so VerifyEmail can start
            // its countdown immediately (and survive a refresh).
            const resendDeadline = Number.isFinite(result?.retry_after_seconds)
                ? Date.now() + result.retry_after_seconds * 1000
                : null;
            setAuthFlow({ email, purpose: "reset-password", otp: null, resendDeadline });
            navigate("/verify-email", { state: { email, purpose: "reset-password" } });
        } catch (err) {
            setErrors({ form: err?.detail || err?.message || "Couldn't send the reset code. Try again." });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthShell subtitle="Reset your password">
            <section className="auth-card" aria-labelledby="reset-heading">
                <div className="auth-card-header">
                    <h2 id="reset-heading" className="auth-card-title">Forgot your password?</h2>
                    <p className="auth-card-subtitle">
                        Enter the email linked to your account and we'll send you a 4-digit
                        verification code.
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
                        <label htmlFor="email" className="auth-label">Email address</label>
                        <div className="auth-input-wrap">
                            <span className="auth-input-icon" aria-hidden="true">
                                <MailIcon size={16} />
                            </span>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setErrors((prev) => ({ ...prev, email: undefined, form: undefined }));
                                }}
                                placeholder="Enter your email"
                                className={`auth-input auth-input--icon ${errors.email ? "auth-input--error" : ""}`}
                                autoComplete="email"
                                inputMode="email"
                                aria-invalid={Boolean(errors.email)}
                                aria-describedby={errors.email ? "email-error" : undefined}
                            />
                        </div>
                        {errors.email && <p id="email-error" className="auth-error">{errors.email}</p>}
                    </div>

                    <button type="submit" className="auth-submit" disabled={submitting}>
                        {submitting ? (
                            <>
                                <SpinnerIcon size={16} className="auth-spinner" />
                                Sending code...
                            </>
                        ) : (
                            <>
                                Send reset code
                                <ArrowRightIcon size={16} />
                            </>
                        )}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>Remember your password?</span>
                </div>

                <Link to="/" className="auth-secondary">
                    Back
                    <LogInIcon size={16} />
                </Link>
            </section>
        </AuthShell>
    );
}
