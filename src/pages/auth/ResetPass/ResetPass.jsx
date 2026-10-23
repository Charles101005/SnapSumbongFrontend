import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { requestPasswordReset } from "../../../api/passwordReset";
import { setAuthFlow } from "../../../shared/authFlowStorage";
import "./ResetPass.css";

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
            await requestPasswordReset(email);
            setAuthFlow({ email, purpose: "reset-password", otp: null });
            navigate("/verify-email", { state: { email, purpose: "reset-password" } });
        } catch (err) {
            setErrors({ email: err?.detail || err?.message || "Couldn't send the reset code. Try again." });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="resetpass-page">
            <div className="resetpass-wrapper">
                {/* Logo + heading */}
                <div className="resetpass-header">
                    <div className="resetpass-logo">
                        <img src="/SnapSumbongLogo.png" alt="SnapSumbong" className="brand-logo-img" />
                    </div>
                    <h1 className="resetpass-title">SnapSumbong</h1>
                    <p className="resetpass-subtitle">Reset your password</p>
                </div>
                <div className="resetpass-card">
                    <h2 className="resetpass-card-title">Forgot Password</h2>
                    <form onSubmit={handleSubmit} className="resetpass-form" noValidate>
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className={`form-input ${errors.email ? "input-error" : ""}`}
                            />
                            {errors.email && <p className="error-text">{errors.email}</p>}
                        </div>
                        <button type="submit" className="resetpass-button" disabled={submitting}>
                            {submitting ? "Sending..." : "Verify Email"}
                        </button>
                    </form>
                </div>
                <p className="login-text">
                    Remember your password? <Link to="/">Log in</Link>
                </p>
            </div>
        </div>
    );
}
