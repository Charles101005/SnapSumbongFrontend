import { useState } from "react";
import { Link } from "react-router-dom";
import "./ResetPass.css";

export default function ResetPass() {
    const [email, setEmail] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log({ email });
    };

    return (
        <div className="resetpass-page">
            <div className="resetpass-wrapper">
                {/* Logo + heading */}
                <div className="resetpass-header">
                    <div className="resetpass-logo">
                        <RocketIcon />
                    </div>
                    <h1 className="resetpass-title">SnapSumbong</h1>
                    <p className="resetpass-subtitle">Reset your password</p>
                </div>
                <div className="resetpass-card">
                    <h2 className="resetpass-card-title">Forgot Password</h2>
                    <form onSubmit={handleSubmit} className="resetpass-form">
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
                                className="form-input"
                            />
                        </div>
                        <button type="submit" className="resetpass-button">
                            Verify Email
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

function RocketIcon() {
    return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
    )        
}
