import { useState, useRef, useEffect } from "react";
import {
  requestEmailChange,
  verifyEmailChange,
  resendEmailChange,
} from "../../../api/accounts";
import { mapApiErrors } from "../../../utils/apiErrors";
import "./EmailChangeModal.css";

const EMAIL_RE = /\S+@\S+\.\S+/;

// Two-step email change dialog: enter the new address, then confirm the
// 4-digit code we email there. Errors render inline inside the modal
// (under the input / under the OTP boxes) — never as a page-level banner.
// Dismissal is only via the buttons (Cancel/Back), matching the
// OK-only convention used by the success popup.
// The parent remounts this component via a key tied to `isOpen`, so every
// open starts from the pristine default state (no reset effect needed).
export default function EmailChangeModal({ isOpen, currentEmail, onClose, onVerified }) {
  const [step, setStep] = useState("email"); // 'email' | 'otp'
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [info, setInfo] = useState("");
  const [sending, setSending] = useState(false);

  const [digits, setDigits] = useState(["", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpErrorCode, setOtpErrorCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  // Focus the first OTP box when the verification step appears.
  useEffect(() => {
    if (isOpen && step === "otp") {
      inputRefs.current[0]?.focus();
    }
  }, [isOpen, step]);

  if (!isOpen) return null;

  const handleChange = (index, value) => {
    if (value && !/^[0-9]$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    setOtpError("");
    setOtpErrorCode("");

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
    setOtpError("");
    setOtpErrorCode("");

    inputRefs.current[Math.min(pasted.length, 3)]?.focus();
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const value = newEmail.trim();

    if (!value) {
      setEmailError("Enter your new email address.");
      return;
    }
    if (!EMAIL_RE.test(value)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    if (value.toLowerCase() === (currentEmail || "").toLowerCase()) {
      setEmailError("New email cannot be the same as your current email.");
      return;
    }

    setSending(true);
    setEmailError("");
    setInfo("");
    try {
      await requestEmailChange(value);
      setNewEmail(value);
      setDigits(["", "", "", ""]);
      setOtpError("");
      setOtpErrorCode("");
      setStep("otp");
    } catch (err) {
      // A code is already pending for this account (e.g. the user cancelled
      // and retried within the 5-minute window) — jump to the OTP step and
      // let them use the code that's already in their inbox.
      if (err?.error_code === "VERIFICATION_IN_PROGRESS") {
        setNewEmail(value);
        setInfo(err.detail);
        setDigits(["", "", "", ""]);
        setOtpError("");
        setOtpErrorCode("");
        setStep("otp");
      } else {
        const mapped = mapApiErrors(err, {
          codes: {
            EMAIL_SAME_AS_CURRENT: "email",
            EMAIL_ALREADY_TAKEN: "email",
          },
        });
        setEmailError(mapped.email || mapped.form || "Couldn't send the code. Try again.");
      }
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = digits.join("");
    if (code.length < 4) {
      setOtpError("Please enter all 4 digits.");
      setOtpErrorCode("");
      return;
    }

    setVerifying(true);
    setOtpError("");
    setOtpErrorCode("");
    try {
      await verifyEmailChange(newEmail, code);
      onVerified(newEmail);
    } catch (err) {
      const mapped = mapApiErrors(err, {
        codes: {
          INVALID_VERIFICATION_OTP: "otp",
          VERIFICATION_EXPIRED: "otp",
          VERIFICATION_ATTEMPTS_EXCEEDED: "otp",
          VERIFICATION_NOT_FOUND: "otp",
          EMAIL_CHANGE_VERIFICATION_INVALID: "otp",
          EMAIL_ALREADY_TAKEN: "otp",
        },
      });
      let message = mapped.otp || mapped.form || "Invalid or expired code.";
      const remaining = err?.meta?.attempts_remaining;
      if (err?.error_code === "INVALID_VERIFICATION_OTP" && typeof remaining === "number") {
        message += ` (${remaining} attempt${remaining === 1 ? "" : "s"} remaining)`;
      }
      setOtpError(message);
      setOtpErrorCode(err?.error_code || "");
      setDigits(["", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setOtpError("");
    setOtpErrorCode("");
    setInfo("");
    try {
      const result = await resendEmailChange(newEmail);
      if (result?.email) setNewEmail(result.email);
      setInfo("A new code has been sent.");
      setDigits(["", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const mapped = mapApiErrors(err, {
        codes: {
          VERIFICATION_NOT_FOUND: "otp",
          OTP_RESEND_LIMIT_EXCEEDED: "otp",
          OTP_RESEND_COOLDOWN_ACTIVE: "otp",
        },
      });
      let message = mapped.otp || mapped.form || "Couldn't resend the code. Try again.";
      const retryAfter = err?.meta?.retry_after_seconds;
      if (err?.error_code === "OTP_RESEND_COOLDOWN_ACTIVE" && typeof retryAfter === "number") {
        message += ` Try again in ${retryAfter}s.`;
      }
      setOtpError(message);
      setOtpErrorCode(err?.error_code || "");
    } finally {
      setResending(false);
    }
  };

  const startOver = () => {
    setStep("email");
    setNewEmail("");
    setInfo("");
    setOtpError("");
    setOtpErrorCode("");
    setDigits(["", "", "", ""]);
  };

  return (
    <div className="ecm-overlay">
      <div className="ecm-card" role="dialog" aria-modal="true" aria-labelledby="ecm-title">
        <div className="ecm-icon-badge">
          {step === "email" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          )}
        </div>

        <h2 id="ecm-title" className="ecm-title">
          {step === "email" ? "Change Email" : "Verify New Email"}
        </h2>

        {step === "email" ? (
          <form onSubmit={handleSend} noValidate className="ecm-form">
            <p className="ecm-subtitle">
              Enter the new address you'd like to use. We'll email a 4-digit
              code to confirm it.
            </p>
            <label htmlFor="ecm-email" className="ecm-label">
              New email address
            </label>
            <input
              id="ecm-email"
              type="email"
              className={`ecm-input ${emailError ? "ecm-input-error" : ""}`}
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                setEmailError("");
              }}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
            />
            {emailError && <p className="ecm-error-text">{emailError}</p>}

            <div className="ecm-actions">
              <button type="button" className="ecm-btn-cancel" onClick={onClose} disabled={sending}>
                Cancel
              </button>
              <button type="submit" className="ecm-btn-primary" disabled={sending}>
                {sending ? "Sending..." : "Send Code"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify} noValidate className="ecm-form">
            <p className="ecm-subtitle">
              Enter the 4-digit code sent to <strong>{newEmail}</strong>. The
              code expires in 5 minutes.
            </p>

            {info && <p className="ecm-info">{info}</p>}

            <div className="ecm-otp-inputs">
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
                  className={`ecm-otp-box ${otpError ? "ecm-input-error" : ""}`}
                  aria-label={`Digit ${index + 1}`}
                />
              ))}
            </div>

            {otpError && <p className="ecm-error-text ecm-otp-error">{otpError}</p>}

            <button
              type="submit"
              className="ecm-btn-primary ecm-btn-block"
              disabled={verifying || resending}
            >
              {verifying ? "Verifying..." : "Verify"}
            </button>

            <p className="ecm-resend-text">
              Didn't get the code?{" "}
              <button
                type="button"
                className="ecm-link-btn"
                onClick={handleResend}
                disabled={resending || verifying}
              >
                {resending ? "Resending..." : "Resend Code"}
              </button>
            </p>

            <div className="ecm-actions">
              {otpErrorCode === "VERIFICATION_NOT_FOUND" ? (
                <button type="button" className="ecm-btn-cancel" onClick={startOver}>
                  Start over
                </button>
              ) : (
                <button
                  type="button"
                  className="ecm-btn-cancel"
                  onClick={() => setStep("email")}
                  disabled={verifying}
                >
                  Back
                </button>
              )}
              <button type="button" className="ecm-btn-cancel" onClick={onClose} disabled={verifying}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
