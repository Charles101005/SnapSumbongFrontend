import { useState, useRef } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { verifyEmail, resendOTP } from "../../../api/register"
import { verifyResetPasswordCode, resendResetPasswordCode } from "../../../api/passwordReset"
import { getAuthFlow, setAuthFlow, clearAuthFlow } from "../../../shared/authFlowStorage"
import "./VerifyEmail.css"

export default function VerifyEmail() {
    const navigate = useNavigate();
    const location = useLocation();

    const flow = getAuthFlow();
    const email = flow?.email ?? location.state?.email;
    const isPasswordReset = (flow?.purpose ?? location.state?.purpose) === "reset-password";

    const [digits, setDigits] = useState(["", "", "", ""]);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);
    const inputRefs = useRef([]);

    if (!email) {
        return (
            <div className="verify-page">
                <div className="verify-wrapper">
                    <p className="error-text">
                        {isPasswordReset
                            ? "No email to verify. Please request a new reset code."
                            : "No email to verify. Please register again."}
                    </p>
                    <Link to={isPasswordReset ? "/forgot-password" : "/register"} onClick={clearAuthFlow}>
                        {isPasswordReset ? "Back to Forgot Password" : "Back to Register"}
                    </Link>
                </div>
            </div>
        );
    }

    const handleChange = (index, value) => {
        if (value && !/^[0-9]$/.test(value)) return;

        const newDigits = [...digits];
        newDigits[index] = value;
        setDigits(newDigits);
        setError("");

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
                await verifyEmail(email, code);
                clearAuthFlow();
                navigate("/", { state: { justVerified: true } });
            }
        } catch (err) {
            setError(err?.message || err?.detail || "Invalid or expired code.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleResend = async (e) => {
        e.preventDefault();
        setResending(true);
        setError("");
        try {
            if (isPasswordReset) {
                await resendResetPasswordCode(email);
            } else {
                await resendOTP(email);
            }
        } catch (err) {
            setError(err?.message || err?.detail || "Couldn't resend the code. Try again.");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="verify-page">
          <div className="verify-wrapper">
            {/* Logo + heading */}
            <div className="verify-header">
              <div className="verify-logo">
                <RocketIcon />
              </div>
              <h1 className="verify-title">SnapSumbong</h1>
            </div>
     
            <div className="verify-card">
              <h2 className="verify-card-title">Verify Your Email</h2>
              <p className="verify-card-subtitle">
                Please enter the 4-digit verification code sent to your email address.
              </p>
     
              <form onSubmit={handleSubmit} noValidate>
                <div className="otp-inputs">
                  {digits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      className={`otp-box ${error ? "input-error" : ""}`}
                    />
                  ))}
                </div>
                {error && <p className="error-text otp-error">{error}</p>}
     
                <button type="submit" className="verify-button" disabled={submitting}>
                  {submitting ? "Verifying..." : "Confirm"}
                </button>
              </form>
     
              <p className="resend-text">
                Didn't receive the code?{" "}
                <Link to="#" onClick={handleResend}>
                  {resending ? "Resending..." : "Resend Code"}
                </Link>
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