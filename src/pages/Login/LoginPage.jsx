import { useState } from "react";
import "./LoginPage.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ email, password });
  };

  return (
    <div className="login-page">
        <div className="login-wrapper">
        {/* Logo + heading */}
        <div className="login-header">
            <div className="login-logo">
                <RocketIcon />
            </div>
            <h1 className="login-title">SnapSumbong</h1>
            <p className="login-subtitle">Community Hazard Reporting Portal</p>
        </div>

    <div className="login-card">
        <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
                <label htmlFor="email" className="form-label">
                    Email Address
                    </label>
                    <div className="input-wrapper">
                        <AtIcon className="input-icon" />
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="form-input"
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="password" className="form-label">
                        Password
                    </label>
                    <div className="input-wrapper">
                        <LockIcon className="input-icon" />
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="form-input"
                        />
                    </div>
                </div>

                <div className="forgot-password">
                    <a href="/forgot-password" className="forgot-password-link">
                        Forgot Password?
                    </a>
                </div>
                <button type="submit" className="submit-btn">
                    Log In
                    <LogInIcon />
                </button>
            </form>
        </div>

        <p className="signup-text">
            Don't have an account? <a href="#">Sign up for an account</a>
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

function AtIcon({ className }) {
    return (
        <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-5.5 8.28" />
        </svg>
    );
}

function LockIcon({ className }) {
    return (
        <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );
}

function LogInIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
    );
}