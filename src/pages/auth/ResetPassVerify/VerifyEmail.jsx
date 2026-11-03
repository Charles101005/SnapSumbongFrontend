import { useState, useRef, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { verifyEmail, resendOTP } from "../../../api/register"
import { verifyResetPasswordCode, resendResetPasswordCode } from "../../../api/passwordReset"
import { getCurrentUser } from "../../../api/accounts"
import { setAccessToken } from "../../../api/authToken"
import { useAuth, homePathFor } from "../../../context/authContext"
import { getAuthFlow, setAuthFlow, clearAuthFlow } from "../../../shared/authFlowStorage"
import { useResendCooldown } from "../../../hooks/useResendCooldown"
import { formatCooldown } from "../../../utils/format"
import AuthShell from "../../../components/shared/AuthShell"
import {
    AlertIcon,
    ArrowLeftIcon,
    CheckIcon,
    SpinnerIcon,
} from "../../../components/shared/icons"

// Remaining seconds of a cooldown stored in the auth flow by Register /
// ResetPass (epoch ms). Recomputed on mount so a refresh mid-countdown
// picks up where it left off instead of restarting the timer.
const remainingSeconds = (deadline) =>
    typeof deadline === "number" && deadline > Date.now()
        ? Math.ceil((deadline - Date.now()) / 1000)
        : 0;

export default function VerifyEmail() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setSession } = useAuth();

    const flow = getAuthFlow();
    const email = flow?.email ?? location.state?.email;
    const isPasswordReset = (flow?.purpose ?? location.state?.purpose) === "reset-password";
    const backPath = isPasswordReset ? "/forgot-password" : "/register";

    const [digits, setDigits] = useState(["", "", "", ""]);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);
    const inputRefs = useRef([]);

    const { secondsLeft, isCoolingDown, start } = useResendCooldown(
        remainingSeconds(flow?.resendDeadline)
    );

    // Focus the first box so the user can type without tapping it first
    useEffect(() => {
        if (email) inputRefs.current[0]?.focus();
    }, [email]);

    if (!email) {
        return (
            <AuthShell subtitle="Verify your email">
                <section className="auth-card" aria-labelledby="verify-missing-heading">
                    <h2 id="verify-missing-heading" className="auth-card-title">Session expired</h2>
                    <div className="auth-alert auth-alert--spaced" role="alert">
                        <AlertIcon size={16} />
                        <span>
                            {isPasswordReset
                                ? "No email to verify. Please request a new reset code."
                                : "No email to verify. Please create your account again."}
                        </span>
                    </div>
                    <Link
                        to={backPath}
                        onClick={clearAuthFlow}
                        className="auth-secondary auth-secondary--spaced"
                    >
                        {isPasswordReset ? "Back to forgot password" : "Back to register"}
                    </Link>
                </section>
            </AuthShell>
        );
    }

    const handleChange = (index, value) => {
        if (value && !/^[0-9]$/.test(value)) return;

        const newDigits = [...digits];
        newDigits[index] = value;
        setDigits(newDigits);
        setError("");
        setNotice("");

        if (value && index < digits.length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").trim();
        if (!/^\d{1,4}$/.test(pasted)) return;

        const newDigits = [...digits];
        pasted.split("").forEach((char, i) => {
          if (i < 4) newDigits[i] = char;
        });
        setDigits(newDigits);
        setError("");
        setNotice("");

        const nextIndex = Math.min(pasted.length, 3);
        inputRefs.current[nextIndex]?.focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const code = digits.join("");

        if (code.length < 4) {
            setError("Please enter all 4 digits.");
            return;
        }

        setSubmitting(true);
        try {
            if (isPasswordReset) {
                const result = await verifyResetPasswordCode(email, code);
                setAuthFlow({ email, purpose: "reset-password", resetToken: result.reset_token });
                navigate("/new-password", { state: { email, resetToken: result.reset_token } });
            } else {
                const result = await verifyEmail(email, code);
                clearAuthFlow();
                try {
                    setAccessToken(result.access);
                    const currentUser = await getCurrentUser();
                    setSession(currentUser);
                    navigate(homePathFor(currentUser), { replace: true });
                } catch {
                    navigate("/", { state: { justVerified: true } });
                }
            }
        } catch (err) {
            setError(err?.message || err?.detail || "Invalid or expired code.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleResend = async () => {
        // Cooldown still running — don't hit the backend at all.
        if (isCoolingDown) return;

        setResending(true);
        setError("");
        setNotice("");
        try {
            let result;
            if (isPasswordReset) {
                result = await resendResetPasswordCode(email);
            } else {
                result = await resendOTP(email);
            }
            // A fresh send restarts the full cooldown.
            start(result?.retry_after_seconds);
            setAuthFlow({ resendDeadline: Date.now() + (result?.retry_after_seconds ?? 0) * 1000 });
            setNotice("A new verification code has been sent to your email.");
            inputRefs.current[0]?.focus();
        } catch (err) {
            // Lost the race (e.g. countdown expired a moment ago) — seed the
            // timer from the server's remaining cooldown instead.
            const retryAfter = err?.meta?.retry_after_seconds;
            if (err?.error_code === "OTP_RESEND_COOLDOWN_ACTIVE" && typeof retryAfter === "number") {
                start(retryAfter);
                setAuthFlow({ resendDeadline: Date.now() + retryAfter * 1000 });
                setError(`Please wait ${formatCooldown(retryAfter)} before requesting another code.`);
            } else {
                setError(err?.message || err?.detail || "Couldn't resend the code. Try again.");
            }
        } finally {
            setResending(false);
        }
    };

    return (
        <AuthShell subtitle={isPasswordReset ? "Reset your password" : "Verify your email"}>
            <section className="auth-card" aria-labelledby="verify-heading">
                <Link to={backPath} onClick={clearAuthFlow} className="auth-back">
                    <ArrowLeftIcon size={15} />
                    Back to {isPasswordReset ? "forgot password" : "register"}
                </Link>

                <div className="auth-card-header">
                    <h2 id="verify-heading" className="auth-card-title">
                        {isPasswordReset ? "Confirm it's you" : "Check your inbox"}
                    </h2>
                    <p className="auth-card-subtitle">
                        Enter the 4-digit code we sent to <strong>{email}</strong> to{" "}
                        {isPasswordReset ? "reset your password." : "activate your account."}
                    </p>
                </div>

                {notice && (
                    <div className="auth-notice" role="status">
                        <CheckIcon size={16} />
                        <span>{notice}</span>
                        <button
                            type="button"
                            className="auth-notice-dismiss"
                            onClick={() => setNotice("")}
                            aria-label="Dismiss notification"
                        >
                            ×
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="auth-otp">
                        {digits.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                aria-label={`Verification code digit ${index + 1} of 4`}
                                aria-invalid={Boolean(error)}
                                className={`auth-otp-box ${error ? "auth-input--error" : ""}`}
                            />
                        ))}
                    </div>
                    {error && <p className="auth-error auth-otp-error" role="alert">{error}</p>}

                    <button type="submit" className="auth-submit" disabled={submitting}>
                        {submitting ? (
                            <>
                                <SpinnerIcon size={16} className="auth-spinner" />
                                Verifying...
                            </>
                        ) : (
                            "Verify code"
                        )}
                    </button>
                </form>

                <p className="auth-resend">
                    Didn't receive the code?{" "}
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending || submitting || isCoolingDown}
                    >
                        {resending
                            ? "Sending..."
                            : isCoolingDown
                                ? `Resend code in ${formatCooldown(secondsLeft)}`
                                : "Resend code"}
                    </button>
                </p>
            </section>
        </AuthShell>
    );
}
